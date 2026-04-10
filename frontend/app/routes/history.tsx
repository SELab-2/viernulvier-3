import { useTranslation } from "react-i18next";

function HistoryEntry({ title, description }: { title: string; description: string }) {
  return (
    <div className="relative pl-12">
      <div className="absolute -left-[9px] top-4 w-4 h-4 rounded-full bg-archive-accent border-4 border-archive-paper dark:border-archive-paper-dark"></div>
      <h3 className="font-serif text-3xl mb-4 italic">{title}</h3>
      <p className="opacity-70 leading-relaxed italic">
        {description}
      </p>
    </div>
  );
}

const HERO_IMAGES = [
  "/public/images/1914_Inhuldiging.jpg",
];

export default function History() {
  const { t } = useTranslation();
  const entries = t("history.entries", { returnObjects: true }) as Record<string, { title: string; description: string }>;

  return (
    <>
      <section className="relative h-screen w-full overflow-hidden">
        <img data-testid="history-hero" key={HERO_IMAGES[0]} src={HERO_IMAGES[0]} alt={t("history.heroAlt")} className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000`}/>
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <h1 className="font-serif text-7xl md:text-9xl italic drop-shadow-lg">
            {t("history.title")}
          </h1>
        </div>
      </section>
      <section>
        <div className="max-w-3xl mx-auto py-12">
          <div className="space-y-16 border-l-2 border-archive-accent/10 pb-12 max-w-2xl mx-auto">
            {Object.values(entries).map((entry) => (
              <HistoryEntry key={entry.title} title={entry.title} description={entry.description} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
