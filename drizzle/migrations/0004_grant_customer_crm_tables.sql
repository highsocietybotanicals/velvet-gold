GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_merges TO authenticated;
GRANT ALL ON public.customer_merges TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_notes TO authenticated;
GRANT ALL ON public.customer_notes TO service_role;