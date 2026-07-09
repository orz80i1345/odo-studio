-- ============================================================================
-- triggers.sql — 選擇性補充：資料庫層維護 updated_at
--
-- 使用時機
--   僅在你「可直連 Postgres 客戶端」（psql / TablePlus / DBeaver / pgAdmin）
--   時才跑此檔。schema.sql 已刻意移除 CREATE FUNCTION / CREATE TRIGGER，
--   以配合限制型 SaaS import 工具的 SQL parser。
--
-- 執行順序
--   1) 先跑 schema.sql（建表）
--   2) 再跑 triggers.sql（補上 DB 端 updated_at 自動更新）
--
-- 若你使用 Directus / Supabase / NocoDB / Xano 等 auto-API SaaS 平台，
-- 這些平台通常內建 updated_at 自動更新設定，不需要此檔。
-- ============================================================================

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_customer_accounts_updated
    BEFORE UPDATE ON customer_accounts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_studio_admin_accounts_updated
    BEFORE UPDATE ON studio_admin_accounts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_studios_updated
    BEFORE UPDATE ON studios
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_studio_images_updated
    BEFORE UPDATE ON studio_images
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_scenes_updated
    BEFORE UPDATE ON scenes
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_scene_images_updated
    BEFORE UPDATE ON scene_images
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_pricing_plans_updated
    BEFORE UPDATE ON pricing_plans
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_business_hours_updated
    BEFORE UPDATE ON business_hours
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_time_slots_updated
    BEFORE UPDATE ON time_slots
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_special_dates_updated
    BEFORE UPDATE ON special_dates
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_bookings_updated
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_payments_updated
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_door_lock_codes_updated
    BEFORE UPDATE ON door_lock_codes
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_email_logs_updated
    BEFORE UPDATE ON email_logs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_email_templates_updated
    BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_bank_accounts_updated
    BEFORE UPDATE ON bank_accounts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_system_settings_updated
    BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- payment_logs 與 admin_activity_logs 為 append-only，不設 updated_at 觸發器
