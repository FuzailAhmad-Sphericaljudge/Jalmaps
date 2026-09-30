import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusPill } from "./status-pill";

describe("StatusPill", () => {
  it.each(["good", "warning", "critical", "offline"] as const)(
    "renders %s with icon and label",
    (status) => {
      render(<StatusPill status={status} label={`${status} label`} />);
      const pill = screen.getByText(`${status} label`).closest("span[data-status]");
      expect(pill).not.toBeNull();
      expect(pill!.querySelector("svg")).not.toBeNull(); // icon always present
      expect(pill).toHaveAttribute("data-status", status);
    },
  );

  it("hides the decorative icon from assistive tech (text carries meaning)", () => {
    render(<StatusPill status="good" label="Water level good" />);
    const icon = screen.getByText("Water level good").previousElementSibling;
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });
});
