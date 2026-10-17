import { useQueries } from "@tanstack/react-query";
import type { TimeRangePreset } from "./ranges";
import { getRangePreset } from "./ranges";
import type { SeriesQueryData } from "./use-series";

export function useCompareSeries(wellIds: string[], range: TimeRangePreset) {
  const { from, to } = getRangePreset(range);

  return useQueries({
    queries: wellIds.map((wellId) => ({
      queryKey: ["series", wellId, range],
      queryFn: async (): Promise<{ wellId: string; data: SeriesQueryData[] }> => {
        const searchParams = new URLSearchParams({
          from: from.toISOString(),
          to: to.toISOString(),
        });
        const res = await fetch(`/api/v1/wells/${wellId}/series?${searchParams.toString()}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch series data for well ${wellId}`);
        }
        const json = await res.json();
        return {
          wellId,
          data: json.map((d: SeriesQueryData) => ({
            ...d,
            band: d.min_depth !== null && d.max_depth !== null ? [d.min_depth, d.max_depth] : null,
          })),
        };
      },
    })),
  });
}
