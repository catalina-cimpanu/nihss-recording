export const NIHSS_SCORE_KEYS = [
  "punkte_1a",
  "punkte_1b",
  "punkte_1c",
  "punkte_2",
  "punkte_3",
  "punkte_4",
  "punkte_5a",
  "punkte_5b",
  "punkte_6a",
  "punkte_6b",
  "punkte_7",
  "punkte_8",
  "punkte_9_grob",
  "punkte_10",
  "punkte_11",
] as const;

export const GFAST_SCORE_KEYS = [
  "punkte_5a",
  "punkte_5b",
  "punkte_9_grob",
  "punkte_10",
  "punkte_4",
] as const;

export type NihssScoreKey = (typeof NIHSS_SCORE_KEYS)[number];
export type GfastScoreKey = (typeof GFAST_SCORE_KEYS)[number];

export type ScoreColor =
  | "score0"
  | "score1"
  | "score2"
  | "score3"
  | "score4"
  | "scoreUN";

export type NihssOption = {
  label: string;
  score: number | null;
  special?: "UN" | "ignored";
  color: ScoreColor;
};

export type NihssField = {
  key: string;
  label: string;
  prompt?: string;
  contributesToNihss: boolean;
  contributesToGfast: boolean;
  options: NihssOption[];
};

export const NIHSS_FIELDS: NihssField[] = [];
