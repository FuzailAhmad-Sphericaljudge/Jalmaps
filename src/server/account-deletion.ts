import { createRouteHandlerClient } from "@/server/supabase/route-handler";
import { createServiceRoleClient } from "@/server/supabase/service-role";

export type AccountDeletionResult = { status: "deleted" } | { status: "unavailable" };

export async function deleteAccountForUser(userId: string): Promise<AccountDeletionResult> {
  const serviceClient = createServiceRoleClient();
  const { data: auditEvent, error: auditError } = await serviceClient
    .from("audit_log")
    .insert({
      actor_id: userId,
      action: "account.deleted",
      entity_type: "profile",
      entity_id: userId,
      details: { source: "self_service" },
    })
    .select("id")
    .single();
  if (auditError) {
    console.error("Account deletion audit insert failed", auditError.code);
    return { status: "unavailable" };
  }

  const rollbackAuditEvent = async () => {
    const { error } = await serviceClient.from("audit_log").delete().eq("id", auditEvent.id);
    if (error) {
      console.error("Account deletion audit cleanup failed", error.code);
      throw error;
    }
  };

  const authClient = await createRouteHandlerClient();
  const { error: signOutError } = await authClient.auth.signOut();
  if (signOutError) {
    console.error("Account deletion sign-out failed", signOutError.name);
    await rollbackAuditEvent();
    return { status: "unavailable" };
  }

  const { error: deleteError } = await serviceClient.auth.admin.deleteUser(userId);
  if (deleteError) {
    console.error("Account deletion failed", deleteError.name);
    await rollbackAuditEvent();
    return { status: "unavailable" };
  }

  return { status: "deleted" };
}
