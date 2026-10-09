Table users [headercolor: #6360f7] {
	id integer [ pk, increment, not null, unique, note: '流水號' ]
	account varchar [ not null, note: '用戶帳號 (email/phone/google/github/line/etc.) @validate="required,email|e164"' ]
	provider varchar [ not null, note: '登入提供商 (email/phone/google/github/line/etc.)' ]
	password_hash varchar [ not null, note: '密碼雜湊 @type=encode @alias=password @rule=hide' ]
	is_active boolean [ not null, default: true, note: '是否啟用' ]
	created_at timestamptz [ not null, default: CURRENT_TIMESTAMP, note: '資料建立時間 @type=auto_createdtime' ]
	updated_at timestamptz [ note: '資料更新時間 @type=auto_updatedtime' ]

	indexes {
		(account) [ name: 'user_account_index' ]
	}

	Note: '使用者核心資料表 @oso={"rules":[{"actor":"admin","actions":["read","create","update","delete"],"condition":null},{"actor":"user","actions":["read","update"],"condition":{"field":"id","operator":"eq","target":"actor.id"}}]}'
}

Table roles [headercolor: #bc49c4] {
	id integer [ pk, increment, not null, unique, note: '流水號' ]
	name varchar [ not null, unique, note: '角色名稱' ]
	description text [ note: '角色描述' ]
	created_at timestamptz [ not null, default: CURRENT_TIMESTAMP, note: '資料新增時間 @type=auto_createdtime' ]
	updated_at timestamptz [ note: '資料更新時間 @type=auto_updatedtime' ]

	Note: '角色定義表 @oso={"rules":[{"actor":"admin","actions":["read","create","update","delete"],"condition":null},{"actor":"user","actions":["read"],"condition":null}]}'
}

Table user_roles [headercolor: #3cde7d] {
	id integer [ pk, increment, not null, unique, note: '流水號' ]
	user_id integer [ not null, note: '用戶流水號' ]
	role_id integer [ not null, note: '角色流水號' ]
	created_at timestamptz [ not null, default: CURRENT_TIMESTAMP, note: '資料建立時間 @type=auto_createdtime' ]
	updated_at timestamptz [ note: '資料更新時間 @type=auto_updatedtime' ]

	indexes {
		(user_id) [ name: 'user_roles_user_id_index' ]
	}

	Note: '使用者與角色的關聯表 @oso={"rules":[{"actor":"admin","actions":["read","create","update","delete"],"condition":null},{"actor":"user","actions":["read"],"condition":{"field":"user_id","operator":"eq","target":"actor.id"}}]}'
}

Table customer_accounts [headercolor: #175e7a] {
	id integer [ pk, increment, not null, unique ]
	email varchar [ not null ]
	phone varchar
	display_name varchar
	password_hash varchar
	email_verified_at timestamptz
	phone_verified_at timestamptz
	marketing_opt_in boolean [ not null, default: false ]
	last_login_at timestamptz
	locale varchar [ not null, default: 'zh-TW' ]
	metadata jsonb [ not null, default: '{}' ]
	is_active boolean [ not null, default: true ]
	created_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_createdtime' ]
	updated_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_updatedtime' ]
	deleted_at timestamptz
	user_id integer [ unique, default: '0', note: '@type=auto_set_user_id' ]

	indexes {
		(LOWER(email)) [ name: 'idx_customer_accounts_email', unique ]
		(phone) [ name: 'idx_customer_accounts_phone' ]
		(is_active) [ name: 'idx_customer_accounts_active' ]
	}

	Note: 'customer_accounts @oso={"rules":[{"actor":"admin","actions":["read","create","update","delete"],"condition":null},{"actor":"user","actions":["read","update","create"],"condition":null}]}'
}

Table studio_admin_accounts [headercolor: #175e7a] {
	id integer [ pk, increment, not null, unique ]
	email varchar [ not null ]
	display_name varchar [ not null ]
	password_hash varchar [ not null ]
	role varchar [ not null, default: 'staff' ]
	last_login_at timestamptz
	is_active boolean [ not null, default: true ]
	metadata jsonb [ not null, default: '{}' ]
	created_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_createdtime' ]
	updated_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_updatedtime' ]
	deleted_at timestamptz

	indexes {
		(LOWER(email)) [ name: 'idx_studio_admin_accounts_email', unique ]
		(is_active) [ name: 'idx_studio_admin_accounts_active' ]
	}

	Note: 'studio_admin_accounts @oso={"rules":[{"actor":"admin","actions":["read","create","update","delete"],"condition":null}]}'
}

Table studios [headercolor: #175e7a] {
	id integer [ pk, increment, not null, unique ]
	slug varchar [ not null ]
	name varchar [ not null ]
	description text
	address varchar
	floor varchar
	area_ping numeric
	capacity integer
	features jsonb [ not null, default: '[]' ]
	default_hourly_price numeric [ not null ]
	min_booking_minutes integer [ not null, default: '60' ]
	max_booking_minutes integer [ not null, default: '480' ]
	booking_increment_minutes integer [ not null, default: '30' ]
	advance_booking_days integer [ not null, default: '90' ]
	cancellation_hours integer [ not null, default: '48' ]
	display_order integer [ not null, default: '0' ]
	is_active boolean [ not null, default: true ]
	metadata jsonb [ not null, default: '{}' ]
	created_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_createdtime' ]
	updated_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_updatedtime' ]
	deleted_at timestamptz

	indexes {
		(slug) [ name: 'idx_studios_slug', unique ]
		(is_active, display_order) [ name: 'idx_studios_active_order' ]
	}

	Note: 'studios @oso={"rules":[{"actor":"admin","actions":["read","create","update","delete"],"condition":null}]} @public_methods=["GET"]'
}

Table studio_images [headercolor: #175e7a] {
	id integer [ pk, increment, not null, unique ]
	studio_id integer [ not null ]
	url varchar [ not null ]
	alt_text varchar
	caption varchar
	display_order integer [ not null, default: '0' ]
	is_cover boolean [ not null, default: false ]
	width integer
	height integer
	file_size integer
	metadata jsonb [ not null, default: '{}' ]
	created_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_createdtime' ]
	updated_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_updatedtime' ]

	indexes {
		(studio_id, display_order) [ name: 'idx_studio_images_studio' ]
		(studio_id) [ name: 'idx_studio_images_cover', unique ]
	}

	Note: 'studio_images @oso={"rules":[{"actor":"admin","actions":["read","create","update","delete"],"condition":null}]} @public_methods=["GET"]'
}

Table scenes [headercolor: #175e7a] {
	id integer [ pk, increment, not null, unique ]
	studio_id integer [ not null ]
	slug varchar [ not null ]
	name varchar [ not null ]
	description text
	tags jsonb [ not null, default: '[]' ]
	display_order integer [ not null, default: '0' ]
	is_active boolean [ not null, default: true ]
	metadata jsonb [ not null, default: '{}' ]
	created_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_createdtime' ]
	updated_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_updatedtime' ]
	deleted_at timestamptz

	indexes {
		(studio_id, display_order) [ name: 'idx_scenes_studio' ]
	}

	Note: 'scenes @oso={"rules":[{"actor":"admin","actions":["read","create","update","delete"],"condition":null}]} @public_methods=["GET"]'
}

Table scene_images [headercolor: #175e7a] {
	id integer [ pk, increment, not null, unique ]
	scene_id integer [ not null ]
	url varchar [ not null ]
	alt_text varchar
	caption varchar
	display_order integer [ not null, default: '0' ]
	is_cover boolean [ not null, default: false ]
	width integer
	height integer
	file_size integer
	metadata jsonb [ not null, default: '{}' ]
	created_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_createdtime' ]
	updated_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_updatedtime' ]

	indexes {
		(scene_id, display_order) [ name: 'idx_scene_images_scene' ]
		(scene_id) [ name: 'idx_scene_images_cover' ]
	}

	Note: 'scene_images @oso={"rules":[{"actor":"admin","actions":["read","create","update","delete"],"condition":null}]} @public_methods=["GET"]'
}

Table pricing_plans [headercolor: #175e7a] {
	id integer [ pk, increment, not null, unique ]
	studio_id integer [ not null ]
	name varchar [ not null ]
	plan_type varchar [ not null, default: 'hourly' ]
	hourly_price numeric [ not null ]
	package_price numeric
	package_hours numeric
	applies_to_weekdays jsonb [ not null, default: '[0,1,2,3,4,5,6]' ]
	start_minute integer
	end_minute integer
	effective_from date
	effective_to date
	min_hours numeric [ not null, default: '1' ]
	max_hours numeric
	priority integer [ not null, default: '0' ]
	is_active boolean [ not null, default: true ]
	metadata jsonb [ not null, default: '{}' ]
	created_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_createdtime' ]
	updated_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_updatedtime' ]
	deleted_at timestamptz

	indexes {
		(studio_id, priority) [ name: 'idx_pricing_plans_studio_priority' ]
	}

	Note: 'pricing_plans @oso={"rules":[{"actor":"admin","actions":["read","create","update","delete"],"condition":null}]} @public_methods=["GET"]'
}

Table business_hours [headercolor: #175e7a] {
	id integer [ pk, increment, not null, unique ]
	studio_id integer [ not null ]
	weekday integer [ note: '@validate="numeric,gte=0,lte=6"' ]
	start_minute integer [ note: '@validate="numeric,gte=0,lte=1439"' ]
	end_minute integer [ note: '@validate="numeric,gte=0,lte=1440"' ]
	is_closed boolean [ not null, default: false ]
	note varchar
	metadata jsonb [ not null, default: '{}' ]
	created_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_createdtime' ]
	updated_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_updatedtime' ]

	indexes {
		(studio_id, weekday) [ name: 'idx_business_hours_studio' ]
	}

	Note: 'business_hours @oso={"rules":[{"actor":"admin","actions":["read","create","update","delete"],"condition":null}]} @public_methods=["GET"]'
}

Table time_slots [headercolor: #175e7a] {
	id integer [ pk, increment, not null, unique ]
	studio_id integer [ not null ]
	slot_date date [ not null ]
	start_minute integer
	end_minute integer
	status varchar [ not null, default: 'available' ]
	booking_id integer
	hourly_price numeric
	hold_expires_at timestamptz
	block_reason varchar
	metadata jsonb [ not null, default: '{}' ]
	created_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_createdtime' ]
	updated_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_updatedtime' ]

	indexes {
		(studio_id, slot_date) [ name: 'idx_time_slots_studio_date' ]
		(studio_id, slot_date, status) [ name: 'idx_time_slots_status_nonavail' ]
		(booking_id) [ name: 'idx_time_slots_booking' ]
		(hold_expires_at) [ name: 'idx_time_slots_hold_expires' ]
	}

	Note: 'time_slots @oso={"rules":[{"actor":"admin","actions":["read","create","update","delete"],"condition":null}]} @public_methods=["GET"]'
}

Table special_dates [headercolor: #175e7a] {
	id integer [ pk, increment, not null, unique ]
	studio_id integer
	special_date date [ not null ]
	date_type varchar [ not null ]
	name varchar
	description text
	start_minute integer
	end_minute integer
	price_multiplier numeric [ not null, default: '1.0' ]
	booking_id integer
	is_recurring boolean [ not null, default: false ]
	created_by_admin_id integer
	metadata jsonb [ not null, default: '{}' ]
	created_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_createdtime' ]
	updated_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_updatedtime' ]

	indexes {
		(studio_id, special_date) [ name: 'idx_special_dates_studio_date' ]
		(special_date) [ name: 'idx_special_dates_date' ]
		(date_type) [ name: 'idx_special_dates_type' ]
	}

	Note: 'special_dates @oso={"rules":[{"actor":"admin","actions":["read","create","update","delete"],"condition":null}]} @public_methods=["GET"]'
}

Table bookings [headercolor: #175e7a] {
	id integer [ pk, increment, not null, unique ]
	booking_number varchar [ not null ]
	studio_id integer [ not null ]
	customer_account_id integer
	customer_name varchar [ not null ]
	customer_phone varchar [ not null ]
	customer_email varchar [ not null ]
	start_at timestamptz [ not null ]
	end_at timestamptz [ not null ]
	total_hours numeric [ not null ]
	headcount integer
	purpose varchar
	scene_ids jsonb [ not null, default: '[]' ]
	pricing_plan_id integer
	subtotal numeric [ not null ]
	discount_amount numeric [ not null, default: '0' ]
	discount_code varchar
	tax_amount numeric [ not null, default: '0' ]
	total_price numeric [ not null ]
	deposit_amount numeric [ not null, default: '0' ]
	status varchar [ not null, default: 'pending' ]
	payment_status varchar [ not null, default: 'unpaid' ]
	customer_note text
	admin_note text
	confirmed_at timestamptz
	checked_in_at timestamptz
	completed_at timestamptz
	cancelled_at timestamptz
	cancellation_reason text
	cancelled_by_admin_id integer
	source varchar [ not null, default: 'web' ]
	referral_code varchar
	created_by_admin_id integer
	metadata jsonb [ not null, default: '{}' ]
	created_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_createdtime' ]
	updated_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_updatedtime' ]
	subtotal_price integer
	booking_mode varchar [ not null, default: 'scenes' ]
	user_id integer [ default: '0', note: '@type=auto_set_user_id' ]
	payer_last4 varchar
	payer_transferred_at timestamptz

	indexes {
		(booking_number) [ name: 'idx_bookings_number', unique ]
		(studio_id, start_at, end_at) [ name: 'idx_bookings_studio_time' ]
		(customer_account_id) [ name: 'idx_bookings_customer_account' ]
		(status) [ name: 'idx_bookings_status' ]
		(payment_status) [ name: 'idx_bookings_payment_status' ]
		(LOWER(customer_email)) [ name: 'idx_bookings_email' ]
		(customer_phone) [ name: 'idx_bookings_phone' ]
		(start_at) [ name: 'idx_bookings_start_at' ]
		(created_at) [ name: 'idx_bookings_created_at' ]
		(discount_code) [ name: 'bookings_index_9' ]
		(payer_last4, deposit_amount, payment_status, payer_transferred_at) [ name: 'idx_bookings_payment_reconciliation' ]
		(payer_last4, payer_transferred_at, total_price, payment_status) [ name: 'idx_bookings_full_payment_reconciliation' ]
	}

	Note: 'bookings @public_methods=["GET"] @oso={"rules":[{"actor":"admin","actions":["read","create","update","delete"],"condition":null},{"actor":"user","actions":["read"],"condition":null},{"actor":"user","actions":["create","update"],"condition":{"field":"user_id","operator":"eq","target":"actor.id"}}]}'
}

Table payments [headercolor: #175e7a] {
	id integer [ pk, increment, not null, unique ]
	booking_id integer [ not null ]
	payment_number varchar [ not null ]
	payment_method varchar [ not null ]
	payment_type varchar [ not null, default: 'full' ]
	amount numeric [ not null ]
	currency varchar [ not null, default: 'TWD' ]
	status varchar [ not null, default: 'pending' ]
	bank_account_id integer
	payer_name varchar
	payer_las4 varchar
	transferred_at timestamptz
	verified_at timestamptz
	verified_by_admin_id integer
	ecpay_merchant_trade_no varchar
	ecpay_trade_no varchar
	ecpay_payment_type varchar
	ecpay_rtn_code varchar
	ecpay_rtn_msg varchar
	ecpay_paid_at timestamptz
	ecpay_check_mac_value varchar
	ecpay_raw_response jsonb
	refund_amount numeric [ not null, default: '0' ]
	refunded_at timestamptz
	refund_reason text
	refunded_by_admin_id integer
	expires_at timestamptz
	metadata jsonb [ not null, default: '{}' ]
	created_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_createdtime' ]
	updated_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_updatedtime' ]
	user_id integer

	indexes {
		(payment_number) [ name: 'idx_payments_number', unique ]
		(booking_id) [ name: 'idx_payments_booking' ]
		(status) [ name: 'idx_payments_status' ]
		(payment_method) [ name: 'idx_payments_method' ]
		(ecpay_merchant_trade_no) [ name: 'idx_payments_ecpay_trade', unique ]
		(transferred_at) [ name: 'idx_payments_transferred_at' ]
		(payer_las4, amount, transferred_at, status) [ name: 'payments_index_6' ]
	}

	Note: 'payments @oso={"rules":[{"actor":"admin","actions":["read","create","update","delete"],"condition":null}]} @public_methods=["GET"]'
}

Table payment_logs [headercolor: #175e7a] {
	id integer [ pk, increment, not null, unique ]
	payment_id integer [ not null ]
	event_type varchar [ not null ]
	from_status varchar
	to_status varchar
	source varchar [ not null, default: 'system' ]
	admin_id integer
	ip_address varchar
	user_agent text
	message text
	payload jsonb [ not null, default: '{}' ]
	created_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_createdtime' ]

	indexes {
		(payment_id, created_at) [ name: 'idx_payment_logs_payment' ]
		(event_type) [ name: 'idx_payment_logs_event_type' ]
		(created_at) [ name: 'idx_payment_logs_created' ]
	}

	Note: 'payment_logs @oso={"rules":[{"actor":"admin","actions":["read","create","update","delete"],"condition":null}]}'
}

Table door_lock_codes [headercolor: #175e7a] {
	id integer [ pk, increment, not null, unique ]
	booking_id integer [ not null ]
	studio_id integer [ not null ]
	lock_code varchar [ not null ]
	lock_code_hash varchar
	valid_from timestamptz [ not null ]
	valid_until timestamptz [ not null ]
	send_status varchar [ not null, default: 'scheduled' ]
	scheduled_send_at timestamptz [ not null ]
	sent_at timestamptz
	delivery_channel varchar [ not null, default: 'email' ]
	email_log_id integer
	send_attempts integer [ not null, default: '0' ]
	last_error text
	used_at timestamptz
	used_count integer [ not null, default: '0' ]
	lock_device_id varchar
	lock_provider varchar
	provider_reference varchar
	provider_raw jsonb
	manually_sent_by_admin_id integer
	metadata jsonb [ not null, default: '{}' ]
	created_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_createdtime' ]
	updated_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_updatedtime' ]

	indexes {
		(booking_id) [ name: 'idx_door_lock_codes_booking' ]
		(scheduled_send_at) [ name: 'idx_door_lock_codes_scheduled' ]
		(send_status) [ name: 'idx_door_lock_codes_send_status' ]
		(valid_from, valid_until) [ name: 'idx_door_lock_codes_valid' ]
	}

	Note: 'door_lock_codes @oso={"rules":[{"actor":"admin","actions":["read","create","update","delete"],"condition":null}]}'
}

Table email_logs [headercolor: #175e7a] {
	id integer [ pk, increment, not null, unique ]
	email_template_id integer
	booking_id integer
	customer_account_id integer
	to_email varchar [ not null ]
	to_name varchar
	cc_emails jsonb [ not null, default: '[]' ]
	bcc_emails jsonb [ not null, default: '[]' ]
	from_email varchar [ not null ]
	from_name varchar
	reply_to varchar
	subject varchar [ not null ]
	body_html text
	body_text text
	email_type varchar [ not null ]
	status varchar [ not null, default: 'queued' ]
	provider varchar
	provider_message_id varchar
	scheduled_at timestamptz
	sent_at timestamptz
	delivered_at timestamptz
	opened_at timestamptz
	clicked_at timestamptz
	bounced_at timestamptz
	failed_at timestamptz
	send_attempts integer [ not null, default: '0' ]
	last_error text
	variables jsonb [ not null, default: '{}' ]
	provider_response jsonb
	metadata jsonb [ not null, default: '{}' ]
	created_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_createdtime' ]
	updated_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_updatedtime' ]

	indexes {
		(booking_id) [ name: 'idx_email_logs_booking' ]
		(customer_account_id) [ name: 'idx_email_logs_customer_account' ]
		(LOWER(to_email)) [ name: 'idx_email_logs_to_email' ]
		(status) [ name: 'idx_email_logs_status' ]
		(email_type) [ name: 'idx_email_logs_type' ]
		(scheduled_at) [ name: 'idx_email_logs_scheduled' ]
		(provider, provider_message_id) [ name: 'idx_email_logs_provider_msg', unique ]
		(created_at) [ name: 'idx_email_logs_created' ]
	}

	Note: 'email_logs @oso={"rules":[{"actor":"admin","actions":["read","create","update","delete"],"condition":null}]}'
}

Table email_templates [headercolor: #175e7a] {
	id integer [ pk, increment, not null, unique ]
	template_key varchar [ not null ]
	name varchar [ not null ]
	description text
	email_type varchar [ not null ]
	subject varchar [ not null ]
	body_html text [ not null ]
	body_text text
	from_email varchar
	from_name varchar
	reply_to varchar
	available_variables jsonb [ not null, default: '[]' ]
	trigger_event varchar
	trigger_offset_minutes integer
	version integer [ not null, default: '1' ]
	is_active boolean [ not null, default: true ]
	locale varchar [ not null, default: 'zh-TW' ]
	updated_by_admin_id integer
	metadata jsonb [ not null, default: '{}' ]
	created_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_createdtime' ]
	updated_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_updatedtime' ]
	deleted_at timestamptz

	indexes {
		(is_active, template_key) [ name: 'idx_email_templates_active' ]
		(trigger_event) [ name: 'idx_email_templates_trigger_event' ]
	}

	Note: 'email_templates @oso={"rules":[{"actor":"admin","actions":["read","create","update","delete"],"condition":null}]}'
}

Table bank_accounts [headercolor: #175e7a] {
	id integer [ pk, increment, not null, unique ]
	account_name varchar [ not null ]
	bank_name varchar [ not null ]
	bank_code varchar
	branch_name varchar
	branch_code varchar
	account_number varchar
	account_holder varchar
	swift_code varchar
	display_name varchar
	display_order integer [ default: '0' ]
	is_active boolean [ not null, default: true ]
	is_default boolean [ not null, default: false ]
	studio_id integer
	note text
	metadata jsonb [ not null, default: '{}' ]
	created_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_createdtime' ]
	updated_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_updatedtime' ]
	deleted_at timestamptz

	indexes {
		(is_active, display_order) [ name: 'idx_bank_accounts_active' ]
		(is_default) [ name: 'idx_bank_accounts_default', unique ]
	}

	Note: 'bank_accounts @oso={"rules":[{"actor":"admin","actions":["read","create","update","delete"],"condition":null}]} @public_methods=["GET"]'
}

Table system_settings [headercolor: #175e7a] {
	id integer [ pk, increment, not null, unique ]
	setting_key varchar [ not null ]
	setting_value jsonb [ default: null ]
	value_type varchar [ not null, default: 'json' ]
	category varchar [ not null, default: 'general' ]
	display_name varchar
	description text
	is_public boolean [ not null, default: false ]
	is_encrypted boolean [ not null, default: false ]
	validation_rules jsonb [ not null, default: '{}' ]
	updated_by_admin_id integer
	created_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_createdtime' ]
	updated_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_updatedtime' ]

	indexes {
		(category) [ name: 'idx_system_settings_category' ]
		(is_public) [ name: 'idx_system_settings_public' ]
	}

	Note: 'system_settings @oso={"rules":[{"actor":"admin","actions":["read","create","update","delete"],"condition":null}]} @public_methods=["GET"]'
}

Table admin_activity_logs [headercolor: #175e7a] {
	id integer [ pk, increment, not null, unique ]
	admin_id integer
	action varchar [ not null ]
	entity_type varchar
	entity_id integer
	changes jsonb [ not null, default: '{}' ]
	ip_address varchar
	user_agent text
	request_method varchar
	request_path varchar
	status varchar [ not null, default: 'success' ]
	error_message text
	metadata jsonb [ not null, default: '{}' ]
	created_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_createdtime' ]

	indexes {
		(admin_id, created_at) [ name: 'idx_admin_activity_admin' ]
		(entity_type, entity_id) [ name: 'idx_admin_activity_entity' ]
		(action) [ name: 'idx_admin_activity_action' ]
		(created_at) [ name: 'idx_admin_activity_created' ]
	}

	Note: 'admin_activity_logs @oso={"rules":[{"actor":"admin","actions":["read","create","update","delete"],"condition":null}]}'
}

Table discount_codes [headercolor: #175e7a] {
	id integer [ pk, increment, not null, unique, note: '流水號' ]
	code text [ not null, unique ]
	name text
	discount_type text [ not null ]
	discount_amount integer [ not null ]
	is_active boolean [ not null, default: true ]
	metadata jsonb [ not null ]

	Note: 'table_22 @oso={"rules":[{"actor":"admin","actions":["read","create","update","delete"],"condition":null}]} @public_methods=["GET"]'
}

Table studio_daily_availability [headercolor: #175e7a] {
	id integer [ pk, increment, not null, unique ]
	studio_id integer [ not null ]
	availability_date date [ not null ]
	total_count integer [ not null, default: '0' ]
	available_count integer [ not null, default: '0' ]
	held_count integer [ not null, default: '0' ]
	booked_count integer [ not null, default: '0' ]
	blocked_count integer [ not null, default: '0' ]
	maintenance_count integer [ not null, default: '0' ]
	holiday_count integer [ not null, default: '0' ]
	is_closed boolean [ not null, default: false ]
	open_start_minute integer
	open_end_minute integer
	min_hourly_price numeric
	max_hourly_price numeric
	metadata jsonb [ not null, default: '{}' ]
	created_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_createdtime' ]
	updated_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_updatedtime' ]

	indexes {
		(studio_id, availability_date) [ name: 'idx_studio_daily_availability_studio_date' ]
		(availability_date) [ name: 'idx_studio_daily_availability_date' ]
	}

	Note: 'studio_daily_availability @oso={"rules":[{"actor":"admin","actions":["read","create","update","delete"],"condition":null}]} @public_methods=["GET"]'
}

Table scene_prices [headercolor: #175e7a] {
	id integer [ pk, increment, not null, unique ]
	scene_id integer [ not null ]
	hourly_price numeric [ not null ]
	effective_from date
	effective_to date
	is_active boolean [ not null, default: true ]
	metadata jsonb [ not null, default: '{}' ]
	created_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_createdtime' ]
	updated_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_updatedtime' ]

	indexes {
		(scene_id) [ name: 'idx_scene_prices_scene' ]
		(is_active) [ name: 'idx_scene_prices_active' ]
	}

	Note: 'scene_prices @oso={"rules":[{"actor":"admin","actions":["read","create","update","delete"],"condition":null}]} @public_methods=["GET"]'
}

Table studio_prices [headercolor: #175e7a] {
	id integer [ pk, increment, not null, unique ]
	studio_id integer [ not null ]
	price_type varchar [ not null, default: 'buyout' ]
	hourly_price numeric [ not null ]
	effective_from date
	effective_to date
	is_active boolean [ not null, default: true ]
	metadata jsonb [ not null, default: '{}' ]
	created_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_createdtime' ]
	updated_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_updatedtime' ]

	indexes {
		(studio_id) [ name: 'idx_studio_prices_studio' ]
		(price_type, is_active) [ name: 'idx_studio_prices_type_active' ]
	}

	Note: 'studio_prices @oso={"rules":[{"actor":"admin","actions":["read","create","update","delete"],"condition":null}]} @public_methods=["GET"]'
}

Table booking_scene_time_slots [headercolor: #175e7a] {
	id integer [ pk, increment, not null, unique ]
	booking_id integer [ not null ]
	scene_id integer [ not null ]
	time_slot_id integer [ not null ]
	status varchar [ not null, default: 'active' ]
	created_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_createdtime' ]
	cancelled_at timestamptz
	user_id integer [ default: '0', note: '@type=auto_set_user_id' ]

	indexes {
		(booking_id) [ name: 'idx_booking_scene_time_slots_booking' ]
		(scene_id) [ name: 'idx_booking_scene_time_slots_scene' ]
		(time_slot_id) [ name: 'idx_booking_scene_time_slots_time_slot' ]
		(scene_id, time_slot_id) [ name: 'uq_booking_scene_time_slots_active', unique ]
	}

	Note: 'booking_scene_time_slots @public_methods=["GET"] @oso={"rules":[{"actor":"admin","actions":["read","create","update","delete"],"condition":null},{"actor":"user","actions":["read"],"condition":null},{"actor":"user","actions":["create","update"],"condition":{"field":"user_id","operator":"eq","target":"actor.id"}}]}'
}

Table equipment_items [headercolor: #175e7a] {
	id integer [ pk, increment, not null, unique ]
	name varchar [ not null ]
	description text
	unit_price numeric [ not null, default: '0' ]
	image_url text
	is_active boolean [ not null, default: true ]
	display_order integer [ not null, default: '0' ]
	metadata jsonb [ not null, default: '{}' ]
	created_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_createdtime' ]
	updated_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_updatedtime' ]

	indexes {
		(is_active, display_order) [ name: 'idx_equipment_items_active_order' ]
	}

	Note: 'equipment_items @oso={"rules":[{"actor":"admin","actions":["read","create","update","delete"],"condition":null}]} @public_methods=["GET"]'
}

Table booking_equipment_items [headercolor: #175e7a] {
	id integer [ pk, increment, not null, unique ]
	booking_id integer [ not null ]
	equipment_item_id integer [ not null ]
	name varchar [ not null ]
	quantity integer [ not null, default: '1' ]
	unit_price numeric [ not null, default: '0' ]
	subtotal numeric [ not null, default: '0' ]
	metadata jsonb [ not null, default: '{}' ]
	created_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_createdtime' ]
	user_id integer [ default: '0', note: '@type=auto_set_user_id' ]

	indexes {
		(booking_id) [ name: 'idx_booking_equipment_items_booking' ]
	}

	Note: 'booking_equipment_items @public_methods=["GET"] @oso={"rules":[{"actor":"admin","actions":["read","create","update","delete"],"condition":null},{"actor":"user","actions":["read"],"condition":null},{"actor":"user","actions":["create","update"],"condition":{"field":"user_id","operator":"eq","target":"actor.id"}}]}'
}

Table booking_equipment_time_slots [headercolor: #175e7a] {
	id integer [ pk, increment, not null, unique ]
	booking_id integer [ not null ]
	equipment_item_id integer [ not null ]
	time_slot_id integer [ not null ]
	created_at timestamptz [ not null, default: `NOW()`, note: '@type=auto_createdtime' ]
	user_id integer

	indexes {
		(equipment_item_id, time_slot_id) [ name: 'uq_booking_equipment_time_slot', unique ]
		(booking_id) [ name: 'idx_booking_equipment_time_slots_booking' ]
		(time_slot_id) [ name: 'idx_booking_equipment_time_slots_time_slot' ]
	}

	Note: 'booking_equipment_time_slots @public_methods=["GET"] @oso={"rules":[{"actor":"admin","actions":["read","create","update","delete"],"condition":null},{"actor":"user","actions":["read"],"condition":null},{"actor":"user","actions":["create","update"],"condition":{"field":"user_id","operator":"eq","target":"actor.id"}}]}'
}

Ref user_roles_user_id_fk {
	user_roles.user_id > users.id [ delete: cascade, update: no action ]
}

Ref user_roles_role_id_fk {
	user_roles.role_id > roles.id [ delete: cascade, update: no action ]
}

Ref fk_studio_images_studio_id_studios {
	studio_images.studio_id > studios.id [ delete: cascade, update: no action ]
}

Ref fk_scenes_studio_id_studios {
	scenes.studio_id > studios.id [ delete: cascade, update: no action ]
}

Ref fk_scene_images_scene_id_scenes {
	scene_images.scene_id > scenes.id [ delete: cascade, update: no action ]
}

Ref fk_pricing_plans_studio_id_studios {
	pricing_plans.studio_id > studios.id [ delete: cascade, update: no action ]
}

Ref fk_business_hours_studio_id_studios {
	business_hours.studio_id > studios.id [ delete: cascade, update: no action ]
}

Ref fk_time_slots_studio_id_studios {
	time_slots.studio_id > studios.id [ delete: cascade, update: no action ]
}

Ref fk_special_dates_studio_id_studios {
	special_dates.studio_id > studios.id [ delete: cascade, update: no action ]
}

Ref fk_special_dates_created_by_admin_id_studio_admin_accounts {
	special_dates.created_by_admin_id > studio_admin_accounts.id [ delete: set null, update: no action ]
}

Ref fk_bookings_studio_id_studios {
	bookings.studio_id > studios.id [ delete: restrict, update: no action ]
}

Ref fk_bookings_customer_account_id_customer_accounts {
	bookings.customer_account_id > customer_accounts.id [ delete: set null, update: no action ]
}

Ref fk_bookings_pricing_plan_id_pricing_plans {
	bookings.pricing_plan_id > pricing_plans.id [ delete: set null, update: no action ]
}

Ref fk_bookings_cancelled_by_admin_id_studio_admin_accounts {
	bookings.cancelled_by_admin_id > studio_admin_accounts.id [ delete: set null, update: no action ]
}

Ref fk_bookings_created_by_admin_id_studio_admin_accounts {
	bookings.created_by_admin_id > studio_admin_accounts.id [ delete: set null, update: no action ]
}

Ref fk_payments_booking_id_bookings {
	payments.booking_id > bookings.id [ delete: restrict, update: no action ]
}

Ref fk_payments_verified_by_admin_id_studio_admin_accounts {
	payments.verified_by_admin_id > studio_admin_accounts.id [ delete: set null, update: no action ]
}

Ref fk_payments_refunded_by_admin_id_studio_admin_accounts {
	payments.refunded_by_admin_id > studio_admin_accounts.id [ delete: set null, update: no action ]
}

Ref fk_payment_logs_payment_id_payments {
	payment_logs.payment_id > payments.id [ delete: cascade, update: no action ]
}

Ref fk_payment_logs_admin_id_studio_admin_accounts {
	payment_logs.admin_id > studio_admin_accounts.id [ delete: set null, update: no action ]
}

Ref fk_door_lock_codes_booking_id_bookings {
	door_lock_codes.booking_id > bookings.id [ delete: cascade, update: no action ]
}

Ref fk_door_lock_codes_studio_id_studios {
	door_lock_codes.studio_id > studios.id [ delete: cascade, update: no action ]
}

Ref fk_door_lock_codes_manually_sent_by_admin_id_studio_admin_accounts {
	door_lock_codes.manually_sent_by_admin_id > studio_admin_accounts.id [ delete: set null, update: no action ]
}

Ref fk_email_logs_booking_id_bookings {
	email_logs.booking_id > bookings.id [ delete: set null, update: no action ]
}

Ref fk_email_logs_customer_account_id_customer_accounts {
	email_logs.customer_account_id > customer_accounts.id [ delete: set null, update: no action ]
}

Ref fk_email_templates_updated_by_admin_id_studio_admin_accounts {
	email_templates.updated_by_admin_id > studio_admin_accounts.id [ delete: set null, update: no action ]
}

Ref fk_bank_accounts_studio_id_studios {
	bank_accounts.studio_id > studios.id [ delete: set null, update: no action ]
}

Ref fk_system_settings_updated_by_admin_id_studio_admin_accounts {
	system_settings.updated_by_admin_id > studio_admin_accounts.id [ delete: set null, update: no action ]
}

Ref fk_admin_activity_logs_admin_id_studio_admin_accounts {
	admin_activity_logs.admin_id > studio_admin_accounts.id [ delete: set null, update: no action ]
}

Ref fk_time_slots_booking_id_bookings {
	time_slots.booking_id > bookings.id [ delete: set null, update: no action ]
}

Ref fk_special_dates_booking_id_bookings {
	special_dates.booking_id > bookings.id [ delete: set null, update: no action ]
}

Ref fk_payments_bank_account_id_bank_accounts {
	payments.bank_account_id > bank_accounts.id [ delete: set null, update: no action ]
}

Ref fk_door_lock_codes_email_log_id_email_logs {
	door_lock_codes.email_log_id > email_logs.id [ delete: set null, update: no action ]
}

Ref fk_email_logs_email_template_id_email_templates {
	email_logs.email_template_id > email_templates.id [ delete: set null, update: no action ]
}

Ref fk_booking_equipment_items_equipment_item_id_equipment_items {
	booking_equipment_items.equipment_item_id > equipment_items.id [ delete: restrict, update: no action ]
}

Ref fk_booking_equipment_time_slots_equipment_item_id_equipment_items {
	booking_equipment_time_slots.equipment_item_id > equipment_items.id [ delete: restrict, update: no action ]
}
