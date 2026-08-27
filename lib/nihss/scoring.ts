import type { ErhebungRow } from "@/lib/supabase/database.types";
import {
  GFAST_SCORE_KEYS,
  NIHSS_SCORE_KEYS,
  type GfastScoreKey,
  type NihssScoreKey,
} from "@/lib/nihss/config";

function sumScores<K extends NihssScoreKey>(
  erhebung: Pick<ErhebungRow, K>,
  keys: readonly K[],
): number {
  return keys.reduce((total, key) => total + (erhebung[key] ?? 0), 0);
}

export function calculateNihss(
  erhebung: Pick<ErhebungRow, NihssScoreKey>,
): number {
  return sumScores(erhebung, NIHSS_SCORE_KEYS);
}

export function calculateGfast(
  erhebung: Pick<ErhebungRow, GfastScoreKey>,
): number {
  return sumScores(erhebung, GFAST_SCORE_KEYS);
}
