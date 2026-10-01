import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TrendArrow } from "./trend-arrow";

describe("TrendArrow", () => {
  it.each(["rising", "falling", "steady"] as const)(
    "renders %s with an icon and a label",
    (direction) => {
      render(<TrendArrow direction={direction} label={`${direction} label`} />);
      const el = screen.getByTitle(`${direction} label`);
      expect(el.querySelector("svg")).not.toBeNull();
      expect(el.getAttribute("data-direction")).toBe(direction);
    },
  );

  it("formats a positive delta with a plus sign", () => {
    render(<TrendArrow direction="rising" label="Rising" delta={0.4} />);
    expect(screen.getByTitle("Rising")).toHaveTextContent("+0.40 m");
  });

  it("formats a negative delta with a minus sign", () => {
    render(<TrendArrow direction="falling" label="Falling" delta={-1.25} />);
    expect(screen.getByTitle("Falling")).toHaveTextContent("-1.25 m");
  });

  it("accepts a custom delta formatter", () => {
    render(
      <TrendArrow
        direction="rising"
        label="Rising"
        delta={0.4}
        formatDelta={(m) => `${(m * 3.28084).toFixed(1)} ft`}
      />,
    );
    expect(screen.getByTitle("Rising")).toHaveTextContent("1.3 ft");
  });
});
