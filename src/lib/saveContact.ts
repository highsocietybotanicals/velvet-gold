import { supabase } from "@/integrations/supabase/client";

/**
 * Silently saves a contact (email/phone) to the contacts table.
 * Uses upsert on email to avoid duplicates.
 */
export async function saveContact({
  email,
  phone,
  name,
  source,
}: {
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  source: string;
}) {
  if (!email && !phone) return;

  try {
    const record: Record<string, string> = { source };
    if (email) record.email = email.trim().toLowerCase();
    if (phone) record.phone = phone.trim();
    if (name) record.name = name.trim();

    if (record.email) {
      // Upsert on email
      await supabase.from("contacts").upsert(record, { onConflict: "email" });
    } else {
      await supabase.from("contacts").insert(record);
    }
  } catch {
    // Silent — never block the user flow
  }
}
