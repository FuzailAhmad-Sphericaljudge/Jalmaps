import { render } from "@testing-library/react";
import { describe, it } from "vitest";

import { expectNoAxeViolations } from "@/test/a11y";
import { ThemeProvider } from "@/components/theme/theme-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import { LogoMark, Wordmark } from "./logo";
import { StatTile } from "./stat-tile";
import { StatusPill } from "./status-pill";
import { TrendArrow } from "./trend-arrow";
import { EmptyState, ErrorState, LoadingState } from "./state-components";
import { WaterGauge } from "./water-gauge";
import { WellTank } from "./well-tank";

/** Render inside ThemeProvider with the .dark class toggled for dark-theme scans. */
function renderThemed(ui: React.ReactElement, theme: "light" | "dark") {
  document.documentElement.classList.toggle("dark", theme === "dark");
  return render(<ThemeProvider initialTheme={theme}>{ui}</ThemeProvider>);
}

const gallery = (
  <>
    <div>
      <Button size="touch">Save</Button>
      <Button variant="outline" size="touch" aria-label="Refresh">
        ⟳
      </Button>
      <Badge>New</Badge>
    </div>
    <Card>
      <CardHeader>
        <CardTitle>Well #4</CardTitle>
      </CardHeader>
      <CardContent>
        <Input aria-label="Well name" />
        <Skeleton statusLabel="Loading levels" className="h-6 w-40" />
      </CardContent>
    </Card>
    <StatTile
      label="Water level"
      value="11.3"
      unit="m bgl"
      trend="rising"
      trendLabel="Rising"
      status="good"
      statusLabel="Good"
    />
    <StatusPill status="critical" label="Critical" />
    <TrendArrow direction="falling" label="Falling" />
    <WaterGauge
      value={11.3}
      min={0}
      max={40}
      name="Well #4"
      valueText="11.3 m"
      centerLabel="11.3"
      unitLabel="m bgl"
    />
    <WellTank fillRatio={0.6} status="good" name="Well #4" valueText="11.3 m bgl" />
    <EmptyState title="No wells yet" description="Add your first well." />
    <ErrorState title="Could not load" action={{ label: "Try again", onClick: () => undefined }} />
    <LoadingState label="Loading water level" />
    <LogoMark title="JalMaps" />
    <Wordmark />
  </>
);

describe("a11y: JalMaps component gallery (axe)", () => {
  it.each(["light", "dark"] as const)("has no violations in %s theme", async (theme) => {
    const rendered = renderThemed(gallery, theme);
    await expectNoAxeViolations(rendered);
    rendered.unmount();
    document.documentElement.classList.remove("dark");
  });
});
