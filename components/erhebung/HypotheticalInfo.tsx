"use client";

import { useEffect, useState } from "react";

export const HYPOTHETICAL_REMINDER_MS = 5000;

/** Popup before the Untersuchung starts; closes itself after a few seconds. */
export function HypotheticalReminder({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const id = window.setTimeout(onClose, HYPOTHETICAL_REMINDER_MS);
    return () => window.clearTimeout(id);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="hypothetical-reminder-title"
      onClick={onClose}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/30 px-4"
    >
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-surface shadow-xl">
        <div className="space-y-3 p-4">
          <h2 id="hypothetical-reminder-title" className="text-lg font-semibold">
            Bitte beachten
          </h2>
          <p>
            Stroke/Lyse:{" "}
            <strong className="text-tempis-signal">hypothetische Entscheidung</strong>{" "}
            – rein nach NIHSS-Befund, unabhängig von vorliegenden
            Kontraindikationen.
          </p>
          <p className="text-sm text-muted">
            Bitte sofort klicken, sobald Sie sich klinisch entscheiden würden.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-tempis-blue-dark px-4 py-2 font-semibold text-white hover:bg-tempis-blue-darker"
          >
            OK
          </button>
        </div>
        <div
          className="h-1 origin-left bg-tempis-signal"
          style={{ animation: `toast-timer ${HYPOTHETICAL_REMINDER_MS}ms linear forwards` }}
        />
      </div>
    </div>
  );
}

export const HYPOTHETICAL_EXPLANATION =
  "unabhängig von vorliegenden Kontraindikationen, rein auf der NIHSS Untersuchung basiert";

/** ⓘ button that toggles the explanation of the hypothetical decision. */
export function HypotheticalInfoButton({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="ml-1 inline-flex align-text-bottom text-tempis-blue-darker"
      aria-label={HYPOTHETICAL_EXPLANATION}
      aria-expanded={open}
      title={HYPOTHETICAL_EXPLANATION}
      onClick={onToggle}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM9 8a1 1 0 0 1 2 0v5a1 1 0 1 1-2 0V8Zm1-4a1.25 1.25 0 1 0 0 2.5A1.25 1.25 0 0 0 10 4Z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
}

/** Reminder above the in-exam Stroke/Lyse buttons. */
export function HypotheticalHint() {
  const [open, setOpen] = useState(false);

  return (
    <div className="text-[0.7rem] leading-tight text-muted md:text-xs">
      <p className="flex items-center">
        <span className="md:hidden">
          <strong className="text-tempis-signal">Hypothetisch</strong> – rein nach
          NIHSS-Befund
        </span>
        <span className="hidden md:inline">
          Stroke/Lyse:{" "}
          <strong className="text-tempis-signal">hypothetische Entscheidung</strong> –
          rein nach NIHSS-Befund
        </span>
        <HypotheticalInfoButton open={open} onToggle={() => setOpen((value) => !value)} />
      </p>
      {open ? (
        <p className="mt-1 rounded-lg bg-tempis-ice px-2 py-1">
          <strong className="text-tempis-signal">Hypothetische Entscheidung</strong>:{" "}
          {HYPOTHETICAL_EXPLANATION}. Bitte sofort klicken, sobald Sie sich
          klinisch entscheiden würden.
        </p>
      ) : null}
    </div>
  );
}
