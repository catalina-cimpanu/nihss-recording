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
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startAt || endAt) {
      return;
    }

    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [startAt, endAt]);

  if (!startAt) {
    return null;
  }

  const startMs = new Date(startAt).getTime();
  if (!Number.isFinite(startMs)) {
    return null;
  }

  const endMs = endAt ? new Date(endAt).getTime() : now;
  const elapsedMs = Number.isFinite(endMs) ? endMs - startMs : 0;

  return (
    <span className={className} title={title}>
      {formatElapsedClock(elapsedMs)}
    </span>
  );
}
