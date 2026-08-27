import { getSupabaseClient } from "@/lib/supabase/client";
import type {
  EreignisInsert,
  ErhebungInsert,
  ErhebungRow,
} from "@/lib/supabase/database.types";

export const ERHEBUNG_LIST_COLUMNS =
  "id, created_at, erhebungs_id, untersuchungstyp, status, nihss, g_fast, stroke_status, lyse_status" as const;

export type ErhebungListItem = Pick<
  ErhebungRow,
  | "id"
  | "created_at"
  | "erhebungs_id"
  | "untersuchungstyp"
  | "status"
  | "nihss"
  | "g_fast"
  | "stroke_status"
  | "lyse_status"
>;

export async function listErhebungen(): Promise<ErhebungListItem[]> {
  const { data, error } = await getSupabaseClient()
    .from("erhebungen")
    .select(ERHEBUNG_LIST_COLUMNS)
    .neq("status", "geloescht")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getErhebung(id: string): Promise<ErhebungRow | null> {
  const { data, error } = await getSupabaseClient()
    .from("erhebungen")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function createErhebung(
  values: ErhebungInsert,
): Promise<ErhebungRow> {
  const { data, error } = await getSupabaseClient()
    .from("erhebungen")
    .insert(values)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function softDeleteErhebung(id: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from("erhebungen")
    .update({ status: "geloescht" })
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export async function insertEreignis(values: EreignisInsert): Promise<void> {
  const { error } = await getSupabaseClient().from("ereignisse").insert(values);

  if (error) {
    throw error;
  }
}
