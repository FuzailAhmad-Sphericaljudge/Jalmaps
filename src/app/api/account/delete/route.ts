import { z } from "zod";

import { deleteAccountForUser } from "@/server/account-deletion";
import { getCurrentUser } from "@/server/auth";

const confirmationSchema = z.object({ confirm: z.literal(true) }).strict();

export async function DELETE(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch (caught) {
    if (caught instanceof SyntaxError || caught instanceof TypeError) {
      return Response.json({ error: "invalid_request" }, { status: 400 });
    }
    throw caught;
  }

  if (!confirmationSchema.safeParse(body).success) {
    return Response.json({ error: "confirmation_required" }, { status: 400 });
  }

  const current = await getCurrentUser();
  if (!current) return Response.json({ error: "unauthorized" }, { status: 401 });

  const result = await deleteAccountForUser(current.user.id);
  if (result.status === "unavailable") {
    return Response.json({ error: "account_delete_unavailable" }, { status: 503 });
  }

  return new Response(null, { status: 204 });
}
