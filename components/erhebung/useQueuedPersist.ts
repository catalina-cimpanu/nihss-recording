"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createErhebungPersistQueue,
  readPersistQueueSnapshot,
  writePersistQueueSnapshot,
} from "@/lib/db/persist-queue";
import type { EreignisInsert, ErhebungRow } from "@/lib/supabase/database.types";

export type SaveStatus = "idle" | "saving" | "saved" | "error" | "retrying";

const SAVED_VISIBLE_MS = 2000;

function browserStorage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function useQueuedPersist(initialErhebung: ErhebungRow) {
  const restoredLatestRef = useRef<ErhebungRow | null>(null);
  const queueRef = useRef<ReturnType<typeof createErhebungPersistQueue> | null>(
    null,
  );
  if (queueRef.current == null) {
    const queue = createErhebungPersistQueue(initialErhebung);
    const stored =
      typeof window !== "undefined"
        ? readPersistQueueSnapshot(window.sessionStorage, initialErhebung.id)
        : null;
    if (stored) {
      queue.restore(stored);
      restoredLatestRef.current = stored.latest;
    }
    queueRef.current = queue;
  }

  const savedTimerRef = useRef<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(() =>
    restoredLatestRef.current ? "retrying" : "idle",
  );
  const [saveError, setSaveError] = useState<string | null>(null);

  const persistSnapshot = useCallback(() => {
    const storage = browserStorage();
    const queue = queueRef.current;
    if (!storage || !queue) {
      return;
    }
    writePersistQueueSnapshot(
      storage,
      initialErhebung.id,
      queue.getSnapshot(),
      queue.isDirty(),
    );
  }, [initialErhebung.id]);

  const persistQueued = useCallback(
    async (next: ErhebungRow, events: EreignisInsert[], silent = false) => {
      if (!silent) {
        if (savedTimerRef.current != null) {
          window.clearTimeout(savedTimerRef.current);
          savedTimerRef.current = null;
        }
        setSaveStatus(navigator.onLine === false ? "retrying" : "saving");
      }
      try {
        await queueRef.current!.enqueue(next, events);
        persistSnapshot();
        setSaveError(null);
        if (!silent) {
          setSaveStatus("saved");
          savedTimerRef.current = window.setTimeout(() => {
            setSaveStatus((current) => (current === "saved" ? "idle" : current));
            savedTimerRef.current = null;
          }, SAVED_VISIBLE_MS);
        } else {
          setSaveStatus((current) =>
            current === "error" || current === "retrying" ? "idle" : current,
          );
        }
      } catch (caught) {
        persistSnapshot();
        const offline = typeof navigator !== "undefined" && navigator.onLine === false;
        const message =
          caught instanceof Error
            ? caught.message
            : "Speichern fehlgeschlagen. Bitte erneut klicken.";
        setSaveError(
          offline
            ? "Keine Verbindung. Speichern wird wiederholt, sobald das Netz wieder da ist."
            : message,
        );
        setSaveStatus(offline ? "retrying" : "error");
      }
    },
    [persistSnapshot],
  );

  const retryQueued = useCallback(async () => {
    if (savedTimerRef.current != null) {
      window.clearTimeout(savedTimerRef.current);
      savedTimerRef.current = null;
    }
    setSaveStatus("retrying");
    try {
      await queueRef.current!.retry();
      persistSnapshot();
      setSaveError(null);
      setSaveStatus("saved");
      savedTimerRef.current = window.setTimeout(() => {
        setSaveStatus((current) => (current === "saved" ? "idle" : current));
        savedTimerRef.current = null;
      }, SAVED_VISIBLE_MS);
    } catch (caught) {
      persistSnapshot();
      const offline = typeof navigator !== "undefined" && navigator.onLine === false;
      setSaveError(
        offline
          ? "Keine Verbindung. Speichern wird wiederholt, sobald das Netz wieder da ist."
          : caught instanceof Error
            ? caught.message
            : "Speichern fehlgeschlagen. Bitte erneut klicken.",
      );
      setSaveStatus(offline ? "retrying" : "error");
    }
  }, [persistSnapshot]);

  useEffect(() => {
    if (restoredLatestRef.current) {
      void retryQueued();
    }
    function onOnline() {
      if (queueRef.current?.isDirty()) {
        void retryQueued();
      }
    }
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("online", onOnline);
      if (savedTimerRef.current != null) {
        window.clearTimeout(savedTimerRef.current);
      }
    };
  }, [retryQueued]);

  return {
    persistQueued,
    retryQueued,
    saveStatus,
    saveError,
    isSaving: saveStatus === "saving" || saveStatus === "retrying",
    restoredLatest: restoredLatestRef.current,
  };
}
