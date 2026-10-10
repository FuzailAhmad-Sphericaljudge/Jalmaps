import { getTranslations } from "next-intl/server";
import { createServerComponentClient } from "@/server/supabase/server-component";

interface HistoryStatsProps {
  wellId: string;
}

export async function HistoryStats({ wellId }: HistoryStatsProps) {
  const t = await getTranslations("history.stats");
  const tUnit = await getTranslations("history.unit");
  const supabase = await createServerComponentClient();

  // eslint-disable-next-line react-hooks/purity
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Get nodes
  const { data: nodes } = await supabase.from("nodes").select("id").eq("well_id", wellId);
  const nodeIds = nodes?.map((n) => n.id) || [];

  let minDepth = 0;
  let maxDepth = 0;
  let avgDepth = 0;
  let netChange = 0;

  if (nodeIds.length > 0) {
    const { data: readings } = await supabase
      .from("readings")
      .select("depth_to_water_m")
      .in("node_id", nodeIds)
      .gte("recorded_at", thirtyDaysAgo)
      .order("recorded_at", { ascending: true });

    if (readings && readings.length > 0) {
      const validReadings = readings
        .map((r) => r.depth_to_water_m)
        .filter((val): val is number => val !== null);

      if (validReadings.length > 0) {
        minDepth = Math.min(...validReadings);
        maxDepth = Math.max(...validReadings);
        avgDepth = validReadings.reduce((acc, val) => acc + val, 0) / validReadings.length;
        netChange = validReadings[validReadings.length - 1]! - validReadings[0]!;
      }
    }
  }

  const isRising = netChange > 0;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground">{t("min")}</p>
        <p className="text-2xl font-bold">{`${minDepth.toFixed(1)} ${tUnit("m")}`}</p>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground">{t("max")}</p>
        <p className="text-2xl font-bold">{`${maxDepth.toFixed(1)} ${tUnit("m")}`}</p>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground">{t("avg")}</p>
        <p className="text-2xl font-bold">{`${avgDepth.toFixed(1)} ${tUnit("m")}`}</p>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground">{t("netChange")}</p>
        <p className="text-2xl font-bold">
          {`${isRising ? "+" : ""}${netChange.toFixed(1)} ${tUnit("m")}`}
        </p>
      </div>
      <div className="col-span-full rounded-lg border bg-card bg-primary/10 p-4">
        <p className="text-sm font-medium">
          {t("summary", {
            change: Math.abs(netChange).toFixed(1),
            direction: isRising ? "rose" : "fell",
            days: 30,
          })}
        </p>
      </div>
    </div>
  );
}
