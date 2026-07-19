
CREATE TABLE IF NOT EXISTS public.ip_rate_limits (
  id bigserial PRIMARY KEY,
  bucket text NOT NULL,
  ip text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ip_rate_limits_bucket_ip_created_idx ON public.ip_rate_limits(bucket, ip, created_at DESC);
GRANT ALL ON public.ip_rate_limits TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.ip_rate_limits_id_seq TO service_role;
ALTER TABLE public.ip_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role manages rate limits" ON public.ip_rate_limits FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages mileage" ON public.delivery_mileage FOR ALL TO service_role USING (true) WITH CHECK (true);
