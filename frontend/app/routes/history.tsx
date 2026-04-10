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

export default function History() {
  const { t } = useTranslation();
  const entries = t("history.entries", { returnObjects: true }) as Record<string, { title: string; description: string }>;

  return (
    <div className="max-w-3xl mx-auto py-12">
      <h1 className="font-serif text-6xl mb-12 italic">{t("history.title")}</h1> 
      <div className="space-y-16 border-l-2 border-archive-accent/10 pb-12 max-w-2xl mx-auto">
        {Object.values(entries).map((entry) => (
          <HistoryEntry key={entry.title} title={entry.title} description={entry.description} />
        ))}
      </div>
    </div>
  );
}
