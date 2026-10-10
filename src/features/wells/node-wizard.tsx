"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { registerNodeAction } from "@/app/[locale]/(app)/farmer/wells/actions";

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

// Provide a mock if BarcodeDetector isn't defined in the environment type
declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var BarcodeDetector: any;
}

export function NodeWizard({ wellId, locale }: { wellId: string; locale: string }) {
  const t = useTranslations("wells");
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [hardwareId, setHardwareId] = useState("");
  const [sensorModel, setSensorModel] = useState("DFRobot KIT0139");
  const [rangeM, setRangeM] = useState<number | "">("");
  const [hangDepthM, setHangDepthM] = useState<number | "">("");
  const [calibrationOffset, setCalibrationOffset] = useState<number>(0);

  const [scanning, setScanning] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState("");

  const [keyData, setKeyData] = useState<{ hardwareId: string; keyString: string } | null>(null);
  const [keySaved, setKeySaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  const startScan = async () => {
    try {
      if (!("BarcodeDetector" in window)) {
        throw new Error("BarcodeDetector not supported");
      }
      setScanning(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });

      const scanInterval = setInterval(async () => {
        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const raw = barcodes[0].rawValue;
            if (raw.startsWith("JM:")) {
              setHardwareId(raw.substring(3));
              stopScan(stream, scanInterval);
            }
          }
        }
      }, 500);
    } catch (err) {
      console.error(err);
      setScanning(false);
      // Fallback is just typing manually
    }
  };

  const stopScan = (stream?: MediaStream, intervalId?: NodeJS.Timeout) => {
    setScanning(false);
    if (intervalId) clearInterval(intervalId);
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    } else if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((track) => track.stop());
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistering(true);
    setError("");

    try {
      const payload = {
        hardware_id: hardwareId,
        sensor_model: sensorModel,
        range_m: Number(rangeM),
        hang_depth_m: Number(hangDepthM),
        calibration_offset_m: Number(calibrationOffset),
      };

      const result = await registerNodeAction(locale, wellId, payload);

      if (result.status === "ok") {
        setKeyData({ hardwareId, keyString: result.keyString });
      } else if (result.status === "invalid" || result.status === "error") {
        setError(result.message || "An error occurred");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred");
    } finally {
      setRegistering(false);
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

  const handleCloseModal = () => {
    setKeyData(null);
    router.push(`/${locale}/app/farmer/wells/${wellId}`);
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h2 className="text-2xl font-bold">{t("nodeWizard.title")}</h2>

      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("nodeWizard.scanFallback")}</p>

          {scanning ? (
            <div className="relative aspect-square overflow-hidden rounded-lg bg-black">
              <video ref={videoRef} className="h-full w-full object-cover" />
              <Button
                variant="destructive"
                className="absolute bottom-4 left-1/2 -translate-x-1/2"
                onClick={() => stopScan()}
              >
                {t("nodeWizard.cancelScan")}
              </Button>
            </div>
          ) : (
            <Button onClick={startScan} className="h-12 w-full" variant="outline">
              {t("nodeWizard.scanQR")}
            </Button>
          )}

          <div className="space-y-2 pt-4">
            <label className="text-sm font-medium">{t("nodeWizard.hardwareId")}</label>
            <Input
              value={hardwareId}
              onChange={(e) => setHardwareId(e.target.value)}
              placeholder={t("nodeWizard.hardwareIdPlaceholder")}
              className="h-12 uppercase"
            />
          </div>

          <Button onClick={() => setStep(2)} disabled={!hardwareId.trim()} className="h-12 w-full">
            {t("wizard.next")}
          </Button>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("nodeWizard.sensorModel")}</label>
            <Input
              value={sensorModel}
              onChange={(e) => setSensorModel(e.target.value)}
              required
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("nodeWizard.rangeM")}</label>
            <Input
              type="number"
              step="0.1"
              min="0.1"
              value={rangeM}
              onChange={(e) => setRangeM(e.target.value ? Number(e.target.value) : "")}
              required
              className="h-12"
            />
          </div>

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

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              className="h-12 flex-1"
            >
              {t("wizard.back")}
            </Button>
            <Button type="submit" disabled={registering} className="h-12 flex-1">
              {registering ? t("nodeWizard.registering") : t("nodeWizard.register")}
            </Button>
          </div>
        </form>
      )}

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
              {copied ? t("nodeWizard.keyCopied") : "Copy API Key"}
            </Button>
            <Button variant="secondary" onClick={handleDownloadConfig}>
              {t("nodeWizard.downloadConfig")}
            </Button>
          </div>

          <div className="flex items-center space-x-2 border-t py-4">
            <input
              type="checkbox"
              id="saved-check"
              checked={keySaved}
              onChange={(e) => setKeySaved(e.target.checked)}
              className="h-5 w-5"
            />
            <label htmlFor="saved-check" className="text-sm leading-none font-medium">
              {t("nodeWizard.keyConfirm")}
            </label>
          </div>

          <DialogFooter>
            <Button className="w-full" disabled={!keySaved} onClick={handleCloseModal}>
              {t("nodeWizard.keyClose")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
