"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Copy, Check, AlertTriangle, RotateCw, Trash2, Activity } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  createKeyAction,
  revokeKeyAction,
  rotateKeyAction,
  getKeyUsageAction,
} from "@/server/insurer/actions";
import type { InsurerScope } from "@/server/insurer/keys";
import type { DailyUsageRollup } from "@/server/insurer/metering";

export interface KeyItem {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  is_sandbox: boolean;
  rate_limit_per_min: number;
  monthly_quota: number;
  revoked_at: string | null;
  expires_at: string | null;
  created_at: string;
  last_used_at: string | null;
}

export function InsurerKeysManager({ initialKeys }: { initialKeys: KeyItem[] }) {
  const t = useTranslations("insurer");
  const [keys, setKeys] = useState<KeyItem[]>(initialKeys);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  // Form states
  const [keyName, setKeyName] = useState("");
  const [isSandbox, setIsSandbox] = useState(false);
  const [selectedScopes, setSelectedScopes] = useState<InsurerScope[]>([
    "stats:read",
    "risk:read",
    "timeseries:read",
  ]);

  // Usage drawer state
  const [usageKeyId, setUsageKeyId] = useState<string | null>(null);
  const [usageData, setUsageData] = useState<DailyUsageRollup[]>([]);
  const [usageLoading, setUsageLoading] = useState(false);

  function toggleScope(scope: InsurerScope) {
    if (selectedScopes.includes(scope)) {
      setSelectedScopes(selectedScopes.filter((s) => s !== scope));
    } else {
      setSelectedScopes([...selectedScopes, scope]);
    }
  }

  async function handleCreateKey(e: React.FormEvent) {
    e.preventDefault();
    if (!keyName.trim()) return;

    setBusy(true);
    try {
      const res = await createKeyAction({
        name: keyName.trim(),
        scopes: selectedScopes,
        isSandbox,
      });

      if (res.success && res.key) {
        setNewKeySecret(res.key.keyString);
        setKeys([
          {
            id: res.key.id,
            name: res.key.name,
            key_prefix: res.key.keyPrefix,
            scopes: res.key.scopes,
            is_sandbox: res.key.isSandbox,
            rate_limit_per_min: res.key.rateLimitPerMin,
            monthly_quota: res.key.monthlyQuota,
            revoked_at: null,
            expires_at: res.key.expiresAt,
            created_at: res.key.createdAt,
            last_used_at: null,
          },
          ...keys,
        ]);
        setKeyName("");
        setShowCreateModal(false);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleRevoke(keyId: string) {
    if (!confirm("Are you sure you want to revoke this key? This cannot be undone.")) return;
    setBusy(true);
    try {
      const res = await revokeKeyAction(keyId);
      if (res.success) {
        setKeys(
          keys.map((k) => (k.id === keyId ? { ...k, revoked_at: new Date().toISOString() } : k)),
        );
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleRotate(keyId: string) {
    if (!confirm("Rotating will immediately revoke this key and create a new one. Proceed?"))
      return;
    setBusy(true);
    try {
      const res = await rotateKeyAction(keyId);
      if (res.success && res.key) {
        setNewKeySecret(res.key.keyString);
        setKeys([
          {
            id: res.key.id,
            name: res.key.name,
            key_prefix: res.key.keyPrefix,
            scopes: res.key.scopes,
            is_sandbox: res.key.isSandbox,
            rate_limit_per_min: res.key.rateLimitPerMin,
            monthly_quota: res.key.monthlyQuota,
            revoked_at: null,
            expires_at: res.key.expiresAt,
            created_at: res.key.createdAt,
            last_used_at: null,
          },
          ...keys.map((k) => (k.id === keyId ? { ...k, revoked_at: new Date().toISOString() } : k)),
        ]);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleViewUsage(keyId: string) {
    setUsageKeyId(keyId);
    setUsageLoading(true);
    try {
      const res = await getKeyUsageAction(keyId, 30);
      if (res.success) {
        setUsageData(res.usage);
      }
    } finally {
      setUsageLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{t("apiKeys")}</h2>
          <p className="text-sm text-muted-foreground">{t("apiKeysDescription")}</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex min-h-12 items-center gap-2 px-4"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>{t("createKey")}</span>
        </Button>
      </div>

      {/* Secret Reveal Modal */}
      {newKeySecret ? (
        <div
          role="dialog"
          aria-labelledby="secret-modal-title"
          className="rounded-xl border-2 border-primary bg-card p-6 shadow-md"
        >
          <div className="flex items-center gap-3 text-amber-600 dark:text-amber-500">
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
            <h3 id="secret-modal-title" className="text-lg font-bold">
              {t("secretOneTimeNotice")}
            </h3>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{t("termsBody")}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-muted p-3 font-mono text-sm break-all">
            <span className="flex-1">{newKeySecret}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(newKeySecret)}
              className="flex min-h-12 items-center gap-2"
            >
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? t("copied") : t("copied")}</span>
            </Button>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="default" onClick={() => setNewKeySecret(null)}>
              <span>{t("acceptTerms")}</span>
            </Button>
          </div>
        </div>
      ) : null}

      {/* Keys Table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/50 text-xs font-medium text-muted-foreground uppercase">
            <tr>
              <th scope="col" className="px-4 py-3">
                {t("keyName")}
              </th>
              <th scope="col" className="px-4 py-3">
                {t("keyType")}
              </th>
              <th scope="col" className="px-4 py-3">
                {t("scopes")}
              </th>
              <th scope="col" className="px-4 py-3">
                {t("rateLimit")}
              </th>
              <th scope="col" className="px-4 py-3">
                {t("status")}
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {keys.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  {t("noKeys")}
                </td>
              </tr>
            ) : (
              keys.map((k) => {
                const isRevoked = Boolean(k.revoked_at);
                const isExpired = Boolean(k.expires_at && new Date(k.expires_at) < new Date());
                const statusLabel = isRevoked
                  ? t("revoked")
                  : isExpired
                    ? t("expired")
                    : t("active");

                return (
                  <tr key={k.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">
                      <div>{k.name}</div>
                      <div className="font-mono text-xs text-muted-foreground">{k.key_prefix}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          k.is_sandbox
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                        }`}
                      >
                        {k.is_sandbox ? t("sandbox") : t("live")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {k.scopes.map((s) => (
                          <span
                            key={s}
                            className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {t("reqPerMin", { count: k.rate_limit_per_min })}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          isRevoked || isExpired
                            ? "bg-destructive/10 text-destructive"
                            : "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                        }`}
                      >
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewUsage(k.id)}
                          title={t("viewUsage")}
                          aria-label={t("viewUsage")}
                          className="min-h-12 px-2"
                        >
                          <Activity className="h-4 w-4" />
                        </Button>
                        {!isRevoked && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={busy}
                              onClick={() => handleRotate(k.id)}
                              title={t("rotate")}
                              aria-label={t("rotate")}
                              className="min-h-12 px-2"
                            >
                              <RotateCw className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={busy}
                              onClick={() => handleRevoke(k.id)}
                              title={t("revoke")}
                              aria-label={t("revoke")}
                              className="min-h-12 px-2 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Usage History Modal */}
      {usageKeyId ? (
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{t("usageChart")}</h3>
            <Button variant="ghost" size="sm" onClick={() => setUsageKeyId(null)}>
              {t("close")}
            </Button>
          </div>
          {usageLoading ? (
            <p className="py-4 text-sm text-muted-foreground">{t("loadingUsage")}</p>
          ) : usageData.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">{t("noUsage")}</p>
          ) : (
            <div className="mt-4 space-y-2">
              <div className="flex h-28 items-end gap-2 border-b pb-2">
                {usageData.map((d) => (
                  <div
                    key={d.date}
                    className="group relative flex flex-1 flex-col items-center gap-1"
                  >
                    <div
                      style={{ height: `${Math.min(100, Math.max(10, d.requests * 5))}%` }}
                      className="w-full rounded-t bg-primary/70 group-hover:bg-primary"
                    />
                    <span className="text-[10px] text-muted-foreground">{d.date.slice(5)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Create Key Modal */}
      {showCreateModal ? (
        <div
          role="dialog"
          aria-labelledby="create-key-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-xl">
            <h3 id="create-key-modal-title" className="text-xl font-bold">
              {t("createKey")}
            </h3>
            <form onSubmit={handleCreateKey} className="mt-4 space-y-4">
              <div>
                <label htmlFor="key-name" className="block text-sm font-medium">
                  {t("keyName")}
                </label>
                <input
                  id="key-name"
                  type="text"
                  required
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g. Production Underwriting Service"
                  className="mt-1 flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">{t("keyType")}</label>
                <div className="mt-2 flex gap-4">
                  <label className="flex min-h-12 cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="env"
                      checked={!isSandbox}
                      onChange={() => setIsSandbox(false)}
                    />
                    <span>{t("live")}</span>
                  </label>
                  <label className="flex min-h-12 cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="env"
                      checked={isSandbox}
                      onChange={() => setIsSandbox(true)}
                    />
                    <span>{t("sandbox")}</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">{t("scopes")}</label>
                <div className="space-y-2">
                  <label className="flex min-h-12 cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedScopes.includes("stats:read")}
                      onChange={() => toggleScope("stats:read")}
                    />
                    <span>{t("scopeStats")}</span>
                  </label>
                  <label className="flex min-h-12 cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedScopes.includes("risk:read")}
                      onChange={() => toggleScope("risk:read")}
                    />
                    <span>{t("scopeRisk")}</span>
                  </label>
                  <label className="flex min-h-12 cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedScopes.includes("timeseries:read")}
                      onChange={() => toggleScope("timeseries:read")}
                    />
                    <span>{t("scopeTimeseries")}</span>
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={busy || !keyName.trim()}>
                  {busy ? t("creating") : t("createKey")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
