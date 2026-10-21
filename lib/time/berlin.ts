const berlinStampFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Berlin",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const berlinPartsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Berlin",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function berlinParts(date: Date) {
  const parts = Object.fromEntries(
    berlinPartsFormatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );
  return parts as Record<
    "year" | "month" | "day" | "hour" | "minute" | "second",
    number
  >;
}

function berlinOffsetMs(date: Date): number {
  const p = berlinParts(date);
  const wall = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return wall - Math.floor(date.getTime() / 1000) * 1000;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** "HH:MM:SS" in Berlin time. */
export function berlinTimeOfDay(iso: string): string {
  const p = berlinParts(new Date(iso));
  return `${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}`;
}

/** Normalizes "H:MM" / "HH:MM" / "HH:MM:SS" to "HH:MM:SS"; null if invalid. */
export function normalizeTimeOfDay(value: string): string | null {
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!match) {
    return null;
  }
  const [hour, minute, second] = [match[1], match[2], match[3] ?? "0"].map(Number);
  if (hour > 23 || minute > 59 || second > 59) {
    return null;
  }
  return `${pad(hour)}:${pad(minute)}:${pad(second)}`;
}

/**
 * The instant with Berlin time of day `time` closest to `reference`
 * (so corrections across midnight land on the right day).
 */
export function nearestBerlinTime(reference: string, time: string): string | null {
  const normalized = normalizeTimeOfDay(time);
  if (!normalized) {
    return null;
  }
  const [hour, minute, second] = normalized.split(":").map(Number);
  const referenceMs = new Date(reference).getTime();
  const day = berlinParts(new Date(reference));
  let best: number | null = null;
  for (const shift of [-1, 0, 1]) {
    const wall = Date.UTC(day.year, day.month - 1, day.day + shift, hour, minute, second);
    const guess = wall - berlinOffsetMs(new Date(wall));
    const candidate = wall - berlinOffsetMs(new Date(guess));
    if (best == null || Math.abs(candidate - referenceMs) < Math.abs(best - referenceMs)) {
      best = candidate;
    }
  }
  return new Date(best!).toISOString();
}

export function createErhebungsId(date = new Date()): string {
  const parts = Object.fromEntries(
    berlinStampFormatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${parts.year}-${parts.month}-${parts.day}_${parts.hour}-${parts.minute}-${parts.second}`;
}
