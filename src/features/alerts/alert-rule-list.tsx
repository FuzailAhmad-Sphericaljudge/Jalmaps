"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { AlertRuleSimulator } from "./alert-rule-simulator";

export function AlertRuleList({
  wellId,
  rules,
  unit,
}: {
  wellId: string;
  rules: Record<string, unknown>[];
  unit: "m" | "ft";
}) {
  const t = useTranslations("alerts");

  // Example state for a simple rule editor
  const [editingRule, setEditingRule] = useState<Record<string, unknown> | null>(null);

  if (editingRule) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => setEditingRule(null)}>
          {t("rules.back")}
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>{t(`ruleTypes.${editingRule.rule_type as string}`)}</CardTitle>
            <CardDescription>{t("rules.editDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Form fields based on rule_type */}
            {editingRule.rule_type === "level_below" && (
              <div className="space-y-2">
                <label htmlFor="threshold" className="text-sm leading-none font-medium">
                  {t("rules.threshold")} {`(${unit})`}
                </label>
                <Input
                  id="threshold"
                  type="number"
                  defaultValue={
                    (editingRule.params as Record<string, unknown>)?.threshold_m as number
                  }
                />
              </div>
            )}

            <AlertRuleSimulator wellId={wellId} rule={editingRule} />

            <Button>{t("rules.save")}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {rules.map((rule) => (
        <Card key={rule.id as string}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t(`ruleTypes.${rule.rule_type as string}`)}
            </CardTitle>
            <Switch checked={rule.enabled as boolean} />
          </CardHeader>
          <CardContent>
            <div className="mb-4 text-xs text-muted-foreground">{JSON.stringify(rule.params)}</div>
            <Button variant="secondary" size="sm" onClick={() => setEditingRule(rule)}>
              {t("rules.edit")}
            </Button>
          </CardContent>
        </Card>
      ))}
      {rules.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          {t("rules.empty")}
        </div>
      )}
    </div>
  );
}
