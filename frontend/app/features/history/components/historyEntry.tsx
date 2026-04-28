import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Protected } from "~/features/auth";
import { ARCHIVE_PERMISSIONS } from "~/features/archive/archive.constants";

export function HistoryEntry({
  id_url,
  year,
  title,
  description,
  onUpdate,
  onDelete,
}: {
  id_url: string;
  year: number;
  title: string;
  description: string;
  onUpdate?: (payload: { id_url: string; year: number; title: string; content: string }) => Promise<void> | void;
  onDelete?: (id_url: string) => Promise<void> | void;
}) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [draftYear, setDraftYear] = useState<string>(String(year));
  const [draftTitle, setDraftTitle] = useState<string>(title);
  const [draftContent, setDraftContent] = useState<string>(description);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    if (!onUpdate) return;
    setIsSaving(true);
    try {
      await onUpdate({ id_url, year: Number(draftYear), title: draftTitle, content: draftContent });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    if (!confirm("Weet je zeker dat je deze entry wilt verwijderen?")) return;
    await onDelete(id_url);
  }

  return (
    <div className="relative pl-[clamp(1.75rem,4vw,3rem)]">
      <div className="bg-archive-accent border-archive-paper absolute top-4 -left-[clamp(0.375rem,0.7vw,0.5625rem)] h-[clamp(0.625rem,1.2vw,1rem)] w-[clamp(0.625rem,1.2vw,1rem)] rounded-full border-[clamp(2px,0.35vw,4px)]" />

      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-[clamp(1.5rem,2.5vw,2.25rem)] italic">
            <span className="mr-2">{year}</span>
            <span className="mx-2">-</span>
            <span>{title}</span>
          </h3>
          <p className="text-[clamp(1rem,1.5vw,1.25rem)] leading-relaxed italic opacity-70">
            {description}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 sm:flex-nowrap">
          <Protected permissions={[ARCHIVE_PERMISSIONS.update]}>
            {!isEditing ? (
              <button
                className="whitespace-nowrap rounded bg-archive-control px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors hover:bg-archive-control/80 disabled:opacity-50"
                onClick={() => {
                  setDraftYear(String(year));
                  setDraftTitle(title);
                  setDraftContent(description);
                  setIsEditing(true);
                }}
              >
                Pas aan
              </button>
            ) : (
              <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                <button
                  className="whitespace-nowrap rounded bg-archive-accent px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-archive-accent/90 disabled:opacity-50"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Opslaan"}
                </button>
                <button
                  className="whitespace-nowrap rounded bg-archive-control px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors hover:bg-archive-control/80 disabled:opacity-50"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  Annuleren
                </button>
              </div>
            )}
          </Protected>

          <Protected permissions={[ARCHIVE_PERMISSIONS.delete]}>
            <button
              className="whitespace-nowrap rounded bg-red-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              onClick={handleDelete}
            >
              Verwijder
            </button>
          </Protected>
        </div>
      </div>

      {isEditing && (
        <div className="mb-6 mt-2 rounded border bg-archive-paper p-4">
          <label className="mb-2 block text-sm">{t("history.form.labels.year")}</label>
          <input
            placeholder={t("history.form.placeholders.year")}
            value={draftYear}
            onChange={(e) => setDraftYear(e.target.value)}
            className="mb-2 w-full rounded border px-2 py-1"
          />

          <label className="mb-2 block text-sm">{t("history.form.labels.title")}</label>
          <input
            placeholder={t("history.form.placeholders.title")}
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            className="mb-2 w-full rounded border px-2 py-1"
          />

          <label className="mb-2 block text-sm">{t("history.form.labels.content")}</label>
          <textarea
            placeholder={t("history.form.placeholders.content")}
            value={draftContent}
            onChange={(e) => setDraftContent(e.target.value)}
            className="w-full rounded border px-2 py-1"
            rows={5}
          />
        </div>
      )}
    </div>
  );
}
