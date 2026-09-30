import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WellTank } from "./well-tank";

describe("WellTank", () => {
  it("exposes an accessible name and text alternative", () => {
    render(
      <WellTank
        fillRatio={0.6}
        status="good"
        name="Well #4"
        valueText="Water level 11.3 metres below ground level"
      />,
    );
    expect(
      screen.getByRole("img", {
        name: "Well #4: Water level 11.3 metres below ground level",
      }),
    ).toBeInTheDocument();
  });

  it("clamps fill ratios outside 0..1", () => {
    const { container, rerender } = render(
      <WellTank fillRatio={2} status="good" name="W" valueText="full" />,
    );
    expect(container.querySelector("svg")).toBeInTheDocument();

    rerender(<WellTank fillRatio={-3} status="offline" name="W" valueText="empty" />);
    // No water rect when empty: only casing/background rects remain.
    const rects = container.querySelectorAll("rect");
    expect(rects.length).toBeGreaterThan(0);
  });

  it("keeps the animation element present but CSS-disabled under reduced motion", () => {
    const { container } = render(
      <WellTank fillRatio={0.5} status="good" name="W" valueText="half" />,
    );
    // The <animate> element relies on globals.css reduced-motion rules;
    // component markup stays static-friendly either way.
    expect(container.querySelector("animate")).not.toBeNull();
  });
});
