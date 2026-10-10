"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

 
export function AlertRuleSimulator({
  wellId,
  rule,
}: {
  wellId: string;
  rule: Record<string, unknown>;
}) {
  const t = useTranslations("alerts");
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState<{ fired: number } | null>(null);

  const runSimulation = async () => {
    setSimulating(true);
    // In a real implementation, we would call an API route to run the evaluators on historical data.
    // For now, simulate network delay and return a mock result.
    setTimeout(() => {
      setResult({ fired: Math.floor(Math.random() * 5) });
      setSimulating(false);
    }, 1000);
  };

  return (
    <div className="mt-4 rounded-lg border bg-muted/50 p-4">
      <h4 className="mb-2 text-sm font-semibold">{t("simulator.title")}</h4>
      <p className="mb-4 text-xs text-muted-foreground">{t("simulator.description")}</p>

      {result !== null ? (
        <div className="mb-4 text-sm">{t("simulator.result", { count: result.fired })}</div>
      ) : null}

      <button
        type="button"
        onClick={runSimulation}
        disabled={simulating}
        className="rounded bg-primary px-3 py-1 text-xs text-primary-foreground"
      >
        {simulating ? t("simulator.running") : t("simulator.run")}
      </button>
    </div>
  );
}
