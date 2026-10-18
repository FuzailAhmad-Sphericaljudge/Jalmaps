import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MapMarker } from "./map-marker";

describe("MapMarker", () => {
  it("renders a cluster marker with count badge and correct aria label", () => {
    const onClick = vi.fn();
    render(<MapMarker status="critical" isCluster={true} count={15} onClick={onClick} />);

    const button = screen.getByRole("button", {
      name: "Cluster of 15 wells, worst status critical",
    });
    expect(button).toBeDefined();
    expect(screen.getByText("15")).toBeDefined();

    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders critical marker with hexagon clip-path and alert icon", () => {
    render(<MapMarker status="critical" name="Kisan Borewell" />);
    const button = screen.getByRole("button", {
      name: "Well: Kisan Borewell, status critical",
    });
    expect(button.className).toContain("clip-path");
    expect(button.className).toContain("bg-red-600");
  });

  it("renders warning marker with diamond shape", () => {
    render(<MapMarker status="warning" name="North Well" />);
    const button = screen.getByRole("button", {
      name: "Well: North Well, status warning",
    });
    expect(button.className).toContain("bg-amber-500");
  });

  it("renders normal marker as rounded-full circle", () => {
    render(<MapMarker status="normal" name="Main Open Well" />);
    const button = screen.getByRole("button", {
      name: "Well: Main Open Well, status normal",
    });
    expect(button.className).toContain("rounded-full");
    expect(button.className).toContain("bg-emerald-600");
  });

  it("enforces minimum 48px touch target on all markers", () => {
    const { container } = render(<MapMarker status="normal" />);
    const button = container.querySelector("button");
    expect(button?.className).toContain("min-h-[48px]");
    expect(button?.className).toContain("min-w-[48px]");
  });
});
