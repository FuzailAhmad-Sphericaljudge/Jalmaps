"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ValueHighlight({
  value,
  children,
  className,
}: {
  value: unknown;
  children: React.ReactNode;
  className?: string;
}) {
  const [highlight, setHighlight] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHighlight(true);
    const timer = setTimeout(() => setHighlight(false), 1000);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div
      className={cn(
        "transition-colors duration-1000",
        highlight
          ? "bg-primary/20 motion-reduce:bg-transparent motion-reduce:font-bold"
          : "bg-transparent",
        className,
      )}
    >
      {children}
    </div>
  );
}
