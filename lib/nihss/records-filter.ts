export type RecordsTypFilter = "all" | "Test" | "Echter Patient";
export type RecordsStatusFilter = "all" | "offen" | "abgeschlossen";

export type RecordsListFilters = {
  query: string;
  typ: RecordsTypFilter;
  untersuchung: RecordsStatusFilter;
  fragen: RecordsStatusFilter;
};

export const EMPTY_RECORDS_FILTERS: RecordsListFilters = {
  query: "",
  typ: "all",
  untersuchung: "all",
  fragen: "all",
};

export type RecordsFilterRow = {
  erhebungs_id: string;
  untersuchungstyp: "Test" | "Echter Patient";
  untersuchung_status: "offen" | "abgeschlossen" | "geloescht";
  followup_status: "offen" | "abgeschlossen";
};

export function matchesRecordsFilter(
  row: RecordsFilterRow,
  filters: RecordsListFilters,
): boolean {
  const query = filters.query.trim().toLowerCase();
  if (query && !row.erhebungs_id.toLowerCase().includes(query)) {
    return false;
  }
  if (filters.typ !== "all" && row.untersuchungstyp !== filters.typ) {
    return false;
  }
  if (
    filters.untersuchung !== "all" &&
    row.untersuchung_status !== filters.untersuchung
  ) {
    return false;
  }
  if (filters.fragen !== "all" && row.followup_status !== filters.fragen) {
    return false;
  }
  return true;
}

export function filterErhebungRows<T extends RecordsFilterRow>(
  rows: T[],
  filters: RecordsListFilters,
): T[] {
  return rows.filter((row) => matchesRecordsFilter(row, filters));
}
