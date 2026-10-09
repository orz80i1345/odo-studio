/**
 * 用末四碼、金額與入帳時間核對 payments，並同步 bookings 狀態。
 *
 * Apps Script 指令碼屬性：
 * - ODO_API_BASE_URL，例如 https://cv3op1ht.cgapps.dev/api
 * - ODO_API_KEY
 * - ODO_ADMIN_ACCOUNT
 * - ODO_ADMIN_PASSWORD
 * - ODO_PAYMENT_TIME_TOLERANCE_MINUTES（選填，預設 30）
 *
 * Gmail 解析完成後呼叫：
 * reconcileOdoPayment('1234', 1500, new Date())
 */
function reconcileOdoPayment(last4, amount, transferredAt) {
  var normalizedLast4 = String(last4 || '').trim();
  var normalizedAmount = Number(String(amount).replace(/,/g, '').trim());
  var paidAt = new Date(transferredAt);

  if (!/^\d{4}$/.test(normalizedLast4)) {
    throw new Error('匯款帳號末四碼格式錯誤');
  }
  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    throw new Error('入帳金額格式錯誤');
  }
  if (!transferredAt || isNaN(paidAt.getTime())) {
    throw new Error('入帳時間格式錯誤');
  }

  var toleranceValue = PropertiesService.getScriptProperties()
    .getProperty('ODO_PAYMENT_TIME_TOLERANCE_MINUTES') || '30';
  var toleranceMinutes = Number(toleranceValue);
  if (!Number.isFinite(toleranceMinutes) || toleranceMinutes <= 0) {
    throw new Error('ODO_PAYMENT_TIME_TOLERANCE_MINUTES 格式錯誤');
  }

  var token = loginOdoAdmin_();
  var candidates = findPaymentCandidates_(
    normalizedLast4,
    normalizedAmount,
    paidAt,
    toleranceMinutes,
    token
  );
  var payable = candidates.filter(function (payment) {
    return payment.status === 'pending' || payment.status === 'failed';
  });

  if (payable.length > 1) {
    throw new Error('末四碼、金額與時間符合多筆待付款紀錄，已停止自動更新');
  }

  if (payable.length === 0) {
    var processed = candidates.filter(function (payment) {
      return payment.status === 'paid';
    });
    if (processed.length === 1) {
      finalizeBookingForPayment_(processed[0], token);
      return {
        result: 'already_processed',
        paymentId: processed[0].id,
        bookingId: processed[0].booking_id
      };
    }
    throw new Error('找不到唯一符合末四碼、金額與時間的待付款紀錄');
  }

  var payment = payable[0];
  var metadata = parseMetadata_(payment.metadata);
  metadata.paymentReconciliation = {
    source: 'gmail_apps_script',
    bankLast4: normalizedLast4,
    amount: normalizedAmount,
    transferredAt: paidAt.toISOString(),
    reconciledAt: new Date().toISOString()
  };

  var updatedResponse = odoApiRequest_(
    '/payments/' + encodeURIComponent(payment.id),
    'patch',
    {
      status: 'paid',
      verified_at: new Date().toISOString(),
      metadata: JSON.stringify(metadata)
    },
    token
  );
  var updatedPayment = updatedResponse.data || updatedResponse;
  finalizeBookingForPayment_(updatedPayment, token);

  return {
    result: 'updated',
    paymentId: updatedPayment.id,
    bookingId: updatedPayment.booking_id,
    paymentStatus: updatedPayment.status
  };
}

function findPaymentCandidates_(last4, amount, transferredAt, toleranceMinutes, token) {
  var windowStart = new Date(transferredAt.getTime() - toleranceMinutes * 60 * 1000);
  var windowEnd = new Date(transferredAt.getTime() + toleranceMinutes * 60 * 1000);
  var filters = [
    // 部署 API 的 doc.json 目前將此欄位命名為 payer_las4。
    ['payer_las4', 'eq', last4],
    ['amount', 'eq', amount],
    ['transferred_at', 'gte', windowStart.toISOString()],
    ['transferred_at', 'lte', windowEnd.toISOString()]
  ];
  return listPayments_(filters, token).filter(function (payment) {
    var paymentTime = new Date(payment.transferred_at).getTime();
    var paymentLast4 = payment.payer_las4 || payment.payer_last4;
    return String(paymentLast4 || '') === last4 &&
      Number(payment.amount) === amount &&
      !isNaN(paymentTime) &&
      paymentTime >= windowStart.getTime() &&
      paymentTime <= windowEnd.getTime();
  });
}

function listPayments_(filters, token) {
  var items = [];
  for (var page = 1; ; page += 1) {
    var query = ['page=' + page, 'pageSize=100'];
    filters.forEach(function (filter) {
      query.push('filter=' + encodeURIComponent(filter.join(',')));
    });
    var response = odoApiRequest_('/public/payments?' + query.join('&'), 'get', undefined, token);
    var rows = response.data || [];
    items = items.concat(rows);
    var total = response.pagination && response.pagination.total;
    if (rows.length === 0 || rows.length < 100 ||
        (total !== undefined && items.length >= total)) break;
  }
  return items;
}

function finalizeBookingForPayment_(payment, token) {
  var bookingPaymentStatus = payment.payment_type === 'deposit'
    ? 'deposit_paid'
    : 'paid';
  odoApiRequest_(
    '/bookings/' + encodeURIComponent(payment.booking_id),
    'patch',
    {
      status: 'confirmed',
      payment_status: bookingPaymentStatus,
      confirmed_at: new Date().toISOString()
    },
    token
  );
}

function loginOdoAdmin_() {
  var properties = PropertiesService.getScriptProperties();
  var response = odoApiRequest_('/auth/login', 'post', {
    account: requiredProperty_(properties, 'ODO_ADMIN_ACCOUNT'),
    password: requiredProperty_(properties, 'ODO_ADMIN_PASSWORD')
  });
  var data = response.data || response;
  if (!data.access_token) throw new Error('API 登入成功但沒有 access_token');
  return data.access_token;
}

function odoApiRequest_(path, method, payload, token) {
  var properties = PropertiesService.getScriptProperties();
  var baseUrl = requiredProperty_(properties, 'ODO_API_BASE_URL').replace(/\/$/, '');
  var headers = {
    'X-API-KEY': requiredProperty_(properties, 'ODO_API_KEY')
  };
  if (token) headers.Authorization = 'Bearer ' + token;

  var options = {
    method: method,
    headers: headers,
    muteHttpExceptions: true
  };
  if (payload !== undefined) {
    options.contentType = 'application/json';
    options.payload = JSON.stringify(payload);
  }

  var response = UrlFetchApp.fetch(baseUrl + path, options);
  var status = response.getResponseCode();
  var text = response.getContentText();
  var body = {};
  if (text) {
    try {
      body = JSON.parse(text);
    } catch (error) {
      body = { message: text };
    }
  }
  if (status < 200 || status >= 300) {
    var apiError = new Error(
      'Ode API HTTP ' + status + ': ' + (body.message || text)
    );
    apiError.httpStatus = status;
    throw apiError;
  }
  return body;
}

function parseMetadata_(value) {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    return {};
  }
}

function requiredProperty_(properties, name) {
  var value = properties.getProperty(name);
  if (!value) throw new Error('缺少 Apps Script 指令碼屬性：' + name);
  return value;
}
