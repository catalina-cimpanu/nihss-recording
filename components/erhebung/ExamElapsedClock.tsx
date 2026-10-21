"use client";

import { useEffect, useState } from "react";
import { formatElapsedClock, pausedMs } from "@/lib/nihss/duration";
import type { Pause } from "@/lib/supabase/database.types";

type ExamElapsedClockProps = {
  startAt: string | null;
  endAt?: string | null;
  /** Paused time is left out, so the clock stands still during a pause. */
  pausen?: readonly Pause[] | null;
  className?: string;
  title?: string;
};

export default function ExamElapsedClock({
  startAt,
  endAt,
  pausen,
  className,
  title = "Seit Untersuchungsstart",
}: ExamElapsedClockProps) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(0);

  useEffect(() => {
    setMounted(true);
    setNow(Date.now());
  }, []);

  useEffect(() => {
    if (!mounted || !startAt || endAt) {
      return;
    }

    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [mounted, startAt, endAt]);

  if (!startAt) {
    return null;
  }

  const startMs = new Date(startAt).getTime();
  if (!Number.isFinite(startMs)) {
    return null;
  }

  const endMs = endAt ? new Date(endAt).getTime() : now;
  const activeMs = endMs - startMs - pausedMs(pausen, startMs, endMs, endMs);
  const elapsedMs =
    (endAt && Number.isFinite(endMs)) || mounted ? Math.max(0, activeMs) : 0;

  return (
    <span className={className} title={title} suppressHydrationWarning>
      {formatElapsedClock(elapsedMs)}
    </span>
  );
}
