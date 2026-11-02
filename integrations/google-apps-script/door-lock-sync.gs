/**
 * 每天為隔日已確認、已付款的預約建立門鎖密碼。
 *
 * 安裝前請在 Apps Script「專案設定 → 指令碼屬性」加入：
 *   ODO_DOOR_LOCK_API_KEY = 門鎖 API Key
 *
 * 執行 installDoorLockDailyTrigger() 一次，即可建立每日觸發器。
 */
var DOOR_LOCK_CONFIG = {
  BOOKING_API_BASE_URL: 'https://cv3op1ht.cgapps.dev/api',
  LOCK_API_URL: 'https://ndxrmp0dv3.execute-api.ap-northeast-1.amazonaws.com/dev/booking',
  API_KEY_PROPERTY: 'ODO_DOOR_LOCK_API_KEY',
  TIME_ZONE: 'Asia/Taipei',
  PAGE_SIZE: 100,
  DEFAULT_DEVICE_ID: 0,

  // 如果不同攝影棚使用不同門鎖，可在這裡用 studio_id 指定 device_id。
  // 例如：{ '1': 0, '2': 1 }
  DEVICE_ID_BY_STUDIO: {},

  // Apps Script 的每日觸發器會在此小時內執行，不保證精確到分鐘。
  DAILY_TRIGGER_HOUR: 20
};

/** 每日觸發器執行入口：同步台北時間的隔日預約。 */
function syncTomorrowBookingsToDoorLock() {
  var tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  var dateText = Utilities.formatDate(tomorrow, DOOR_LOCK_CONFIG.TIME_ZONE, 'yyyy-MM-dd');
  return syncBookingsToDoorLockForDate_(dateText);
}

/**
 * 手動測試入口。預設仍測試隔日；若要測指定日期，暫時填入 yyyy-MM-dd。
 */
function testDoorLockSync() {
  var testDate = '';
  if (!testDate) return syncTomorrowBookingsToDoorLock();
  return syncBookingsToDoorLockForDate_(testDate);
}

function syncBookingsToDoorLockForDate_(dateText) {
  validateDoorLockConfig_();
  validateDoorLockDate_(dateText);

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) {
    console.log('前一次門鎖同步仍在執行，本次略過');
    return { created: 0, existing: 0, skipped: 0, failed: 0, locked: true };
  }

  try {
    var bookings = listEligibleBookingsForDoorLock_(dateText);
    var result = { created: 0, existing: 0, skipped: 0, failed: 0 };

    bookings.forEach(function (booking) {
      try {
        syncOneBookingToDoorLock_(booking, result);
      } catch (error) {
        result.failed += 1;
        console.error(JSON.stringify({
          message: '門鎖密碼建立失敗',
          bookingId: booking.id,
          bookingNumber: booking.booking_number,
          error: error && error.message ? error.message : String(error)
        }));
      }
    });

    console.log(JSON.stringify({
      message: '隔日門鎖同步完成',
      date: dateText,
      bookings: bookings.length,
      result: result
    }));
    return result;
  } finally {
    lock.releaseLock();
  }
}

function listEligibleBookingsForDoorLock_(dateText) {
  var startAt = Utilities.parseDate(
    dateText + ' 00:00:00',
    DOOR_LOCK_CONFIG.TIME_ZONE,
    'yyyy-MM-dd HH:mm:ss'
  );
  var endAt = new Date(startAt.getTime() + 24 * 60 * 60 * 1000);
  var bookings = [];
  var page = 1;

  while (true) {
    var query = [
      'page=' + page,
      'pageSize=' + DOOR_LOCK_CONFIG.PAGE_SIZE,
      'sort=start_at',
      'filter=' + encodeURIComponent('start_at,gte,' + startAt.toISOString()),
      'filter=' + encodeURIComponent('start_at,lt,' + endAt.toISOString()),
      'filter=' + encodeURIComponent('status,eq,confirmed'),
      'filter=' + encodeURIComponent('payment_status,eq,paid')
    ].join('&');
    var response = UrlFetchApp.fetch(
      DOOR_LOCK_CONFIG.BOOKING_API_BASE_URL.replace(/\/$/, '') + '/public/bookings?' + query,
      { method: 'get', muteHttpExceptions: true }
    );
    var status = response.getResponseCode();
    var text = response.getContentText();
    if (status < 200 || status >= 300) {
      throw new Error('預約 API HTTP ' + status + ': ' + text);
    }

    var payload = parseDoorLockJson_(text, '預約 API');
    var items = Array.isArray(payload.data) ? payload.data : [];

    // 即使後端忽略 filter，也只允許隔日、已確認、已付款的預約進入門鎖流程。
    items.forEach(function (booking) {
      var bookingStart = new Date(booking.start_at);
      if (
        booking.status === 'confirmed' &&
        booking.payment_status === 'paid' &&
        Number.isFinite(bookingStart.getTime()) &&
        bookingStart >= startAt &&
        bookingStart < endAt
      ) {
        bookings.push(booking);
      }
    });

    var total = payload.pagination && Number(payload.pagination.total);
    if (
      items.length === 0 ||
      items.length < DOOR_LOCK_CONFIG.PAGE_SIZE ||
      (Number.isFinite(total) && page * DOOR_LOCK_CONFIG.PAGE_SIZE >= total)
    ) {
      return bookings;
    }
    page += 1;
  }
}

function syncOneBookingToDoorLock_(booking, result) {
  var begin = formatDoorLockHour_(booking.start_at, booking, 'start_at');
  var end = formatDoorLockHour_(booking.end_at, booking, 'end_at');
  var remark = String(booking.customer_name || '').trim();
  var deviceId = doorLockDeviceIdForBooking_(booking);

  if (!remark) {
    result.skipped += 1;
    console.error('預約缺少 customer_name，略過：' + (booking.booking_number || booking.id));
    return;
  }
  if (begin >= end) {
    throw new Error('預約開始時間必須早於結束時間：' + begin + ' / ' + end);
  }

  var existing = findExistingDoorLockBooking_(begin, end, remark, deviceId);
  if (existing) {
    rememberDoorLockBooking_(booking, existing, begin, end, remark, deviceId);
    result.existing += 1;
    return;
  }

  var created = requestDoorLockApi_('post', '', {
    begin: begin,
    end: end,
    remark: remark,
    device_id: deviceId
  });
  if (!created.ok || !created.booking || !created.booking.password) {
    throw new Error('門鎖 API 未回傳有效的 booking/password');
  }

  // 不將密碼寫入執行記錄；僅保存於 Script Properties，供後續通知流程讀取。
  rememberDoorLockBooking_(booking, created.booking, begin, end, remark, deviceId);
  result.created += 1;
}

function findExistingDoorLockBooking_(begin, end, remark, deviceId) {
  var query = '?begin=' + encodeURIComponent(begin) + '&end=' + encodeURIComponent(end);
  var payload = requestDoorLockApi_('get', query);
  var bookings = Array.isArray(payload.bookings) ? payload.bookings : [];
  return bookings.filter(function (item) {
    return String(item.remark || '') === remark && Number(item.device_id || 0) === deviceId;
  })[0] || null;
}

function requestDoorLockApi_(method, query, body) {
  var apiKey = PropertiesService.getScriptProperties()
    .getProperty(DOOR_LOCK_CONFIG.API_KEY_PROPERTY);
  var options = {
    method: method,
    headers: { 'x-api-key': apiKey },
    muteHttpExceptions: true
  };
  if (body) {
    options.contentType = 'application/json';
    options.payload = JSON.stringify(body);
  }

  var response = UrlFetchApp.fetch(DOOR_LOCK_CONFIG.LOCK_API_URL + (query || ''), options);
  var status = response.getResponseCode();
  var text = response.getContentText();
  if (status < 200 || status >= 300) {
    throw new Error('門鎖 API HTTP ' + status + ': ' + text);
  }
  return parseDoorLockJson_(text, '門鎖 API');
}

function formatDoorLockHour_(value, booking, fieldName) {
  var date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new Error('預約 ' + fieldName + ' 格式錯誤：' + value);
  }
  var minute = Utilities.formatDate(date, DOOR_LOCK_CONFIG.TIME_ZONE, 'mm');
  var second = Utilities.formatDate(date, DOOR_LOCK_CONFIG.TIME_ZONE, 'ss');
  if (minute !== '00' || second !== '00') {
    throw new Error(
      '門鎖 API 僅支援整點，但預約不是整點：' +
      (booking.booking_number || booking.id) + ' ' + value
    );
  }
  return Utilities.formatDate(date, DOOR_LOCK_CONFIG.TIME_ZONE, 'yyyy-MM-dd-HH');
}

function doorLockDeviceIdForBooking_(booking) {
  var mapped = DOOR_LOCK_CONFIG.DEVICE_ID_BY_STUDIO[String(booking.studio_id)];
  var value = mapped === undefined ? DOOR_LOCK_CONFIG.DEFAULT_DEVICE_ID : mapped;
  value = Number(value);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error('device_id 必須是大於等於 0 的整數：' + value);
  }
  return value;
}

function rememberDoorLockBooking_(booking, lockBooking, begin, end, remark, deviceId) {
  PropertiesService.getScriptProperties().setProperty(
    'ode_door_lock_booking_' + booking.id,
    JSON.stringify({
      bookingId: booking.id,
      bookingNumber: booking.booking_number,
      password: String(lockBooking.password),
      remoteId: lockBooking.id || null,
      begin: begin,
      end: end,
      remark: remark,
      deviceId: deviceId,
      savedAt: new Date().toISOString()
    })
  );
}

function parseDoorLockJson_(text, source) {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(source + ' 回傳的不是合法 JSON：' + text);
  }
}

function validateDoorLockDate_(dateText) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
    throw new Error('同步日期必須是 yyyy-MM-dd：' + dateText);
  }
}

function validateDoorLockConfig_() {
  if (!DOOR_LOCK_CONFIG.BOOKING_API_BASE_URL) throw new Error('尚未設定 BOOKING_API_BASE_URL');
  if (!DOOR_LOCK_CONFIG.LOCK_API_URL) throw new Error('尚未設定 LOCK_API_URL');
  if (DOOR_LOCK_CONFIG.PAGE_SIZE < 1 || DOOR_LOCK_CONFIG.PAGE_SIZE > 100) {
    throw new Error('PAGE_SIZE 必須介於 1 到 100');
  }
  var apiKey = PropertiesService.getScriptProperties()
    .getProperty(DOOR_LOCK_CONFIG.API_KEY_PROPERTY);
  if (!apiKey) {
    throw new Error(
      '請在 Apps Script 指令碼屬性設定 ' + DOOR_LOCK_CONFIG.API_KEY_PROPERTY
    );
  }
}

/** 執行一次即可建立每日觸發器；重複執行會先刪除舊觸發器。 */
function installDoorLockDailyTrigger() {
  validateDoorLockConfig_();
  if (
    !Number.isInteger(DOOR_LOCK_CONFIG.DAILY_TRIGGER_HOUR) ||
    DOOR_LOCK_CONFIG.DAILY_TRIGGER_HOUR < 0 ||
    DOOR_LOCK_CONFIG.DAILY_TRIGGER_HOUR > 23
  ) {
    throw new Error('DAILY_TRIGGER_HOUR 必須介於 0 到 23');
  }

  ScriptApp.getProjectTriggers()
    .filter(function (trigger) {
      return trigger.getHandlerFunction() === 'syncTomorrowBookingsToDoorLock';
    })
    .forEach(function (trigger) {
      ScriptApp.deleteTrigger(trigger);
    });

  ScriptApp.newTrigger('syncTomorrowBookingsToDoorLock')
    .timeBased()
    .atHour(DOOR_LOCK_CONFIG.DAILY_TRIGGER_HOUR)
    .everyDays(1)
    .inTimezone(DOOR_LOCK_CONFIG.TIME_ZONE)
    .create();
}

