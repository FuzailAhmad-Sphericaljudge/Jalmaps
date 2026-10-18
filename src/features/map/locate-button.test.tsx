import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LocateButton } from "./locate-button";

describe("LocateButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls navigator.geolocation and triggers onLocationFound on success", () => {
    const onLocationFound = vi.fn();
    const mockGetCurrentPosition = vi.fn().mockImplementation((success) => {
      success({
        coords: {
          latitude: 28.5,
          longitude: 77.2,
          accuracy: 25,
        },
      });
    });

    // @ts-expect-error Mocking navigator geolocation
    global.navigator.geolocation = {
      getCurrentPosition: mockGetCurrentPosition,
    };

    render(<LocateButton onLocationFound={onLocationFound} />);
    const button = screen.getByRole("button", { name: "Locate me on map" });

    fireEvent.click(button);

    expect(mockGetCurrentPosition).toHaveBeenCalledOnce();
    expect(onLocationFound).toHaveBeenCalledWith({
      lat: 28.5,
      lng: 77.2,
      accuracy: 25,
    });
  });

  it("handles geolocation error gracefully and calls onError", () => {
    const onError = vi.fn();
    const mockGetCurrentPosition = vi.fn().mockImplementation((_success, error) => {
      error({
        code: 1, // PERMISSION_DENIED
        message: "User denied Geolocation",
      });
    });

    // @ts-expect-error Mocking navigator geolocation
    global.navigator.geolocation = {
      getCurrentPosition: mockGetCurrentPosition,
    };

    render(<LocateButton onLocationFound={vi.fn()} onError={onError} />);
    const button = screen.getByRole("button", { name: "Locate me on map" });

    fireEvent.click(button);

    expect(onError).toHaveBeenCalledWith("Location permission was denied.");
  });
});
