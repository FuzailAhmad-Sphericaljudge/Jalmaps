import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/db/types";
import { requireDatabaseData } from "@/server/db/errors";
import { safeNodeColumns, type SafeNode } from "@/server/db/nodes";

type ExportWell = Pick<
  Database["public"]["Tables"]["wells"]["Row"],
  | "id"
  | "owner_id"
  | "admin_area_id"
  | "name"
  | "well_type"
  | "latitude"
  | "longitude"
  | "total_depth_m"
  | "installed_at"
  | "status"
  | "visibility"
  | "notes"
  | "created_at"
  | "updated_at"
>;

type ExportReading = Pick<
  Database["public"]["Tables"]["readings"]["Row"],
  | "id"
  | "node_id"
  | "recorded_at"
  | "received_at"
  | "column_m"
  | "depth_to_water_m"
  | "current_ma"
  | "battery_v"
  | "rssi"
  | "quality"
  | "raw"
>;

type ExportAlertRule = Pick<
  Database["public"]["Tables"]["alert_rules"]["Row"],
  | "id"
  | "created_by"
  | "well_id"
  | "admin_area_id"
  | "metric"
  | "operator"
  | "threshold"
  | "severity"
  | "enabled"
  | "channels"
  | "cooldown_minutes"
  | "created_at"
  | "updated_at"
>;

type ExportAlert = Pick<
  Database["public"]["Tables"]["alerts"]["Row"],
  | "id"
  | "rule_id"
  | "well_id"
  | "node_id"
  | "metric"
  | "severity"
  | "status"
  | "message_key"
  | "details"
  | "triggered_at"
  | "acknowledged_at"
  | "acknowledged_by"
  | "resolved_at"
  | "created_at"
  | "updated_at"
>;

type ExportNotificationPreference = Database["public"]["Tables"]["notification_prefs"]["Row"];

type ExportApiKey = Pick<
  Database["public"]["Tables"]["api_keys"]["Row"],
  | "id"
  | "profile_id"
  | "label"
  | "scopes"
  | "requests_per_minute"
  | "requests_per_day"
  | "last_used_at"
  | "expires_at"
  | "revoked_at"
  | "created_at"
>;

export type AccountExportData = {
  wells: ExportWell[];
  nodes: SafeNode[];
  readings: ExportReading[];
  alert_rules: ExportAlertRule[];
  alerts: ExportAlert[];
  notification_preferences: ExportNotificationPreference[];
  api_keys: ExportApiKey[];
};

const pageSize = 500;
const idBatchSize = 100;

async function collectPages<T>(
  loadPage: (
    start: number,
    end: number,
  ) => PromiseLike<{ data: T[] | null; error: PostgrestError | null }>,
  operation: string,
): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await loadPage(offset, offset + pageSize - 1);
    const page: T[] = requireDatabaseData(data, error, operation);
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

export async function getAccountExportData(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<AccountExportData> {
  const wells = await collectPages<ExportWell>(
    (start, end) =>
      client
        .from("wells")
        .select(
          "id,owner_id,admin_area_id,name,well_type,latitude,longitude,total_depth_m,installed_at,status,visibility,notes,created_at,updated_at",
        )
        .eq("owner_id", userId)
        .order("created_at")
        .order("id")
        .range(start, end),
    "export account wells",
  );
  const wellIds = wells.map((well) => well.id);

  const nodes: SafeNode[] = [];
  for (let start = 0; start < wellIds.length; start += idBatchSize) {
    const wellIdBatch = wellIds.slice(start, start + idBatchSize);
    nodes.push(
      ...(await collectPages<SafeNode>(
        (pageStart, pageEnd) =>
          client
            .from("nodes")
            .select(safeNodeColumns)
            .in("well_id", wellIdBatch)
            .order("created_at")
            .order("id")
            .range(pageStart, pageEnd),
        "export account nodes",
      )),
    );
  }

  const nodeIds = nodes.map((node) => node.id);
  const readings: ExportReading[] = [];
  for (let start = 0; start < nodeIds.length; start += idBatchSize) {
    const nodeIdBatch = nodeIds.slice(start, start + idBatchSize);
    readings.push(
      ...(await collectPages<ExportReading>(
        (pageStart, pageEnd) =>
          client
            .from("readings")
            .select(
              "id,node_id,recorded_at,received_at,column_m,depth_to_water_m,current_ma,battery_v,rssi,quality,raw",
            )
            .in("node_id", nodeIdBatch)
            .order("recorded_at")
            .order("id")
            .range(pageStart, pageEnd),
        "export account readings",
      )),
    );
  }

  const alertRules = await collectPages<ExportAlertRule>(
    (start, end) =>
      client
        .from("alert_rules")
        .select(
          "id,created_by,well_id,admin_area_id,metric,operator,threshold,severity,enabled,channels,cooldown_minutes,created_at,updated_at",
        )
        .eq("created_by", userId)
        .order("created_at")
        .order("id")
        .range(start, end),
    "export account alert rules",
  );

  const alerts: ExportAlert[] = [];
  for (let start = 0; start < wellIds.length; start += idBatchSize) {
    const wellIdBatch = wellIds.slice(start, start + idBatchSize);
    alerts.push(
      ...(await collectPages<ExportAlert>(
        (pageStart, pageEnd) =>
          client
            .from("alerts")
            .select(
              "id,rule_id,well_id,node_id,metric,severity,status,message_key,details,triggered_at,acknowledged_at,acknowledged_by,resolved_at,created_at,updated_at",
            )
            .in("well_id", wellIdBatch)
            .order("triggered_at")
            .order("id")
            .range(pageStart, pageEnd),
        "export account alerts",
      )),
    );
  }

  const notificationPreferences = await collectPages<ExportNotificationPreference>(
    (start, end) =>
      client
        .from("notification_prefs")
        .select("id,profile_id,channel,enabled,destination,created_at,updated_at")
        .eq("profile_id", userId)
        .order("created_at")
        .order("id")
        .range(start, end),
    "export account notification preferences",
  );

  const apiKeys = await collectPages<ExportApiKey>(
    (start, end) =>
      client
        .from("api_keys")
        .select(
          "id,profile_id,label,scopes,requests_per_minute,requests_per_day,last_used_at,expires_at,revoked_at,created_at",
        )
        .eq("profile_id", userId)
        .order("created_at")
        .order("id")
        .range(start, end),
    "export account API keys",
  );

  return {
    wells,
    nodes,
    readings,
    alert_rules: alertRules,
    alerts,
    notification_preferences: notificationPreferences,
    api_keys: apiKeys,
  };
}
