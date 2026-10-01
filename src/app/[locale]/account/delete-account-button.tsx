"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRouter } from "@/i18n/navigation";

export function DeleteAccountButton() {
  const t = useTranslations("account");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function deleteAccount() {
    setBusy(true);
    setFailed(false);
    try {
      const response = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
      if (!response.ok) {
        setFailed(true);
        return;
      }
      router.replace("/login");
    } catch (caught) {
      if (!(caught instanceof TypeError)) throw caught;
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!busy) setOpen(nextOpen);
        }}
      >
        <DialogTrigger asChild>
          <Button type="button" size="touch" variant="destructive">
            <Trash2 aria-hidden="true" />
            {t("deleteAccount")}
          </Button>
        </DialogTrigger>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t("deleteTitle")}</DialogTitle>
            <DialogDescription>{t("deleteDialogDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              size="touch"
              variant="outline"
              disabled={busy}
              onClick={() => setOpen(false)}
            >
              {t("deleteCancel")}
            </Button>
            <Button
              type="button"
              size="touch"
              variant="destructive"
              disabled={busy}
              onClick={() => void deleteAccount()}
            >
              <Trash2 aria-hidden="true" />
              {busy ? t("deleting") : t("deleteConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <p aria-live="polite" className="min-h-6 text-sm text-destructive">
        {failed ? t("deleteFailed") : ""}
      </p>
    </>
  );
}
