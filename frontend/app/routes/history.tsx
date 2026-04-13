import { useTranslation } from "react-i18next";

function HistoryEntry({ title, description }: { title: string; description: string }) {
  return (
    <div className="relative pl-12">
      <div className="bg-archive-accent border-archive-paper absolute top-4 -left-[9px] h-4 w-4 rounded-full border-4" />
      <h3 className="mb-4 font-serif text-[clamp(1.5rem,2.5vw,2.25rem)] italic">
        {title}
      </h3>
      <p className="text-[clamp(1rem,1.5vw,1.25rem)] leading-relaxed italic opacity-70">
        {" "}
        {description}
      </p>
    </div>
  );
}

const HERO_IMAGES = ["/images/1914_Inhuldiging.jpg"];

export default function History() {
  const { t } = useTranslation();

  type HistoryEntry = {
    title: string;
    description: string;
  };

  const entries = t("history.entries", {
    returnObjects: true,
  }) as HistoryEntry[];

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
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <h1 className="font-serif text-[clamp(3rem,7vw,6rem)] text-[#f0e4d3] italic drop-shadow-lg">
            {t("history.title")}
          </h1>
        </div>
      </section>
      <section>
        <div className="mx-auto max-w-5xl py-12">
          <div className="border-archive-accent/10 mx-auto max-w-4xl space-y-16 border-l-2 pr-[clamp(1rem,3vw,2rem)] pb-12 pl-[clamp(1rem,3vw,3rem)] xl:max-w-7xl">
            {" "}
            {entries.map((entry) => (
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
