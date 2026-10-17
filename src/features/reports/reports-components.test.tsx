import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { expectNoAxeViolations } from "@/test/a11y";
import { ReportHistoryTable } from "./ReportHistoryTable";
import { ScheduledDigestsCard } from "./ScheduledDigestsCard";
import { ReportGenerationModal } from "./ReportGenerationModal";
import { ShareLinkModal } from "./ShareLinkModal";
import reportsMessages from "@/i18n/messages/en/reports.json";
import commonMessages from "@/i18n/messages/en/common.json";
import type { ReportRow, ScheduleRow } from "@/server/reports/actions";

// Mock server actions called in client components
vi.mock("@/server/reports/actions", () => ({
  generateReportAction: vi.fn(),
  getReportDownloadUrlAction: vi.fn(),
  deleteReportAction: vi.fn(),
  createReportShareAction: vi.fn().mockResolvedValue({
    success: true,
    share: {
      token: "tok12345",
      shareUrl: "https://jalmaps.in/share/tok12345",
      expiresAt: "2026-11-15T00:00:00Z",
    },
  }),
  revokeReportShareAction: vi.fn().mockResolvedValue({ success: true }),
  getActiveShareAction: vi.fn().mockResolvedValue({
    success: true,
    share: {
      id: "share-1",
      expiresAt: "2026-11-15T00:00:00Z",
      accessCount: 4,
      revokedAt: null,
    },
  }),
  saveReportScheduleAction: vi.fn(),
  deleteReportScheduleAction: vi.fn(),
}));

function renderWithIntl(ui: React.ReactNode) {
  return render(
    <NextIntlClientProvider
      locale="en"
      messages={{ reports: reportsMessages, common: commonMessages }}
      timeZone="Asia/Kolkata"
    >
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("ReportHistoryTable", () => {
  it("renders empty state when there are no reports", () => {
    renderWithIntl(
      <ReportHistoryTable reports={[]} onDownload={vi.fn()} onShare={vi.fn()} onDelete={vi.fn()} />,
    );

    expect(
      screen.getByText(
        "No reports generated yet. Click Generate Report to create your first report.",
      ),
    ).toBeInTheDocument();
  });

  it("renders report rows with type, format, and status badges", () => {
    const mockReports: ReportRow[] = [
      {
        id: "rep-1",
        type: "village",
        format: "pdf",
        scope: { villageName: "Khed Shivapur" },
        params: {},
        status: "done",
        storage_path: "user/rep-1.pdf",
        created_by: "user-1",
        created_at: "2026-10-16T10:00:00Z",
        completed_at: "2026-10-16T10:01:00Z",
        expires_at: "2026-11-15T10:00:00Z",
        error: null,
        retry_count: 0,
        file_size_bytes: 42000,
      },
      {
        id: "rep-2",
        type: "district",
        format: "csv",
        scope: { districtName: "Pune" },
        params: {},
        status: "running",
        storage_path: null,
        created_by: "user-1",
        created_at: "2026-10-16T11:00:00Z",
        completed_at: null,
        expires_at: "2026-11-15T11:00:00Z",
        error: null,
        retry_count: 0,
        file_size_bytes: null,
      },
    ];

    const onDownload = vi.fn();
    const onShare = vi.fn();
    const onDelete = vi.fn();

    renderWithIntl(
      <ReportHistoryTable
        reports={mockReports}
        onDownload={onDownload}
        onShare={onShare}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText("Village Overview Report")).toBeInTheDocument();
    expect(screen.getByText("District Groundwater Summary")).toBeInTheDocument();
    expect(screen.getByText("Khed Shivapur")).toBeInTheDocument();
    expect(screen.getByText("Pune")).toBeInTheDocument();
    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(screen.getByText("Processing")).toBeInTheDocument();

    const downloadButtons = screen.getAllByRole("button", { name: "Download" });
    expect(downloadButtons).toHaveLength(1);
    fireEvent.click(downloadButtons[0]!);
    expect(onDownload).toHaveBeenCalledWith(mockReports[0]);

    const shareButtons = screen.getAllByRole("button", { name: "Share Link" });
    expect(shareButtons).toHaveLength(1);
    fireEvent.click(shareButtons[0]!);
    expect(onShare).toHaveBeenCalledWith(mockReports[0]);
  });
});

describe("ScheduledDigestsCard", () => {
  it("renders empty schedules notice when none are scheduled", () => {
    renderWithIntl(<ScheduledDigestsCard initialSchedules={[]} locale="en" />);

    expect(screen.getByText("Scheduled Digests")).toBeInTheDocument();
    expect(screen.getByText("No scheduled digests configured.")).toBeInTheDocument();
  });

  it("renders existing schedules with frequency and channel badges", () => {
    const mockSchedules: ScheduleRow[] = [
      {
        id: "sch-1",
        user_id: "user-1",
        type: "village",
        scope: { villageId: "vil-1" },
        cadence: "weekly",
        day_of_week: 1,
        day_of_month: 1,
        time_utc: "04:00",
        locale: "en",
        channel: "email",
        active: true,
        last_run_at: null,
        created_at: "2026-10-16T10:00:00Z",
        updated_at: "2026-10-16T10:00:00Z",
      },
    ];

    renderWithIntl(<ScheduledDigestsCard initialSchedules={mockSchedules} locale="en" />);

    expect(screen.getAllByText("Weekly (Every Monday)").length).toBeGreaterThan(0);
    expect(screen.getByText("weekly")).toBeInTheDocument();
    expect(screen.getByText("email")).toBeInTheDocument();
  });
});

describe("ReportGenerationModal", () => {
  it("renders modal form with report types and format options", () => {
    renderWithIntl(
      <ReportGenerationModal
        isOpen={true}
        onClose={vi.fn()}
        defaultType="village"
        defaultScope={{ villageId: "vil-1", name: "Khed Shivapur" }}
        locale="en"
      />,
    );

    expect(screen.getByText("Generate Report")).toBeInTheDocument();
    expect(screen.getByText("Preview Summary")).toBeInTheDocument();
    expect(screen.getByText("Confirm & Generate")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Khed Shivapur")).toBeInTheDocument();
  });
});

describe("ShareLinkModal", () => {
  it("loads and displays active share link with access count", async () => {
    renderWithIntl(<ShareLinkModal isOpen={true} onClose={vi.fn()} reportId="rep-1" />);

    expect(screen.getByText("Share Report Link")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Anyone with this link can view the report. Link expires automatically in 30 days.",
      ),
    ).toBeInTheDocument();

    const viewsText = await screen.findByText("Views: 4");
    expect(viewsText).toBeInTheDocument();
    expect(screen.getByText("Revoke Link")).toBeInTheDocument();
  });
});

describe("Accessibility (axe)", () => {
  it("ReportHistoryTable has zero axe violations", async () => {
    const rendered = renderWithIntl(
      <ReportHistoryTable reports={[]} onDownload={vi.fn()} onShare={vi.fn()} onDelete={vi.fn()} />,
    );
    await expectNoAxeViolations(rendered);
  });

  it("ScheduledDigestsCard has zero axe violations", async () => {
    const rendered = renderWithIntl(<ScheduledDigestsCard initialSchedules={[]} locale="en" />);
    await expectNoAxeViolations(rendered);
  });
});
