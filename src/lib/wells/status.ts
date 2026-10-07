export function getNodeConnectionState(
  node: { last_seen_at: string | null; status: string; range_m: number | null },
  now: Date = new Date(),
): "online" | "offline" | "never_reported" {
  if (!node.last_seen_at) {
    return "never_reported";
  }
  const lastSeen = new Date(node.last_seen_at);
  const diffSeconds = (now.getTime() - lastSeen.getTime()) / 1000;

  // 3600 seconds = 1 hour (2x 30min default reporting interval)
  if (diffSeconds <= 3600) {
    return "online";
  }

  return "offline";
}
