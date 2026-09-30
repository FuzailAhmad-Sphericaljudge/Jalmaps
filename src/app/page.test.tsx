import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("Home page", () => {
  it("renders the JalMaps name and one-line description", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", { level: 1, name: /jalmaps/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/groundwater monitoring for india/i)).toBeInTheDocument();
  });
});
