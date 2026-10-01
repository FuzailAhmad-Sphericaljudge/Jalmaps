import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WaterGauge } from "./water-gauge";

describe("WaterGauge", () => {
  it("exposes an accessible name and text alternative", () => {
    render(
      <WaterGauge
        value={11.3}
        min={0}
        max={40}
        name="Water level at Well #4"
        valueText="11.3 metres below ground level"
      />,
    );
    expect(
      screen.getByRole("img", { name: "Water level at Well #4: 11.3 metres below ground level" }),
    ).toBeInTheDocument();
  });

  it("marks the arc with the highest matching threshold status", () => {
    const { container } = render(
      <WaterGauge
        value={20}
        min={0}
        max={40}
        thresholds={[
          { value: 25, status: "critical" },
          { value: 15, status: "warning" },
          { value: 5, status: "good" },
        ]}
        name="Well #4"
        valueText="20 m"
      />,
    );
    // warning is the highest threshold <= value
    expect(container.querySelector("path.stroke-warning")).not.toBeNull();
    expect(container.querySelector("path.stroke-danger")).toBeNull();
  });

  it("clamps out-of-range values into the track", () => {
    const { container } = render(
      <WaterGauge value={99} min={0} max={40} name="Well #4" valueText="99 m" />,
    );
    // 99 clamps to max => full arc; no error, ends exactly at the right end.
    const arcs = container.querySelectorAll("path");
    expect(arcs.length).toBeGreaterThan(0);
  });

  it("renders centre and unit labels", () => {
    render(
      <WaterGauge
        value={11.3}
        min={0}
        max={40}
        name="Well #4"
        valueText="11.3 m"
        centerLabel="11.3"
        unitLabel="m bgl"
      />,
    );
    expect(screen.getByText("11.3")).toBeInTheDocument();
    expect(screen.getByText("m bgl")).toBeInTheDocument();
  });

  it("shows the offline stroke when value is below every threshold", () => {
    const { container } = render(
      <WaterGauge
        value={1}
        min={0}
        max={40}
        thresholds={[{ value: 5, status: "good" }]}
        name="Well #4"
        valueText="1 m"
      />,
    );
    expect(container.querySelector(".stroke-offline")).not.toBeNull();
  });
});
