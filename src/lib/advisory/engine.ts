import { AdvisoryRule } from "../schemas/advisory";
import { WellFacts } from "./facts";

export interface AdviceItem {
  id: string; // rule id
  adviceKey: string;
  priority: number;
}

export type ConditionLeaf = {
  fact: string;
  operator: string;
  value: unknown;
};

export type ConditionNode = ConditionLeaf | { all: ConditionNode[] } | { any: ConditionNode[] };

export function evaluateCondition(
  condition: ConditionNode,
  facts: Record<string, unknown>,
): boolean {
  if ("all" in condition) {
    return condition.all.every((c) => evaluateCondition(c, facts));
  }
  if ("any" in condition) {
    return condition.any.some((c) => evaluateCondition(c, facts));
  }

  // It's a simple condition
  const { fact, operator, value } = condition;
  const factValue = facts[fact];

  // If a required fact is null/undefined and we are evaluating it, we must fail safe.
  // Unless we are explicitly checking for null.
  if (factValue === undefined || factValue === null) {
    return operator === "==" && value === null;
  }

  switch (operator) {
    case "==":
      return factValue === value;
    case "!=":
      return factValue !== value;
    case ">":
      return (factValue as number) > (value as number);
    case ">=":
      return (factValue as number) >= (value as number);
    case "<":
      return (factValue as number) < (value as number);
    case "<=":
      return (factValue as number) <= (value as number);
    default:
      return false;
  }
}

export function runAdvisoryEngine(
  rules: AdvisoryRule[],
  facts: WellFacts,
  recentAdviceHistory: { ruleId: string; date: string }[],
  now: Date,
): AdviceItem[] {
  const activeAdvice: AdviceItem[] = [];

  for (const rule of rules) {
    if (!rule.enabled) continue;

    // Check cooldown
    const cooldownMs = rule.cooldown_days * 24 * 60 * 60 * 1000;
    const lastGiven = recentAdviceHistory
      .filter((h) => h.ruleId === rule.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    if (lastGiven && now.getTime() - new Date(lastGiven.date).getTime() < cooldownMs) {
      continue;
    }

    // Evaluate conditions
    let matches = false;
    try {
      matches = evaluateCondition(
        rule.conditions as ConditionNode,
        facts as unknown as Record<string, unknown>,
      );
    } catch {
      matches = false;
    }

    if (matches) {
      activeAdvice.push({
        id: rule.id,
        adviceKey: rule.advice_key,
        priority: rule.priority,
      });
    }
  }

  // Generic fallback if no advice
  if (activeAdvice.length === 0) {
    activeAdvice.push({
      id: "generic_fallback",
      adviceKey: "advice.generic_fallback",
      priority: 0,
    });
  }

  // Sort by priority descending and take top 3
  activeAdvice.sort((a, b) => b.priority - a.priority);
  return activeAdvice.slice(0, 3);
}

export const starterRules: AdvisoryRule[] = [
  {
    id: "critical_stage_low_water",
    version: 1,
    enabled: true,
    priority: 100,
    cooldown_days: 3,
    advice_key: "advice.critical_stage_low_water",
    conditions: {
      all: [
        { fact: "cropWaterSensitivity", operator: "==", value: "high" },
        {
          any: [
            { fact: "stressLevel", operator: "==", value: "warning" },
            { fact: "stressLevel", operator: "==", value: "critical" },
          ],
        },
      ],
    },
  },
  {
    id: "fast_depletion",
    version: 1,
    enabled: true,
    priority: 90,
    cooldown_days: 3,
    advice_key: "advice.fast_depletion",
    conditions: {
      all: [
        { fact: "depthTrend7d", operator: ">", value: 0.5 },
        { fact: "stressLevel", operator: "!=", value: "critical" },
      ],
    },
  },
  {
    id: "recovering_after_rain",
    version: 1,
    enabled: true,
    priority: 80,
    cooldown_days: 3,
    advice_key: "advice.recovering_after_rain",
    conditions: {
      all: [
        { fact: "expectedRainfall", operator: ">", value: 10 },
        { fact: "stressLevel", operator: "!=", value: "critical" },
      ],
    },
  },
  {
    id: "suspect_sensor_data",
    version: 1,
    enabled: true,
    priority: 110,
    cooldown_days: 1,
    advice_key: "advice.suspect_sensor_data",
    conditions: {
      any: [
        { fact: "dataQuality", operator: "==", value: "suspect" },
        { fact: "dataQuality", operator: "==", value: "bad" },
      ],
    },
  },
];
