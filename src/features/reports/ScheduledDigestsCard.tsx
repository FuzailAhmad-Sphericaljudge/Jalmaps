"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Bell, Calendar, Mail, MessageSquare, Trash2, Plus, Loader2, Check } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  saveReportScheduleAction,
  deleteReportScheduleAction,
  type ScheduleRow,
} from "@/server/reports/actions";

interface ScheduledDigestsCardProps {
  initialSchedules: ScheduleRow[];
  defaultScope?: Record<string, string>;
  locale: string;
}

export function ScheduledDigestsCard({
  initialSchedules,
  defaultScope = { districtId: "dist-1" },
  locale,
}: ScheduledDigestsCardProps) {
  const t = useTranslations("reports");
  const [schedules, setSchedules] = useState<ScheduleRow[]>(initialSchedules);
  const [cadence, setCadence] = useState<"weekly" | "monthly">("weekly");
  const [channel, setChannel] = useState<"email" | "sms" | "whatsapp" | "in_app">("email");
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    setSuccessMsg(null);

    try {
      const res = await saveReportScheduleAction({
        type: "village",
        scope: defaultScope,
        cadence,
        channel,
        locale,
        dayOfWeek: 1, // Monday
        timeUtc: "04:00",
      });

      if (res.success && res.schedule) {
        setSchedules((prev) => [res.schedule as ScheduleRow, ...prev]);
        setSuccessMsg(t("digests.subscribed"));
        setTimeout(() => setSuccessMsg(null), 3500);
      }
    } catch (err) {
      console.error("Failed to add digest schedule:", err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      setDeletingId(id);
      await deleteReportScheduleAction(id);
      setSchedules((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Failed to delete schedule:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const getChannelIcon = (ch: string) => {
    switch (ch) {
      case "sms":
        return <MessageSquare className="h-4 w-4 text-emerald-500" />;
      default:
        return <Mail className="h-4 w-4 text-sky-500" />;
    }
  };

  return (
    <Card className="border border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Bell className="h-5 w-5 text-primary" />
          <span>{t("digests.title")}</span>
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          {t("digests.subtitle")}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Subscribe Form */}
        <form
          onSubmit={handleAddSchedule}
          className="flex flex-col gap-3 rounded-lg border border-border/70 bg-muted/20 p-4 sm:flex-row sm:items-end"
        >
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              {t("digests.cadence")}
            </label>
            <Select
              value={cadence}
              onValueChange={(val) => setCadence(val as "weekly" | "monthly")}
            >
              <SelectTrigger
                aria-label={t("digests.cadence")}
                className="h-12 min-h-[48px] w-full bg-background"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">{t("digests.weekly")}</SelectItem>
                <SelectItem value="monthly">{t("digests.monthly")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              {t("digests.channel")}
            </label>
            <Select
              value={channel}
              onValueChange={(val) => setChannel(val as "email" | "sms" | "whatsapp" | "in_app")}
            >
              <SelectTrigger
                aria-label={t("digests.channel")}
                className="h-12 min-h-[48px] w-full bg-background"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{"Email"}</span>
                  </div>
                </SelectItem>
                <SelectItem value="sms">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>{"SMS"}</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={isAdding} className="h-12 min-h-[48px] px-5 sm:shrink-0">
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="mr-1.5 h-4 w-4" />
                <span>{t("digests.subscribe")}</span>
              </>
            )}
          </Button>
        </form>

        {successMsg && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
            <Check className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Existing Schedules List */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {t("digests.activeSchedules")}
          </h4>

          {schedules.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground italic">
              {t("digests.noSchedules")}
            </p>
          ) : (
            <div className="divide-y divide-border/60 rounded-lg border border-border/80">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between p-3.5 transition-colors hover:bg-muted/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {schedule.cadence === "weekly"
                            ? t("digests.weekly")
                            : t("digests.monthly")}
                        </span>
                        <Badge variant="outline" className="font-mono text-[10px] uppercase">
                          {schedule.cadence}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {getChannelIcon(schedule.channel)}
                        <span className="capitalize">{schedule.channel}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteSchedule(schedule.id)}
                    disabled={deletingId === schedule.id}
                    className="h-12 min-h-[48px] w-12 min-w-[48px] rounded-lg text-muted-foreground hover:text-destructive"
                    aria-label={t("actions.delete")}
                  >
                    {deletingId === schedule.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
