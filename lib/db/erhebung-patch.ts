import type {
  ErhebungRow,
  ErhebungUpdate,
} from "@/lib/supabase/database.types";

const SKIP_KEYS = new Set<keyof ErhebungRow>(["id", "created_at"]);

export function erhebungUpdatePatch(
  from: ErhebungRow,
  to: ErhebungRow,
): ErhebungUpdate {
  const patch: ErhebungUpdate = {};
  for (const key of Object.keys(to) as (keyof ErhebungRow)[]) {
    if (SKIP_KEYS.has(key)) {
      continue;
    }
    if (!Object.is(from[key], to[key])) {
      (patch as Record<string, unknown>)[key] = to[key];
    }
  }
  return patch;
}
