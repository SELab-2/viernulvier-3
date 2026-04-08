import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import type { ProductionInfo } from "~/features/archive/types/productionTypes";

import type { ProductionCardData } from "./ProductionCard";

interface ProductionPageProps {
  production: ProductionCardData;
  preferredLanguage?: string;
}

function getProductionInfoByLanguage(
  productionInfos: ProductionInfo[] | undefined,
  language: string
): ProductionInfo | undefined {
  if (!productionInfos || productionInfos.length === 0) {
    return undefined;
  }

  const languageMatch = productionInfos.find((info) => info.language === language);
  if (languageMatch) {
    return languageMatch;
  }

  const dutchMatch = productionInfos.find((info) => info.language === "nl");
  return dutchMatch ?? productionInfos[0];
}

function getTextOrDefault(value: string | null | undefined, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : fallback;
}

// search for given language, if not found fall back to "nl", if "nl" not just take first translation
function getTagNamesByLanguage(
  production: ProductionCardData,
  language: string
): string[] {
  if (production.tag_names && production.tag_names.length > 0) {
    return production.tag_names;
  }

  if (!production.tags || production.tags.length === 0) {
    return [];
  }

  return production.tags
    .map((tag) => {
      const languageMatch = tag.names.find((name) => name.language === language);
      if (languageMatch?.name) {
        return languageMatch.name;
      }

      const defaultMatch = tag.names.find((name) => name.language === "nl");
      return defaultMatch?.name ?? tag.names[0]?.name;
    })
    .filter((name): name is string => typeof name === "string" && name.length > 0);
}

export function ProductionPage({
  production,
  preferredLanguage = "nl",
}: ProductionPageProps) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? preferredLanguage;

  const productionInfo = getProductionInfoByLanguage(
    production.production_infos,
    language
  );

  const title = getTextOrDefault(
    productionInfo?.title,
    t("productionPage.fallback.unknownProduction")
  );
  const supertitle = getTextOrDefault(
    productionInfo?.supertitle,
    t("productionPage.fallback.archive")
  );
  const artist = getTextOrDefault(
    productionInfo?.artist,
    t("productionPage.fallback.defaultArtist")
  );
  const tagline = getTextOrDefault(
    productionInfo?.tagline,
    t("productionPage.fallback.noDescription")
  );
  const startsAt = getTextOrDefault(
    production.starts_at,
    t("productionPage.fallback.dateTbd")
  );
  const hallName = getTextOrDefault(
    production.hall_name,
    t("productionPage.fallback.locationTbd")
  );
  const imageUrl = getTextOrDefault(
    production.image_url,
    "https://images.unsplash.com/photo-1518998053901-5348d3961a04?q=80&w=1600&auto=format&fit=crop"
  );
  const imageUrls = [imageUrl];
  const tags = getTagNamesByLanguage(production, language);

  return (
    <div className="bg-archive-paper text-archive-ink min-h-screen">
      <main className="mx-auto w-full max-w-[1400px] px-6 pt-10 pb-16 md:px-12">
        <div className="flex flex-col gap-4">
          <Link
            to="/"
            className="font-sans text-[0.68rem] tracking-[0.24em] uppercase no-underline opacity-70 transition hover:opacity-100"
          >
            {t("productionPage.backToCollection")}
          </Link>

          <section className="relative overflow-hidden rounded-[2rem] border border-[color:color-mix(in_srgb,var(--archive-accent)_12%,transparent)] bg-black/30">
            <img
              src={imageUrl}
              alt={title}
              className="h-[280px] w-full object-cover object-center md:h-[360px]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
            <div className="absolute right-7 bottom-8 left-7 md:right-12 md:bottom-10 md:left-12">
              <p className="font-sans text-[0.65rem] tracking-[0.28em] text-white/72 uppercase">
                {supertitle}
              </p>
              <h1 className="mt-2 font-serif text-5xl leading-[1.03] text-[#f0e4d3] md:text-7xl">
                {title}
              </h1>
              <p className="archive-artist-chic mt-2 text-xl text-[#f0e4d3]/90 md:text-2xl">
                {artist}
              </p>
            </div>
          </section>
        </div>

        <ul className="mt-6 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li
              key={tag}
              className="bg-archive-control rounded-full border border-[color:color-mix(in_srgb,var(--archive-accent)_24%,transparent)] px-4 py-1.5 text-[0.68rem] tracking-[var(--archive-tracking-label)] uppercase"
            >
              {tag}
            </li>
          ))}
        </ul>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <article className="space-y-6 text-[1.06rem] leading-[1.62] opacity-92">
            <p>{tagline}</p>
            <p>
              {t("productionPage.body.referenceAndContext", {
                reference: production.id_url ?? production.id,
              })}
            </p>
            <p>{t("productionPage.body.exploreSimilar")}</p>
          </article>

          <aside className="bg-archive-surface-strong h-fit rounded-[1.75rem] border border-[color:color-mix(in_srgb,var(--archive-accent)_16%,transparent)] p-6">
            <h2 className="text-[0.68rem] tracking-[0.25em] uppercase opacity-70">
              {t("productionPage.archiveSchema")}
            </h2>

            <div className="mt-6 space-y-4">
              <div className="border-b border-[color:color-mix(in_srgb,var(--archive-accent)_15%,transparent)] pb-4">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-serif text-[1.35rem] leading-tight italic">
                    {startsAt}
                  </span>
                  <span className="text-xs tracking-[0.16em] opacity-72">
                    {t("productionPage.startTime")}
                  </span>
                </div>
                <p className="mt-2 text-xs tracking-[0.2em] uppercase opacity-62">
                  {hallName}
                </p>
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-16 border-t border-[color:color-mix(in_srgb,var(--archive-accent)_14%,transparent)] pt-14">
          <div className="mb-8 flex items-end justify-between gap-6">
            <h2 className="font-serif text-4xl italic opacity-85 md:text-6xl">
              {t("productionPage.visualEvidence")}
            </h2>
            <p className="text-[0.68rem] tracking-[0.22em] uppercase opacity-60">
              {t("productionPage.archiveFragments", { count: imageUrls.length })}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {imageUrls.map((url, index) => (
              <figure
                // NOTE remove ?? after we fully switch to production.id_url
                key={`${production.id_url ?? production.id}-${url}-${index}`}
                className="group bg-archive-surface overflow-hidden rounded-2xl border border-[color:color-mix(in_srgb,var(--archive-accent)_12%,transparent)]"
              >
                <img
                  src={url}
                  alt={t("productionPage.archivePhotoAlt", {
                    title,
                    index: index + 1,
                  })}
                  loading="lazy"
                  className="h-40 w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
                <figcaption className="px-4 py-3 text-sm opacity-85">
                  {t("productionPage.archivePhotoCaption", {
                    title,
                    index: index + 1,
                  })}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
