import { useTranslation } from "react-i18next";
import { getArchiveStatistics } from "~/features/archive/services/statisticsService";
import { useAsyncFetch } from "~/shared/hooks/useAsyncFetch";
import { HomeStatistic } from "../components/homeStatistic";
import NavigateButton from "~/shared/components/NavigateButton";

export default function HomePage() {
  const { t } = useTranslation();
  const { data: statistics } = useAsyncFetch(getArchiveStatistics);

  const productionsCount = statistics?.productions_count ?? 0;
  const eventsCount = statistics?.events_count ?? 0;
  const artistsCount = statistics?.unique_artists_count ?? 0;
  const tagsCount = statistics?.tags_count ?? 0;

  return (
    <main>
      <title>{`${t("nav.home")} | VIERNULVIER`}</title>
      <div className="mx-auto max-w-4xl py-12 text-center md:py-24">
        <h1 className="mb-6 font-serif text-5xl italic md:mb-12 md:text-8xl">
          {t("home.title")}
        </h1>
        <p className="mb-10 text-lg leading-relaxed font-light opacity-70 md:mb-16 md:text-2xl">
          {t("home.description")}
        </p>
        <p>Testing buildx in CI actions</p>
        <div className="border-archive-ink/5 mx-auto mb-16 grid max-w-sm grid-cols-2 items-center gap-y-10 border-y py-10 opacity-80 sm:flex sm:max-w-none sm:flex-wrap sm:justify-center sm:gap-x-16">
          <HomeStatistic count={productionsCount} label={t("home.stats.productions")} />
          <HomeStatistic count={eventsCount} label={t("home.stats.events")} />
          <HomeStatistic count={artistsCount} label={t("home.stats.artists")} />
          <HomeStatistic count={tagsCount} label={t("home.stats.genres")} />
        </div>

        <div className="flex flex-col justify-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-8">
          <NavigateButton location="archive" name={t("home.buttons.explore")} />
          <NavigateButton
            location="history"
            name={t("home.buttons.history")}
            variant="secondary"
          />
        </div>
      </div>
    </main>
  );
}
