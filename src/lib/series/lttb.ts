export interface DataPoint {
  x: number;
  y: number | null;
}

/**
 * Largest Triangle Three Buckets (LTTB) downsampling algorithm.
 * @param data Array of contiguous DataPoints (no gaps)
 * @param threshold Max number of points to keep
 * @returns Downsampled array
 */
function lttbSingle<T extends DataPoint>(data: T[], threshold: number): T[] {
  const dataLength = data.length;
  if (threshold >= dataLength || threshold <= 2) return data; // Nothing to do

  const sampled: T[] = [];
  const every = (dataLength - 2) / (threshold - 2);
  let a = 0; // Initially a is the first point in the triangle

  sampled.push(data[a]); // Always add the first point

  for (let i = 0; i < threshold - 2; i++) {
    // Calculate point average for next bucket (min, max)
    let avgX = 0;
    let avgY = 0;
    let avgRangeStart = Math.floor((i + 1) * every) + 1;
    let avgRangeEnd = Math.floor((i + 2) * every) + 1;
    avgRangeEnd = avgRangeEnd < dataLength ? avgRangeEnd : dataLength;

    const avgRangeLength = avgRangeEnd - avgRangeStart;

    for (; avgRangeStart < avgRangeEnd; avgRangeStart++) {
      avgX += data[avgRangeStart].x;
      avgY += data[avgRangeStart].y!; // assumed not null
    }
    avgX /= avgRangeLength;
    avgY /= avgRangeLength;

    // Get the range for this bucket
    let rangeOffs = Math.floor((i + 0) * every) + 1;
    const rangeTo = Math.floor((i + 1) * every) + 1;

    // Point a
    const pointAX = data[a].x;
    const pointAY = data[a].y!; // assumed not null

    let maxArea = -1;
    let area = -1;
    let maxAreaPoint = -1;

    for (; rangeOffs < rangeTo; rangeOffs++) {
      // Calculate triangle area over three buckets
      area =
        Math.abs(
          (pointAX - avgX) * (data[rangeOffs].y! - pointAY) -
            (pointAX - data[rangeOffs].x) * (avgY - pointAY),
        ) * 0.5;
      if (area > maxArea) {
        maxArea = area;
        maxAreaPoint = rangeOffs;
      }
    }

    if (maxAreaPoint !== -1) {
      sampled.push(data[maxAreaPoint]);
      a = maxAreaPoint;
    }
  }

  sampled.push(data[dataLength - 1]); // Always add last
  return sampled;
}

/**
 * Downsample time-series data using LTTB, while preserving gaps.
 * Missing data (represented by `y: null` or an x-delta > maxGap) will not be interpolated.
 *
 * @param data Array of time-series data
 * @param threshold Target maximum points (approximate, due to gaps)
 * @param maxGap Max gap on the x-axis before considered missing data
 */
export function downsampleWithGaps<T extends DataPoint>(
  data: T[],
  threshold: number,
  maxGap: number,
): T[] {
  if (data.length === 0) return [];

  // 1. Split into segments separated by gaps or nulls
  const segments: T[][] = [];
  let currentSegment: T[] = [];

  for (let i = 0; i < data.length; i++) {
    const point = data[i];
    if (point.y === null) {
      if (currentSegment.length > 0) {
        segments.push(currentSegment);
        currentSegment = [];
      }
      continue;
    }

    if (currentSegment.length > 0) {
      const prev = currentSegment[currentSegment.length - 1];
      if (point.x - prev.x > maxGap) {
        segments.push(currentSegment);
        currentSegment = [];
      }
    }

    currentSegment.push(point);
  }

  if (currentSegment.length > 0) {
    segments.push(currentSegment);
  }

  if (segments.length === 0) return [];

  // Calculate total non-null points
  const totalPoints = segments.reduce((sum, seg) => sum + seg.length, 0);

  // Downsample each segment proportionally
  const result: T[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    const segmentThreshold = Math.max(2, Math.floor((segment.length / totalPoints) * threshold));

    if (segment.length <= segmentThreshold) {
      result.push(...segment);
    } else {
      result.push(...lttbSingle(segment, segmentThreshold));
    }

    // Insert a null gap between segments to prevent Recharts from connecting them
    if (i < segments.length - 1) {
      result.push({
        ...segment[segment.length - 1],
        x: segment[segment.length - 1].x + maxGap / 2, // arbitrary midpoint for the gap
        y: null,
      } as unknown as T);
    }
  }

  return result;
}
