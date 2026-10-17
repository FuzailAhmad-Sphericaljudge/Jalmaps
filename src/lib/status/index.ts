type Reading = { recorded_at: string | null; quality?: "good" | "suspect" | "bad" | null };

export type WellStatus = "online" | "stale" | "offline" | "fault" | "empty";

export function classifyWellStatus(
  node?: { status: string } | null,
  latestReading?: Reading | null,
  nowMs: number = Date.now(),
): WellStatus {
  if (!node) return "empty";
  if (node.status === "fault") return "fault";
  if (node.status === "offline") return "offline";
  if (!latestReading || !latestReading.recorded_at) return "empty";

  const recordedAtMs = new Date(latestReading.recorded_at).getTime();
  const hoursSinceLastReading = (nowMs - recordedAtMs) / (1000 * 60 * 60);

  if (hoursSinceLastReading > 24) {
    return "stale";
  }

  if (latestReading.quality === "bad") {
    return "fault";
  }

  return "online";
}
