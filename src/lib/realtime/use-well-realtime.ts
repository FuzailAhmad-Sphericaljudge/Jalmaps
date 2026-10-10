import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RealtimeManager, ConnectionState, RealtimeReading } from "./manager";

export function useWellRealtime(wellId: string) {
  const queryClient = useQueryClient();
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");
  const bufferRef = useRef<RealtimeReading[]>([]);
  const flushTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const manager = RealtimeManager.getInstance();

    const handleReading = (reading: RealtimeReading) => {
      // Buffer the incoming reading
      bufferRef.current.push(reading);

      // Throttle UI updates to at most once per second
      if (!flushTimeoutRef.current) {
        flushTimeoutRef.current = setTimeout(() => {
          flushBuffer();
        }, 1000);
      }
    };

    const flushBuffer = () => {
      flushTimeoutRef.current = null;
      if (bufferRef.current.length === 0) return;

      const readingsToProcess = [...bufferRef.current];
      bufferRef.current = [];

      // Sort by recorded_at just in case
      readingsToProcess.sort(
        (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
      );

      // Extract the latest reading
      const latestReading = readingsToProcess[readingsToProcess.length - 1];

      // Update the latest reading cache (if you have one)
      queryClient.setQueryData(["latest_reading", wellId], (old: RealtimeReading | undefined) => {
        if (!old) return latestReading;
        return new Date(latestReading.recorded_at) > new Date(old.recorded_at)
          ? latestReading
          : old;
      });

      // Update series caches
      // Because there could be multiple range presets, we need to get all "series" keys for this well
      queryClient.setQueriesData({ queryKey: ["series", wellId] }, (oldData: unknown) => {
        if (!oldData || !Array.isArray(oldData)) return oldData;

        const newData = [...oldData];
        for (const reading of readingsToProcess) {
          // Find if point already exists in the series
          const idx = newData.findIndex((p) => p.bucket_time === reading.recorded_at);

          const newPoint = {
            bucket_time: reading.recorded_at,
            avg_depth: reading.depth_to_water_m,
            min_depth: reading.depth_to_water_m,
            max_depth: reading.depth_to_water_m,
            reading_count: 1,
            band:
              reading.depth_to_water_m !== null
                ? [reading.depth_to_water_m, reading.depth_to_water_m]
                : null,
          };

          if (idx >= 0) {
            // Update existing
            newData[idx] = newPoint;
          } else {
            // Push and sort
            newData.push(newPoint);
          }
        }

        newData.sort(
          (a, b) => new Date(a.bucket_time).getTime() - new Date(b.bucket_time).getTime(),
        );
        return newData;
      });
    };

    const unsubscribe = manager.subscribe(wellId, handleReading, setConnectionState);

    return () => {
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current);
      }
      unsubscribe();
    };
  }, [wellId, queryClient]);

  return { connectionState };
}
