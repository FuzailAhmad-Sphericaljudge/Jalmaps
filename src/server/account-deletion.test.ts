import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createRouteHandlerClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
  deleteAudit: vi.fn(),
  deleteUser: vi.fn(),
  insertAudit: vi.fn(),
  signOut: vi.fn(),
  auditError: null as { code: string } | null,
}));

vi.mock("@/server/supabase/route-handler", () => ({
  createRouteHandlerClient: mocks.createRouteHandlerClient,
}));
vi.mock("@/server/supabase/service-role", () => ({
  createServiceRoleClient: mocks.createServiceRoleClient,
}));

import { deleteAccountForUser } from "./account-deletion";

const userId = "c5d376a5-2005-4f49-80ec-8fecfd987c60";

describe("deleteAccountForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auditError = null;
    mocks.insertAudit.mockImplementation(() => ({
      select: () => ({
        single: () => Promise.resolve({ data: { id: 42 }, error: mocks.auditError }),
      }),
    }));
    mocks.deleteAudit.mockResolvedValue({ error: null });
    mocks.signOut.mockResolvedValue({ error: null });
    mocks.deleteUser.mockResolvedValue({ error: null });
    mocks.createServiceRoleClient.mockReturnValue({
      from: () => ({
        insert: mocks.insertAudit,
        delete: () => ({ eq: mocks.deleteAudit }),
      }),
      auth: { admin: { deleteUser: mocks.deleteUser } },
    });
    mocks.createRouteHandlerClient.mockResolvedValue({
      auth: { signOut: mocks.signOut },
    });
  });

  it("audits, signs out, then deletes only the requested Auth user", async () => {
    await expect(deleteAccountForUser(userId)).resolves.toEqual({ status: "deleted" });

    expect(mocks.insertAudit).toHaveBeenCalledWith({
      actor_id: userId,
      action: "account.deleted",
      entity_type: "profile",
      entity_id: userId,
      details: { source: "self_service" },
    });
    expect(Math.min(...mocks.signOut.mock.invocationCallOrder)).toBeLessThan(
      Math.min(...mocks.deleteUser.mock.invocationCallOrder),
    );
    expect(mocks.deleteUser).toHaveBeenCalledWith(userId);
  });

  it("does not sign out when it cannot write the audit event", async () => {
    mocks.auditError = { code: "XX000" };

    await expect(deleteAccountForUser(userId)).resolves.toEqual({ status: "unavailable" });

    expect(mocks.signOut).not.toHaveBeenCalled();
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });

  it("removes the audit event when Auth deletion fails", async () => {
    mocks.deleteUser.mockResolvedValue({ error: new Error("provider details") });

    await expect(deleteAccountForUser(userId)).resolves.toEqual({ status: "unavailable" });

    expect(mocks.deleteAudit).toHaveBeenCalledWith("id", 42);
  });

  it("surfaces audit cleanup errors rather than swallowing them", async () => {
    mocks.deleteUser.mockResolvedValue({ error: new Error("provider details") });
    mocks.deleteAudit.mockResolvedValue({ error: { code: "XX000" } });

    await expect(deleteAccountForUser(userId)).rejects.toMatchObject({ code: "XX000" });
  });
});
