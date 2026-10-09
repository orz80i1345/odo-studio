BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'payments'
      AND column_name = 'payer_last5'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'payments'
      AND column_name = 'payer_last4'
  ) THEN
    ALTER TABLE payments RENAME COLUMN payer_last5 TO payer_last4;
  END IF;
END $$;

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS user_id INTEGER DEFAULT 0;

ALTER TABLE payments
  ALTER COLUMN payer_last4 TYPE VARCHAR(4)
  USING RIGHT(payer_last4, 4);

COMMENT ON TABLE payments IS 'payments @oso={"rules":[{"actor":"admin","actions":["read","create","update","delete"],"condition":null},{"actor":"user","actions":["read","create","update"],"condition":{"field":"user_id","operator":"eq","target":"actor.id"}}]}';
COMMENT ON COLUMN payments.user_id IS '@type=auto_set_user_id';

UPDATE payments AS p
SET payer_last4 = COALESCE(
      NULLIF(p.payer_last4, ''),
      NULLIF(b.payer_last4, ''),
      RIGHT(COALESCE(
        b.metadata -> 'paymentProof' ->> 'bankLast4',
        b.metadata -> 'paymentProof' ->> 'bankLast5'
      ), 4)
    ),
    transferred_at = COALESCE(
      p.transferred_at,
      b.payer_transferred_at,
      CASE
        WHEN (b.metadata -> 'paymentProof' ->> 'paidAt')
          ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T'
        THEN (b.metadata -> 'paymentProof' ->> 'paidAt')::TIMESTAMPTZ
      END
    ),
    user_id = COALESCE(NULLIF(p.user_id, 0), b.user_id)
FROM bookings AS b
WHERE b.id = p.booking_id;

INSERT INTO payments (
  booking_id,
  payment_number,
  payment_method,
  payment_type,
  amount,
  currency,
  status,
  payer_name,
  payer_last4,
  transferred_at,
  metadata,
  user_id
)
SELECT
  b.id,
  'PAY-' || b.booking_number || '-01',
  'bank_transfer',
  CASE
    WHEN b.deposit_amount > 0 AND b.deposit_amount < b.total_price THEN 'deposit'
    ELSE 'full'
  END,
  CASE
    WHEN b.deposit_amount > 0 THEN b.deposit_amount
    ELSE b.total_price
  END,
  'TWD',
  CASE
    WHEN b.payment_status IN ('deposit_paid', 'paid') THEN 'paid'
    WHEN b.payment_status = 'failed' THEN 'failed'
    WHEN b.payment_status = 'refunded' THEN 'refunded'
    ELSE 'pending'
  END,
  b.metadata -> 'paymentProof' ->> 'payerName',
  COALESCE(
    NULLIF(b.payer_last4, ''),
    RIGHT(COALESCE(
      b.metadata -> 'paymentProof' ->> 'bankLast4',
      b.metadata -> 'paymentProof' ->> 'bankLast5'
    ), 4)
  ),
  COALESCE(
    b.payer_transferred_at,
    CASE
      WHEN (b.metadata -> 'paymentProof' ->> 'paidAt')
        ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T'
      THEN (b.metadata -> 'paymentProof' ->> 'paidAt')::TIMESTAMPTZ
    END
  ),
  '{}'::JSONB,
  b.user_id
FROM bookings AS b
WHERE NOT EXISTS (
  SELECT 1
  FROM payments AS p
  WHERE p.booking_id = b.id
);

DROP INDEX IF EXISTS idx_bookings_payment_reconciliation;
DROP INDEX IF EXISTS idx_bookings_full_payment_reconciliation;

ALTER TABLE bookings
  DROP COLUMN IF EXISTS payer_last4,
  DROP COLUMN IF EXISTS payer_transferred_at;

CREATE INDEX IF NOT EXISTS idx_payments_reconciliation
  ON payments (payer_last4, amount, transferred_at, status);

COMMIT;
