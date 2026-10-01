"use client";

import {
  useEffect,
  useId,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

let scrollLockCount = 0;
let previousBodyOverflow = "";

function lockBodyScroll() {
  if (scrollLockCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  scrollLockCount += 1;
}

function unlockBodyScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) {
    document.body.style.overflow = previousBodyOverflow;
  }
}

function focusableIn(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (node) =>
      !node.hasAttribute("disabled") &&
      node.getAttribute("aria-hidden") !== "true" &&
      node.tabIndex !== -1,
  );
}

type AppDialogProps = {
  children: ReactNode;
  title?: string;
  stepLabel?: string;
  label?: string;
  describedBy?: string;
  dismissible?: boolean;
  onClose?: () => void;
  inert?: boolean;
  zClass?: string;
  panelClassName?: string;
};

export default function AppDialog({
  children,
  title,
  stepLabel,
  label,
  describedBy,
  dismissible = true,
  onClose,
  inert = false,
  zClass = "z-[70]",
  panelClassName = "",
}: AppDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const generatedTitleId = useId();
  const titleId = title ? generatedTitleId : undefined;

  useEffect(() => {
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, []);

  useEffect(() => {
    if (inert) {
      return;
    }
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const panel = panelRef.current;
    if (!panel) {
      return;
    }
    const focusable = focusableIn(panel);
    (focusable[0] ?? panel).focus();

    return () => {
      previousFocusRef.current?.focus();
    };
  }, [inert]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (inert) {
      return;
    }
    if (event.key === "Escape") {
      if (dismissible && onClose) {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
      return;
    }
    if (event.key !== "Tab" || !panelRef.current) {
      return;
    }
    const focusable = focusableIn(panelRef.current);
    if (focusable.length === 0) {
      event.preventDefault();
      panelRef.current.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className={`fixed inset-0 ${zClass} flex items-end justify-center bg-black/40 p-4 md:items-center ${
        inert ? "pointer-events-none" : ""
      }`}
      onMouseDown={(event) => {
        if (inert || !dismissible || !onClose) {
          return;
        }
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-label={!titleId ? label : undefined}
        aria-describedby={describedBy}
        aria-hidden={inert || undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={`w-full max-w-lg space-y-3 rounded-xl border border-tempis-orange bg-surface p-4 shadow-lg outline-none ${panelClassName}`}
      >
        {stepLabel ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {stepLabel}
          </p>
        ) : null}
        {title ? (
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
        ) : null}
        {children}
      </div>
    </div>
  );
}
