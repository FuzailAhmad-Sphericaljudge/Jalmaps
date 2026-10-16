"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  ClipboardList,
  Plus,
  CheckCircle2,
  Clock,
  Calendar,
  Trash2,
  Loader2,
  X,
} from "lucide-react";
import type { AreaNoteRecord } from "@/server/official/notes";
import {
  createNoteAction,
  updateNoteStatusAction,
  deleteNoteAction,
} from "@/server/official/actions";

interface OfficialFollowUpNotesProps {
  notes: AreaNoteRecord[];
  currentAreaId?: string;
  allowedAreas: Array<{ id: string; name: string }>;
}

export function OfficialFollowUpNotes({
  notes: initialNotes,
  currentAreaId,
  allowedAreas,
}: OfficialFollowUpNotesProps) {
  const t = useTranslations("official");
  const [notes, setNotes] = useState<AreaNoteRecord[]>(initialNotes);
  const [isAdding, setIsAdding] = useState(false);
  const [text, setText] = useState("");
  const [targetAreaId, setTargetAreaId] = useState(currentAreaId || allowedAreas[0]?.id || "");
  const [dueDate, setDueDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !targetAreaId) return;

    try {
      setIsSaving(true);
      const res = await createNoteAction({
        area_id: targetAreaId,
        text: text.trim(),
        status: "open",
        due_date: dueDate || undefined,
      });
      if (res.note) {
        setNotes((prev) => [res.note, ...prev]);
        setText("");
        setDueDate("");
        setIsAdding(false);
      }
    } catch (err) {
      console.error("Failed to create note:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStatus = async (noteId: string, status: "open" | "in_progress" | "done") => {
    try {
      setUpdatingId(noteId);
      await updateNoteStatusAction(noteId, status);
      setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, status } : n)));
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (noteId: string) => {
    try {
      await deleteNoteAction(noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-3 border-b border-border/50 pb-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
            <ClipboardList className="h-5 w-5 text-primary" aria-hidden="true" />
            {t("notes.title")}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("notes.subtitle")}</p>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding((prev) => !prev)}
          className="inline-flex min-h-[40px] items-center gap-1.5 self-start rounded-xl bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>{t("notes.addNote")}</span>
        </button>
      </div>

      {isAdding && (
        <form
          onSubmit={handleCreateNote}
          className="space-y-3 rounded-xl border border-border/80 bg-muted/30 p-4"
        >
          <div>
            <textarea
              required
              rows={2}
              placeholder={t("notes.textPlaceholder")}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-[150px] flex-1">
              <select
                aria-label={t("scope.label")}
                value={targetAreaId}
                onChange={(e) => setTargetAreaId(e.target.value)}
                className="min-h-[36px] w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                {allowedAreas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
              </span>
              <input
                type="date"
                aria-label={t("notes.dueDate")}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="min-h-[36px] rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
              <button
                type="submit"
                disabled={isSaving || !text.trim()}
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isSaving && <Loader2 className="h-3 w-3 animate-spin" />}
                <span>{isSaving ? t("notes.saving") : t("notes.addNote")}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {notes.length === 0 ? (
        <div className="py-8 text-center">
          <CheckCircle2 className="mx-auto h-7 w-7 text-muted-foreground/50" aria-hidden="true" />
          <p className="mt-2 text-xs text-muted-foreground">{t("notes.empty")}</p>
        </div>
      ) : (
        <div className="max-h-[360px] divide-y divide-border/40 overflow-y-auto pr-1">
          {notes.map((note) => {
            const isDone = note.status === "done";
            const isInProgress = note.status === "in_progress";
            return (
              <div
                key={note.id}
                className="flex items-start justify-between gap-3 py-3 transition-colors hover:bg-muted/30"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-xs ${
                        isDone
                          ? "text-muted-foreground line-through"
                          : "font-medium text-foreground"
                      }`}
                    >
                      {note.text}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                    {note.due_date && (
                      <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                        <Clock className="h-3 w-3" />
                        {new Date(note.due_date).toLocaleDateString()}
                      </span>
                    )}
                    <span>
                      {t("notes.createdOn", {
                        date: new Date(note.created_at).toLocaleDateString(),
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1 self-center">
                  {updatingId === note.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      {isDone ? (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(note.id, "open")}
                          className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          {t("notes.markOpen")}
                        </button>
                      ) : (
                        <>
                          {!isInProgress && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(note.id, "in_progress")}
                              className="rounded-md border border-amber-500/30 px-2 py-1 text-xs text-amber-600 hover:bg-amber-500/10"
                            >
                              {t("notes.markInProgress")}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(note.id, "done")}
                            className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 px-2.5 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-500/10"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {t("notes.markDone")}
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(note.id)}
                        className="rounded-md p-1 text-muted-foreground transition-colors hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
