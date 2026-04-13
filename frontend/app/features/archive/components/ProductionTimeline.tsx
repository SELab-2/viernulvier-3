import { useParams } from "react-router";
import { ProductionCard } from "./ProductionCard";
import { Divider } from "@mui/material";
import type { Production } from "../types/productionTypes";

type GroupedProductions = Map<number, Map<number, Production[]>>;

// Get the name of the nth month, note that the months are 0-indexed because javascript...
function getMonthName(n: number, lang?: string) {
  return new Date(0, n).toLocaleString(lang, { month: "long" });
}

// Groups productions per year per month
function groupProductions(productions: Production[]): GroupedProductions {
  const grouped: GroupedProductions = new Map();

  for (const prod of productions) {
    const date = prod.starts_at ? new Date(prod.starts_at) : new Date();
    const year = date.getFullYear();
    const month = date.getMonth();

    if (!grouped.has(year)) grouped.set(year, new Map());
    const yearGroup = grouped.get(year)!;

    if (!yearGroup.has(month)) yearGroup.set(month, []);
    yearGroup.get(month)!.push(prod);
  }

  return grouped;
}

function MonthDisplay({
  productions,
  month,
}: {
  productions: Production[];
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
        <Divider className="bg-archive-ink/15 flex-1" />
      </div>

      {/* Productions */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {productions.map((prod) => (
          <ProductionCard key={prod.id} production={prod} className="" />
        ))}
      </div>
    </div>
  );
}

function YearDisplay({
  productionsPerMonth,
  year,
}: {
  productionsPerMonth: Map<number, Production[]>;
  year: number;
}) {
  const months = [...productionsPerMonth.keys()];

  return (
    <div>
      <h2 className="mt-5 min-h-18 font-serif text-6xl font-black tracking-tighter opacity-20 transition-all">
        {year}
      </h2>
      <Divider className="bg-archive-accent/15 flex-1" />

      {months
        .sort()
        .reverse()
        .map((month) => (
          <MonthDisplay
            key={`productions-y${year}-m${month}`}
            productions={productionsPerMonth.get(month)!}
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
  productions: Production[];
  className?: string;
}) {
  const groupedProductions = groupProductions(productions);
  const years = [...groupedProductions.keys()];

  return (
    <div className={className}>
      {years
        .sort()
        .reverse()
        .map((year) => (
          <YearDisplay
            key={`productions-y${year}`}
            productionsPerMonth={groupedProductions.get(year)!}
            year={year}
          />
        ))}
    </div>
  );
}
