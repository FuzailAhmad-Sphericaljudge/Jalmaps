import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LogoMark, Wordmark } from "./logo";

describe("LogoMark", () => {
  it("is decorative by default (hidden from assistive tech)", () => {
    const { container } = render(<LogoMark />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("becomes a named image when a title is passed", () => {
    render(<LogoMark title="JalMaps home" />);
    expect(screen.getByRole("img", { name: "JalMaps home" })).toBeInTheDocument();
  });
});

describe("Wordmark", () => {
  it("renders the wordmark text next to the mark", () => {
    render(<Wordmark />);
    expect(screen.getByText("JalMaps")).toBeInTheDocument();
  });

  it("accepts custom wordmark text", () => {
    render(<Wordmark text="जलमैप्स" />);
    expect(screen.getByText("जलमैप्स")).toBeInTheDocument();
  });
});
