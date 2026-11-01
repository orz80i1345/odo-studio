/**
 * 將未來預約同步到 Google Calendar。
 *
 * 建議在 Apps Script 設定每 5 分鐘執行 syncConfirmedBookingsToCalendar。
 * 只有 status=confirmed 且 payment_status=paid 的訂單會存在於日曆；
 * 訂單取消、改回未付款或時間異動時，下一次同步會刪除或更新事件。
 */
var CALENDAR_CONFIG = {
  API_BASE_URL: 'https://cv3op1ht.cgapps.dev/api',

  // 留空表示使用執行 Apps Script 帳號的預設日曆。
  // 若要使用共用日曆，請填入 Google Calendar 設定中的「日曆 ID」。
  CALENDAR_ID: '',

  EVENT_TITLE_PREFIX: '河日 Ode Studio',
  EVENT_LOCATION: '',
  TIME_ZONE: 'Asia/Taipei',
  PAGE_SIZE: 100,
  LOOKBACK_DAYS: 1,
  POPUP_REMINDER_MINUTES: 60
};

var CALENDAR_EVENT_PROPERTY_PREFIX = 'ode_calendar_event_';

function syncConfirmedBookingsToCalendar() {
  validateCalendarConfig_();
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) {
    console.log('前一次 Google Calendar 同步仍在執行，本次略過');
    return;
  }

  try {
    var calendar = getTargetCalendar_();
    var bookings = listUpcomingBookings_();
    var result = { created: 0, updated: 0, deleted: 0, skipped: 0 };

    bookings.forEach(function (booking) {
      var eligible = booking.status === 'confirmed' && booking.payment_status === 'paid';
      if (eligible) {
        upsertCalendarEvent_(calendar, booking, result);
      } else {
        deleteCalendarEvent_(calendar, booking, result);
      }
    });

    console.log(JSON.stringify({
      message: 'Google Calendar 同步完成',
      bookings: bookings.length,
      result: result
    }));
    return result;
  } finally {
    lock.releaseLock();
  }
}

function listUpcomingBookings_() {
  var cutoff = new Date(Date.now() - CALENDAR_CONFIG.LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  var bookings = [];
  var page = 1;

  while (true) {
    var query = [
      'page=' + page,
      'pageSize=' + CALENDAR_CONFIG.PAGE_SIZE,
      'sort=start_at',
      'filter=' + encodeURIComponent('end_at,gte,' + cutoff.toISOString())
    ].join('&');
    var response = UrlFetchApp.fetch(
      CALENDAR_CONFIG.API_BASE_URL.replace(/\/$/, '') + '/public/bookings?' + query,
      { method: 'get', muteHttpExceptions: true }
    );
    var status = response.getResponseCode();
    var text = response.getContentText();
    if (status < 200 || status >= 300) {
      throw new Error('預約 API HTTP ' + status + ': ' + text);
    }

    var payload = JSON.parse(text);
    var items = Array.isArray(payload.data) ? payload.data : [];
    bookings = bookings.concat(items);
    var total = payload.pagination && Number(payload.pagination.total);
    if (items.length === 0 || items.length < CALENDAR_CONFIG.PAGE_SIZE ||
        (Number.isFinite(total) && bookings.length >= total)) {
      return bookings;
    }
    page += 1;
  }
}

function upsertCalendarEvent_(calendar, booking, result) {
  var properties = PropertiesService.getScriptProperties();
  var propertyKey = CALENDAR_EVENT_PROPERTY_PREFIX + booking.id;
  var eventId = properties.getProperty(propertyKey);
  var event = eventId ? calendar.getEventById(eventId) : null;
  var title = buildCalendarTitle_(booking);
  var startAt = new Date(booking.start_at);
  var endAt = new Date(booking.end_at);
  var description = buildCalendarDescription_(booking);

  if (!Number.isFinite(startAt.getTime()) || !Number.isFinite(endAt.getTime()) || endAt <= startAt) {
    console.error('預約時間格式錯誤：' + booking.booking_number);
    result.skipped += 1;
    return;
  }

  // Script Properties 被清除或重新部署時，仍先用訂單編號找回既有事件，避免重複建立。
  if (!event) {
    event = calendar.getEvents(startAt, endAt, { search: booking.booking_number })
      .filter(function (candidate) {
        return candidate.getDescription().indexOf('訂單編號：' + booking.booking_number) !== -1;
      })[0] || null;
    if (event) properties.setProperty(propertyKey, event.getId());
  }

  if (!event) {
    event = calendar.createEvent(title, startAt, endAt, {
      description: description,
      location: CALENDAR_CONFIG.EVENT_LOCATION
    });
    event.removeAllReminders();
    event.addPopupReminder(CALENDAR_CONFIG.POPUP_REMINDER_MINUTES);
    properties.setProperty(propertyKey, event.getId());
    result.created += 1;
    return;
  }

  event
    .setTitle(title)
    .setTime(startAt, endAt)
    .setDescription(description)
    .setLocation(CALENDAR_CONFIG.EVENT_LOCATION);
  result.updated += 1;
}

function deleteCalendarEvent_(calendar, booking, result) {
  var properties = PropertiesService.getScriptProperties();
  var propertyKey = CALENDAR_EVENT_PROPERTY_PREFIX + booking.id;
  var eventId = properties.getProperty(propertyKey);
  if (!eventId) return;

  var event = calendar.getEventById(eventId);
  if (event) event.deleteEvent();
  properties.deleteProperty(propertyKey);
  result.deleted += 1;
}

function buildCalendarTitle_(booking) {
  return [
    CALENDAR_CONFIG.EVENT_TITLE_PREFIX,
    booking.customer_name,
    booking.booking_number
  ].filter(Boolean).join('｜');
}

function buildCalendarDescription_(booking) {
  return [
    '訂單編號：' + (booking.booking_number || ''),
    '客戶：' + (booking.customer_name || ''),
    '電話：' + (booking.customer_phone || ''),
    'Email：' + (booking.customer_email || ''),
    '用途：' + (booking.purpose || '未填寫'),
    '金額：NT$ ' + Number(booking.total_price || 0).toLocaleString('en-US'),
    '付款狀態：已付款',
    '備註：' + (booking.customer_note || '無')
  ].join('\n');
}

function getTargetCalendar_() {
  if (!CALENDAR_CONFIG.CALENDAR_ID) return CalendarApp.getDefaultCalendar();
  var calendar = CalendarApp.getCalendarById(CALENDAR_CONFIG.CALENDAR_ID);
  if (!calendar) throw new Error('找不到 CALENDAR_CONFIG.CALENDAR_ID 指定的日曆');
  return calendar;
}

/** 執行一次即可建立每 5 分鐘觸發器；重複執行會先移除舊觸發器。 */
function installCalendarSyncTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(function (trigger) {
      return trigger.getHandlerFunction() === 'syncConfirmedBookingsToCalendar';
    })
    .forEach(function (trigger) {
      ScriptApp.deleteTrigger(trigger);
    });

  ScriptApp.newTrigger('syncConfirmedBookingsToCalendar')
    .timeBased()
    .everyMinutes(5)
    .create();
}

function validateCalendarConfig_() {
  if (!CALENDAR_CONFIG.API_BASE_URL) throw new Error('請先設定 CALENDAR_CONFIG.API_BASE_URL');
  if (CALENDAR_CONFIG.PAGE_SIZE < 1 || CALENDAR_CONFIG.PAGE_SIZE > 100) {
    throw new Error('CALENDAR_CONFIG.PAGE_SIZE 必須介於 1 到 100');
  }
}
