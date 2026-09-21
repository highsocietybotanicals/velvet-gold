ALTER TABLE public.sales_commissions
  ADD COLUMN IF NOT EXISTS sale_type text NOT NULL DEFAULT 'reassort',
  ADD COLUMN IF NOT EXISTS new_client_bonus numeric NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_sales_commissions_rep_client
  ON public.sales_commissions(rep_id, client_label, period_month);