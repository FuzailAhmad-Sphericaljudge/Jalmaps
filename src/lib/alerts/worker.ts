import { createClient } from "@supabase/supabase-js";
import { evaluateLevelBelow, evaluateDropRate, evaluateNoData, evaluateLowBattery, evaluateSensorFault } from "./rules";
import { transitionAlertState } from "./state";
import type { AlertContext, AlertRuleType, EvaluatorFunction } from "./types";
import { getEnv } from "@/lib/env";
import { queueAlertNotifications } from "@/lib/notifications/queue";

const getEvaluator = (type: AlertRuleType): EvaluatorFunction => {
  switch (type) {
    case "level_below": return evaluateLevelBelow;
    case "drop_rate": return evaluateDropRate;
    case "no_data": return evaluateNoData;
    case "low_battery": return evaluateLowBattery;
    case "sensor_fault": return evaluateSensorFault;
    default: throw new Error(`Unknown rule type: ${type}`);
  }
};

export const evaluateWell = async (wellId: string, now: Date = new Date()) => {
  const env = getEnv();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  // 1. Load context
  const { data: well } = await supabase.from("wells").select("*").eq("id", wellId).single();
  const { data: node } = await supabase.from("nodes").select("*").eq("well_id", wellId).single();
  
  // Need recent readings, let's say last 7 days
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: readings } = await supabase
    .from("readings")
    .select("*")
    .eq("well_id", wellId)
    .gte("recorded_at", sevenDaysAgo)
    .order("recorded_at", { ascending: false });

  // 2. Load rules
  const { data: rules } = await supabase
    .from("alert_rules")
    .select("*")
    .eq("well_id", wellId)
    .eq("enabled", true);

  if (!well || !rules || rules.length === 0) return;

  // 3. Evaluate each rule
  for (const rule of rules) {
    const { data: previousAlerts } = await supabase
      .from("alerts")
      .select("*")
      .eq("rule_id", rule.id)
      .eq("well_id", wellId)
      .neq("status", "resolved")
      .order("created_at", { ascending: false })
      .limit(1);

    const previousAlert = previousAlerts?.[0];

    const context: AlertContext = {
      well,
      node: node || {},
      readings: readings || [],
      now,
      previousAlert
    };

    const evaluator = getEvaluator(rule.rule_type);
    const result = evaluator(rule.params, context);

    if (result.triggered && !previousAlert) {
      // Create new alert
      const dedupe_key = `${rule.rule_type}_${wellId}_${now.getTime()}`; // simplistic dedupe for now
      const { data: newAlert } = await supabase.from("alerts").insert({
        rule_id: rule.id,
        well_id: wellId,
        node_id: node?.id,
        severity: result.severity || rule.severity,
        message_key: `alerts.${rule.rule_type}`,
        payload: result.payload || {},
        dedupe_key
      }).select().single();

      if (newAlert) {
        await supabase.from("alert_events").insert({
          alert_id: newAlert.id,
          new_status: "open",
          reason: "Evaluator triggered"
        });
        await queueAlertNotifications(newAlert, "opened");
      }
    } else if (!result.triggered && result.shouldResolve && previousAlert) {
      // Auto-resolve
      const transition = transitionAlertState(previousAlert.status, "resolve_auto");
      if (transition.success) {
        const { data: updatedAlert } = await supabase.from("alerts").update({
          status: transition.newStatus,
          resolved_at: now.toISOString(),
          resolved_reason: transition.resolvedReason,
        }).eq("id", previousAlert.id).select().single();

        await supabase.from("alert_events").insert({
          alert_id: previousAlert.id,
          previous_status: previousAlert.status,
          new_status: transition.newStatus,
          reason: transition.reason
        });
        if (updatedAlert) {
          await queueAlertNotifications(updatedAlert, "resolved");
        }
      }
    }
  }
};

