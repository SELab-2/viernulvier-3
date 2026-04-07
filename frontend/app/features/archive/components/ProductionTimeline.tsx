import { ProductionCard, type ProductionCardData } from "./ProductionCard";

function MonthDisplay({
  productions,
  year,
  month,
}: {
  productions: ProductionCardData[];
  year: number;
  month: number;
}) {
  return (
    <>
      {/* Sticky month */}
      <div className="z-30 mb-3 flex items-center gap-3">
        <div className="text-xs font-bold opacity-25">
          {new Date(0, month).toLocaleString("en", { month: "long" })}{" "}
          {/* TODO: Make this take locale */}
        </div>
        <div className="bg-archive-ink/5 h-px flex-1"></div>
      </div>
      {/* Productions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
        {productions
          .filter((prod) => {
            const date = prod.starts_at ? new Date(prod.starts_at) : new Date();
            return date.getFullYear() === year && date.getMonth() === month;
          })
          .map((prod) => (
            <ProductionCard production={prod} />
          ))}
      </div>
    </>
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
    .map((prod) => {
      const d = prod.starts_at ? new Date(prod.starts_at) : new Date();
      return d.getMonth();
    })
    .filter((value, index, array) => array.indexOf(value) === index);

  return (
    <div className="">
      {/* YEAR HEADER */}
      <h2 className="font-serif text-4xl font-black tracking-tighter opacity-20 transition-all md:text-6xl">
        {year}
      </h2>

      {months.map((month) => (
        <MonthDisplay productions={productions} month={month} year={year} />
      ))}
    </div>
  );
}

export function ProductionTimeline({
  productions,
}: {
  productions: ProductionCardData[];
}) {
  // TODO do mapping and filters once and use result everywhere instead of repeatedly filtering
  const years: number[] = productions
    .map((prod) => {
      const d = prod.starts_at ? new Date(prod.starts_at) : new Date();
      return d.getFullYear();
    })
    .filter((value, index, array) => array.indexOf(value) === index);

  return (
    <div className="">
      {years.map((year) => (
        <YearDisplay productions={productions} year={year} />
      ))}
    </div>
  );
}
