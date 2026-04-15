import { useTranslation } from "react-i18next";
import NavigateButton from "~/shared/components/NavigateButton";

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

export default function Home() {
  const { t } = useTranslation();

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
          {/* Deze cijfers zijn placeholders en moeten nog vervangen worden (vanaf endpoint beschikbaar is). */}
          <HomeStatistic count={1254} label={t("home.stats.productions")} />
          <HomeStatistic count={4037} label={t("home.stats.events")} />
          <HomeStatistic count={248} label={t("home.stats.artists")} />
          <HomeStatistic count={56} label={t("home.stats.genres")} />
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
