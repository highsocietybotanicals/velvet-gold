ALTER TABLE public.profiles DISABLE TRIGGER trg_prevent_profile_privilege_escalation;

UPDATE public.profiles
SET is_pro_validated = true,
    is_vat_validated = true
WHERE id = '317ee1ef-483d-4bfe-a2d2-d8529d557a6e';

ALTER TABLE public.profiles ENABLE TRIGGER trg_prevent_profile_privilege_escalation;