import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";

import type {
  Production,
  ProductionInfo,
} from "~/features/archive/types/productionTypes";
import type { Event, Price } from "~/features/archive/types/eventTypes";
import type { HallResponse } from "~/features/archive/types/hallTypes";
import { useLocalizedPath } from "~/shared/hooks/useLocalizedPath";
import { getMediaForProductionPaginated } from "~/features/archive/services/mediaService";
import {
  getEventByUrl,
  getPriceByUrl,
} from "~/features/archive/services/eventService";
import { getHallByUrl } from "~/features/archive/services/hallService";

interface ProductionPageProps {
  production: Production;
  preferredLanguage?: string;
}

type EventWithResolvedRelations = Event & {
  resolvedHall: HallResponse | undefined;
  resolvedPrices: Price[];
};

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

function formatEventTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();

  if (minutes === 0) {
    return `${hours}u`;
  }

  return `${hours}u${String(minutes).padStart(2, "0")}`;
}

function formatEventDateTimeRange(
  startsAt?: string,
  endsAt?: string
): { dateLabel: string; timeLabel: string } | undefined {
  if (!startsAt) {
    return undefined;
  }

  const startDate = new Date(startsAt);
  if (Number.isNaN(startDate.getTime())) {
    return undefined;
  }

  const dateLabel = `${startDate.getDate()}/${startDate.getMonth() + 1}/${startDate.getFullYear()}`;
  const startTimeLabel = formatEventTime(startDate);

  if (!endsAt) {
    return {
      dateLabel,
      timeLabel: startTimeLabel,
    };
  }

  const endDate = new Date(endsAt);
  if (Number.isNaN(endDate.getTime())) {
    return {
      dateLabel,
      timeLabel: startTimeLabel,
    };
  }

  return {
    dateLabel,
    timeLabel: `${startTimeLabel}-${formatEventTime(endDate)}`,
  };
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

// extract numeric production id from id_url for media requests
function getProductionNumericIdFromUrl(idUrl: string): number | undefined {
  const match = idUrl.match(/\/productions\/(\d+)(?:[/?#]|$)/);
  if (!match) {
    return undefined;
  }

  const parsedId = Number(match[1]);
  return Number.isInteger(parsedId) && parsedId > 0 ? parsedId : undefined;
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

export function ProductionPage({
  production,
  preferredLanguage = "nl",
}: ProductionPageProps) {
  const { t, i18n } = useTranslation();
  const lp = useLocalizedPath();
  const [evidenceScrollPercent, setEvidenceScrollPercent] = useState(0);
  const [hasEvidenceOverflow, setHasEvidenceOverflow] = useState(false);
  const [mediaImageUrls, setMediaImageUrls] = useState<string[]>([]);
  const [eventsWithDetails, setEventsWithDetails] = useState<
    EventWithResolvedRelations[]
  >([]);
  const evidenceTrackRef = useRef<HTMLDivElement | null>(null);
  const isDraggingEvidenceRef = useRef(false);
  const evidenceDragStartXRef = useRef(0);
  const evidenceStartScrollLeftRef = useRef(0);
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

  //TODO maybe an image saying no image found? Or something else? idk
  const fallbackImageUrl =
    "https://images.unsplash.com/photo-1518998053901-5348d3961a04?q=80&w=1600&auto=format&fit=crop";

  const productionNumericId = useMemo(
    () => getProductionNumericIdFromUrl(production.id_url),
    [production.id_url]
  );

  const imageUrls = useMemo(
    () =>
      mediaImageUrls.length > 0
        ? mediaImageUrls
        : [
            fallbackImageUrl,
            fallbackImageUrl,
            fallbackImageUrl,
            fallbackImageUrl,
            fallbackImageUrl,
          ],
    [fallbackImageUrl, mediaImageUrls]
  );
  const imageUrl = imageUrls[0];
  const tags = getTagNamesByLanguage(production, language);
  // keep events chronologically ordered for a predictable schedule list
  const eventObjects = useMemo(
    () =>
      eventsWithDetails
    .slice()
    .sort((leftEvent, rightEvent) => {
      const startDifference =
        getEventTimestamp(leftEvent.starts_at) -
        getEventTimestamp(rightEvent.starts_at);

      if (startDifference !== 0) {
        return startDifference;
      }

      return leftEvent.id.localeCompare(rightEvent.id);
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
        if (production.events.length === 0) {
          return;
        }

        const hydratedEvents = await Promise.all(
          production.events.map(async (eventUrl): Promise<EventWithResolvedRelations | null> => {
            let event: Event | undefined;

            try {
              event = await getEventByUrl(eventUrl);
            } catch {
              return null;
            }

            if (!event) {
              return null;
            }

            const hallPromise = event.hall_id
              ? getHallByUrl(event.hall_id).catch(() => undefined)
              : Promise.resolve(undefined);

            const pricesPromise =
              event.prices.length > 0
                ? Promise.all(
                    event.prices.map(async (priceUrl) => {
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
          })
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
  }, [production.events]);

  useEffect(() => {
    setMediaImageUrls([]);

    // skip media fetching if the production id cannot be parsed
    if (!productionNumericId) {
      return;
    }

    let isCancelled = false;

    const loadAllMediaImages = async () => {
      try {
        const imageUrlsSet = new Set<string>();
        let cursor: number | undefined;
        let hasMore = true;

        // continue paginated requests until there are no more pages
        while (hasMore) {
          const response = await getMediaForProductionPaginated(productionNumericId, {
            cursor,
            limit: 50,
          });

          for (const media of response.media) {
            // keep only image media for the visual evidence section
            if (!media.content_type.startsWith("image/")) {
              continue;
            }

            // a set avoids duplicate urls while preserving insertion order
            imageUrlsSet.add(media.url);
          }

          cursor = response.pagination.next_cursor;
          hasMore =
            response.pagination.has_more &&
            typeof response.pagination.next_cursor === "number";
        }

        if (!isCancelled) {
          setMediaImageUrls(Array.from(imageUrlsSet));
        }
      } catch {
        if (!isCancelled) {
          setMediaImageUrls([]);
        }
      }
    };

    void loadAllMediaImages();

    // prevent state updates if the component unmounts during an in-flight request
    return () => {
      isCancelled = true;
    };
  }, [productionNumericId]);

  const syncEvidenceSlider = () => {
    const track = evidenceTrackRef.current;
    if (!track) {
      return;
    }

    const maxScroll = track.scrollWidth - track.clientWidth;
    const hasOverflow = maxScroll > 0;
    setHasEvidenceOverflow(hasOverflow);

    if (maxScroll <= 0) {
      setEvidenceScrollPercent(0);
      return;
    }

    setEvidenceScrollPercent((track.scrollLeft / maxScroll) * 100);
  };

  const handleEvidenceSliderChange = (nextPercent: number) => {
    const track = evidenceTrackRef.current;
    if (!track || !hasEvidenceOverflow) {
      return;
    }

    const maxScroll = track.scrollWidth - track.clientWidth;
    track.scrollLeft = (Math.max(0, Math.min(100, nextPercent)) / 100) * maxScroll;
    setEvidenceScrollPercent(nextPercent);
  };

  const handleEvidenceMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!hasEvidenceOverflow) {
      return;
    }

    const track = evidenceTrackRef.current;
    if (!track) {
      return;
    }

    isDraggingEvidenceRef.current = true;
    evidenceDragStartXRef.current = event.clientX;
    evidenceStartScrollLeftRef.current = track.scrollLeft;
  };

  const handleEvidenceMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!isDraggingEvidenceRef.current) {
      return;
    }

    const track = evidenceTrackRef.current;
    if (!track) {
      return;
    }

    const dragDelta = event.clientX - evidenceDragStartXRef.current;
    track.scrollLeft = evidenceStartScrollLeftRef.current - dragDelta;
    syncEvidenceSlider();
  };

  const stopEvidenceDragging = () => {
    isDraggingEvidenceRef.current = false;
  };

  useEffect(() => {
    const track = evidenceTrackRef.current;
    if (!track) {
      return;
    }

    syncEvidenceSlider();

    const resizeObserver = new ResizeObserver(() => {
      syncEvidenceSlider();
    });

    resizeObserver.observe(track);

    return () => {
      resizeObserver.disconnect();
    };
  }, [imageUrls]);

  return (
    <div className="bg-archive-paper text-archive-ink min-h-screen">
      <main className="mx-auto w-full max-w-[1400px] px-6 pt-10 pb-16 md:px-12">
        <div className="flex flex-col gap-4">
          <Link
            to={lp("/archive")}
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
          {/* Performer type badge */}
          {production.performer_type && (
            <li className="bg-archive-control rounded-full border border-[color:color-mix(in_srgb,var(--archive-accent)_40%,transparent)] px-4 py-1.5 text-[0.68rem] font-semibold tracking-[var(--archive-tracking-label)] uppercase opacity-90">
              {production.performer_type}
            </li>
          )}

          {/* Bestaande tags */}
          {tags.map((tag) => (
            <li
              key={tag}
              className="bg-archive-control rounded-full border border-[color:color-mix(in_srgb,var(--archive-accent)_24%,transparent)] px-4 py-1.5 text-[0.68rem] tracking-[var(--archive-tracking-label)] uppercase"
            >
              {tag}
            </li>
          ))}
        </ul>

        <section className="mt-8">
          <article className="space-y-6 text-[1.06rem] leading-[1.62] opacity-92">
            <p>{tagline}</p>
            <section className="bg-archive-surface-strong mt-8 max-w-3xl rounded-[1.75rem] p-6">
              <h2 className="text-[0.68rem] tracking-[0.25em] uppercase opacity-70">
                {t("productionPage.archiveSchema")}
              </h2>

              {eventObjects.length > 0 ? (
                <ul className="mt-6 space-y-2.5">
                  {eventObjects.map((event) => {
                    const dateAndTime = formatEventDateTimeRange(
                      event.starts_at,
                      event.ends_at
                    );
                    const eventDate =
                      dateAndTime?.dateLabel ?? t("productionPage.fallback.dateTbd");
                    const eventTime =
                      dateAndTime?.timeLabel ?? t("productionPage.fallback.dateTbd");
                    const eventLocation = getTextOrDefault(
                      event.resolvedHall?.name ?? event.hall?.name,
                      t("productionPage.fallback.locationTbd")
                    );
                    const eventPrice =
                      event.resolvedPrices.length > 0
                        ? event.resolvedPrices
                            .map((price) =>
                              typeof price.amount === "number"
                                ? new Intl.NumberFormat(i18n.language, {
                                    style: "currency",
                                    currency: "EUR",
                                  }).format(price.amount)
                                : undefined
                            )
                            .filter(
                              (amount): amount is string =>
                                typeof amount === "string" && amount.length > 0
                            )
                            .join(", ") || t("productionPage.noPrice")
                        : t("productionPage.noPrice");

                    return (
                      <li key={event.id}>
                        <details className="bg-archive-surface group rounded-xl border border-[color:color-mix(in_srgb,var(--archive-accent)_15%,transparent)] transition open:border-[color:color-mix(in_srgb,var(--archive-accent)_35%,transparent)]">
                          <summary className="grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 marker:content-none md:px-5">
                            <div className="min-w-0">
                              <p className="text-[0.62rem] tracking-[0.18em] uppercase opacity-55">
                                {t("productionPage.dateLabel")}
                              </p>
                              <p className="truncate text-sm font-semibold opacity-95 md:text-base">
                                {eventDate}
                              </p>
                            </div>

                            <div className="min-w-0">
                              <p className="text-[0.62rem] tracking-[0.18em] uppercase opacity-55">
                                {t("productionPage.placeLabel")}
                              </p>
                              <p className="truncate text-sm font-semibold opacity-95 md:text-base">
                                {eventLocation}
                              </p>
                            </div>

                            <span className="font-sans text-[0.62rem] tracking-[0.18em] uppercase opacity-65 transition group-open:rotate-180">
                              Meer
                            </span>
                          </summary>

                          <div className="border-t border-[color:color-mix(in_srgb,var(--archive-accent)_14%,transparent)] px-4 py-3 md:px-5">
                            <div className="grid gap-3 text-sm sm:grid-cols-2">
                              <div className="bg-archive-control rounded-lg border border-[color:color-mix(in_srgb,var(--archive-accent)_12%,transparent)] p-3">
                                <dt className="text-[0.6rem] tracking-[0.16em] uppercase opacity-55">
                                  {t("productionPage.timeLabel")}
                                </dt>
                                <dd className="mt-1 font-medium opacity-95">
                                  {eventTime}
                                </dd>
                              </div>

                              <div className="bg-archive-control rounded-lg border border-[color:color-mix(in_srgb,var(--archive-accent)_12%,transparent)] p-3">
                                <dt className="text-[0.6rem] tracking-[0.16em] uppercase opacity-55">
                                  {t("productionPage.priceLabel")}
                                </dt>
                                <dd className="mt-1 font-medium opacity-95">
                                  {eventPrice}
                                </dd>
                              </div>
                            </div>
                          </div>
                        </details>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="mt-6">
                  <div className="bg-archive-surface rounded-xl border border-[color:color-mix(in_srgb,var(--archive-accent)_15%,transparent)] px-4 py-3 md:px-5">
                    <p className="text-sm font-semibold opacity-95">
                      {t("productionPage.fallback.dateTbd")}
                    </p>
                    <p className="mt-1 text-sm opacity-75">
                      {t("productionPage.fallback.locationTbd")}
                    </p>
                  </div>
                </div>
              )}
            </section>
          </article>
        </section>

        <section className="mt-16 border-t border-[color:color-mix(in_srgb,var(--archive-accent)_14%,transparent)] pt-14">
          <div className="mb-8 flex items-end justify-between gap-6">
            <h2 className="font-serif text-4xl italic opacity-85 md:text-6xl">
              {t("productionPage.visualEvidence")}
            </h2>
          </div>

          <>
            <div
              ref={evidenceTrackRef}
              onScroll={syncEvidenceSlider}
              onMouseDown={handleEvidenceMouseDown}
              onMouseMove={handleEvidenceMouseMove}
              onMouseUp={stopEvidenceDragging}
              onMouseLeave={stopEvidenceDragging}
              className={`flex gap-4 overflow-x-auto pb-3 select-none [scrollbar-width:thin] ${
                hasEvidenceOverflow
                  ? "cursor-grab active:cursor-grabbing"
                  : "cursor-default"
              }`}
            >
              {imageUrls.map((url, index) => (
                <figure
                  key={`${production.id_url}-${url}-${index}`}
                  className="group bg-archive-surface min-w-[260px] flex-shrink-0 overflow-hidden rounded-2xl border border-[color:color-mix(in_srgb,var(--archive-accent)_12%,transparent)] sm:min-w-[320px] lg:min-w-[340px]"
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
                </figure>
              ))}
            </div>

            {hasEvidenceOverflow ? (
              <div className="mt-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={Math.round(evidenceScrollPercent)}
                  onChange={(event) =>
                    handleEvidenceSliderChange(Number(event.target.value))
                  }
                  aria-label={t("productionPage.archiveSchema")}
                  className="accent-archive-accent w-full"
                />
              </div>
            ) : null}
          </>
        </section>
      </main>
    </div>
  );
}
