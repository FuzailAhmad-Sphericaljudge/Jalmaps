import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./button";

describe("Button", () => {
  it("renders with an accessible name from its text content", () => {
    render(<Button>Save report</Button>);
    expect(screen.getByRole("button", { name: "Save report" })).toBeInTheDocument();
  });

  it("fires onClick", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Tap</Button>);
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("is disabled when the disabled attribute is set", () => {
    render(<Button disabled>Locked</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("applies the touch size class (48px target)", () => {
    render(<Button size="touch">Big button</Button>);
    expect(screen.getByRole("button").className).toContain("h-12");
  });

  it("applies the icon-touch size class (48px square)", () => {
    render(
      <Button size="icon-touch" aria-label="Open menu">
        <span />
      </Button>,
    );
    expect(screen.getByRole("button", { name: "Open menu" }).className).toContain("size-12");
  });
});
