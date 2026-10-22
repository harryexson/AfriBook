-- In-person cash receipts have a different lifecycle from online deliveries.
-- No changes to existing orders, customer data, wallets or payment providers.
BEGIN;
CREATE TABLE IF NOT EXISTS public.pos_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id),
  operator_id uuid REFERENCES public.profiles(id),
  request_key uuid NOT NULL,
  request_fingerprint text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('counter', 'kiosk')),
  status text NOT NULL CHECK (status IN ('awaiting_payment', 'paid', 'cancelled')),
  fulfillment text NOT NULL CHECK (fulfillment IN ('dine_in', 'pickup', 'service')),
  prep_status text NOT NULL DEFAULT 'pending' CHECK (prep_status IN ('pending', 'preparing', 'ready', 'completed')),
  currency varchar(3) NOT NULL,
  lines jsonb NOT NULL CHECK (jsonb_typeof(lines) = 'array'),
  subtotal_minor bigint NOT NULL CHECK (subtotal_minor >= 0),
  tax_minor bigint NOT NULL CHECK (tax_minor >= 0),
  total_minor bigint NOT NULL CHECK (total_minor = subtotal_minor + tax_minor),
  tendered_minor bigint,
  change_minor bigint,
  tax_basis_points integer NOT NULL CHECK (tax_basis_points BETWEEN 0 AND 10000),
  tax_inclusive boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, request_key),
  CHECK (status <> 'paid' OR (operator_id IS NOT NULL AND paid_at IS NOT NULL AND tendered_minor >= total_minor AND change_minor = tendered_minor - total_minor))
);
CREATE INDEX IF NOT EXISTS pos_sales_business_created ON public.pos_sales(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS pos_sales_kitchen ON public.pos_sales(business_id, prep_status) WHERE status = 'paid';
ALTER TABLE public.pos_sales ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.pos_sale_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.pos_sales(id),
  event text NOT NULL,
  actor_id uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pos_sale_events ENABLE ROW LEVEL SECURITY;
-- All writes go through owner-authorized server transactions; no anonymous
-- or browser Data API grants are introduced by this migration.
REVOKE ALL ON public.pos_sales FROM anon, authenticated;
REVOKE ALL ON public.pos_sale_events FROM anon, authenticated;
COMMIT;
