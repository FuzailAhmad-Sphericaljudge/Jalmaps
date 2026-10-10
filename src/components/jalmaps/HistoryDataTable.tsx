import { useTranslations } from "next-intl";
import { useState } from "react";

export function HistoryDataTable({
  data,
  compareWellIds,
  otherWells,
}: {
  data: Record<string, unknown>[];
  compareWellIds: string[];
  otherWells: { id: string; name: string }[];
}) {
  const t = useTranslations("history");
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const totalPages = Math.ceil(data.length / pageSize);
  const currentData = data.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="flex flex-col gap-4 overflow-hidden rounded-lg border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="p-4 font-medium">{t("export.date")}</th>
              <th className="p-4 font-medium">{t("thisWell", { fallback: "This well" })}</th>
              {compareWellIds.map((id) => (
                <th key={id} className="p-4 font-medium">
                  {otherWells.find((w) => w.id === id)?.name || id}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentData.map((row, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
                <td className="p-4">{new Date(row.x).toLocaleString()}</td>
                <td className="p-4">{typeof row.y === "number" ? row.y.toFixed(2) : "-"}</td>
                {compareWellIds.map((id) => {
                  const val = row[`y_${id}`];
                  return (
                    <td key={id} className="p-4">
                      {typeof val === "number" ? val.toFixed(2) : "-"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 pt-0">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="rounded border px-3 py-1 text-sm disabled:opacity-50"
          >
            {t("prev", { fallback: "Previous" })}
          </button>
          <span className="text-sm text-muted-foreground">
            {page + 1} {t("pageOf", { fallback: "of" })} {totalPages}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border px-3 py-1 text-sm disabled:opacity-50"
          >
            {t("next", { fallback: "Next" })}
          </button>
        </div>
      )}
    </div>
  );
}
