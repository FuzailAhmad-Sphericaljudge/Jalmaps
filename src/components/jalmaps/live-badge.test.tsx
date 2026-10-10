import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { LiveBadge } from "./live-badge";
import { NextIntlClientProvider } from "next-intl";

function renderWithIntl(ui: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={{}}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("LiveBadge", () => {
  it("renders live state", () => {
    renderWithIntl(<LiveBadge state="live" />);
    expect(screen.getByText("live")).toBeInTheDocument();
  });

  it("renders connecting state", () => {
    renderWithIntl(<LiveBadge state="connecting" />);
    expect(screen.getByText("connecting")).toBeInTheDocument();
  });

  it("renders offline state", () => {
    renderWithIntl(<LiveBadge state="offline" />);
    expect(screen.getByText("offline")).toBeInTheDocument();
  });
});
