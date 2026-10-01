import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createErhebungPersistQueue } from "@/lib/db/persist-queue";
import type {
  EreignisInsert,
  ErhebungRow,
} from "@/lib/supabase/database.types";

function row(overrides: Partial<ErhebungRow> = {}): ErhebungRow {
  return {
    id: "exam-1",
    created_at: "2026-08-27T10:00:00.000Z",
    erhebungs_id: "E-1",
    untersuchungstyp: "Echter Patient",
    untersuchung_status: "offen",
    followup_status: "offen",
    nihss: 0,
    g_fast: 0,
    timeline: "",
    ...overrides,
  } as ErhebungRow;
}

function event(id: string): EreignisInsert {
  return { erhebung_id: "exam-1", ereignis_typ: id } as EreignisInsert;
}

describe("createErhebungPersistQueue", () => {
  it("serializes overlapping saves so a later row cannot finish before an earlier one", async () => {
    const calls: Array<{
      nihss: number;
      eventCount: number;
      previousNihss: number | undefined;
    }> = [];
    let releaseFirst!: () => void;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    let startedFirst!: () => void;
    const firstStarted = new Promise<void>((resolve) => {
      startedFirst = resolve;
    });
    let persistCount = 0;

    const queue = createErhebungPersistQueue(
      row({ nihss: 0 }),
      async (next, events, previous) => {
        persistCount += 1;
        if (persistCount === 1) {
          startedFirst();
          await firstGate;
        }
        calls.push({
          nihss: next.nihss,
          eventCount: events.length,
          previousNihss: previous?.nihss,
        });
      },
    );

    const first = queue.enqueue(row({ nihss: 1 }), [event("a")]);
    await firstStarted;
    const second = queue.enqueue(row({ nihss: 2 }), [event("b")]);
    releaseFirst();
    await Promise.all([first, second]);

    assert.equal(calls.length, 2);
    assert.deepEqual(calls[0], {
      nihss: 1,
      eventCount: 1,
      previousNihss: 0,
    });
    assert.deepEqual(calls[1], {
      nihss: 2,
      eventCount: 1,
      previousNihss: 1,
    });
  });

  it("requeues events after a failed persist so a later enqueue retries them", async () => {
    let shouldFail = true;
    const calls: number[] = [];
    const queue = createErhebungPersistQueue(row({ nihss: 0 }), async (_next, events) => {
      calls.push(events.length);
      if (shouldFail) {
        shouldFail = false;
        throw new Error("offline");
      }
    });

    await assert.rejects(() => queue.enqueue(row({ nihss: 3 }), [event("a"), event("b")]));
    await queue.enqueue(row({ nihss: 3 }), []);

    assert.deepEqual(calls, [2, 2]);
  });
});
