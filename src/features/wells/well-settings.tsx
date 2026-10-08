"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { updateWellAction, addWellMemberAction } from "@/app/[locale]/(app)/farmer/wells/actions";

// Assuming we have basic UI components from earlier phases
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function WellSettings({ well, members }: { well: any; members: any[] }) {
  const t = useTranslations("wells");
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const [name, setName] = useState(well.name);
  const [notes, setNotes] = useState(well.notes || "");
  const [saving, setSaving] = useState(false);

  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("viewer");
  const [addingMember, setAddingMember] = useState(false);
  const [memberError, setMemberError] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateWellAction(locale, well.id, { name, notes });
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingMember(true);
    setMemberError("");
    try {
      const result = await addWellMemberAction(locale, well.id, { phone, role });
      if (result.status === "not_found") {
        setMemberError(t("members.notFound"));
      } else {
        setPhone("");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddingMember(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t("detail.settings")}</h2>
        <form onSubmit={handleSave} className="max-w-md space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("wizard.name")}</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="min-h-[48px]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("wizard.notes")}</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[48px]"
            />
          </div>
          <Button type="submit" disabled={saving} className="min-h-[48px]">
            {saving ? t("wizard.saving") : t("wizard.save")}
          </Button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t("members.title")}</h2>

        {members.length > 0 && (
          <ul className="max-w-md space-y-2">
            {members.map((m) => (
              <li
                key={m.user_id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div>
                  <p className="font-medium">{m.profiles?.full_name || m.profiles?.phone}</p>
                  <p className="text-sm text-muted-foreground">{t(`members.roles.${m.role}`)}</p>
                </div>
                <Button variant="ghost" size="sm" className="text-destructive">
                  {t("members.remove")}
                </Button>
              </li>
            ))}
          </ul>
        )}

        <form
          onSubmit={handleAddMember}
          className="max-w-md space-y-4 rounded-lg border bg-muted/20 p-4"
        >
          <h3 className="font-medium">{t("members.addMember")}</h3>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("members.phone")}</label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91..."
              required
              className="min-h-[48px]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("members.role")}</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="flex h-12 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="viewer">{t("members.roles.viewer")}</option>
              <option value="editor">{t("members.roles.editor")}</option>
            </select>
          </div>

          {memberError && <p className="text-sm text-destructive">{memberError}</p>}

          <Button type="submit" disabled={addingMember} className="min-h-[48px] w-full">
            {addingMember ? t("members.adding") : t("members.add")}
          </Button>
        </form>
      </section>
    </div>
  );
}
