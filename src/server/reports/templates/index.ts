import type { ReportData } from "../types";
import { renderWellReportHtml } from "./well-template";
import { renderVillageReportHtml } from "./village-template";
import { renderDistrictReportHtml } from "./district-template";
import { renderSubsidyPlanningReportHtml } from "./subsidy-planning-template";

export {
  renderWellReportHtml,
  renderVillageReportHtml,
  renderDistrictReportHtml,
  renderSubsidyPlanningReportHtml,
};

export function renderReportHtml(data: ReportData): string {
  switch (data.type) {
    case "well":
      return renderWellReportHtml(data);
    case "village":
      return renderVillageReportHtml(data);
    case "district":
      return renderDistrictReportHtml(data);
    case "subsidy_planning":
      return renderSubsidyPlanningReportHtml(data);
    default: {
      const _exhaustiveCheck: never = data;
      throw new Error(`Unsupported report type: ${JSON.stringify(_exhaustiveCheck)}`);
    }
  }
}
