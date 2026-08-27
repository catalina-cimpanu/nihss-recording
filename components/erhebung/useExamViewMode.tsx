"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  readExamViewMode,
  resolveExamViewMode,
  writeExamViewMode,
  type ExamViewMode,
} from "@/lib/nihss/exam-view";

type ExamViewContextValue = {
  mode: ExamViewMode;
  setMode: (mode: ExamViewMode) => void;
};

const ExamViewContext = createContext<ExamViewContextValue | null>(null);

export function ExamViewProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ExamViewMode>("normal");

  useEffect(() => {
    setModeState(
      resolveExamViewMode({
        stored: readExamViewMode(window.localStorage),
        isNarrowViewport: window.matchMedia("(max-width: 767px)").matches,
      }),
    );
  }, []);

  const value = useMemo<ExamViewContextValue>(
    () => ({
      mode,
      setMode(next) {
        setModeState(next);
        writeExamViewMode(window.localStorage, next);
      },
    }),
    [mode],
  );

  return (
    <ExamViewContext.Provider value={value}>{children}</ExamViewContext.Provider>
  );
}

export function useExamViewMode(): ExamViewContextValue {
  const context = useContext(ExamViewContext);
  if (!context) {
    throw new Error("useExamViewMode must be used within ExamViewProvider");
  }
  return context;
}
