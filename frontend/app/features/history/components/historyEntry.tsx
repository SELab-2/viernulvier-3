import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Protected } from "~/features/auth";
import { ARCHIVE_PERMISSIONS } from "~/features/archive/archive.constants";

export function HistoryEntry({
  entryYear,
  entryLanguage,
  year,
  language,
  title,
  description,
  onUpdate,
  onDelete,
}: {
  entryYear: number;
  entryLanguage: string;
  year: number;
  language: string;
  title: string;
  description: string;
  onUpdate?: (payload: {
    entryYear: number;
    entryLanguage: string;
    year: number;
    language: string;
    title: string;
    content: string;
  }) => Promise<void> | void;
  onDelete?: (year: number, language: string) => Promise<void> | void;
}) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [draftYear, setDraftYear] = useState<string>(String(year));
  const [draftTitle, setDraftTitle] = useState<string>(title);
  const [draftContent, setDraftContent] = useState<string>(description);
  const [isSaving, setIsSaving] = useState(false);

  const actionButtonClass =
    "rounded px-4 py-2 text-xs font-semibold tracking-wide whitespace-nowrap uppercase transition-colors disabled:opacity-50";

  async function handleSave() {
    if (!onUpdate) return;
    setIsSaving(true);
    try {
      await onUpdate({
        entryYear,
        entryLanguage,
        year: Number(draftYear),
        language,
        title: draftTitle,
        content: draftContent,
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    if (!confirm(t("history.messages.confirmDelete"))) return;
    await onDelete(year, language);
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
                className={`${actionButtonClass} bg-archive-accent text-white hover:bg-archive-accent/90`}
                onClick={() => {
                  setDraftYear(String(year));
                  setDraftTitle(title);
                  setDraftContent(description);
                  setIsEditing(true);
                }}
              >
                {t("history.actions.edit")}
              </button>
            ) : (
              <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                <button
                  className={`${actionButtonClass} bg-archive-accent text-white hover:bg-archive-accent/90`}
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? t("history.actions.saving") : t("history.actions.save")}
                </button>
                <button
                  className={`${actionButtonClass} bg-archive-control hover:bg-archive-control/80`}
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  {t("history.actions.cancel")}
                </button>
              </div>
            )}
          </Protected>

          <Protected permissions={[ARCHIVE_PERMISSIONS.delete]}>
            <button
              className={`${actionButtonClass} bg-archive-accent text-white hover:bg-archive-accent/90`}
              onClick={handleDelete}
            >
              {t("history.actions.delete")}
            </button>
          </Protected>
        </div>
      </div>

      {isEditing && (
        <div className="bg-archive-paper mt-2 mb-6 rounded border p-4">
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

          <label className="mb-2 block text-sm">
            {t("history.form.labels.content")}
          </label>
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
