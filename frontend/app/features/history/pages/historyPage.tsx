import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { HistoryEntry } from "../components/historyEntry";
import {
  getHistoryEntries,
  createHistoryEntry,
  updateHistoryEntry,
  deleteHistoryEntry,
  type HistoryEntryCreateRequest,
} from "~/features/history/services/historyService";
import type { HistoryEntryRecord } from "~/features/history/types/historyTypes";
import { Protected } from "~/features/auth";
import { ARCHIVE_PERMISSIONS } from "~/features/archive/archive.constants";

const HERO_IMAGES = ["/images/1914_Inhuldiging.jpg"];

export default function HistoryPage() {
  const { t, i18n } = useTranslation();
  const [entries, setEntries] = useState<HistoryEntryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function fetchHistoryEntries() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await getHistoryEntries();
        if (!isActive) {
          return;
        }

        setEntries(result);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setEntries([]);
        setErrorMessage(error instanceof Error ? error.message : t("history.error"));
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    fetchHistoryEntries();

    return () => {
      isActive = false;
    };
  }, [i18n.resolvedLanguage, t]);

  async function handleUpdate(payload: {
    entryYear: number;
    entryLanguage: string;
    year: number;
    language: string;
    title: string;
    content: string;
  }) {
    try {
      const updated = await updateHistoryEntry(
        payload.entryYear,
        payload.entryLanguage,
        {
          year: payload.year,
          language: payload.language,
          title: payload.title,
          content: payload.content,
        }
      );
      setEntries((prev) =>
        prev.map((e) =>
          e.year === payload.entryYear && e.language === payload.entryLanguage
            ? updated
            : e
        )
      );
    } catch (err) {
      window.alert(
        t("history.messages.updateFailed", {
          error: err instanceof Error ? err.message : String(err),
        })
      );
    }
  }

  async function handleDelete(year: number, language: string) {
    try {
      await deleteHistoryEntry(year, language);
      setEntries((prev) =>
        prev.filter((e) => !(e.year === year && e.language === language))
      );
    } catch (err) {
      window.alert(
        t("history.messages.deleteFailed", {
          error: err instanceof Error ? err.message : String(err),
        })
      );
    }
  }

  const [isCreating, setIsCreating] = useState(false);
  const [newEntry, setNewEntry] = useState<HistoryEntryCreateRequest>({
    year: new Date().getFullYear(),
    language: i18n.resolvedLanguage ?? "nl",
    title: "",
    content: "",
  });

  const actionButtonClass =
    "rounded px-3 py-1 text-sm font-semibold transition-colors disabled:opacity-50";

  async function handleCreate() {
    try {
      const created = await createHistoryEntry(newEntry);
      setEntries((prev) => [created, ...prev]);
      setIsCreating(false);
      setNewEntry({
        year: new Date().getFullYear(),
        language: i18n.resolvedLanguage ?? "nl",
        title: "",
        content: "",
      });
    } catch (err) {
      window.alert(
        t("history.messages.createFailed", {
          error: err instanceof Error ? err.message : String(err),
        })
      );
    }
  }
  function renderMain() {
    return (
      <main>
        <title>{`${t("nav.history")} | VIERNULVIER`}</title>
        {renderHeroSection()}
        {renderContentSection()}
      </main>
    );
  }

  function renderHeroSection() {
    return (
      <section className="relative h-screen w-full overflow-hidden">
        <img
          data-testid="history-hero"
          key={HERO_IMAGES[0]}
          src={HERO_IMAGES[0]}
          alt={t("history.heroAlt")}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000`}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <h1 className="font-serif text-[clamp(3rem,7vw,6rem)] text-[#f0e4d3] italic drop-shadow-lg">
            {t("history.title")}
          </h1>
        </div>
      </section>
    );
  }

  function renderContentSection() {
    return (
      <section className="mx-6 md:mx-10">
        <div className="mx-auto max-w-5xl py-12">
          <div className="border-archive-accent/10 mx-auto max-w-4xl border-l-2 pr-[clamp(1rem,3vw,2rem)] pb-12 pl-[clamp(1rem,3vw,3rem)] xl:max-w-7xl">
            {isLoading
              ? renderLoadingState()
              : errorMessage
                ? renderErrorState()
                : entries.length > 0
                  ? renderEntriesList()
                  : renderEmptyState()}
          </div>
        </div>
      </section>
    );
  }

  function renderLoadingState() {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="font-serif text-3xl italic opacity-60">{t("history.loading")}</p>
      </div>
    );
  }

  function renderErrorState() {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
        <p className="font-serif text-3xl italic opacity-60">
          {t("history.errorTitle")}
        </p>
        <p className="mt-3 max-w-2xl opacity-70">{errorMessage}</p>
      </div>
    );
  }

  function renderEmptyState() {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
        <p className="font-serif text-3xl italic opacity-60">
          {t("history.empty.title")}
        </p>
        <p className="mt-3 max-w-2xl opacity-70">{t("history.empty.description")}</p>
      </div>
    );
  }

  function renderEntriesList() {
    return (
      <div className="space-y-16">
        <Protected permissions={[ARCHIVE_PERMISSIONS.create]}>
          <div className="mb-6 flex items-start gap-3">
            {!isCreating ? renderCreateButton() : renderCreateForm()}
          </div>
        </Protected>
        {entries.map((entry) => (
          <HistoryEntry
            key={`${entry.year}-${entry.language}`}
            entryYear={entry.year}
            entryLanguage={entry.language}
            year={entry.year}
            language={entry.language}
            title={entry.title ?? String(entry.year)}
            description={entry.content}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        ))}
      </div>
    );
  }

  function renderCreateButton() {
    return (
      <button
        className={`${actionButtonClass} bg-archive-accent hover:bg-archive-accent/90 text-white`}
        onClick={() => setIsCreating(true)}
      >
        {t("history.edit.create")}
      </button>
    );
  }

  function renderCreateForm() {
    return (
      <div className="bg-archive-paper w-full rounded border p-4">
        <div className="mb-2 flex gap-2">
          <input
            aria-label={t("history.form.labels.year")}
            placeholder={t("history.form.placeholders.year")}
            value={String(newEntry.year)}
            onChange={(e) =>
              setNewEntry((prev) => ({
                ...prev,
                year: Number(e.target.value),
              }))
            }
            className="w-24 rounded border px-2 py-1"
          />
          <input
            aria-label={t("history.form.labels.title")}
            placeholder={t("history.form.placeholders.title")}
            value={newEntry.title ?? undefined}
            onChange={(e) =>
              setNewEntry((prev) => ({
                ...prev,
                title: e.target.value,
              }))
            }
            className="flex-1 rounded border px-2 py-1"
          />
        </div>
        <textarea
          aria-label={t("history.form.labels.content")}
          placeholder={t("history.form.placeholders.content")}
          value={newEntry.content}
          onChange={(e) =>
            setNewEntry((prev) => ({
              ...prev,
              content: e.target.value,
            }))
          }
          rows={4}
          className="mb-2 w-full rounded border px-2 py-1"
        />
        <div className="flex gap-2">
          <button
            className={`${actionButtonClass} bg-archive-accent hover:bg-archive-accent/90 cursor-pointer text-white`}
            onClick={handleCreate}
          >
            {t("history.edit.submit")}
          </button>
          <button
            className={`${actionButtonClass} bg-archive-control hover:bg-archive-control/80 cursor-pointer`}
            onClick={() => setIsCreating(false)}
          >
            {t("history.edit.cancel")}
          </button>
        </div>
      </div>
    );
  }

  return renderMain();
}
