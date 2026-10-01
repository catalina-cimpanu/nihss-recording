"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createErhebungPersistQueue } from "@/lib/db/persist-queue";
import type { EreignisInsert, ErhebungRow } from "@/lib/supabase/database.types";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

const SAVED_VISIBLE_MS = 2000;

export function useQueuedPersist(initialErhebung: ErhebungRow) {
  const queueRef = useRef(createErhebungPersistQueue(initialErhebung));
  const savedTimerRef = useRef<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current != null) {
        window.clearTimeout(savedTimerRef.current);
      }
    };
  }, []);

  const persistQueued = useCallback(
    async (next: ErhebungRow, events: EreignisInsert[], silent = false) => {
      if (!silent) {
        if (savedTimerRef.current != null) {
          window.clearTimeout(savedTimerRef.current);
          savedTimerRef.current = null;
        }
        setSaveStatus("saving");
      }
      try {
        await queueRef.current.enqueue(next, events);
        setSaveError(null);
        if (!silent) {
          setSaveStatus("saved");
          savedTimerRef.current = window.setTimeout(() => {
            setSaveStatus((current) => (current === "saved" ? "idle" : current));
            savedTimerRef.current = null;
          }, SAVED_VISIBLE_MS);
        } else {
          setSaveStatus((current) => (current === "error" ? "idle" : current));
        }
      } catch (caught) {
        const message =
          caught instanceof Error
            ? caught.message
            : "Speichern fehlgeschlagen. Bitte erneut klicken.";
        setSaveError(message);
        setSaveStatus("error");
      }
    },
    [],
  );

  return {
    persistQueued,
    saveStatus,
    saveError,
    isSaving: saveStatus === "saving",
  };
}
