"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Copy, Check, ShieldAlert, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createReportShareAction,
  revokeReportShareAction,
  getActiveShareAction,
} from "@/server/reports/actions";

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string | null;
  onShareRevoked?: () => void;
}

export function ShareLinkModal({ isOpen, onClose, reportId, onShareRevoked }: ShareLinkModalProps) {
  const t = useTranslations("reports");
  const [shareUrl, setShareUrl] = useState<string>("");
  const [shareId, setShareId] = useState<string | null>(null);
  const [accessCount, setAccessCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isRevoking, setIsRevoking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !reportId) {
      return;
    }

    let isMounted = true;
    async function loadOrCreateShare() {
      setIsLoading(true);
      setError(null);
      try {
        const activeRes = await getActiveShareAction(reportId!);
        if (!isMounted) return;

        if (activeRes.share && !activeRes.share.revokedAt) {
          setShareId(activeRes.share.id);
          setAccessCount(activeRes.share.accessCount);
          setShareUrl(`${window.location.origin}/share/${activeRes.share.id}`);
        } else {
          // Generate new share link
          const baseUrl = window.location.origin;
          const createRes = await createReportShareAction(reportId!, {
            expiryDays: 30,
            baseUrl,
          });
          if (!isMounted) return;
          if (createRes.success && createRes.share) {
            setShareUrl(createRes.share.shareUrl);
            setShareId(reportId);
            setAccessCount(0);
          }
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : t("failedToLoad"));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadOrCreateShare();

    return () => {
      isMounted = false;
    };
  }, [isOpen, reportId, t]);

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleRevoke = async () => {
    if (!shareId) return;
    try {
      setIsRevoking(true);
      await revokeReportShareAction(shareId);
      setShareUrl("");
      setShareId(null);
      if (onShareRevoked) onShareRevoked();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke");
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{t("shareModal.title")}</span>
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {t("shareModal.description")}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={shareUrl}
                className="h-12 min-h-[48px] font-mono text-xs"
                aria-label={t("shareModal.title")}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleCopy}
                className="h-12 min-h-[48px] shrink-0 px-4"
                aria-label={t("shareModal.copyLink")}
              >
                {isCopied ? (
                  <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="ml-2 text-xs">
                  {isCopied ? t("shareModal.copied") : t("shareModal.copyLink")}
                </span>
              </Button>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{t("shareModal.views", { count: accessCount })}</span>
              <span className="rounded bg-muted px-2 py-0.5 font-medium text-foreground">
                {t("periods.30d")}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-12 min-h-[48px] px-4"
              >
                <X className="mr-1.5 h-4 w-4" />
                <span>{t("actions.cancel")}</span>
              </Button>
              {shareId && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleRevoke}
                  disabled={isRevoking}
                  className="h-12 min-h-[48px] px-4"
                >
                  {isRevoking ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      <span>{t("shareModal.revoking")}</span>
                    </>
                  ) : (
                    <span>{t("shareModal.revoke")}</span>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
