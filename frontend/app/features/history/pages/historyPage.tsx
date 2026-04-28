import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { HistoryEntry } from "../components/historyEntry";
import { getHistoryEntries } from "~/features/history/services/historyService";
import type { HistoryEntryRecord } from "~/features/history/types/historyTypes";

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

  return (
    <main>
      <title>{`${t("nav.history")} | VIERNULVIER`}</title>
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
      <section className="mx-6 md:mx-10">
        <div className="mx-auto max-w-5xl py-12">
          <div className="border-archive-accent/10 mx-auto max-w-4xl border-l-2 pr-[clamp(1rem,3vw,2rem)] pb-12 pl-[clamp(1rem,3vw,3rem)] xl:max-w-7xl">
            {isLoading ? (
              <div className="flex min-h-[40vh] items-center justify-center">
                <p className="font-serif text-3xl italic opacity-60">{t("history.loading")}</p>
              </div>
            ) : errorMessage ? (
              <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
                <p className="font-serif text-3xl italic opacity-60">{t("history.errorTitle")}</p>
                <p className="mt-3 max-w-2xl opacity-70">{errorMessage}</p>
              </div>
            ) : entries.length > 0 ? (
              <div className="space-y-16">
                {entries.map((entry) => (
                  <HistoryEntry
                    key={entry.id_url}
                    year={entry.year}
                    title={entry.title ?? String(entry.year)}
                    description={entry.content}
                  />
                ))}
              </div>
            ) : (
              <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
                <p className="font-serif text-3xl italic opacity-60">{t("history.empty.title")}</p>
                <p className="mt-3 max-w-2xl opacity-70">{t("history.empty.description")}</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
