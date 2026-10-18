import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useOnlineStatus } from "./use-online-status";

function OnlineStatusProbe() {
  const isOnline = useOnlineStatus();
  return <span>{isOnline ? "online" : "offline"}</span>;
}

describe("useOnlineStatus", () => {
  it("tracks browser online and offline events and cleans up listeners", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    vi.stubGlobal("navigator", { onLine: true });
    const { unmount } = render(<OnlineStatusProbe />);
    expect(screen.getByText("online")).toBeInTheDocument();

    act(() => {
      vi.stubGlobal("navigator", { onLine: false });
      window.dispatchEvent(new Event("offline"));
    });
    expect(screen.getByText("offline")).toBeInTheDocument();

    act(() => {
      vi.stubGlobal("navigator", { onLine: true });
      window.dispatchEvent(new Event("online"));
    });
    expect(screen.getByText("online")).toBeInTheDocument();

    unmount();
    expect(remove).toHaveBeenCalledWith("online", expect.any(Function));
    expect(remove).toHaveBeenCalledWith("offline", expect.any(Function));
    add.mockRestore();
    remove.mockRestore();
    vi.unstubAllGlobals();
  });
});
