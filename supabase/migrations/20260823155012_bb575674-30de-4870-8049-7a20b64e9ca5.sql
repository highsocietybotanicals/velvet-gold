ALTER TABLE public.profiles DISABLE TRIGGER trg_prevent_profile_privilege_escalation;

INSERT INTO public.user_roles (user_id, role)
VALUES ('5ee4432f-0377-485c-96da-bacb08a87306', 'pro')
ON CONFLICT (user_id, role) DO NOTHING;

DELETE FROM public.user_roles
WHERE user_id = '5ee4432f-0377-485c-96da-bacb08a87306' AND role = 'admin';

UPDATE public.profiles
SET is_pro_validated = true,
    is_vat_validated = true,
    company_name = COALESCE(NULLIF(company_name, ''), 'Bureau de tabac Ratarieux'),
    vat_number = COALESCE(NULLIF(vat_number, ''), 'FR00000000000')
WHERE id = '5ee4432f-0377-485c-96da-bacb08a87306';

ALTER TABLE public.profiles ENABLE TRIGGER trg_prevent_profile_privilege_escalation;