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

export type PersistQueueSnapshot = {
  lastPersisted: ErhebungRow;
  latest: ErhebungRow;
  pendingEvents: EreignisInsert[];
};

export function persistQueueStorageKey(erhebungId: string): string {
  return `nihss-persist-queue:${erhebungId}`;
}

export function createErhebungPersistQueue(
  initial: ErhebungRow,
  persistFn: PersistFn = persistErhebungAndEreignisse,
) {
  let lastPersisted = initial;
  let latest = initial;
  let pendingEvents: EreignisInsert[] = [];
  let chain: Promise<void> = Promise.resolve();

  function isDirty(): boolean {
    return (
      pendingEvents.length > 0 ||
      Object.keys(erhebungUpdatePatch(lastPersisted, latest)).length > 0
    );
  }

  function getSnapshot(): PersistQueueSnapshot {
    return {
      lastPersisted,
      latest,
      pendingEvents: [...pendingEvents],
    };
  }

  function restore(snapshot: PersistQueueSnapshot): void {
    lastPersisted = snapshot.lastPersisted;
    latest = snapshot.latest;
    pendingEvents = [...snapshot.pendingEvents];
  }

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

  function retry(): Promise<void> {
    return enqueue(latest, []);
  }

  return { enqueue, retry, getSnapshot, restore, isDirty };
}

export function readPersistQueueSnapshot(
  storage: Pick<Storage, "getItem">,
  erhebungId: string,
): PersistQueueSnapshot | null {
  try {
    const raw = storage.getItem(persistQueueStorageKey(erhebungId));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as PersistQueueSnapshot;
    if (!parsed?.latest?.id || !parsed?.lastPersisted?.id) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writePersistQueueSnapshot(
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem">,
  erhebungId: string,
  snapshot: PersistQueueSnapshot,
  dirty: boolean,
): void {
  try {
    const key = persistQueueStorageKey(erhebungId);
    if (!dirty) {
      storage.removeItem(key);
      return;
    }
    storage.setItem(key, JSON.stringify(snapshot));
  } catch {
    // Ignore quota / private-mode failures.
  }
}
