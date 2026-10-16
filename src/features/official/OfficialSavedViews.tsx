"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Bookmark, Pin, Trash2, Plus, Loader2, X } from "lucide-react";
import type { SavedViewRecord } from "@/server/official/saved-views";
import { saveViewAction, deleteViewAction, togglePinViewAction } from "@/server/official/actions";

interface OfficialSavedViewsProps {
  views: SavedViewRecord[];
  currentAreaId?: string;
  currentPreset?: "7d" | "30d" | "90d" | "1y";
  onApplyView?: (view: SavedViewRecord) => void;
}

export function OfficialSavedViews({
  views: initialViews,
  currentAreaId,
  currentPreset,
  onApplyView,
}: OfficialSavedViewsProps) {
  const t = useTranslations("official");
  const [views, setViews] = useState<SavedViewRecord[]>(initialViews);
  const [isOpen, setIsOpen] = useState(false);
  const [newViewName, setNewViewName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveCurrent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newViewName.trim()) return;

    try {
      setIsSaving(true);
      const res = await saveViewAction({
        name: newViewName.trim(),
        filters: {
          areaId: currentAreaId,
          preset: currentPreset,
        },
        is_default: false,
        is_pinned: false,
      });
      if (res.view) {
        setViews((prev) => [res.view, ...prev]);
        setNewViewName("");
        setIsOpen(false);
      }
    } catch (err) {
      console.error("Failed to save view:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (viewId: string) => {
    try {
      await deleteViewAction(viewId);
      setViews((prev) => prev.filter((v) => v.id !== viewId));
    } catch (err) {
      console.error("Failed to delete view:", err);
    }
  };

  const handleTogglePin = async (viewId: string, currentPinned: boolean) => {
    try {
      await togglePinViewAction(viewId, !currentPinned);
      setViews((prev) =>
        prev.map((v) => (v.id === viewId ? { ...v, is_pinned: !currentPinned } : v)),
      );
    } catch (err) {
      console.error("Failed to pin view:", err);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-medium text-foreground shadow-xs transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      >
        <Bookmark className="h-4 w-4 text-primary" aria-hidden="true" />
        <span>{t("savedViews.title")}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 space-y-3 rounded-2xl border border-border/80 bg-card p-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <h3 className="text-xs font-semibold text-foreground">{t("savedViews.title")}</h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSaveCurrent} className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={t("savedViews.namePlaceholder")}
                value={newViewName}
                onChange={(e) => setNewViewName(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                disabled={isSaving || !newViewName.trim()}
                className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Plus className="h-3 w-3" />
                )}
              </button>
            </div>
          </form>

          <div className="max-h-56 divide-y divide-border/40 overflow-y-auto">
            {views.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                {t("savedViews.empty")}
              </p>
            ) : (
              views.map((v) => (
                <div key={v.id} className="flex items-center justify-between py-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      onApplyView?.(v);
                      setIsOpen(false);
                    }}
                    className="mr-2 flex-1 truncate text-left font-medium text-foreground hover:text-primary"
                  >
                    {v.name}
                  </button>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      title={v.is_pinned ? t("savedViews.unpin") : t("savedViews.pin")}
                      onClick={() => handleTogglePin(v.id, v.is_pinned)}
                      className={`rounded-md p-1 transition-colors ${
                        v.is_pinned
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Pin className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title={t("savedViews.delete")}
                      onClick={() => handleDelete(v.id)}
                      className="rounded-md p-1 text-muted-foreground transition-colors hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
