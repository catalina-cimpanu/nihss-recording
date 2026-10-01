export function closeDialogMessage(args: {
  isIncomplete: boolean;
  missingFieldLabels: string[];
  ataxiaIncompleteLabel: string | null;
  undecidedStrokeLyse: string[];
  lyseJaWithKeinStroke: boolean;
  longerThan60Minutes: boolean;
  needsCloseAnyway: boolean;
  continueQuestion?: string;
}): string {
  const parts: string[] = [];

  if (args.isIncomplete) {
    parts.push(
      `Die Erhebung ist unvollständig. Fehlende NIHSS-Felder: ${[
        ...args.missingFieldLabels,
        ...(args.ataxiaIncompleteLabel ? [args.ataxiaIncompleteLabel] : []),
      ].join(", ")}.`,
    );
  }

  if (args.lyseJaWithKeinStroke) {
    parts.push("Kein Stroke und Lyse Ja gehören nicht zusammen.");
  }

  if (args.undecidedStrokeLyse.length === 2) {
    parts.push("Stroke und Lyse sind noch nicht entschieden.");
  } else if (args.undecidedStrokeLyse.length === 1) {
    parts.push(`${args.undecidedStrokeLyse[0]} ist noch nicht entschieden.`);
  }

  if (args.longerThan60Minutes) {
    parts.push("Die Untersuchungsdauer beträgt mehr als 60 Minuten.");
  }

  if (!args.needsCloseAnyway) {
    return `Untersuchung beenden und als abgeschlossen markieren?${
      args.longerThan60Minutes
        ? " Die Untersuchungsdauer beträgt mehr als 60 Minuten."
        : ""
    }`;
  }

  return `${parts.join(" ")} ${args.continueQuestion ?? "Trotzdem abschließen?"}`;
}
