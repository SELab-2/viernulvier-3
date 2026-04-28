export function HistoryEntry({
  year,
  title,
  description,
}: {
  year: number;
  title: string;
  description: string;
}) {
  return (
    <div className="relative pl-[clamp(1.75rem,4vw,3rem)]">
      <div className="bg-archive-accent border-archive-paper absolute top-4 -left-[clamp(0.375rem,0.7vw,0.5625rem)] h-[clamp(0.625rem,1.2vw,1rem)] w-[clamp(0.625rem,1.2vw,1rem)] rounded-full border-[clamp(2px,0.35vw,4px)]" />
      <p className="mb-2 font-sans text-[0.7rem] tracking-[0.28em] text-archive-ink/60 uppercase">
        {year}
      </p>
      <h3 className="mb-4 font-serif text-[clamp(1.5rem,2.5vw,2.25rem)] italic">
        {" "}
        {title}{" "}
      </h3>
      <p className="text-[clamp(1rem,1.5vw,1.25rem)] leading-relaxed italic opacity-70">
        {" "}
        {description}{" "}
      </p>
    </div>
  );
}
