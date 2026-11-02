/**
 * 每小時檢查即將開始的預約，查詢門鎖密碼後優先用 LINE 通知，
 * 沒有有效 LINE 綁定（或 LINE 推送失敗）時改寄 Email。
 *
 * 必要的 Apps Script 指令碼屬性：
 *   ODO_DOOR_LOCK_API_KEY
 *   ODO_LINE_CHANNEL_ACCESS_TOKEN
 *   ODO_API_ADMIN_ACCOUNT
 *   ODO_API_ADMIN_PASSWORD
 */
var DOOR_NOTIFICATION_CONFIG = {
  BOOKING_API_BASE_URL: 'https://cv3op1ht.cgapps.dev/api',
  LOCK_API_URL: 'https://ndxrmp0dv3.execute-api.ap-northeast-1.amazonaws.com/dev/booking',
  LINE_PUSH_URL: 'https://api.line.me/v2/bot/message/push',
  TIME_ZONE: 'Asia/Taipei',
  PAGE_SIZE: 100,
  LOOKAHEAD_MINUTES: 60,

  // 上一次執行若失敗，下一次仍可補送已開始但未超過一小時的預約。
  RETRY_LOOKBACK_MINUTES: 60,
  DEFAULT_DEVICE_ID: 0,
  DEVICE_ID_BY_STUDIO: {},

  LOCK_API_KEY_PROPERTY: 'ODO_DOOR_LOCK_API_KEY',
  LINE_TOKEN_PROPERTY: 'ODO_LINE_CHANNEL_ACCESS_TOKEN',
  ADMIN_ACCOUNT_PROPERTY: 'ODO_API_ADMIN_ACCOUNT',
  ADMIN_PASSWORD_PROPERTY: 'ODO_API_ADMIN_PASSWORD',
  ADMIN_TOKEN_CACHE_KEY: 'ode_admin_access_token',
  NOTIFIED_PROPERTY_PREFIX: 'ode_door_lock_notified_',
  EMAIL_SENDER_NAME: '河日 Ode Studio'
};

/** 每小時觸發器執行入口。 */
function notifyUpcomingBookingsWithDoorCode() {
  validateDoorNotificationConfig_();
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) {
    console.log('前一次門鎖通知仍在執行，本次略過');
    return { line: 0, email: 0, skipped: 0, failed: 0, locked: true };
  }

  try {
    var now = new Date();
    var windowStart = new Date(
      now.getTime() - DOOR_NOTIFICATION_CONFIG.RETRY_LOOKBACK_MINUTES * 60 * 1000
    );
    var windowEnd = new Date(
      now.getTime() + DOOR_NOTIFICATION_CONFIG.LOOKAHEAD_MINUTES * 60 * 1000
    );
    var bookings = listBookingsForDoorNotification_(windowStart, windowEnd);
    var result = { line: 0, email: 0, skipped: 0, failed: 0 };

    bookings.forEach(function (booking) {
      if (hasDoorNotificationBeenSent_(booking.id)) {
        result.skipped += 1;
        return;
      }

      try {
        notifyOneBookingDoorCode_(booking, result);
      } catch (error) {
        result.failed += 1;
        console.error(JSON.stringify({
          message: '門鎖密碼通知失敗',
          bookingId: booking.id,
          bookingNumber: booking.booking_number,
          error: error && error.message ? error.message : String(error)
        }));
      }
    });

    console.log(JSON.stringify({
      message: '每小時門鎖通知完成',
      checkedAt: now.toISOString(),
      bookings: bookings.length,
      result: result
    }));
    return result;
  } finally {
    lock.releaseLock();
  }
}

/** 手動執行此函式測試目前時間前後一小時內的預約。 */
function testDoorLockNotification() {
  return notifyUpcomingBookingsWithDoorCode();
}

function listBookingsForDoorNotification_(windowStart, windowEnd) {
  var bookings = [];
  var page = 1;

  while (true) {
    var query = [
      'page=' + page,
      'pageSize=' + DOOR_NOTIFICATION_CONFIG.PAGE_SIZE,
      'sort=start_at',
      'filter=' + encodeURIComponent('start_at,gte,' + windowStart.toISOString()),
      'filter=' + encodeURIComponent('start_at,lt,' + windowEnd.toISOString()),
      'filter=' + encodeURIComponent('status,eq,confirmed'),
      'filter=' + encodeURIComponent('payment_status,eq,paid')
    ].join('&');
    var response = UrlFetchApp.fetch(
      DOOR_NOTIFICATION_CONFIG.BOOKING_API_BASE_URL.replace(/\/$/, '') +
        '/public/bookings?' + query,
      { method: 'get', muteHttpExceptions: true }
    );
    var status = response.getResponseCode();
    var text = response.getContentText();
    if (status < 200 || status >= 300) {
      throw new Error('預約 API HTTP ' + status + ': ' + text);
    }

    var payload = parseDoorNotificationJson_(text, '預約 API');
    var items = Array.isArray(payload.data) ? payload.data : [];

    // 後端 filter 若被忽略，仍在 Apps Script 再次驗證每筆資料。
    items.forEach(function (booking) {
      var startAt = new Date(booking.start_at);
      if (
        booking.status === 'confirmed' &&
        booking.payment_status === 'paid' &&
        Number.isFinite(startAt.getTime()) &&
        startAt >= windowStart &&
        startAt < windowEnd
      ) {
        bookings.push(booking);
      }
    });

    var total = payload.pagination && Number(payload.pagination.total);
    if (
      items.length === 0 ||
      items.length < DOOR_NOTIFICATION_CONFIG.PAGE_SIZE ||
      (Number.isFinite(total) && page * DOOR_NOTIFICATION_CONFIG.PAGE_SIZE >= total)
    ) {
      return bookings;
    }
    page += 1;
  }
}

function notifyOneBookingDoorCode_(booking, result) {
  var doorBooking = findDoorCodeForBooking_(booking);
  var message = buildDoorCodeMessage_(booking, doorBooking.password);
  var lineAccount = null;
  var lineLookupError = null;

  if (booking.customer_account_id) {
    try {
      lineAccount = findActiveCustomerLineAccount_(booking.customer_account_id);
    } catch (error) {
      lineLookupError = error;
      console.error(
        'LINE 綁定查詢失敗，改寄 Email：' +
        (error && error.message ? error.message : String(error))
      );
    }
  }

  if (lineAccount) {
    try {
      pushDoorCodeToLine_(lineAccount.line_user_id, message);
      markDoorNotificationSent_(booking, 'line', doorBooking, lineAccount.id);
      result.line += 1;
      return;
    } catch (error) {
      console.error(
        'LINE 推送失敗，改寄 Email：' +
        (error && error.message ? error.message : String(error))
      );
    }
  }

  if (!booking.customer_email) {
    if (lineLookupError) throw lineLookupError;
    throw new Error('沒有可用的 LINE 綁定，預約也缺少 customer_email');
  }
  sendDoorCodeEmail_(booking, message);
  markDoorNotificationSent_(booking, 'email', doorBooking, null);
  result.email += 1;
}

function findDoorCodeForBooking_(booking) {
  var begin = formatDoorNotificationHour_(booking.start_at, booking, 'start_at');
  var end = formatDoorNotificationHour_(booking.end_at, booking, 'end_at');
  var remark = String(booking.customer_name || '').trim();
  var deviceId = notificationDeviceIdForBooking_(booking);
  var query = '?begin=' + encodeURIComponent(begin) + '&end=' + encodeURIComponent(end);
  var payload = requestDoorLockForNotification_('get', query);
  var matches = (Array.isArray(payload.bookings) ? payload.bookings : [])
    .filter(function (item) {
      return (
        String(item.remark || '') === remark &&
        Number(item.device_id || 0) === deviceId &&
        Boolean(item.password)
      );
    });

  if (matches.length === 0) {
    throw new Error(
      '找不到對應的門鎖密碼：' + (booking.booking_number || booking.id) +
      ' / ' + begin + ' / ' + end + ' / ' + remark
    );
  }
  if (matches.length > 1) {
    throw new Error(
      '門鎖密碼查詢到多筆，停止通知以避免傳錯密碼：' +
      (booking.booking_number || booking.id)
    );
  }
  return matches[0];
}

function findActiveCustomerLineAccount_(customerAccountId) {
  var query = [
    'page=1',
    'pageSize=100',
    'sort=-updated_at',
    'filter=' + encodeURIComponent('customer_account_id,eq,' + customerAccountId),
    'filter=' + encodeURIComponent('status,eq,active'),
    'filter=' + encodeURIComponent('notification_enabled,eq,true')
  ].join('&');
  var response = fetchAuthorizedLineAccounts_(query, false);
  var payload = parseDoorNotificationJson_(response.getContentText(), 'LINE 綁定 API');
  var items = Array.isArray(payload.data) ? payload.data : [];
  var matches = items.filter(function (item) {
    return (
      Number(item.customer_account_id) === Number(customerAccountId) &&
      item.status === 'active' &&
      item.notification_enabled === true &&
      !item.unlinked_at &&
      Boolean(item.line_user_id)
    );
  });
  return matches[0] || null;
}

function fetchAuthorizedLineAccounts_(query, forceLogin) {
  var token = getDoorNotificationAdminToken_(forceLogin);
  var url = DOOR_NOTIFICATION_CONFIG.BOOKING_API_BASE_URL.replace(/\/$/, '') +
    '/customer_line_accounts?' + query;
  var response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: { Authorization: 'Bearer ' + token },
    muteHttpExceptions: true
  });
  var status = response.getResponseCode();

  if (status === 401 && !forceLogin) {
    CacheService.getScriptCache().remove(DOOR_NOTIFICATION_CONFIG.ADMIN_TOKEN_CACHE_KEY);
    return fetchAuthorizedLineAccounts_(query, true);
  }
  if (status < 200 || status >= 300) {
    throw new Error('LINE 綁定 API HTTP ' + status + ': ' + response.getContentText());
  }
  return response;
}

function getDoorNotificationAdminToken_(forceLogin) {
  var cache = CacheService.getScriptCache();
  if (!forceLogin) {
    var cached = cache.get(DOOR_NOTIFICATION_CONFIG.ADMIN_TOKEN_CACHE_KEY);
    if (cached) return cached;
  }

  var properties = PropertiesService.getScriptProperties();
  var account = properties.getProperty(DOOR_NOTIFICATION_CONFIG.ADMIN_ACCOUNT_PROPERTY);
  var password = properties.getProperty(DOOR_NOTIFICATION_CONFIG.ADMIN_PASSWORD_PROPERTY);
  var response = UrlFetchApp.fetch(
    DOOR_NOTIFICATION_CONFIG.BOOKING_API_BASE_URL.replace(/\/$/, '') + '/auth/login',
    {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ account: account, password: password }),
      muteHttpExceptions: true
    }
  );
  var status = response.getResponseCode();
  var text = response.getContentText();
  if (status < 200 || status >= 300) {
    throw new Error('後台登入 HTTP ' + status + ': ' + text);
  }
  var payload = parseDoorNotificationJson_(text, '後台登入 API');
  var data = payload && payload.data ? payload.data : payload;
  var token = data && data.access_token;
  if (!token) throw new Error('後台登入 API 未回傳 access_token');

  cache.put(DOOR_NOTIFICATION_CONFIG.ADMIN_TOKEN_CACHE_KEY, token, 50 * 60);
  return token;
}

function pushDoorCodeToLine_(lineUserId, message) {
  var token = PropertiesService.getScriptProperties()
    .getProperty(DOOR_NOTIFICATION_CONFIG.LINE_TOKEN_PROPERTY);
  var response = UrlFetchApp.fetch(DOOR_NOTIFICATION_CONFIG.LINE_PUSH_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify({
      to: lineUserId,
      messages: [{ type: 'text', text: message }]
    }),
    muteHttpExceptions: true
  });
  var status = response.getResponseCode();
  if (status < 200 || status >= 300) {
    throw new Error('LINE Messaging API HTTP ' + status + ': ' + response.getContentText());
  }
}

function sendDoorCodeEmail_(booking, message) {
  var subject = '河日 Ode Studio 門鎖密碼｜' + (booking.booking_number || '預約通知');
  MailApp.sendEmail({
    to: booking.customer_email,
    name: DOOR_NOTIFICATION_CONFIG.EMAIL_SENDER_NAME,
    subject: subject,
    body: message,
    htmlBody: '<div style="font-family:sans-serif;white-space:pre-line;line-height:1.7">' +
      escapeDoorNotificationHtml_(message) + '</div>'
  });
}

function buildDoorCodeMessage_(booking, password) {
  var startAt = new Date(booking.start_at);
  var endAt = new Date(booking.end_at);
  var date = Utilities.formatDate(startAt, DOOR_NOTIFICATION_CONFIG.TIME_ZONE, 'yyyy/MM/dd');
  var startTime = Utilities.formatDate(startAt, DOOR_NOTIFICATION_CONFIG.TIME_ZONE, 'HH:mm');
  var endTime = Utilities.formatDate(endAt, DOOR_NOTIFICATION_CONFIG.TIME_ZONE, 'HH:mm');
  return [
    (booking.customer_name || '您好') + '，您好：',
    '',
    '您在河日 Ode Studio 的預約即將開始。',
    '訂單編號：' + (booking.booking_number || ''),
    '預約時間：' + date + ' ' + startTime + '－' + endTime,
    '門鎖密碼：' + String(password),
    '',
    '請妥善保管密碼，勿轉傳給非同行人員。'
  ].join('\n');
}

function requestDoorLockForNotification_(method, query) {
  var properties = PropertiesService.getScriptProperties();
  var apiKey = properties.getProperty(DOOR_NOTIFICATION_CONFIG.LOCK_API_KEY_PROPERTY);
  var response = UrlFetchApp.fetch(
    DOOR_NOTIFICATION_CONFIG.LOCK_API_URL + (query || ''),
    {
      method: method,
      headers: { 'x-api-key': apiKey },
      muteHttpExceptions: true
    }
  );
  var status = response.getResponseCode();
  var text = response.getContentText();
  if (status < 200 || status >= 300) {
    throw new Error('門鎖 API HTTP ' + status + ': ' + text);
  }
  return parseDoorNotificationJson_(text, '門鎖 API');
}

function formatDoorNotificationHour_(value, booking, fieldName) {
  var date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new Error('預約 ' + fieldName + ' 格式錯誤：' + value);
  }
  var minute = Utilities.formatDate(date, DOOR_NOTIFICATION_CONFIG.TIME_ZONE, 'mm');
  var second = Utilities.formatDate(date, DOOR_NOTIFICATION_CONFIG.TIME_ZONE, 'ss');
  if (minute !== '00' || second !== '00') {
    throw new Error(
      '門鎖 API 僅支援整點，但預約不是整點：' +
      (booking.booking_number || booking.id) + ' ' + value
    );
  }
  return Utilities.formatDate(date, DOOR_NOTIFICATION_CONFIG.TIME_ZONE, 'yyyy-MM-dd-HH');
}

function notificationDeviceIdForBooking_(booking) {
  var mapped = DOOR_NOTIFICATION_CONFIG.DEVICE_ID_BY_STUDIO[String(booking.studio_id)];
  var value = mapped === undefined ? DOOR_NOTIFICATION_CONFIG.DEFAULT_DEVICE_ID : mapped;
  value = Number(value);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error('device_id 必須是大於等於 0 的整數：' + value);
  }
  return value;
}

function hasDoorNotificationBeenSent_(bookingId) {
  return Boolean(
    PropertiesService.getScriptProperties().getProperty(
      DOOR_NOTIFICATION_CONFIG.NOTIFIED_PROPERTY_PREFIX + bookingId
    )
  );
}

function markDoorNotificationSent_(booking, channel, doorBooking, lineAccountId) {
  // 不保存門鎖密碼，只保存已發送結果，避免每小時重複通知。
  PropertiesService.getScriptProperties().setProperty(
    DOOR_NOTIFICATION_CONFIG.NOTIFIED_PROPERTY_PREFIX + booking.id,
    JSON.stringify({
      bookingId: booking.id,
      bookingNumber: booking.booking_number,
      channel: channel,
      doorLockBookingId: doorBooking.id || null,
      customerLineAccountId: lineAccountId,
      sentAt: new Date().toISOString()
    })
  );
}

function parseDoorNotificationJson_(text, source) {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(source + ' 回傳的不是合法 JSON：' + text);
  }
}

function escapeDoorNotificationHtml_(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function validateDoorNotificationConfig_() {
  var properties = PropertiesService.getScriptProperties();
  [
    DOOR_NOTIFICATION_CONFIG.LOCK_API_KEY_PROPERTY,
    DOOR_NOTIFICATION_CONFIG.LINE_TOKEN_PROPERTY,
    DOOR_NOTIFICATION_CONFIG.ADMIN_ACCOUNT_PROPERTY,
    DOOR_NOTIFICATION_CONFIG.ADMIN_PASSWORD_PROPERTY
  ].forEach(function (name) {
    if (!properties.getProperty(name)) {
      throw new Error('請在 Apps Script 指令碼屬性設定 ' + name);
    }
  });
  if (
    DOOR_NOTIFICATION_CONFIG.PAGE_SIZE < 1 ||
    DOOR_NOTIFICATION_CONFIG.PAGE_SIZE > 100
  ) {
    throw new Error('PAGE_SIZE 必須介於 1 到 100');
  }
}

/** 執行一次即可建立每小時觸發器；重複執行會先刪除舊觸發器。 */
function installDoorLockNotificationTrigger() {
  validateDoorNotificationConfig_();
  ScriptApp.getProjectTriggers()
    .filter(function (trigger) {
      return trigger.getHandlerFunction() === 'notifyUpcomingBookingsWithDoorCode';
    })
    .forEach(function (trigger) {
      ScriptApp.deleteTrigger(trigger);
    });

  ScriptApp.newTrigger('notifyUpcomingBookingsWithDoorCode')
    .timeBased()
    .everyHours(1)
    .create();
}

