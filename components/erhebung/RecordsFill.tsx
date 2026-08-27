"use client";

import { useLayoutEffect, useState, type ReactNode } from "react";

export default function RecordsFill({ children }: { children: ReactNode }) {
  const [height, setHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    function update() {
      const header = document.querySelector("header");
      const footer = document.querySelector("footer");
      const headerH = header?.getBoundingClientRect().height ?? 0;
      const footerH = footer?.getBoundingClientRect().height ?? 0;
      setHeight(Math.max(window.innerHeight - headerH - footerH, 0));
    }

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div
      className="flex min-h-0 flex-col overflow-hidden"
      style={height != null ? { height } : undefined}
    >
      {children}
    </div>
  );
}
