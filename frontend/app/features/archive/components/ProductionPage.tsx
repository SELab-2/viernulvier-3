import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";

import type {
  Production,
  ProductionInfo,
} from "~/features/archive/types/productionTypes";
import type { Event, Price } from "~/features/archive/types/eventTypes";
import { useLocalizedPath } from "~/shared/hooks/useLocalizedPath";
import { getEventByUrl, getPriceByUrl } from "~/features/archive/services/eventService";
import { getHallByUrl } from "~/features/archive/services/hallService";
import { EventCard, type EventWithResolvedRelations } from "./EventCard";
import { ProductionPageMediaGallery } from "./ProductionPageMediaGallery";

interface ProductionPageProps {
  production: Production;
  preferredLanguage?: string;
}

function getProductionInfoByLanguage(
  productionInfos: ProductionInfo[],
  language: string
): ProductionInfo {
  const languageMatch = productionInfos.find((info) => info.language === language);
  if (languageMatch) {
    return languageMatch;
  }

  // fallback to dutch first, then fallback to first available translation
  const defaultMatch = productionInfos.find((info) => info.language === "nl");
  return defaultMatch ?? productionInfos[0];
}

function getTextOrDefault(value: string | null | undefined, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : fallback;
}

function getSanitizedHtmlOrUndefined(
  value: string | null | undefined
): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();
  if (trimmedValue.length === 0) {
    return undefined;
  }

  return DOMPurify.sanitize(trimmedValue);
}

function getEventTimestamp(startsAt?: string): number {
  if (!startsAt) {
    return Number.POSITIVE_INFINITY;
  }

  const parsedDate = new Date(startsAt);
  if (Number.isNaN(parsedDate.getTime())) {
    return Number.POSITIVE_INFINITY;
  }

  return parsedDate.getTime();
}

// prefer active language, then dutch, then first available tag name
function getTagNamesByLanguage(production: Production, language: string): string[] {
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

function BackToCollectionLink() {
  const { t } = useTranslation();
  const lp = useLocalizedPath();
  return (
    <Link
      id="back-to-collection"
      to={lp("/archive")}
      className="font-sans text-[0.68rem] tracking-[0.24em] uppercase no-underline opacity-70 transition hover:opacity-100"
    >
      {t("productionPage.backToCollection")}
    </Link>
  );
}

type ProductionHeaderProps = {
  production_info: ProductionInfo;
  image_url: string;
};

/* ProductionHeader contains main image, supertitle, title and artist */
function ProductionHeader({
  production_info,
  image_url: imageUrl,
}: ProductionHeaderProps) {
  const { t } = useTranslation();
  const title = getTextOrDefault(
    production_info?.title,
    t("productionPage.fallback.unknownProduction")
  );
  const supertitle = getTextOrDefault(
    production_info?.supertitle,
    t("productionPage.fallback.archive")
  );
  const artist = getTextOrDefault(
    production_info?.artist,
    t("productionPage.fallback.defaultArtist")
  );

  return (
    <section
      id="production-header"
      className="relative overflow-hidden rounded-[2rem] border border-[color:color-mix(in_srgb,var(--archive-accent)_12%,transparent)] bg-black/30"
    >
      <img
        src={imageUrl}
        alt={title}
        className="h-[280px] w-full object-cover object-center md:h-[360px]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
      <div className="absolute right-7 bottom-8 left-7 md:right-12 md:bottom-10 md:left-12">
        <p
          id="supertitle"
          className="font-sans text-[0.65rem] tracking-[0.28em] text-white/72 uppercase"
        >
          {supertitle}
        </p>
        <h1
          id="title"
          className="mt-2 font-serif text-5xl leading-[1.03] text-[#f0e4d3] md:text-7xl"
        >
          {title}
        </h1>
        <p
          id="artist"
          className="archive-artist-chic mt-2 text-xl text-[#f0e4d3]/90 md:text-2xl"
        >
          {artist}
        </p>
      </div>
    </section>
  );
}

type TagsProps = {
  performer_type?: string | undefined;
  tags: string[];
};

function Tags({ performer_type, tags }: TagsProps) {
  return (
    <section id="production-tags" aria-label="Production tags">
      <ul className="mt-6 flex flex-wrap gap-2">
        {/* Performer type badge */}
        {performer_type && (
          <li
            id="tag-performer-type"
            aria-label="Performer type"
            className="bg-archive-control rounded-full border border-[color:color-mix(in_srgb,var(--archive-accent)_40%,transparent)] px-4 py-1.5 text-[0.68rem] font-semibold tracking-[var(--archive-tracking-label)] uppercase opacity-90"
          >
            {performer_type}
          </li>
        )}

        {/* existing tags */}
        {tags.map((tag) => (
          <li
            key={tag}
            aria-label="Tag"
            className="bg-archive-control rounded-full border border-[color:color-mix(in_srgb,var(--archive-accent)_24%,transparent)] px-4 py-1.5 text-[0.68rem] tracking-[var(--archive-tracking-label)] uppercase"
          >
            {tag}
          </li>
        ))}
      </ul>
    </section>
  );
}

type EventsProps = {
  event_objects: EventWithResolvedRelations[];
};
function Events({ event_objects }: EventsProps) {
  const { t } = useTranslation();

  if (event_objects.length > 0) {
    return (
      <div id="events-listing">
        <ul className="mt-6 space-y-2.5">
          {event_objects.map((event) => (
            <EventCard event={event} />
          ))}
        </ul>
      </div>
    );
  } else {
    return (
      <div id="events-listing" className="mt-6">
        <p className="mt-1 text-sm opacity-75">
          {t("productionPage.fallback.noEvents")}
        </p>
      </div>
    );
  }
}

export function ProductionPage({
  production,
  preferredLanguage = "nl",
}: ProductionPageProps) {
  const { t, i18n } = useTranslation();
  const [mediaImageUrlsByProductionId] = useState<Record<string, string[]>>({});
  const [eventsWithDetails, setEventsWithDetails] = useState<
    EventWithResolvedRelations[]
  >([]);
  const language = i18n.resolvedLanguage ?? preferredLanguage;

  const productionInfo = getProductionInfoByLanguage(
    production.production_infos,
    language
  );

  const title = getTextOrDefault(
    productionInfo?.title,
    t("productionPage.fallback.unknownProduction")
  );
  const tagline = getTextOrDefault(productionInfo?.tagline, "");
  const teaserHtml = getSanitizedHtmlOrUndefined(productionInfo?.teaser);
  const descriptionHtml = getSanitizedHtmlOrUndefined(productionInfo?.description);
  const infoHtml = getSanitizedHtmlOrUndefined(productionInfo?.info);

  //TODO maybe an image saying no image found? Or something else? idk
  const fallbackImageUrl =
    "https://images.unsplash.com/photo-1518998053901-5348d3961a04?q=80&w=1600&auto=format&fit=crop";

  const imageUrl =
    mediaImageUrlsByProductionId[production.id_url]?.[0] ?? fallbackImageUrl;
  const tags = getTagNamesByLanguage(production, language);
  // keep events chronologically ordered for a predictable schedule list
  const eventObjects = useMemo(
    () =>
      eventsWithDetails.slice().sort((leftEvent, rightEvent) => {
        const startDifference =
          getEventTimestamp(leftEvent.starts_at) -
          getEventTimestamp(rightEvent.starts_at);

        if (startDifference !== 0) {
          return startDifference;
        }

        return leftEvent.id_url.localeCompare(rightEvent.id_url);
      }),
    [eventsWithDetails]
  );

  useEffect(() => {
    let isCancelled = false;

    const loadEventDetails = async () => {
      if (!isCancelled) {
        setEventsWithDetails([]);
      }

      try {
        if (production.event_id_urls.length === 0) {
          return;
        }

        const hydratedEvents = await Promise.all(
          production.event_id_urls.map(
            async (eventUrl): Promise<EventWithResolvedRelations | null> => {
              let event: Event | undefined;

              try {
                event = await getEventByUrl(eventUrl);
              } catch {
                return null;
              }

              if (!event) {
                return null;
              }

              const hallPromise = event.hall?.id_url
                ? getHallByUrl(event.hall.id_url).catch(() => undefined)
                : Promise.resolve(undefined);

              const pricesPromise =
                event.price_urls.length > 0
                  ? Promise.all(
                      event.price_urls.map(async (priceUrl) => {
                        try {
                          return await getPriceByUrl(priceUrl);
                        } catch {
                          return undefined;
                        }
                      })
                    ).then((prices) =>
                      prices.filter((price): price is Price => Boolean(price))
                    )
                  : Promise.resolve([] as Price[]);

              const [resolvedHall, resolvedPrices] = await Promise.all([
                hallPromise,
                pricesPromise,
              ]);

              return {
                ...event,
                resolvedHall,
                resolvedPrices,
              };
            }
          )
        );

        if (!isCancelled) {
          setEventsWithDetails(
            hydratedEvents.filter(
              (event): event is EventWithResolvedRelations => event !== null
            )
          );
        }
      } catch {
        if (!isCancelled) {
          setEventsWithDetails([]);
        }
      }
    };

    void loadEventDetails();

    return () => {
      isCancelled = true;
    };
  }, [production.event_id_urls]);

  return (
    <div className="bg-archive-paper text-archive-ink min-h-screen">
      <main className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-6 pt-10 pb-16 md:px-12">
        <BackToCollectionLink />
        <ProductionHeader production_info={productionInfo} image_url={imageUrl} />

        <Tags performer_type={production.performer_type} tags={tags} />

        <section id="production-events" className="mt-8">
          <article className="space-y-6 text-[1.06rem] leading-[1.62] opacity-92">
            {tagline && <p id="tagline">{tagline}</p>}

            {teaserHtml && (
              <div
                id="teaser"
                className="opacity-90"
                dangerouslySetInnerHTML={{ __html: teaserHtml }}
              />
            )}

            {descriptionHtml && (
              <div
                id="description"
                className="opacity-90"
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />
            )}

            {infoHtml ? (
              <div
                id="info"
                className="opacity-90"
                dangerouslySetInnerHTML={{ __html: infoHtml }}
              />
            ) : (
              <p id="info" className="opacity-75">
                {t("productionPage.fallback.noInfo")}
              </p>
            )}

            <section className="bg-archive-surface-strong mt-8 max-w-3xl rounded-[1.75rem] p-6">
              <h2 className="text-[0.68rem] tracking-[0.25em] uppercase opacity-70">
                {t("productionPage.archiveSchema")}
              </h2>

              <Events event_objects={eventObjects} />
            </section>
          </article>
        </section>

        <ProductionPageMediaGallery
          production_id_url={production.id_url}
          title={title}
        />
      </main>
    </div>
  );
}
