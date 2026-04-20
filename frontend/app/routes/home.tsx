import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";
import { getArchiveStatistics } from "~/features/archive/services/statisticsService";
import { useAsyncFetch } from "~/shared/hooks/useAsyncFetch";
import { useLocalizedPath } from "~/shared/hooks/useLocalizedPath";

function HomeStatistic({ count, label }: { count: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="font-serif text-3xl tracking-tighter italic md:text-4xl"
        data-count={count}
      >
        {count.toLocaleString()}
      </div>
      <div className="mt-1 text-[9px] font-bold tracking-[0.3em] uppercase opacity-40">
        {label}
      </div>
    </div>
  );
}

function HomeButton({
  location,
  name,
  variant = "primary",
}: {
  location: string;
  name: string;
  variant?: "primary" | "secondary";
}) {
  const lp = useLocalizedPath();

  const base =
    "px-8 md:px-10 py-4 rounded-full text-xs md:text-sm font-bold uppercase tracking-[0.2em] transition-all inline-block hover:scale-105 shadow-xl shadow-archive-ink/10";

  const styles = {
    primary: "bg-archive-ink text-archive-paper",
    secondary: "border border-archive-ink/20",
  };

  return (
    <NavLink
      to={lp(location)}
      data-testid={`home-button-${name}`}
      className={`${base} ${styles[variant]}`}
    >
      {name}
    </NavLink>
  );
}

export default function Home() {
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
        <div className="border-archive-ink/5 mb-16 flex flex-wrap items-center justify-center gap-x-12 gap-y-10 border-y py-10 opacity-80 sm:gap-x-16">
          <HomeStatistic count={productionsCount} label={t("home.stats.productions")} />
          <HomeStatistic count={eventsCount} label={t("home.stats.events")} />
          <HomeStatistic count={artistsCount} label={t("home.stats.artists")} />
          <HomeStatistic count={tagsCount} label={t("home.stats.genres")} />
        </div>

        <div className="flex flex-col justify-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-8">
          <HomeButton location="archive" name={t("home.buttons.explore")} />
          <HomeButton
            location="history"
            name={t("home.buttons.history")}
            variant="secondary"
          />
        </div>
      </div>
    </main>
  );
}
