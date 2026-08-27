"use client";

import { useLayoutEffect, useState } from "react";

const SELECTOR = "[data-sticky-option-row] button";

export function useStickyOptionHeight(): number | null {
  const [height, setHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    function update() {
      let max = 0;
      document.querySelectorAll<HTMLElement>(SELECTOR).forEach((button) => {
        max = Math.max(max, button.getBoundingClientRect().height);
      });
      if (max > 0) {
        setHeight(max);
      }
    }

    update();
    const observer = new ResizeObserver(update);
    document.querySelectorAll<HTMLElement>(SELECTOR).forEach((button) => {
      observer.observe(button);
    });
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return height;
}
