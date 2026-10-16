export interface BaseReportLayoutOptions {
  title: string;
  subtitle: string;
  scopeBadge: string;
  generatedAt: string;
  locale: string;
  qrCodeDataUrl?: string;
  liveUrl?: string;
  contentHtml: string;
}

export function renderBaseReportHtml(options: BaseReportLayoutOptions): string {
  const { title, subtitle, scopeBadge, generatedAt, locale, qrCodeDataUrl, liveUrl, contentHtml } =
    options;

  const dateFormatted = new Date(generatedAt).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} - JalMaps</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;600;700&family=Noto+Sans+Devanagari:wght@400;600;700&family=Noto+Sans+Gujarati:wght@400;600;700&family=Noto+Sans+Gurmukhi:wght@400;600;700&family=Noto+Sans+Kannada:wght@400;600;700&family=Noto+Sans+Malayalam:wght@400;600;700&family=Noto+Sans+Oriya:wght@400;600;700&family=Noto+Sans+Tamil:wght@400;600;700&family=Noto+Sans+Telugu:wght@400;600;700&display=swap');

    @page {
      size: A4 portrait;
      margin: 12mm 15mm 15mm 15mm;
      @bottom-right {
        content: "Page " counter(page) " of " counter(pages);
        font-family: system-ui, sans-serif;
        font-size: 9px;
        color: #94a3b8;
      }
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      font-family: 'Inter', 'Noto Sans Devanagari', 'Noto Sans Gurmukhi', 'Noto Sans Bengali', 'Noto Sans Tamil', 'Noto Sans Telugu', 'Noto Sans Kannada', 'Noto Sans Malayalam', 'Noto Sans Gujarati', 'Noto Sans Oriya', system-ui, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 11px;
      line-height: 1.45;
    }

    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0284c7;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }

    .brand-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-logo {
      width: 36px;
      height: 36px;
      background: #0284c7;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-weight: 800;
      font-size: 18px;
    }

    .brand-title h1 {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      color: #0369a1;
      letter-spacing: -0.01em;
    }

    .brand-title p {
      margin: 2px 0 0 0;
      font-size: 10px;
      color: #64748b;
    }

    .header-meta {
      display: flex;
      align-items: center;
      gap: 14px;
      text-align: right;
    }

    .meta-text {
      font-size: 10px;
      color: #475569;
    }

    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 10px;
      text-transform: uppercase;
      background: #e0f2fe;
      color: #0369a1;
      margin-bottom: 4px;
    }

    .qr-container {
      width: 58px;
      height: 58px;
      padding: 2px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
    }

    .qr-container img {
      width: 100%;
      height: 100%;
      display: block;
    }

    .kpi-strip {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
      gap: 8px;
      margin-bottom: 16px;
    }

    .kpi-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 10px;
      page-break-inside: avoid;
    }

    .kpi-card .kpi-label {
      font-size: 9px;
      color: #64748b;
      font-weight: 500;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .kpi-card .kpi-value {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
    }

    .kpi-card .kpi-sub {
      font-size: 9px;
      color: #94a3b8;
      margin-top: 2px;
    }

    .section-title {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin: 14px 0 8px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      font-size: 10px;
    }

    .data-table th {
      background: #f1f5f9;
      color: #475569;
      font-weight: 600;
      text-align: left;
      padding: 6px 8px;
      border-bottom: 1px solid #cbd5e1;
    }

    .data-table td {
      padding: 5px 8px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
    }

    .data-table tr:nth-child(even) {
      background: #f8fafc;
    }

    .tier-badge {
      display: inline-block;
      padding: 1px 6px;
      border-radius: 3px;
      font-size: 9px;
      font-weight: 600;
    }
    .tier-critical { background: #fee2e2; color: #991b1b; }
    .tier-warning { background: #fef3c7; color: #92400e; }
    .tier-watch { background: #dbeafe; color: #1e40af; }
    .tier-low { background: #dcfce7; color: #166534; }

    .banner-warning {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 6px;
      padding: 10px 12px;
      color: #92400e;
      margin-bottom: 14px;
      page-break-inside: avoid;
    }

    .report-footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      margin-top: 20px;
      display: flex;
      justify-content: space-between;
      color: #94a3b8;
      font-size: 9px;
    }
  </style>
</head>
<body>
  <header class="report-header">
    <div class="brand-section">
      <div class="brand-logo">J</div>
      <div class="brand-title">
        <h1>${title}</h1>
        <p>${subtitle}</p>
      </div>
    </div>
    <div class="header-meta">
      <div class="meta-text">
        <div class="badge">${scopeBadge}</div>
        <div>Generated: ${dateFormatted}</div>
        ${liveUrl ? `<div style="font-size:8px; color:#0284c7;">Scan QR for live telemetric dashboard</div>` : ""}
      </div>
      ${
        qrCodeDataUrl
          ? `<div class="qr-container"><img src="${qrCodeDataUrl}" alt="Live Dashboard QR" /></div>`
          : ""
      }
    </div>
  </header>

  <main>
    ${contentHtml}
  </main>

  <footer class="report-footer">
    <div>JalMaps Groundwater Telemetry & Decision Support • Aligned with CGWB GEC-2015 Norms</div>
    <div>Confidential & Jurisdictional Access Only • Not a statutory water deed</div>
  </footer>
</body>
</html>`;
}
