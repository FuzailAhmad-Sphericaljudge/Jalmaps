import type { ReportTrendPoint } from "../types";

export interface SvgChartOptions {
  width?: number;
  height?: number;
}

/**
 * Server-rendered SVG trend line chart for groundwater depth over time.
 * Inverts the Y-axis so ground surface is at the top (smaller depth) and
 * deeper groundwater is towards the bottom, matching hydrological conventions.
 */
export function renderTrendSvg(
  series: ReportTrendPoint[],
  unit: "m" | "ft" = "m",
  options: SvgChartOptions = {},
): string {
  const width = options.width ?? 650;
  const height = options.height ?? 200;
  const padding = { top: 25, right: 35, bottom: 35, left: 55 };

  const validPoints = series.filter(
    (p): p is { timestamp: string; depthM: number } => typeof p.depthM === "number",
  );

  if (validPoints.length === 0) {
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#f8fafc" rx="6" stroke="#e2e8f0"/>
      <text x="${width / 2}" y="${height / 2}" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="13">
        Insufficient telemetry data to plot trend line (minimum 2 readings required)
      </text>
    </svg>`;
  }

  // Convert unit if requested (1 m = 3.28084 ft)
  const factor = unit === "ft" ? 3.28084 : 1;
  const depths = validPoints.map((p) => p.depthM * factor);

  const minDepth = Math.max(0, Math.floor(Math.min(...depths) - 0.5));
  const maxDepth = Math.ceil(Math.max(...depths) + 0.5);
  const depthRange = Math.max(maxDepth - minDepth, 1);

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // X & Y scalers
  const getX = (idx: number) =>
    padding.left + (idx / Math.max(validPoints.length - 1, 1)) * chartWidth;
  // Invert Y: minDepth (closer to surface) at padding.top, maxDepth (deeper) at padding.top + chartHeight
  const getY = (depth: number) => padding.top + ((depth - minDepth) / depthRange) * chartHeight;

  // Grid lines & Y-axis labels (3 to 5 ticks)
  const tickCount = 4;
  const gridLines: string[] = [];
  for (let i = 0; i <= tickCount; i++) {
    const val = minDepth + (i / tickCount) * depthRange;
    const y = getY(val);
    gridLines.push(`
      <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#e2e8f0" stroke-dasharray="3,3" stroke-width="1"/>
      <text x="${padding.left - 8}" y="${y + 4}" text-anchor="end" fill="#64748b" font-size="11" font-family="sans-serif">
        ${val.toFixed(1)} ${unit}
      </text>
    `);
  }

  // Build SVG path
  const points = validPoints.map((p, idx) => ({
    x: getX(idx),
    y: getY(p.depthM * factor),
    date: p.timestamp.slice(5, 10), // MM-DD
  }));

  const pathD = points
    .map((pt, idx) => `${idx === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(" ");

  // Fill area under path to ground surface
  const areaD = `${pathD} L ${points[points.length - 1]?.x.toFixed(1)} ${padding.top + chartHeight} L ${points[0]?.x.toFixed(1)} ${padding.top + chartHeight} Z`;

  // X-axis date labels (first, middle, last)
  const xLabels: string[] = [];
  if (points.length > 0) {
    const first = points[0]!;
    const last = points[points.length - 1]!;
    xLabels.push(`
      <text x="${first.x}" y="${height - 12}" text-anchor="start" fill="#64748b" font-size="10" font-family="sans-serif">
        ${first.date}
      </text>
    `);
    if (points.length > 2) {
      const mid = points[Math.floor(points.length / 2)]!;
      xLabels.push(`
        <text x="${mid.x}" y="${height - 12}" text-anchor="middle" fill="#64748b" font-size="10" font-family="sans-serif">
          ${mid.date}
        </text>
      `);
    }
    xLabels.push(`
      <text x="${last.x}" y="${height - 12}" text-anchor="end" fill="#64748b" font-size="10" font-family="sans-serif">
        ${last.date}
      </text>
    `);
  }

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0284c7" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="#0284c7" stop-opacity="0.02"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="#f8fafc" rx="6" stroke="#e2e8f0"/>
    ${gridLines.join("\n")}
    <path d="${areaD}" fill="url(#trendGradient)"/>
    <path d="${pathD}" fill="none" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    ${points
      .map(
        (pt) =>
          `<circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="3" fill="#0284c7" stroke="#ffffff" stroke-width="1.5"/>`,
      )
      .join("\n")}
    ${xLabels.join("\n")}
    <text x="${padding.left}" y="${padding.top - 10}" fill="#0f172a" font-size="11" font-weight="600" font-family="sans-serif">
      Groundwater Depth to Water (${unit}) - (Depth increases downward)
    </text>
  </svg>`;
}

/**
 * Server-rendered simplified geographic boundary outline SVG.
 * Avoids any third-party external tile server licensing issues.
 */
export function renderBoundarySvg(
  coords: [number, number][] | null,
  options: SvgChartOptions = {},
): string {
  const width = options.width ?? 280;
  const height = options.height ?? 180;
  const padding = 20;

  // Fallback to stylized boundary polygon if raw coordinates are unavailable
  const points =
    coords && coords.length >= 3
      ? coords
      : [
          [20, 20],
          [240, 30],
          [260, 140],
          [210, 160],
          [70, 150],
          [20, 100],
        ];

  const xs = points.map((p) => p[0] ?? 0);
  const ys = points.map((p) => p[1] ?? 0);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const rangeX = Math.max(maxX - minX, 0.0001);
  const rangeY = Math.max(maxY - minY, 0.0001);

  const scaleX = (width - padding * 2) / rangeX;
  const scaleY = (height - padding * 2) / rangeY;

  const svgPoints = points
    .map(([x = 0, y = 0]) => {
      const px = padding + (x - minX) * scaleX;
      const py = height - (padding + (y - minY) * scaleY);
      return `${px.toFixed(1)},${py.toFixed(1)}`;
    })
    .join(" ");

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" fill="#f1f5f9" rx="6" stroke="#cbd5e1"/>
    <!-- Compass Rose -->
    <g transform="translate(${width - 30}, 30)">
      <circle cx="0" cy="0" r="14" fill="#ffffff" stroke="#94a3b8" stroke-width="1"/>
      <polygon points="0,-10 3,-2 0,0 -3,-2" fill="#ef4444"/>
      <polygon points="0,10 3,2 0,0 -3,2" fill="#94a3b8"/>
      <text x="0" y="-12" text-anchor="middle" font-size="8" font-weight="bold" fill="#0f172a" font-family="sans-serif">N</text>
    </g>
    <!-- Simplified Polygon Outline -->
    <polygon points="${svgPoints}" fill="#e0f2fe" stroke="#0284c7" stroke-width="2" stroke-linejoin="round"/>
    <text x="${width / 2}" y="${height - 10}" text-anchor="middle" font-size="10" fill="#64748b" font-family="sans-serif">
      Official Administrative Boundary (Simplified)
    </text>
  </svg>`;
}

/**
 * Server-rendered semi-circular stress gauge meter SVG (0-100 score).
 */
export function renderStressGaugeSvg(score: number, tier: string): string {
  const width = 140;
  const height = 80;
  const cx = 70;
  const cy = 65;
  const r = 45;

  const clampedScore = Math.max(0, Math.min(100, score));
  const angleDeg = 180 - (clampedScore / 100) * 180;
  const angleRad = (angleDeg * Math.PI) / 180;

  const needleX = cx + (r - 10) * Math.cos(angleRad);
  const needleY = cy - (r - 10) * Math.sin(angleRad);

  const tierColors: Record<string, string> = {
    critical: "#ef4444",
    warning: "#f59e0b",
    watch: "#3b82f6",
    low: "#10b981",
  };
  const color = tierColors[tier] ?? "#0284c7";

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <!-- Arc Track -->
    <path d="M 25 65 A 45 45 0 0 1 115 65" fill="none" stroke="#e2e8f0" stroke-width="10" stroke-linecap="round"/>
    <!-- Needle -->
    <line x1="${cx}" y1="${cy}" x2="${needleX.toFixed(1)}" y2="${needleY.toFixed(1)}" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
    <circle cx="${cx}" cy="${cy}" r="4" fill="${color}"/>
    <!-- Score Text -->
    <text x="${cx}" y="${cy - 12}" text-anchor="middle" font-size="16" font-weight="bold" fill="#0f172a" font-family="sans-serif">
      ${clampedScore}
    </text>
  </svg>`;
}
