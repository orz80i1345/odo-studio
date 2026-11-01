/**
 * 每分鐘由 Apps Script 時間驅動觸發器執行。
 *
 * 注意：銀行信中的「您的存款帳號末四碼」是收款帳戶末四碼，
 * 不是付款人的帳號末四碼，所以 payload 使用 creditedAccountLast4。
 */
var CONFIG = {
  // API Base URL 要包含 /api，但結尾不要加斜線。
  API_BASE_URL: 'https://你的網域.cgapps.dev/api',
  WORKFLOW_ID: 'fb3fb6f3-6937-4abf-99dc-143ef20ed0d8',

  GMAIL_QUERY: 'label:bank-webhook is:unread',
  TIME_ZONE: 'Asia/Taipei',
  MATCH_TOLERANCE_MINUTES: 30
};

function checkBankMail() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) {
    console.log('前一次銀行信件檢查仍在執行，本次略過');
    return;
  }

  try {
    var errorLabel = GmailApp.getUserLabelByName('bank-webhook-error') ||
      GmailApp.createLabel('bank-webhook-error');
    var threads = GmailApp.search(CONFIG.GMAIL_QUERY, 0, 100);

    threads.forEach(function (thread) {
      thread.getMessages().forEach(function (message) {
        if (!message.isUnread()) return;

        var bankEvent;
        try {
          bankEvent = parseBankDepositMail_(message);
        } catch (error) {
          console.error('銀行信件解析失敗：' + message.getId() + '，' + error.message);
          // Gmail label 屬於整個 thread，因此只用 label 提醒人工檢查，
          // 並將目前這封格式不符的 message 標成已讀，避免每分鐘重複解析。
          thread.addLabel(errorLabel);
          message.markRead();
          return;
        }

        try {
          var result = sendBankEventToWorkflow_(bankEvent);
          console.log(JSON.stringify({
            message: '銀行入帳事件已由 workflow 接收',
            gmailMessageId: message.getId(),
            result: result
          }));
          message.markRead();
        } catch (error) {
          // Webhook 未成功接收時維持未讀，下次觸發器會使用相同 eventId 重試。
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
    emailReceivedAt: message.getDate().toISOString()
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
  var baseUrl = CONFIG.API_BASE_URL.replace(/\/$/, '');

  var response = UrlFetchApp.fetch(
    baseUrl + '/workflow/' + encodeURIComponent(CONFIG.WORKFLOW_ID) + '/execute',
    {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    }
  );

  var httpStatus = response.getResponseCode();
  var responseText = response.getContentText();

  if (httpStatus < 200 || httpStatus >= 300) {
    throw new Error('Webhook HTTP ' + httpStatus + ': ' + responseText);
  }

  // 這個 endpoint 只確認事件已接收；付款更新會在 workflow 內非同步執行。
  if (!responseText) {
    return { accepted: true, httpStatus: httpStatus };
  }

  try {
    return JSON.parse(responseText);
  } catch (error) {
    return {
      accepted: true,
      httpStatus: httpStatus,
      responseText: responseText
    };
  }
}

function pad2_(value) {
  return String(value).padStart(2, '0');
}

function validateConfig_() {
  if (!CONFIG.API_BASE_URL || CONFIG.API_BASE_URL.indexOf('你的網域') !== -1) {
    throw new Error('請先設定 CONFIG.API_BASE_URL');
  }
}
