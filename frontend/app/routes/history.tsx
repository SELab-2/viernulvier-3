import { useTranslation } from "react-i18next";

function HistoryEntry({ title, description }: { title: string; description: string }) {
  return (
    <div className="relative pl-12">
      <div className="bg-archive-accent border-archive-paper absolute top-4 -left-[9px] h-4 w-4 rounded-full border-4" />
      <h3 className="mb-4 font-serif italic text-[clamp(1.5rem,2.5vw,2.25rem)]">{title}</h3>
      <p className="italic leading-relaxed opacity-70 text-[clamp(1rem,1.5vw,1.25rem)]"> {description}</p>
    </div>
  );
}

const HERO_IMAGES = ["/public/images/1914_Inhuldiging.jpg"];

export default function History() {
  const { t } = useTranslation();
  const entries = t("history.entries", { returnObjects: true }) as Record<
    string,
    { title: string; description: string }
  >;

  return (
    <>
      <section className="relative h-screen w-full overflow-hidden">
        <img
          data-testid="history-hero"
          key={HERO_IMAGES[0]}
          src={HERO_IMAGES[0]}
          alt={t("history.heroAlt")}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000`}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <h1 className="font-serif italic text-[#f0e4d3] drop-shadow-lg text-[clamp(2.5rem,5vw,4.5rem)]">
            {t("history.title")}
          </h1>
        </div>
      </section>
      <section>
        <div className="mx-auto max-w-3xl py-12">
          <div className="border-archive-accent/10 mx-auto max-w-2xl space-y-16 border-l-2 pb-12 pl-[clamp(1rem,3vw,3rem)] pr-[clamp(1rem,3vw,2rem)]">
            {Object.values(entries).map((entry) => (
              <HistoryEntry
                key={entry.title}
                title={entry.title}
                description={entry.description}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
