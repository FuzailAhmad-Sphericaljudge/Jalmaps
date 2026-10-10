"use client";

import { useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { AppLocale } from "@/i18n/config";
import type { Database, Json } from "@/lib/db/types";
import { createBrowserSupabaseClient } from "@/lib/db/client";
import { useRouter } from "@/i18n/navigation";
import { cropIds, type OnboardingInput } from "@/lib/schemas/onboarding";
import { completeOnboarding } from "./actions";

type AreaOption = Pick<
  Database["public"]["Tables"]["admin_areas"]["Row"],
  "id" | "parent_id" | "level" | "names"
>;
type ChildLevel = "district" | "block" | "village";

const cropMessageKeys = {
  rice: "cropRice",
  wheat: "cropWheat",
  cotton: "cropCotton",
  millet: "cropMillet",
  maize: "cropMaize",
  pulses: "cropPulses",
  groundnut: "cropGroundnut",
  sugarcane: "cropSugarcane",
} as const;

function areaLabel(names: Json, locale: AppLocale): string {
  if (typeof names !== "object" || names === null || Array.isArray(names)) return "";
  const localized = names[locale];
  if (typeof localized === "string") return localized;
  const english = names.en;
  return typeof english === "string" ? english : "";
}

export function OnboardingWizard({
  locale,
  states,
  initialLocale,
}: {
  locale: AppLocale;
  states: AreaOption[];
  initialLocale: AppLocale;
}) {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [preferredLocale, setPreferredLocale] = useState<AppLocale>(initialLocale);
  const [preferredUnit, setPreferredUnit] = useState<"m" | "ft">("m");
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedBlock, setSelectedBlock] = useState("");
  const [selectedVillage, setSelectedVillage] = useState("");
  const [districts, setDistricts] = useState<AreaOption[]>([]);
  const [blocks, setBlocks] = useState<AreaOption[]>([]);
  const [villages, setVillages] = useState<AreaOption[]>([]);
  const [crops, setCrops] = useState<OnboardingInput["crops"]>([]);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [isLoadingAreas, setIsLoadingAreas] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const areaRequestId = useRef(0);

  async function loadChildren(parentId: string, level: ChildLevel) {
    const requestId = ++areaRequestId.current;
    setLoadError(false);
    setIsLoadingAreas(true);
    try {
      const { data, error } = await createBrowserSupabaseClient()
        .from("admin_areas")
        .select("id,parent_id,level,names")
        .eq("parent_id", parentId)
        .eq("level", level)
        .order("code");
      if (requestId !== areaRequestId.current) return;
      if (error) {
        setLoadError(true);
        if (level === "district") setDistricts([]);
        if (level === "block") setBlocks([]);
        if (level === "village") setVillages([]);
        return;
      }

      if (level === "district") setDistricts(data);
      if (level === "block") setBlocks(data);
      if (level === "village") setVillages(data);
    } catch (caught) {
      if (!(caught instanceof TypeError)) throw caught;
      if (requestId === areaRequestId.current) setLoadError(true);
    } finally {
      if (requestId === areaRequestId.current) setIsLoadingAreas(false);
    }
  }

  function selectState(id: string) {
    setSelectedState(id);
    setSelectedDistrict("");
    setSelectedBlock("");
    setSelectedVillage("");
    setBlocks([]);
    setVillages([]);
    if (id) void loadChildren(id, "district");
  }

  function selectDistrict(id: string) {
    setSelectedDistrict(id);
    setSelectedBlock("");
    setSelectedVillage("");
    setVillages([]);
    if (id) void loadChildren(id, "block");
  }

  function selectBlock(id: string) {
    setSelectedBlock(id);
    setSelectedVillage("");
    if (id) void loadChildren(id, "village");
  }

  function toggleCrop(crop: OnboardingInput["crops"][number]) {
    setCrops((selected) =>
      selected.includes(crop) ? selected.filter((value) => value !== crop) : [...selected, crop],
    );
  }

  function finishOnboarding() {
    setSaveError(false);
    setIsSaving(true);
    const input: OnboardingInput = {
      locale,
      preferred_locale: preferredLocale,
      preferred_unit: preferredUnit,
      state_id: selectedState,
      district_id: selectedDistrict,
      block_id: selectedBlock,
      village_id: selectedVillage,
      crops,
    };

    void (async () => {
      try {
        const result = await completeOnboarding(input);
        if (result.status !== "saved") {
          setSaveError(true);
          return;
        }
        router.replace("/");
      } catch (caught) {
        if (!(caught instanceof Error)) throw caught;
        setSaveError(true);
      } finally {
        setIsSaving(false);
      }
    })();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < 6) {
      setStep((current) => current + 1);
      return;
    }
    if (crops.length === 0) {
      setSaveError(true);
      return;
    }
    finishOnboarding();
  }

  const questionKeys = [
    "languageQuestion",
    "unitQuestion",
    "stateQuestion",
    "districtQuestion",
    "blockQuestion",
    "villageQuestion",
    "cropsQuestion",
  ] as const;

  return (
    <main id="main" className="mx-auto flex w-full max-w-xl flex-1 items-center px-4 py-8">
      <form className="w-full rounded-2xl border bg-card p-5 shadow-sm sm:p-8" onSubmit={submit}>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("description")}</p>

        <div className="mt-6">
          <label className="text-sm text-muted-foreground" htmlFor="onboarding-progress">
            {t("progress", { current: step + 1, total: questionKeys.length })}
          </label>
          <progress
            id="onboarding-progress"
            className="mt-2 block h-2 w-full accent-primary"
            max={questionKeys.length}
            value={step + 1}
          />
        </div>

        <fieldset className="mt-8 min-h-56">
          <legend className="mb-4 text-xl font-semibold">{t(questionKeys[step]!)}</legend>

          {step === 0 ? (
            <div className="grid gap-3">
              {(["en", "hi"] as const).map((value) => (
                <label
                  key={value}
                  className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-4"
                >
                  <input
                    type="radio"
                    name="preferred-locale"
                    value={value}
                    checked={preferredLocale === value}
                    onChange={() => setPreferredLocale(value)}
                  />
                  {t(value === "en" ? "english" : "hindi")}
                </label>
              ))}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="grid gap-3">
              {(["m", "ft"] as const).map((value) => (
                <label
                  key={value}
                  className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-4"
                >
                  <input
                    type="radio"
                    name="preferred-unit"
                    value={value}
                    checked={preferredUnit === value}
                    onChange={() => setPreferredUnit(value)}
                  />
                  {t(value === "m" ? "metres" : "feet")}
                </label>
              ))}
            </div>
          ) : null}

          {step >= 2 && step <= 5 ? (
            <select
              className="h-12 w-full rounded-md border border-input bg-background px-3 text-base"
              value={
                step === 2
                  ? selectedState
                  : step === 3
                    ? selectedDistrict
                    : step === 4
                      ? selectedBlock
                      : selectedVillage
              }
              onChange={(event) => {
                if (step === 2) selectState(event.target.value);
                if (step === 3) selectDistrict(event.target.value);
                if (step === 4) selectBlock(event.target.value);
                if (step === 5) setSelectedVillage(event.target.value);
              }}
              required
            >
              <option value="">{t("selectPlaceholder")}</option>
              {(step === 2 ? states : step === 3 ? districts : step === 4 ? blocks : villages).map(
                (area) => (
                  <option key={area.id} value={area.id}>
                    {areaLabel(area.names, locale)}
                  </option>
                ),
              )}
            </select>
          ) : null}

          {step === 6 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {cropIds.map((crop) => (
                <label
                  key={crop}
                  className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-4"
                >
                  <input
                    type="checkbox"
                    checked={crops.includes(crop)}
                    onChange={() => toggleCrop(crop)}
                  />
                  {t(cropMessageKeys[crop])}
                </label>
              ))}
            </div>
          ) : null}
        </fieldset>

        <div className="min-h-7 text-sm" aria-live="polite">
          {loadError ? <p className="text-destructive">{t("loadError")}</p> : null}
          {saveError ? (
            <p className="text-destructive">
              {step === 6 && crops.length === 0 ? t("required") : t("saveError")}
            </p>
          ) : null}
        </div>

        <div className="mt-4 flex gap-3">
          {step > 0 ? (
            <Button
              type="button"
              size="touch"
              variant="outline"
              className="flex-1"
              disabled={isSaving}
              onClick={() => setStep((current) => current - 1)}
            >
              {t("back")}
            </Button>
          ) : null}
          <Button
            type="submit"
            size="touch"
            className="flex-1"
            disabled={isSaving || isLoadingAreas || (step >= 2 && step <= 5 && loadError)}
          >
            {isSaving ? t("saving") : step === 6 ? t("save") : t("next")}
          </Button>
        </div>
      </form>
    </main>
  );
}
