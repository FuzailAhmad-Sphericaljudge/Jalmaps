import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatTile } from "./stat-tile";

describe("StatTile", () => {
  it("renders label, value and unit", () => {
    render(<StatTile label="Water level" value="11.3" unit="m bgl" />);
    expect(screen.getByText("Water level")).toBeInTheDocument();
    expect(screen.getByText("11.3")).toBeInTheDocument();
    expect(screen.getByText("m bgl")).toBeInTheDocument();
  });

  it("shows trend and status with icons plus text", () => {
    render(
      <StatTile
        label="Water level"
        value="11.3"
        unit="m bgl"
        trend="rising"
        trendLabel="Rising vs last week"
        status="good"
        statusLabel="Good"
      />,
    );
    expect(screen.getByTitle("Rising vs last week")).toBeInTheDocument();
    expect(screen.getByText("Good")).toBeInTheDocument();
  });

  it("omits the trend/status row when neither is provided", () => {
    const { container } = render(<StatTile label="Depth" value="42" unit="m" />);
    expect(container.querySelector("[data-direction]")).toBeNull();
    expect(container.querySelector("[data-status]")).toBeNull();
  });
});
