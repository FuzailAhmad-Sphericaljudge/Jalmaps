import { useQuery } from "@tanstack/react-query";
import type { TimeRangePreset } from "./ranges";
import { getRangePreset } from "./ranges";
import type { DataPoint } from "./lttb";

export interface SeriesQueryData extends DataPoint {
  avg_depth: number | null;
  min_depth: number | null;
  max_depth: number | null;
  reading_count: number;
  band?: [number, number] | null;
}

export function useSeries(wellId: string, range: TimeRangePreset) {
  const { from, to } = getRangePreset(range);

  return useQuery({
    queryKey: ["series", wellId, range],
    queryFn: async (): Promise<SeriesQueryData[]> => {
      const searchParams = new URLSearchParams({
        from: from.toISOString(),
        to: to.toISOString(),
      });
      const res = await fetch(`/api/v1/wells/${wellId}/series?${searchParams.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to fetch series data");
      }
      const json = await res.json();
      return json.map((d: SeriesQueryData) => ({
        ...d,
        band: d.min_depth !== null && d.max_depth !== null ? [d.min_depth, d.max_depth] : null,
      }));
    },
  });
}
