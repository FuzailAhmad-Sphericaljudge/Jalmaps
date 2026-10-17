import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import accountMessages from "../../../i18n/messages/en/account.json";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

import { DeleteAccountButton } from "./delete-account-button";

describe("DeleteAccountButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("requires confirmation in an accessible dialog before sending the delete request", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    render(
      <NextIntlClientProvider locale="en" messages={{ account: accountMessages }}>
        <DeleteAccountButton />
      </NextIntlClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Delete my account" }));
    const dialog = screen.getByRole("dialog", { name: "Delete your account?" });
    expect(dialog).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();

    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Delete my account" }),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/account/delete",
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(mocks.replace).toHaveBeenCalledWith("/login");
  });
});
