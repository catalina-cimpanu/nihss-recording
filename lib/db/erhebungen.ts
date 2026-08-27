import { getSupabaseClient } from "@/lib/supabase/client";
import { calculateGfast, withDerivedScores } from "@/lib/nihss/scoring";
import type {
  EreignisInsert,
  EreignisRow,
  ErhebungInsert,
  ErhebungRow,
  ErhebungUpdate,
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
    .select(
      "id, created_at, erhebungs_id, untersuchungstyp, status, nihss, g_fast, stroke_status, lyse_status, punkte_2, punkte_4, punkte_5a, punkte_5b, punkte_9_grob, punkte_10",
    )
    .neq("status", "geloescht")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    created_at: row.created_at,
    erhebungs_id: row.erhebungs_id,
    untersuchungstyp: row.untersuchungstyp,
    status: row.status,
    nihss: row.nihss,
    g_fast: calculateGfast(row),
    stroke_status: row.stroke_status,
    lyse_status: row.lyse_status,
  }));
}

export async function listErhebungenFull(): Promise<ErhebungRow[]> {
  const { data, error } = await getSupabaseClient()
    .from("erhebungen")
    .select("*")
    .neq("status", "geloescht")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(withDerivedScores);
}

export async function listEreignisseForErhebungen(
  erhebungIds: string[],
): Promise<EreignisRow[]> {
  if (erhebungIds.length === 0) {
    return [];
  }

  const { data, error } = await getSupabaseClient()
    .from("ereignisse")
    .select("*")
    .in("erhebung_id", erhebungIds)
    .order("created_at", { ascending: true });

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

  return data ? withDerivedScores(data) : null;
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

export async function updateErhebung(
  id: string,
  values: ErhebungUpdate,
): Promise<ErhebungRow> {
  const { data, error } = await getSupabaseClient()
    .from("erhebungen")
    .update(values)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function insertEreignis(values: EreignisInsert): Promise<void> {
  const { error } = await getSupabaseClient().from("ereignisse").insert(values);

  if (error) {
    throw error;
  }
}

export async function persistErhebungAndEreignisse(
  erhebung: ErhebungRow,
  ereignisse: EreignisInsert[],
): Promise<void> {
  const values: ErhebungUpdate = { ...erhebung };
  delete values.id;
  delete values.created_at;
  await updateErhebung(erhebung.id, values);

  if (ereignisse.length === 0) {
    return;
  }

  const { error } = await getSupabaseClient()
    .from("ereignisse")
    .insert(ereignisse);

  if (error) {
    throw error;
  }
}

export async function persistErhebungAndEreignis(
  erhebung: ErhebungRow,
  ereignis: EreignisInsert,
): Promise<void> {
  await persistErhebungAndEreignisse(erhebung, [ereignis]);
}
