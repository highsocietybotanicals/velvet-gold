GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_reps TO authenticated;
GRANT ALL ON public.sales_reps TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_prospects TO authenticated;
GRANT ALL ON public.sales_prospects TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_commissions TO authenticated;
GRANT ALL ON public.sales_commissions TO service_role;

DROP TRIGGER IF EXISTS sales_reps_updated_at ON public.sales_reps;
CREATE TRIGGER sales_reps_updated_at BEFORE UPDATE ON public.sales_reps
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS sales_prospects_updated_at ON public.sales_prospects;
CREATE TRIGGER sales_prospects_updated_at BEFORE UPDATE ON public.sales_prospects
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS sales_commissions_updated_at ON public.sales_commissions;
CREATE TRIGGER sales_commissions_updated_at BEFORE UPDATE ON public.sales_commissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();