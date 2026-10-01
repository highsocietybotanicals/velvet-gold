import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { buildCustomers, type MergeRow, type RawItem, type RawOrder, type RawProfile } from "@/lib/customers";

const db = supabase as any;

/** Load every row of a query with .range() pages of 1000. */
async function fetchAll<T>(table: string, columns: string): Promise<T[]> {
  const out: T[] = [];
  const size = 1000;
  for (let from = 0; ; from += size) {
    const { data, error } = await db.from(table).select(columns).range(from, from + size - 1);
    if (error) throw error;
    out.push(...((data || []) as T[]));
    if (!data || data.length < size) break;
  }
  return out;
}

export const CUSTOMERS_KEY = ["admin", "customers"];

export const useCustomers = () => {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: CUSTOMERS_KEY,
    queryFn: async () => {
      const [orders, items, profiles, merges] = await Promise.all([
        fetchAll<RawOrder>("orders", "id, created_at, total_amount, total_flower_weight, delivery_type, payment_method, payment_status, status, order_channel, guest_name, guest_phone, contact_phone, guest_email, user_id"),
        fetchAll<RawItem>("order_items", "order_id, product_name, product_type, quantity, weight, total_price"),
        fetchAll<RawProfile>("profiles", "id, full_name, phone, email"),
        fetchAll<MergeRow>("customer_merges", "source_key, target_key, created_at"),
      ]);
      return { orders, items, profiles, merges };
    },
  });

  const customers = useMemo(
    () => (query.data ? buildCustomers(query.data.orders, query.data.items, query.data.profiles, query.data.merges) : []),
    [query.data]
  );

  const refetch = () => qc.invalidateQueries({ queryKey: CUSTOMERS_KEY });

  const merge = async (source_key: string, target_key: string) => {
    const { error } = await db.from("customer_merges").insert({ source_key, target_key });
    if (error) throw error;
    await refetch();
  };

  const unmerge = async (source_key: string) => {
    const { error } = await db.from("customer_merges").delete().eq("source_key", source_key);
    if (error) throw error;
    await refetch();
  };

  return { customers, isLoading: query.isLoading, error: query.error as Error | null, merge, unmerge };
};

export const useCustomerNote = (keys: string[]) =>
  useQuery({
    queryKey: ["admin", "customer-note", keys.slice().sort().join(",")],
    enabled: keys.length > 0,
    queryFn: async () => {
      const { data, error } = await db.from("customer_notes").select("customer_key, notes, updated_at").in("customer_key", keys);
      if (error) throw error;
      const rows = (data || []) as { customer_key: string; notes: string; updated_at: string }[];
      rows.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
      return rows[0]?.notes ?? "";
    },
  });

export const saveCustomerNote = async (customer_key: string, notes: string) => {
  const { error } = await db
    .from("customer_notes")
    .upsert({ customer_key, notes, updated_at: new Date().toISOString() }, { onConflict: "customer_key" });
  if (error) throw error;
};
