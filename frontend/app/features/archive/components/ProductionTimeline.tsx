import { useParams } from "react-router";
import { ProductionCard } from "./ProductionCard";
import { Divider } from "@mui/material";
import type { Production } from "../types/productionTypes";
import { useTranslation } from "react-i18next";
import { getLongMonthName } from "~/shared/utils/dateFormatting";

type GroupedProductions = Map<number, Map<number, Production[]>>;

export enum ArchiveSortOrder {
  NewestFirst = "NewestFirst",
  OldestFirst = "OldestFirst",
}

const UNKNOWN_YEAR_OR_MONTH = -1;

// Returns a sorting function to sort a list of numbers based on the ArchiveSortOrder enum
function getSortFunction(sortOrder?: ArchiveSortOrder): (list: number[]) => number[] {
  const direction =
    sortOrder === ArchiveSortOrder.NewestFirst
      ? -1
      : sortOrder === ArchiveSortOrder.OldestFirst
        ? 1
        : 0;

  if (direction === 0) return (list) => list;

  return (list) =>
    list.sort((a, b) => {
      // Ensure unknown appears last
      if (a === UNKNOWN_YEAR_OR_MONTH) return 1;
      if (b === UNKNOWN_YEAR_OR_MONTH) return -1;

      // Actual sort
      return direction * (a - b);
    });
}

function getEarliestProductionStartDate(production: Production): Date | null {
  return production.eventsExpanded
    ? production.eventsExpanded.reduce<Date | null>((min, event) => {
        if (!event.starts_at) return min;

        const current = new Date(event.starts_at);
        return !min || current < min ? current : min;
      }, null)
    : null;
}

// Groups productions per year per month
function groupProductions(productions: Production[]): GroupedProductions {
  const grouped: GroupedProductions = new Map();

  for (const prod of productions) {
    const date = getEarliestProductionStartDate(prod);
    const year = date ? date.getFullYear() : -1;
    const month = date ? date.getMonth() : -1;

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
  const { t } = useTranslation();

  return (
    <div>
      {/* Sticky month */}
      {month != -1 ? (
        <div className="bg-archive-paper/80 sticky top-20 z-30 mb-3 flex min-h-14 items-center gap-3 overflow-visible backdrop-blur-[14px]">
          <div className="upper text-[14px] font-bold tracking-[0.28em] uppercase opacity-25">
            {month == -1 ? t("Unknown") : getLongMonthName(month, lang)}
          </div>
          <Divider className="bg-archive-ink/15 flex-1" />
        </div>
      ) : (
        <div className="py-3">
          {/* If we don't display the month, create some padding between year and card */}
        </div>
      )}

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
  sortOrder,
}: {
  productionsPerMonth: Map<number, Production[]>;
  year: number;
  sortOrder?: ArchiveSortOrder;
}) {
  const { t } = useTranslation();
  const months = [...productionsPerMonth.keys()];

  const sortFunction = getSortFunction(sortOrder);

  return (
    <div>
      <h2 className="mt-5 min-h-18 font-serif text-6xl font-black tracking-tighter opacity-20 transition-all">
        {year == -1 ? t("archive.unknownDate") : year}
      </h2>
      <Divider className="bg-archive-accent/15 flex-1" />

      {sortFunction(months).map((month) => (
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
  sortOrder,
}: {
  productions: Production[];
  className?: string;
  sortOrder?: ArchiveSortOrder;
}) {
  const groupedProductions = groupProductions(productions);
  const years = [...groupedProductions.keys()];

  const sortFunction = getSortFunction(sortOrder);

  return (
    <div className={className}>
      {sortFunction(years).map((year) => (
        <YearDisplay
          key={`productions-y${year}`}
          productionsPerMonth={groupedProductions.get(year)!}
          year={year}
          sortOrder={sortOrder}
        />
      ))}
    </div>
  );
}
