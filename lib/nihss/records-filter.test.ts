import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EMPTY_RECORDS_FILTERS,
  filterErhebungRows,
  type RecordsFilterRow,
} from "@/lib/nihss/records-filter";

function row(overrides: Partial<RecordsFilterRow> = {}): RecordsFilterRow {
  return {
    erhebungs_id: "E-1001",
    untersuchungstyp: "Echter Patient",
    untersuchung_status: "offen",
    followup_status: "offen",
    ...overrides,
  };
}

describe("filterErhebungRows", () => {
  const rows = [
    row({ erhebungs_id: "ABC-111", untersuchungstyp: "Test" }),
    row({
      erhebungs_id: "XYZ-222",
      untersuchungstyp: "Echter Patient",
      untersuchung_status: "abgeschlossen",
      followup_status: "offen",
    }),
    row({
      erhebungs_id: "XYZ-333",
      untersuchungstyp: "Echter Patient",
      untersuchung_status: "abgeschlossen",
      followup_status: "abgeschlossen",
    }),
  ];

  it("returns all rows when filters are empty", () => {
    assert.equal(filterErhebungRows(rows, EMPTY_RECORDS_FILTERS).length, 3);
  });

  it("filters by Erhebungs-ID substring, ignoring case", () => {
    const found = filterErhebungRows(rows, {
      ...EMPTY_RECORDS_FILTERS,
      query: "xyz",
    });
    assert.deepEqual(
      found.map((item) => item.erhebungs_id),
      ["XYZ-222", "XYZ-333"],
    );
  });

  it("filters by Test vs Echter Patient", () => {
    const found = filterErhebungRows(rows, {
      ...EMPTY_RECORDS_FILTERS,
      typ: "Test",
    });
    assert.equal(found.length, 1);
    assert.equal(found[0].erhebungs_id, "ABC-111");
  });

  it("filters by Untersuchung and Fragen status", () => {
    const found = filterErhebungRows(rows, {
      ...EMPTY_RECORDS_FILTERS,
      untersuchung: "abgeschlossen",
      fragen: "offen",
    });
    assert.equal(found.length, 1);
    assert.equal(found[0].erhebungs_id, "XYZ-222");
  });
});
