"use client";

import { useEffect, useState } from "react";
import { formatElapsedClock } from "@/lib/nihss/duration";

type ExamElapsedClockProps = {
  startAt: string | null;
  endAt?: string | null;
  className?: string;
  title?: string;
};

export default function ExamElapsedClock({
  startAt,
  endAt,
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
  const elapsedMs =
    endAt && Number.isFinite(endMs)
      ? Math.max(0, endMs - startMs)
      : mounted
        ? Math.max(0, endMs - startMs)
        : 0;

  return (
    <span className={className} title={title} suppressHydrationWarning>
      {formatElapsedClock(elapsedMs)}
    </span>
  );
}
