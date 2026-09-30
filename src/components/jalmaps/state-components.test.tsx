import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EmptyState, ErrorState, LoadingSkeleton, LoadingState } from "./state-components";

describe("EmptyState", () => {
  it("renders title, description and an optional action", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <EmptyState
        title="No wells yet"
        description="Add your first well to see water levels."
        action={{ label: "Add well", onClick }}
      />,
    );

    expect(screen.getByText("No wells yet")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add well" }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe("ErrorState", () => {
  it("renders an error message with a retry action", () => {
    render(
      <ErrorState
        title="Could not load level"
        description="Check your internet connection."
        action={{ label: "Try again", onClick: () => undefined }}
      />,
    );
    expect(screen.getByText("Could not load level")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});

describe("LoadingState", () => {
  it("announces loading with role=status and the given label", () => {
    render(<LoadingState label="Loading water level" />);
    expect(screen.getByRole("status", { name: "Loading water level" })).toBeInTheDocument();
  });
});

describe("LoadingSkeleton", () => {
  it("renders an accessible skeleton placeholder", () => {
    render(<LoadingSkeleton label="Loading levels" />);
    expect(screen.getByRole("status", { name: "Loading levels" })).toBeInTheDocument();
  });
});
