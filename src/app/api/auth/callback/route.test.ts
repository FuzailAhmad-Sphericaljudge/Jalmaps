import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createRouteHandlerClient: vi.fn(),
  exchangeCodeForSession: vi.fn(),
}));

vi.mock("@/server/supabase/route-handler", () => ({
  createRouteHandlerClient: mocks.createRouteHandlerClient,
}));
vi.mock("@/lib/db/public-env", () => ({
  getPublicEnv: () => ({ NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3000" }),
}));

import { GET } from "./route";

describe("GET /api/auth/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.exchangeCodeForSession.mockResolvedValue({ error: null });
    mocks.createRouteHandlerClient.mockResolvedValue({
      auth: { exchangeCodeForSession: mocks.exchangeCodeForSession },
    });
  });

  it("exchanges the email or OAuth code and returns to the requested locale", async () => {
    const response = await GET(
      new Request("http://localhost/api/auth/callback?code=valid-code&locale=hi"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://127.0.0.1:3000/hi/");
    expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith("valid-code");
  });

  it("uses the default locale when the callback locale is invalid", async () => {
    const response = await GET(
      new Request("http://localhost/api/auth/callback?code=valid-code&locale=xx"),
    );

    expect(response.headers.get("location")).toBe("http://127.0.0.1:3000/en/");
  });

  it("returns to login when the code is missing or invalid", async () => {
    const missingCode = await GET(new Request("http://localhost/api/auth/callback?locale=hi"));
    expect(missingCode.headers.get("location")).toBe("http://127.0.0.1:3000/hi/login");
    expect(mocks.exchangeCodeForSession).not.toHaveBeenCalled();

    mocks.exchangeCodeForSession.mockResolvedValue({ error: new Error("invalid code") });
    const invalidCode = await GET(new Request("http://localhost/api/auth/callback?code=expired"));
    expect(invalidCode.headers.get("location")).toBe("http://127.0.0.1:3000/en/login");
  });
});
