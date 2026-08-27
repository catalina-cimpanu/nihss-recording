const berlinTimeFormatter = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

export function formatBerlinTime(date: Date): string {
  return berlinTimeFormatter.format(date);
}

export function formatTimelineLine(
  date: Date,
  fieldLabel: string,
  valueLabel: string,
): string {
  return `${formatBerlinTime(date)} – ${fieldLabel}: ${valueLabel}`;
}

export function appendTimelineLine(
  currentTimeline: string,
  line: string,
): string {
  return currentTimeline ? `${currentTimeline}\n${line}` : line;
}
