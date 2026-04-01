import { Link } from "react-router";

import { ThemeToggle } from "~/shared/components/ThemeToggle";

import type { ProductionCardData } from "./ProductionCard";

interface ProductionInfoData {
  language: string;
  title?: string;
  supertitle?: string;
  artist?: string;
  tagline?: string;
}

interface ProductionPageProps {
  production: ProductionCardData;
  preferredLanguage?: string;
}

function getProductionInfoByLanguage(
  productionInfos: ProductionInfoData[] | undefined,
  language: string
): ProductionInfoData | undefined {
  if (!productionInfos || productionInfos.length === 0) {
    return undefined;
  }

  const languageMatch = productionInfos.find((info) => info.language === language);
  return languageMatch ?? productionInfos[0];
}

function getTextOrDefault(value: string | null | undefined, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : fallback;
}

function getListOrDefault<T>(value: T[] | null | undefined, fallback: T[]): T[] {
  return Array.isArray(value) ? value : fallback;
}

export function ProductionPage({ production, preferredLanguage = "nl" }: ProductionPageProps) {
  const productionInfo = getProductionInfoByLanguage(
    production.production_infos,
    preferredLanguage
  );

  const title = getTextOrDefault(productionInfo?.title, "Onbekende productie");
  const supertitle = getTextOrDefault(productionInfo?.supertitle, "Archief");
  const artist = getTextOrDefault(productionInfo?.artist, "viernulvier");
  const tagline = getTextOrDefault(
    productionInfo?.tagline,
    "Geen extra beschrijving beschikbaar voor deze productie."
  );
  const startsAt = getTextOrDefault(production.starts_at, "Datum nog te bepalen");
  const hallName = getTextOrDefault(production.hall_name, "Locatie nog te bepalen");
  const imageUrls = getListOrDefault(production.image_url, []);
  const imageUrl = getTextOrDefault(
    imageUrls[0],
    "https://images.unsplash.com/photo-1518998053901-5348d3961a04?q=80&w=1600&auto=format&fit=crop"
  );
  const tags = getListOrDefault(production.tag_names, []);

  return (
    <div className="bg-archive-paper text-archive-ink min-h-screen">
      <header className="border-archive-border bg-archive-surface sticky top-0 z-50 border-b backdrop-blur-[14px] [backdrop-filter:blur(14px)]">
        <div className="mx-auto flex h-20 max-w-[1800px] items-center justify-between px-6 md:px-24">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[inherit] no-underline"
            aria-label="VIERNULVIER Archief"
          >
            <img
              src="/logo.svg"
              alt=""
              className="h-8 w-auto md:h-10"
              style={{ filter: "var(--archive-logo-filter)" }}
            />
            <span
              aria-hidden="true"
              className="font-serif text-base italic opacity-50 md:text-[1.125rem]"
            >
              Archief
            </span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1200px] px-6 pb-16 pt-10 md:px-12">
        <Link
          to="/"
          className="font-sans text-[0.68rem] uppercase tracking-[0.24em] opacity-70 no-underline transition hover:opacity-100"
        >
          &larr; Terug Naar De Collectie
        </Link>

        <section className="relative mt-6 overflow-hidden rounded-[2rem] border border-[color:color-mix(in_srgb,var(--archive-accent)_12%,transparent)] bg-black/30">
          <img
            src={imageUrl}
            alt={title}
            className="h-[320px] w-full object-cover object-center md:h-[430px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
          <div className="absolute bottom-8 left-7 right-7 md:bottom-10 md:left-12 md:right-12">
            <p className="font-sans text-[0.65rem] uppercase tracking-[0.28em] text-white/72">
              {supertitle}
            </p>
            <h1 className="font-serif mt-2 text-5xl leading-[1.03] text-[#f0e4d3] md:text-7xl">
              {title}
            </h1>
            <p className="archive-artist-chic mt-2 text-xl text-[#f0e4d3]/90 md:text-2xl">
              {artist}
            </p>
          </div>
        </section>

        <ul className="mt-6 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li
              key={tag}
              className="border-[color:color-mix(in_srgb,var(--archive-accent)_24%,transparent)] bg-archive-control rounded-full border px-4 py-1.5 text-[0.68rem] uppercase tracking-[var(--archive-tracking-label)]"
            >
              {tag}
            </li>
          ))}
        </ul>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <article className="space-y-6 text-[1.06rem] leading-[1.62] opacity-92">
            <p>{tagline}</p>
            <p>
              Deze productie is opgenomen in het archief onder referentie {production.id_url}.
              Vanuit deze pagina bundelen we kerninfo, metadata en context op een leesbare
              manier.
            </p>
            <p>
              Gebruik de tags en de locatie rechts om gelijkaardige items in de collectie te
              verkennen.
            </p>
          </article>

          <aside className="border-[color:color-mix(in_srgb,var(--archive-accent)_16%,transparent)] bg-archive-surface-strong h-fit rounded-[1.75rem] border p-6">
            <h2 className="text-[0.68rem] uppercase tracking-[0.25em] opacity-70">
              Archief Schema
            </h2>

            <div className="mt-6 space-y-4">
              <div className="border-[color:color-mix(in_srgb,var(--archive-accent)_15%,transparent)] border-b pb-4">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-serif text-[1.35rem] leading-tight italic">
                    {startsAt}
                  </span>
                  <span className="text-xs tracking-[0.16em] opacity-72">Aanvang</span>
                </div>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] opacity-62">
                  {hallName}
                </p>
              </div>
            </div>
          </aside>
        </section>

        <section className="border-[color:color-mix(in_srgb,var(--archive-accent)_14%,transparent)] mt-16 border-t pt-14">
          <div className="mb-8 flex items-end justify-between gap-6">
            <h2 className="font-serif text-4xl italic opacity-85 md:text-6xl">
              Visueel Bewijsmateriaal
            </h2>
            <p className="text-[0.68rem] uppercase tracking-[0.22em] opacity-60">
              {imageUrls.length} Archieffragmenten
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {imageUrls.map((url, index) => (
              <figure
                key={`${production.id_url}-${url}-${index}`}
                className="group border-[color:color-mix(in_srgb,var(--archive-accent)_12%,transparent)] bg-archive-surface overflow-hidden rounded-2xl border"
              >
                <img
                  src={url}
                  alt={`${title} - archieffoto ${index + 1}`}
                  loading="lazy"
                  className="h-40 w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
                <figcaption className="px-4 py-3 text-sm opacity-85">
                  {title} - archieffoto {index + 1}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
