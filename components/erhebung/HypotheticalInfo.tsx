"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const HYPOTHETICAL_REMINDER_MS = 3000;
const FADE_MS = 200;
const MORPH_MS = 600;
const HINT_SELECTOR = "[data-hypothetical-hint]";

/**
 * Popup before the Untersuchung starts. On "OK", a tap, or after a few
 * seconds it shrinks into the hint line in the sticky bar.
 */
export function HypotheticalReminder({ onClose }: { onClose: () => void }) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);
  const [collapsing, setCollapsing] = useState(false);

  const dismiss = useCallback(() => {
    if (closingRef.current) {
      return;
    }
    closingRef.current = true;
    const backdrop = backdropRef.current;
    const card = cardRef.current;
    const target = document.querySelector<HTMLElement>(HINT_SELECTOR);
    if (!backdrop || !card) {
      onClose();
      return;
    }
    if (!target || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      backdrop
        .animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE_MS, fill: "forwards" })
        .finished.then(onClose, onClose);
      return;
    }

    // First fade out everything that is not in the hint line, then move the card.
    setCollapsing(true);
    backdrop.animate(
      [{ backgroundColor: "rgb(0 0 0 / 0.3)" }, { backgroundColor: "rgb(0 0 0 / 0)" }],
      { duration: FADE_MS + MORPH_MS, fill: "forwards" },
    );
    const from = card.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    card
      .animate(
        [
          { transform: "none", opacity: 1 },
          {
            transform: `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${to.width / from.width}, ${to.height / from.height})`,
            opacity: 0,
          },
        ],
        {
          duration: MORPH_MS,
          delay: FADE_MS,
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
          fill: "forwards",
        },
      )
      .finished.then(() => {
        onClose();
        target.animate(
          [
            { backgroundColor: "rgb(222 186 10 / 0.45)" },
            { backgroundColor: "rgb(222 186 10 / 0)" },
          ],
          { duration: 900, easing: "ease-out" },
        );
      }, onClose);
  }, [onClose]);

  useEffect(() => {
    const id = window.setTimeout(dismiss, HYPOTHETICAL_REMINDER_MS);
    return () => window.clearTimeout(id);
  }, [dismiss]);

  const extra = `transition-opacity duration-200 ${collapsing ? "opacity-0" : ""}`;

  return (
    <div
      ref={backdropRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="hypothetical-reminder-title"
      onClick={dismiss}
      className={`fixed inset-0 z-[90] flex items-center justify-center bg-black/30 px-4 ${
        collapsing ? "pointer-events-none" : ""
      }`}
    >
      <div
        ref={cardRef}
        className="w-full max-w-md origin-top-left overflow-hidden rounded-xl bg-surface shadow-xl"
      >
        <div className="space-y-3 p-4">
          <h2 id="hypothetical-reminder-title" className={`text-lg font-semibold ${extra}`}>
            Bitte beachten
          </h2>
          <p>
            Stroke/Lyse:{" "}
            <strong className="text-tempis-signal">hypothetische Entscheidung</strong>{" "}
            – rein nach NIHSS-Befund
            <span className={extra}>
              , unabhängig von vorliegenden Kontraindikationen.
            </span>
          </p>
          <p className={`text-sm text-muted ${extra}`}>
            Bitte sofort klicken, sobald Sie sich klinisch entscheiden würden.
          </p>
          <button
            type="button"
            onClick={dismiss}
            className={`rounded-lg bg-tempis-blue-dark px-4 py-2 font-semibold text-white hover:bg-tempis-blue-darker ${extra}`}
          >
            OK
          </button>
        </div>
        <div
          className={`h-1 origin-left bg-tempis-signal ${extra}`}
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
      {/* Target of the reminder popup when it closes. */}
      <p data-hypothetical-hint className="inline-flex items-center rounded">
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
