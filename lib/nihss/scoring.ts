import type { ErhebungRow } from "@/lib/supabase/database.types";
import {
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

function isPositiveFinding(score: number | null | undefined): boolean {
  return (score ?? 0) >= 1;
}

export function calculateGfast(
  erhebung: Pick<ErhebungRow, GfastScoreKey>,
): number {
  const gaze = isPositiveFinding(erhebung.punkte_2);
  const face = isPositiveFinding(erhebung.punkte_4);
  const arm =
    isPositiveFinding(erhebung.punkte_5a) ||
    isPositiveFinding(erhebung.punkte_5b);
  const speech =
    isPositiveFinding(erhebung.punkte_9_grob) ||
    isPositiveFinding(erhebung.punkte_10);

  return Number(gaze) + Number(face) + Number(arm) + Number(speech);
}

export function withDerivedScores<
  T extends Pick<ErhebungRow, NihssScoreKey | GfastScoreKey> & {
    nihss: number;
    g_fast: number;
  },
>(row: T): T {
  return {
    ...row,
    nihss: calculateNihss(row),
    g_fast: calculateGfast(row),
  };
}
