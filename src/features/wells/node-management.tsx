"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  updateNodeSettingsAction,
  rotateKeyAction,
  retireNodeAction,
} from "@/app/[locale]/(app)/farmer/wells/actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { StatusPill } from "@/components/jalmaps/status-pill";
import type { WellStatus } from "@/components/jalmaps/status-pill";

type ActiveNode = {
  id: string;
  hardware_id: string;
  status: string;
  last_seen_at: string | null;
  hang_depth_m: number | null;
  range_m: number | null;
  calibration_offset_m: number | null;
  battery_v: number | null;
  signal_rssi: number | null;
  firmware_version: string | null;
};

type NodeConnectionState = "online" | "offline" | "never_reported";

export function NodeManagement({
  well,
  activeNode,
  connectionState,
  locale,
}: {
  well: { id: string; owner_id: string };
  activeNode: ActiveNode;
  connectionState: NodeConnectionState;
  locale: string;
}) {
  const t = useTranslations("wells");
  const router = useRouter();

  const [hangDepthM, setHangDepthM] = useState<number | "">(activeNode.hang_depth_m ?? "");
  const [calibrationOffset, setCalibrationOffset] = useState<number>(
    activeNode.calibration_offset_m ?? 0,
  );
  const [savingSettings, setSavingSettings] = useState(false);

  const [rotating, setRotating] = useState(false);
  const [retiring, setRetiring] = useState(false);

  const [showRotateConfirm, setShowRotateConfirm] = useState(false);
  const [showRetireConfirm, setShowRetireConfirm] = useState(false);

  const [keyData, setKeyData] = useState<{ hardwareId: string; keyString: string } | null>(null);
  const [keySaved, setKeySaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await updateNodeSettingsAction(
        locale,
        activeNode.id,
        {
          hang_depth_m: Number(hangDepthM),
          calibration_offset_m: Number(calibrationOffset),
        },
        well.owner_id,
      );
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleRotateKey = async () => {
    setRotating(true);
    try {
      const result = await rotateKeyAction(locale, activeNode.id, activeNode.hardware_id);
      if (result.status === "ok") {
        setShowRotateConfirm(false);
        setKeyData({ hardwareId: activeNode.hardware_id, keyString: result.keyString });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRotating(false);
    }
  };

  const handleRetireNode = async () => {
    setRetiring(true);
    try {
      const result = await retireNodeAction(locale, activeNode.id, well.owner_id);
      if (result.status === "ok") {
        router.push(`/${locale}/app/farmer/wells/${well.id}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRetiring(false);
    }
  };

  const handleCopyKey = () => {
    if (keyData) {
      navigator.clipboard.writeText(keyData.keyString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadConfig = () => {
    if (!keyData) return;
    const config = {
      hardware_id: keyData.hardwareId,
      api_key: keyData.keyString,
      ingest_url: `${window.location.origin}/api/v1/ingest`,
      ping_url: `${window.location.origin}/api/v1/ingest/ping`,
      server_time: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "config.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-md space-y-8">
      {/* Node Status Summary */}
      <section className="flex flex-col space-y-4 rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t("node.title")}</h3>
          <StatusPill
            status={
              (connectionState === "online"
                ? "good"
                : connectionState === "offline"
                  ? "offline"
                  : "warning") satisfies WellStatus
            }
            label={t(`nodeStatus.${connectionState}`)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-muted p-3">
            <div className="text-xs text-muted-foreground">{t("node.lastSeen")}</div>
            <div className="font-medium">
              {activeNode.last_seen_at
                ? new Date(activeNode.last_seen_at).toLocaleString(locale)
                : "-"}
            </div>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <div className="text-xs text-muted-foreground">{t("nodeWizard.hardwareId")}</div>
            <div className="font-medium break-all">{activeNode.hardware_id}</div>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <div className="text-xs text-muted-foreground">{t("node.battery")}</div>
            <div className="font-medium">
              {activeNode.battery_v ? `${activeNode.battery_v} V` : "-"}
            </div>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <div className="text-xs text-muted-foreground">{t("node.signal")}</div>
            <div className="font-medium">
              {activeNode.signal_rssi ? `${activeNode.signal_rssi} dBm` : "-"}
            </div>
          </div>
          <div className="col-span-2 rounded-lg bg-muted p-3">
            <div className="text-xs text-muted-foreground">{t("node.firmware")}</div>
            <div className="font-medium">{activeNode.firmware_version || "-"}</div>
          </div>
        </div>
      </section>

      {/* Settings Form */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">{t("detail.settings")}</h3>
        <form onSubmit={handleSaveSettings} className="space-y-4 rounded-xl border bg-card p-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("nodeWizard.hangDepthM")}</label>
            <p className="text-xs text-muted-foreground">{t("nodeWizard.hangDepthHint")}</p>
            <Input
              type="number"
              step="0.1"
              min="0.1"
              value={hangDepthM}
              onChange={(e) => setHangDepthM(e.target.value ? Number(e.target.value) : "")}
              required
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("nodeWizard.calibrationOffset")}</label>
            <Input
              type="number"
              step="0.1"
              value={calibrationOffset}
              onChange={(e) => setCalibrationOffset(Number(e.target.value))}
              required
              className="h-12"
            />
          </div>

          <Button type="submit" disabled={savingSettings} className="h-12 w-full">
            {savingSettings ? t("wizard.saving") : t("wizard.save")}
          </Button>
        </form>
      </section>

      {/* Danger Zone */}
      <section className="space-y-4 border-t border-destructive/20 pt-4">
        <div className="space-y-4">
          <Button
            variant="outline"
            className="h-12 w-full"
            onClick={() => setShowRotateConfirm(true)}
          >
            {t("node.rotateKey")}
          </Button>
          <Button
            variant="destructive"
            className="h-12 w-full"
            onClick={() => setShowRetireConfirm(true)}
          >
            {t("node.retire")}
          </Button>
        </div>
      </section>

      {/* Modals */}
      <Dialog open={showRotateConfirm} onOpenChange={setShowRotateConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("node.rotateTitle")}</DialogTitle>
            <DialogDescription>{t("node.rotateDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowRotateConfirm(false)}>
              {t("node.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleRotateKey} disabled={rotating}>
              {rotating ? t("node.rotating") : t("node.rotateConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRetireConfirm} onOpenChange={setShowRetireConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("node.retireTitle")}</DialogTitle>
            <DialogDescription>{t("node.retireDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowRetireConfirm(false)}>
              {t("node.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleRetireNode} disabled={retiring}>
              {retiring ? t("node.retiring") : t("node.retireConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!keyData} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t("nodeWizard.keyTitle")}</DialogTitle>
            <DialogDescription className="font-medium text-destructive">
              {t("nodeWizard.keyWarning")}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-md bg-muted p-4 text-center font-mono text-sm break-all">
            {keyData?.keyString}
          </div>

          <div className="my-4 flex flex-col gap-3">
            <Button variant="secondary" onClick={handleCopyKey}>
              {copied ? t("nodeWizard.keyCopied") : t("node.copyKey")}
            </Button>
            <Button variant="secondary" onClick={handleDownloadConfig}>
              {t("nodeWizard.downloadConfig")}
            </Button>
          </div>

          <div className="flex items-center space-x-2 border-t py-4">
            <input
              type="checkbox"
              id="saved-check-mgmt"
              checked={keySaved}
              onChange={(e) => setKeySaved(e.target.checked)}
              className="h-5 w-5"
            />
            <label htmlFor="saved-check-mgmt" className="text-sm leading-none font-medium">
              {t("nodeWizard.keyConfirm")}
            </label>
          </div>

          <DialogFooter>
            <Button
              className="w-full"
              disabled={!keySaved}
              onClick={() => {
                setKeyData(null);
                setKeySaved(false);
              }}
            >
              {t("nodeWizard.keyClose")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
