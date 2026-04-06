import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";
import { useLocalizedPath } from "~/shared/hooks/useLocalizedPath";

function HomeStatistic({ count, label }: { count: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="font-serif text-3xl md:text-4xl italic tracking-tighter" data-count={count}>{count.toLocaleString()}</div>
      <div className="text-[9px] uppercase tracking-[0.3em] font-bold opacity-40 mt-1">{label}</div>
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
    "px-8 md:px-10 py-4 rounded-full text-xs md:text-sm font-bold uppercase tracking-[0.2em] transition-all inline-block";

  const styles = {
    primary:
      "bg-archive-ink text-archive-paper hover:scale-105 shadow-xl shadow-archive-ink/10",
    secondary:
      "border border-archive-ink/20 hover:bg-archive-ink/5",
  };

  return (
    <NavLink to={lp(location)} data-testid={`home-button-${name}`} className={`${base} ${styles[variant]}`}>
      {name}
    </NavLink>
  );
}

export default function Home() {
  const { t } = useTranslation();
  
  return (
    <main>
      <title>{`${t("nav.home")} | VIERNULVIER`}</title>
        <div className="py-12 md:py-24 text-center max-w-4xl mx-auto">
          <h1 className="font-serif text-5xl md:text-8xl mb-6 md:mb-12 italic">{t("home.title")}</h1>
          <p className="text-lg md:text-2xl opacity-70 font-light leading-relaxed mb-10 md:mb-16">
              {t("home.description")}
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-10 sm:gap-x-16 mb-16 opacity-80 border-y border-archive-ink/5 py-10">
              {/* Deze cijfers zijn placeholders en moeten nog vervangen worden (vanaf endpoint beschikbaar is). */}
              <HomeStatistic count={1254} label={t("home.stats.productions")} />
              <HomeStatistic count={4037} label={t("home.stats.events")} />
              <HomeStatistic count={248} label={t("home.stats.artists")} />
              <HomeStatistic count={56} label={t("home.stats.genres")} />
          </div>

          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-8">
              <HomeButton location="archive" name={t("home.buttons.explore")} />
              <HomeButton location="history" name={t("home.buttons.history")} variant="secondary" />
          </div>
      </div>
    </main>
  );
}
