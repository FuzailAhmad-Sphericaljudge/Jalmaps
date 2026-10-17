import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  deleteAccountForUser: vi.fn(),
  getCurrentUser: vi.fn(),
}));

vi.mock("@/server/auth", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/server/account-deletion", () => ({
  deleteAccountForUser: mocks.deleteAccountForUser,
}));

import { DELETE } from "./route";

const userId = "c5d376a5-2005-4f49-80ec-8fecfd987c60";

function deleteRequest(body: unknown) {
  return new Request("http://localhost/api/account/delete", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("DELETE /api/account/delete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentUser.mockResolvedValue({ user: { id: userId }, profile: {} });
    mocks.deleteAccountForUser.mockResolvedValue({ status: "deleted" });
  });

  it("requires an explicit confirmation", async () => {
    const response = await DELETE(deleteRequest({ confirm: false }));

    expect(response.status).toBe(400);
    expect(mocks.deleteAccountForUser).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated delete requests", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    const response = await DELETE(deleteRequest({ confirm: true }));

    expect(response.status).toBe(401);
    expect(mocks.deleteAccountForUser).not.toHaveBeenCalled();
  });

  it("delegates deletion for only the authenticated user", async () => {
    const response = await DELETE(deleteRequest({ confirm: true }));

    expect(response.status).toBe(204);
    expect(mocks.deleteAccountForUser).toHaveBeenCalledWith(userId);
  });

  it("returns a generic service error when deletion is unavailable", async () => {
    mocks.deleteAccountForUser.mockResolvedValue({ status: "unavailable" });

    const response = await DELETE(deleteRequest({ confirm: true }));

    expect(response.status).toBe(503);
  });
});
