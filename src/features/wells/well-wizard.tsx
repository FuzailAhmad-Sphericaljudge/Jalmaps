"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Check, ChevronLeft, ChevronRight, Loader2, MapPin, Camera, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/config";
import type { WellCreateInput } from "@/lib/schemas/wells";
import { createWellAction } from "@/app/[locale]/(app)/farmer/wells/actions";
import { createBrowserSupabaseClient } from "@/lib/db/client";
import { compressAndStripExif } from "@/lib/image-upload";

type WizardData = Partial<WellCreateInput> & {
  photos: File[];
  total_depth_ui: string;
};

export function WellWizard({
  locale,
  defaultAdminAreaId,
  ownerId,
  unitPreference,
}: {
  locale: AppLocale;
  defaultAdminAreaId: string;
  ownerId: string;
  unitPreference: "m" | "ft";
}) {
  const t = useTranslations("wells");
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [data, setData] = useState<WizardData>({
    admin_area_id: defaultAdminAreaId,
    owner_id: ownerId,
    well_type: "borewell",
    name: "",
    total_depth_ui: "",
    photos: [],
  });

  const updateData = (updates: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...updates }));
    setError("");
  };

  const handleNext = () => {
    if (step === 1) {
      if (!data.name?.trim()) {
        setError(t("wizard.namePlaceholder"));
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!data.latitude || !data.longitude) {
        setError(t("wizard.locationError"));
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleBack = () => setStep((s) => s - 1);

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError(t("wizard.locationError"));
      return;
    }
    updateData({ latitude: undefined, longitude: undefined });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateData({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (err) => {
        console.error(err);
        setError(t("wizard.locationError"));
      },
      { enableHighAccuracy: true },
    );
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    if (data.photos.length + files.length > 3) {
      setError("Max 3 photos");
      return;
    }

    updateData({ photos: [...data.photos, ...files] });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...data.photos];
    newPhotos.splice(index, 1);
    updateData({ photos: newPhotos });
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      let total_depth_m: number | undefined;
      if (data.total_depth_ui) {
        const val = parseFloat(data.total_depth_ui);
        if (!isNaN(val) && val > 0) {
          total_depth_m = unitPreference === "ft" ? val / 3.28084 : val;
        }
      }

      const payload: WellCreateInput = {
        name: data.name!,
        well_type: data.well_type!,
        latitude: data.latitude!,
        longitude: data.longitude!,
        admin_area_id: data.admin_area_id!,
        owner_id: data.owner_id,
        total_depth_m,
        status: "active",
        visibility: "private",
      };

      const result = await createWellAction(locale, payload);

      if (result.status !== "ok") {
        setError(result.message);
        setIsSubmitting(false);
        return;
      }

      if (data.photos.length > 0) {
        const supabase = createBrowserSupabaseClient();
        for (const file of data.photos) {
          try {
            const blob = await compressAndStripExif(file);
            const ext =
              file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
            const filename = `${result.wellId}/${crypto.randomUUID()}.${ext}`;
            await supabase.storage.from("well-photos").upload(filename, blob, {
              contentType: file.type || "image/jpeg",
              cacheControl: "3600",
              upsert: false,
            });
          } catch (err) {
            console.error("Photo upload failed", err);
          }
        }
      }

      router.push(`/app/farmer/wells/${result.wellId}`);
    } catch (err) {
      console.error(err);
      setError("Failed to save");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6 py-6">
      <div className="mb-8 flex items-center gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full ${step >= i ? "bg-primary" : "bg-muted"}`}
          />
        ))}
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
      )}

      {step === 1 && (
        <div className="animate-in space-y-6 slide-in-from-right-4">
          <div>
            <h2 className="mb-2 text-xl font-bold">{t("wizard.step1")}</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label
                className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                htmlFor="well_name"
              >
                {t("wizard.name")}
              </label>
              <Input
                id="well_name"
                value={data.name}
                onChange={(e) => updateData({ name: e.target.value })}
                placeholder={t("wizard.namePlaceholder")}
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                htmlFor="well_type"
              >
                {t("wizard.wellType")}
              </label>
              <Select
                value={data.well_type}
                onValueChange={(val: WellCreateInput["well_type"]) =>
                  updateData({ well_type: val })
                }
              >
                <SelectTrigger id="well_type" className="h-12 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="borewell">{t("wellTypes.borewell")}</SelectItem>
                  <SelectItem value="open_well">{t("wellTypes.open_well")}</SelectItem>
                  <SelectItem value="tank">{t("wellTypes.tank")}</SelectItem>
                  <SelectItem value="pond">{t("wellTypes.pond")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label
                className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                htmlFor="total_depth"
              >
                {t("wizard.totalDepth")}
                {" (" + unitPreference + ")"}
              </label>
              <Input
                id="total_depth"
                type="number"
                inputMode="decimal"
                value={data.total_depth_ui}
                onChange={(e) => updateData({ total_depth_ui: e.target.value })}
                placeholder="0.0"
                className="h-12 text-base"
              />
            </div>
          </div>

          <Button className="h-12 w-full" onClick={handleNext}>
            {t("wizard.next")} <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="animate-in space-y-6 slide-in-from-right-4">
          <div>
            <h2 className="mb-2 text-xl font-bold">{t("wizard.step2")}</h2>
          </div>

          <div className="space-y-4">
            <Button
              variant="outline"
              className="h-14 w-full border-primary/20 text-primary hover:bg-primary/5"
              onClick={getLocation}
            >
              <MapPin className="mr-2 h-5 w-5" />
              {t("wizard.useLocation")}
            </Button>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  htmlFor="lat"
                >
                  {t("wizard.latitude")}
                </label>
                <Input
                  id="lat"
                  type="number"
                  value={data.latitude || ""}
                  onChange={(e) => updateData({ latitude: parseFloat(e.target.value) })}
                  className="h-12 text-base"
                />
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  htmlFor="lng"
                >
                  {t("wizard.longitude")}
                </label>
                <Input
                  id="lng"
                  type="number"
                  value={data.longitude || ""}
                  onChange={(e) => updateData({ longitude: parseFloat(e.target.value) })}
                  className="h-12 text-base"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="h-12 w-12 shrink-0" onClick={handleBack}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button className="h-12 flex-1" onClick={handleNext}>
              {t("wizard.next")} <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="animate-in space-y-6 slide-in-from-right-4">
          <div>
            <h2 className="mb-2 text-xl font-bold">{t("wizard.step3")}</h2>
            <p className="text-muted-foreground">{t("wizard.photoHint")}</p>
          </div>

          <div className="space-y-4">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              ref={fileInputRef}
              onChange={handlePhotoSelect}
            />

            {data.photos.length < 3 && (
              <Button
                variant="outline"
                className="flex h-24 w-full flex-col items-center justify-center border-2 border-dashed text-muted-foreground"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="mb-2 h-8 w-8" />
                {t("wizard.addPhotos")}
                {" (" + data.photos.length + "/3)"}
              </Button>
            )}

            {data.photos.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {data.photos.map((file, i) => (
                  <div
                    key={i}
                    className="relative aspect-square overflow-hidden rounded-md bg-muted"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={URL.createObjectURL(file)}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                    <button
                      className="absolute top-1 right-1 rounded-full bg-background/80 p-1 text-foreground"
                      onClick={() => removePhoto(i)}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="h-12 w-12 shrink-0" onClick={handleBack}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button className="h-12 flex-1" onClick={handleNext}>
              {t("wizard.next")} <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="animate-in space-y-6 slide-in-from-right-4">
          <div>
            <h2 className="mb-2 text-xl font-bold">{t("wizard.review")}</h2>
          </div>

          <div className="space-y-3 rounded-xl bg-muted p-4">
            <div>
              <div className="text-sm text-muted-foreground">{t("wizard.name")}</div>
              <div className="font-medium">{data.name}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{t("wizard.wellType")}</div>
              <div className="font-medium">{data.well_type}</div>
            </div>
            {data.total_depth_ui && (
              <div>
                <div className="text-sm text-muted-foreground">{t("wizard.totalDepth")}</div>
                <div className="font-medium">
                  {data.total_depth_ui} {unitPreference}
                </div>
              </div>
            )}
            <div>
              <div className="text-sm text-muted-foreground">
                {t("wizard.latitude")}
                {" / "}
                {t("wizard.longitude")}
              </div>
              <div className="font-medium">
                {data.latitude?.toFixed(5)}
                {", "}
                {data.longitude?.toFixed(5)}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="h-12 w-12 shrink-0"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button className="h-12 flex-1" onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Check className="mr-2 h-5 w-5" />
              )}
              {t("wizard.save")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
