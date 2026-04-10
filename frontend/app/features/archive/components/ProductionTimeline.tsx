import { useParams } from "react-router";
import { ProductionCard, type ProductionCardData } from "./ProductionCard";

// Get the name of the nth month, note that the months are 0-indexed because javascript...
function getMonthName(n: number, lang?: string) {
  return new Date(0, n).toLocaleString(lang, { month: "long" });
}

function MonthDisplay({
  productions,
  year,
  month,
}: {
  productions: ProductionCardData[];
  year: number;
  month: number;
}) {
  const { lang } = useParams();
  return (
    <div>
      {/* Sticky month */}
      <div className="bg-archive-paper/80 sticky top-20 z-30 mb-3 flex min-h-14 items-center gap-3 overflow-visible backdrop-blur-[14px]">
        <div className="text-[14px] font-bold tracking-[0.28em] opacity-25">
          {getMonthName(month, lang).toUpperCase()}
        </div>
        <div className="bg-archive-ink/15 h-px flex-1"></div>
      </div>

      {/* Productions */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {productions
          .filter((prod) => {
            const date = prod.starts_at ? new Date(prod.starts_at) : new Date();
            return date.getFullYear() === year && date.getMonth() === month;
          })
          .map((prod) => (
            <ProductionCard key={prod.id} production={prod} className="" />
          ))}
      </div>
    </div>
  );
}

function YearDisplay({
  productions,
  year,
}: {
  productions: ProductionCardData[];
  year: number;
}) {
  const months = productions
    .filter((prod) => prod.starts_at && new Date(prod.starts_at).getFullYear() == year)
    .map((prod) => {
      const d = prod.starts_at ? new Date(prod.starts_at) : new Date();
      return d.getMonth();
    })
    .filter((value, index, array) => array.indexOf(value) === index);

  return (
    <div>
      <h2 className="mt-5 min-h-18 font-serif text-6xl font-black tracking-tighter opacity-20 transition-all">
        {year}
      </h2>
      <div className="bg-archive-ink/5 h-px flex-1"></div>

      {months
        .sort()
        .reverse()
        .map((month) => (
          <MonthDisplay
            key={`productions-y${year}-m${month}`}
            productions={productions}
            month={month}
            year={year}
          />
        ))}
    </div>
  );
}

export function ProductionTimeline({
  productions,
  className,
}: {
  productions: ProductionCardData[];
  className?: string;
}) {
  // TODO do mapping and filters once and use result everywhere instead of repeatedly filtering
  const years: number[] = productions
    .map((prod) => {
      const d = prod.starts_at ? new Date(prod.starts_at) : new Date();
      return d.getFullYear();
    })
    .filter((value, index, array) => array.indexOf(value) === index);

  return (
    <div className={className}>
      {years
        .sort()
        .reverse()
        .map((year) => (
          <YearDisplay
            key={`productions-y${year}`}
            productions={productions}
            year={year}
          />
        ))}
    </div>
  );
}
