import { erhebungUpdatePatch } from "@/lib/db/erhebung-patch";
import { persistErhebungAndEreignisse } from "@/lib/db/erhebungen";
import type {
  EreignisInsert,
  ErhebungRow,
} from "@/lib/supabase/database.types";

export type PersistFn = (
  erhebung: ErhebungRow,
  ereignisse: EreignisInsert[],
  previous?: ErhebungRow,
) => Promise<void>;

export function createErhebungPersistQueue(
  initial: ErhebungRow,
  persistFn: PersistFn = persistErhebungAndEreignisse,
) {
  let lastPersisted = initial;
  let latest = initial;
  let pendingEvents: EreignisInsert[] = [];
  let chain: Promise<void> = Promise.resolve();

  async function flush(): Promise<void> {
    while (true) {
      const events = pendingEvents;
      pendingEvents = [];
      const next = latest;
      const previous = lastPersisted;
      const hasPatch = Object.keys(erhebungUpdatePatch(previous, next)).length > 0;
      if (!hasPatch && events.length === 0) {
        return;
      }

      try {
        await persistFn(next, events, previous);
        lastPersisted = next;
      } catch (error) {
        pendingEvents = [...events, ...pendingEvents];
        throw error;
      }
    }
  }

  function enqueue(next: ErhebungRow, events: EreignisInsert[]): Promise<void> {
    latest = next;
    pendingEvents.push(...events);
    const run = chain.then(() => flush());
    chain = run.catch(() => undefined);
    return run;
  }

  return { enqueue };
}
