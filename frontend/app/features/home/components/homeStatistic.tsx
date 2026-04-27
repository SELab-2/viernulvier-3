export function HomeStatistic({ count, label }: { count: number; label: string }) {
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
