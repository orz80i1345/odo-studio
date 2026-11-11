/**
 * 每 5 分鐘由 Apps Script 時間驅動觸發器執行。
 *
 * Gmail 未讀狀態就是待重試佇列：workflow 只有明確回傳 updated 或
 * already_processed 時才標記已讀。超過 3 小時仍無法配對則轉人工審核。
 *
 * 注意：銀行信中的「您的存款帳號末四碼」是收款帳戶末四碼，
 * 不是付款人的帳號末四碼，所以 payload 使用 creditedAccountLast4。
 */
var CONFIG = {
  // API Base URL 要包含 /api，但結尾不要加斜線。
  API_BASE_URL: 'https://cv3op1ht.cgapps.dev/api',
  WORKFLOW_ID: 'fb3fb6f3-6937-4abf-99dc-143ef20ed0d8',

  // workflow 尚未完成時可切到 Echo 測試；正式使用前必須改成 false。
  USE_TEST_WEBHOOK: true,
  TEST_WEBHOOK_URL: 'https://dev-api.cgapps.dev/api/echo/fb3fb6f3-6937-4abf-99dc-143ef20ed0d8',

  // Workflow endpoint 若不要求 X-API-KEY，保持空字串即可。
  API_KEY: '',

  GMAIL_QUERY: 'label:bank-webhook is:unread',
  TIME_ZONE: 'Asia/Taipei',
  MATCH_TOLERANCE_MINUTES: 30,
  RETRY_WINDOW_HOURS: 3,

  ERROR_LABEL: 'bank-webhook-error',
  MANUAL_REVIEW_LABEL: 'bank-webhook-manual-review',
  PROCESSED_LABEL: 'bank-webhook-processed'
};

function checkBankMail() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) {
    console.log('前一次銀行信件檢查仍在執行，本次略過');
    return;
  }

  try {
    var labels = getBankMailLabels_();
    var threads = GmailApp.search(CONFIG.GMAIL_QUERY, 0, 100);

    threads.forEach(function (thread) {
      thread.getMessages().forEach(function (message) {
        if (!message.isUnread()) return;

        var bankEvent;
        try {
          bankEvent = parseBankDepositMail_(message);
        } catch (error) {
          console.error('銀行信件解析失敗：' + message.getId() + '，' + error.message);
          thread.addLabel(labels.error);
          message.markRead();
          return;
        }

        // 到期後不再自動重試，但保留信件並加上人工審核標籤。
        if (new Date().getTime() >= new Date(bankEvent.retryExpiresAt).getTime()) {
          try {
            if (isBankEventProcessed_(bankEvent.eventId)) {
              thread.addLabel(labels.processed);
              message.markRead();
              return;
            }
          } catch (error) {
            console.error('到期前最終核對失敗：' + message.getId() + '，' + error.message);
          }
          console.warn('銀行入帳事件超過自動核對期限，轉人工審核：' + message.getId());
          thread.addLabel(labels.manualReview);
          message.markRead();
          return;
        }

        try {
          var workflowBody = sendBankEventToWorkflow_(bankEvent);
          var outcome = classifyWorkflowOutcome_(workflowBody);

          console.log(JSON.stringify({
            message: '銀行入帳 workflow 已回應',
            gmailMessageId: message.getId(),
            outcome: outcome,
            workflowBody: workflowBody
          }));

          // workflow 沒有自訂 response 時，直接查 payments.bank_event_id 確認。
          var processed = outcome === 'processed' || isBankEventProcessed_(bankEvent.eventId);
          if (processed) {
            thread.addLabel(labels.processed);
            message.markRead();
            return;
          }

          if (outcome === 'manual_review') {
            thread.addLabel(labels.manualReview);
            message.markRead();
            return;
          }

          // no_match、ambiguous、amount_mismatch 或沒有明確結果時維持未讀，
          // 下次五分鐘觸發器會用同一個 eventId 再試。
          console.log('尚未找到唯一付款資料，保留未讀等待下次重試：' + message.getId());
        } catch (error) {
          // 網路或 workflow 錯誤時維持未讀，下次使用相同 eventId 重試。
          console.error('銀行入帳 workflow 處理失敗：' + message.getId() + '，' + error.message);
        }
      });
    });
  } finally {
    lock.releaseLock();
  }
}

function parseBankDepositMail_(message) {
  var body = message.getPlainBody().replace(/\u00a0/g, ' ');
  var match = body.match(
    /(?:存款)?帳號末四碼\s*(\d{4})\s*於\s*(\d{1,2})\/(\d{1,2})\s+(\d{1,2})[:：](\d{2})\s*有金額入帳\s*(?:新?[臺台]幣|NT\$?)\s*([\d,]+(?:\.\d{1,2})?)\s*元/i
  );

  if (!match) {
    throw new Error('找不到帳號末四碼、入帳時間或金額');
  }

  var creditedAccountLast4 = match[1];
  var amount = Number(match[6].replace(/,/g, ''));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('入帳金額格式錯誤');
  }

  var occurredAt = inferBankOccurredAt_(
    Number(match[2]),
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    message.getDate(),
    CONFIG.TIME_ZONE
  );
  var toleranceMilliseconds = CONFIG.MATCH_TOLERANCE_MINUTES * 60 * 1000;
  var retryMilliseconds = CONFIG.RETRY_WINDOW_HOURS * 60 * 60 * 1000;

  return {
    eventId: 'gmail:' + message.getId(),
    source: 'gmail_bank_deposit',
    gmailMessageId: message.getId(),
    gmailThreadId: message.getThread().getId(),
    creditedAccountLast4: creditedAccountLast4,
    amount: amount,
    currency: 'TWD',
    occurredAt: occurredAt.toISOString(),
    matchWindowStart: new Date(occurredAt.getTime() - toleranceMilliseconds).toISOString(),
    matchWindowEnd: new Date(occurredAt.getTime() + toleranceMilliseconds).toISOString(),
    emailReceivedAt: message.getDate().toISOString(),
    retryExpiresAt: new Date(message.getDate().getTime() + retryMilliseconds).toISOString()
  };
}

/**
 * 銀行通知通常不含年份。以收信時間為基準，在前一年、當年、後一年中
 * 選擇時間距離最近者，可正確處理跨年收到的 12/31 或 01/01 通知。
 */
function inferBankOccurredAt_(month, day, hour, minute, referenceDate, timeZone) {
  var referenceYear = Number(Utilities.formatDate(referenceDate, timeZone, 'yyyy'));
  var candidates = [referenceYear - 1, referenceYear, referenceYear + 1].map(function (year) {
    return Utilities.parseDate(
      year + '/' + pad2_(month) + '/' + pad2_(day) + ' ' +
        pad2_(hour) + ':' + pad2_(minute),
      timeZone,
      'yyyy/MM/dd HH:mm'
    );
  });

  candidates.sort(function (left, right) {
    return Math.abs(left.getTime() - referenceDate.getTime()) -
      Math.abs(right.getTime() - referenceDate.getTime());
  });
  return candidates[0];
}

function sendBankEventToWorkflow_(payload) {
  validateConfig_();
  var endpoint = CONFIG.USE_TEST_WEBHOOK
    ? CONFIG.TEST_WEBHOOK_URL.replace(/\/$/, '')
    : CONFIG.API_BASE_URL.replace(/\/$/, '') +
      '/workflow/' + encodeURIComponent(CONFIG.WORKFLOW_ID) + '/execute';
  var headers = {
    'X-Idempotency-Key': payload.eventId
  };
  if (CONFIG.API_KEY) headers['X-API-KEY'] = CONFIG.API_KEY;

  var response = UrlFetchApp.fetch(endpoint, {
    method: 'post',
    contentType: 'application/json',
    headers: headers,
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  var httpStatus = response.getResponseCode();
  var responseText = response.getContentText();
  var responseBody = parseJsonResponse_(responseText);

  if (httpStatus < 200 || httpStatus >= 300) {
    throw new Error('Webhook HTTP ' + httpStatus + ': ' + responseText);
  }

  // workflow executor 可能以 HTTP 200 包裝實際的 workflow statusCode。
  if (responseBody.statusCode !== undefined &&
      (Number(responseBody.statusCode) < 200 || Number(responseBody.statusCode) >= 300)) {
    throw new Error('Workflow status ' + responseBody.statusCode + ': ' + responseText);
  }

  return unwrapWorkflowBody_(responseBody);
}

function unwrapWorkflowBody_(value) {
  var current = value;
  for (var index = 0; index < 5; index += 1) {
    if (typeof current === 'string') {
      current = parseMaybeJson_(current);
      continue;
    }
    if (!current || typeof current !== 'object') break;
    if (Object.prototype.hasOwnProperty.call(current, 'body')) {
      current = current.body;
      continue;
    }
    if (current.data && typeof current.data === 'object') {
      current = current.data;
      continue;
    }
    break;
  }
  return current && typeof current === 'object' ? current : { value: current };
}

function classifyWorkflowOutcome_(workflowBody) {
  var result = String(workflowBody.result || '').toLowerCase();

  if (result === 'updated' ||
      result === 'already_processed' ||
      result === 'matched') {
    return 'processed';
  }

  if (result === 'manual_review') {
    return 'manual_review';
  }

  // 不把單純 success=true 視為已核銷；它可能只代表 workflow 成功執行，
  // 而不是成功找到付款。沒有明確結果一律重試。
  return 'retry';
}

/**
 * workflow 可能只回傳通用 200，無法直接知道有沒有成功核銷。
 * 因此再用 bank_event_id 查 payments；查到 paid 才視為真正完成。
 */
function isBankEventProcessed_(eventId) {
  var baseUrl = CONFIG.API_BASE_URL.replace(/\/$/, '');
  var filterValue = 'bank_event_id,eq,' + eventId;
  var url = baseUrl + '/public/payments?pageSize=1&filter=' + encodeURIComponent(filterValue);
  var headers = {};
  if (CONFIG.API_KEY) headers['X-API-KEY'] = CONFIG.API_KEY;

  var response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: headers,
    muteHttpExceptions: true
  });
  var httpStatus = response.getResponseCode();
  var responseText = response.getContentText();
  if (httpStatus < 200 || httpStatus >= 300) {
    throw new Error('查詢 bank_event_id HTTP ' + httpStatus + ': ' + responseText);
  }

  var responseBody = parseJsonResponse_(responseText);
  var body = responseBody.body || responseBody;
  if (typeof body === 'string') body = parseMaybeJson_(body);
  var items = Array.isArray(body) ? body : (Array.isArray(body.data) ? body.data : []);

  return items.some(function (payment) {
    return payment.bank_event_id === eventId && payment.status === 'paid';
  });
}

function parseJsonResponse_(text) {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error('Webhook 回傳的不是 JSON：' + text);
  }
}

function parseMaybeJson_(value) {
  try {
    return JSON.parse(value);
  } catch (error) {
    return { value: value };
  }
}

function getBankMailLabels_() {
  return {
    error: getOrCreateLabel_(CONFIG.ERROR_LABEL),
    manualReview: getOrCreateLabel_(CONFIG.MANUAL_REVIEW_LABEL),
    processed: getOrCreateLabel_(CONFIG.PROCESSED_LABEL)
  };
}

function getOrCreateLabel_(name) {
  return GmailApp.getUserLabelByName(name) || GmailApp.createLabel(name);
}

/** 執行一次即可建立每 5 分鐘觸發器；重複執行會先移除舊觸發器。 */
function installBankMailTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === 'checkBankMail') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger('checkBankMail')
    .timeBased()
    .everyMinutes(5)
    .create();
}

function pad2_(value) {
  return String(value).padStart(2, '0');
}

function validateConfig_() {
  if (!CONFIG.API_BASE_URL || CONFIG.API_BASE_URL.indexOf('你的網域') !== -1) {
    throw new Error('請先設定 CONFIG.API_BASE_URL');
  }
  if (!CONFIG.WORKFLOW_ID) {
    throw new Error('請先設定 CONFIG.WORKFLOW_ID');
  }
  if (CONFIG.USE_TEST_WEBHOOK && !CONFIG.TEST_WEBHOOK_URL) {
    throw new Error('USE_TEST_WEBHOOK=true 時必須設定 TEST_WEBHOOK_URL');
  }
}
