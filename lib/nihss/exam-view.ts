export const EXAM_VIEW_STORAGE_KEY = "nihss-exam-view";

export type ExamViewMode = "normal" | "compact";
export type FieldOptionsLayout = "grid" | "single" | "wrap" | "stack";

export function parseExamViewMode(
  value: string | null | undefined,
): ExamViewMode | null {
  return value === "compact" || value === "normal" ? value : null;
}

export function resolveExamViewMode(args: {
  stored: string | null | undefined;
  isNarrowViewport: boolean;
}): ExamViewMode {
  return parseExamViewMode(args.stored) ?? (args.isNarrowViewport ? "compact" : "normal");
}

export function fieldOptionsLayout(args: {
  viewMode: ExamViewMode;
  singleLine?: boolean;
  compact?: boolean;
}): FieldOptionsLayout {
  if (args.singleLine) {
    return "single";
  }

  if (args.viewMode === "compact") {
    return "stack";
  }

  if (args.compact) {
    return "wrap";
  }

  return "stack";
}

export function readExamViewMode(storage: Pick<Storage, "getItem">): string | null {
  try {
    return storage.getItem(EXAM_VIEW_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writeExamViewMode(
  storage: Pick<Storage, "setItem">,
  mode: ExamViewMode,
): void {
  try {
    storage.setItem(EXAM_VIEW_STORAGE_KEY, mode);
  } catch {
    // Ignore quota / private-mode failures; the in-memory toggle still works.
  }
}

export function isExamWorkspacePath(pathname: string): boolean {
  return /^\/records\/[^/]+$/.test(pathname);
}

/** Pair fields for Kompakt: two per row from md up; an odd leftover sits full-width first. */
export function compactFieldRows<T>(fields: T[]): T[][] {
  if (fields.length === 0) {
    return [];
  }

  const rows: T[][] = [];
  let index = 0;
  if (fields.length % 2 === 1) {
    rows.push([fields[0]]);
    index = 1;
  }

  for (; index < fields.length; index += 2) {
    rows.push(fields.slice(index, index + 2));
  }

  return rows;
}
