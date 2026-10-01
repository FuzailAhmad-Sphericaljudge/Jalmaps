"use server";

import { createServiceRoleClient } from "@/server/supabase/service-role";
import { createServerComponentClient } from "@/server/supabase/server-component";
import { requireAuthenticatedUser } from "@/server/auth";
import { onboardingSchema } from "@/lib/schemas/onboarding";
import { isAppLocale } from "@/i18n/config";

type OnboardingActionResult = { status: "saved" } | { status: "invalid" };

export async function completeOnboarding(input: unknown): Promise<OnboardingActionResult> {
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    console.error(
      "Onboarding payload rejected",
      parsed.error.issues.map(({ path, code }) => ({ path, code })),
    );
    return { status: "invalid" };
  }
  if (!isAppLocale(parsed.data.locale)) return { status: "invalid" };

  const current = await requireAuthenticatedUser(parsed.data.locale);
  if (!current.profile) {
    throw new Error("Authenticated user profile is missing.");
  }

  const areaIds = [
    parsed.data.state_id,
    parsed.data.district_id,
    parsed.data.block_id,
    parsed.data.village_id,
  ];
  const authenticatedClient = await createServerComponentClient();
  const { data: areas, error: areaError } = await authenticatedClient
    .from("admin_areas")
    .select("id,parent_id,level")
    .in("id", areaIds);
  if (areaError) throw areaError;

  const state = areas.find((area) => area.id === parsed.data.state_id);
  const district = areas.find((area) => area.id === parsed.data.district_id);
  const block = areas.find((area) => area.id === parsed.data.block_id);
  const village = areas.find((area) => area.id === parsed.data.village_id);
  if (areas.length !== areaIds.length || !state || !district || !block || !village) {
    console.error("Onboarding area hierarchy rejected", {
      returnedAreas: areas.length,
      stateFound: Boolean(state),
      districtFound: Boolean(district),
      blockFound: Boolean(block),
      villageFound: Boolean(village),
    });
    return { status: "invalid" };
  }
  if (
    state.level !== "state" ||
    district.level !== "district" ||
    district.parent_id !== state.id ||
    block.level !== "block" ||
    block.parent_id !== district.id ||
    village.level !== "village" ||
    village.parent_id !== block.id
  ) {
    console.error("Onboarding area hierarchy rejected", {
      stateLevel: state.level,
      districtLevel: district.level,
      blockLevel: block.level,
      villageLevel: village.level,
      districtMatchesState: district.parent_id === state.id,
      blockMatchesDistrict: block.parent_id === district.id,
      villageMatchesBlock: village.parent_id === block.id,
    });
    return { status: "invalid" };
  }

  const serviceClient = createServiceRoleClient();
  const { data, error } = await serviceClient
    .from("profiles")
    .update({
      preferred_locale: parsed.data.preferred_locale,
      preferred_unit: parsed.data.preferred_unit,
      admin_area_id: village.id,
      crops: parsed.data.crops,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", current.user.id)
    .select("id")
    .single();
  if (error) {
    console.error("Onboarding profile update failed", error.code);
    throw error;
  }
  if (!data) throw new Error("Onboarding update did not return the updated profile.");

  return { status: "saved" };
}
