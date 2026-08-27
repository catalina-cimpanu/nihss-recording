"use client";

import { useEffect, useState } from "react";

type ScrollToTopButtonProps = {
  className?: string;
  variant?: "fixed" | "docked";
};

function UpArrow() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12.5 10 6.5l6 6" />
    </svg>
  );
}

export default function ScrollToTopButton({
  className,
  variant = "fixed",
}: ScrollToTopButtonProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 240);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) {
    return null;
  }

  const buttonClass =
    "flex h-9 w-9 items-center justify-center rounded-full bg-tempis-blue-dark text-white shadow-lg hover:bg-tempis-blue-darker";

  if (variant === "docked") {
    return (
      <button
        type="button"
        aria-label="Nach oben"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`mb-2 mr-3 self-end ${buttonClass}`}
      >
        <UpArrow />
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label="Nach oben"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed right-4 z-[55] ${buttonClass} ${className ?? ""}`}
    >
      <UpArrow />
    </button>
  );
}
