import { useTranslation } from "react-i18next";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import type { Event, Price } from "~/features/archive/types/eventTypes";
import type { Hall } from "~/features/archive/types/hallTypes";
import { Protected } from "~/features/auth";
import { ARCHIVE_PERMISSIONS } from "../archive.constants";
import { useEffect, useState } from "react";
import { getAllHalls } from "../services/hallService";

export type EventWithResolvedRelations = Event & {
  resolvedHall: Hall | undefined;
  resolvedPrices: Price[];
};

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
    return { dateLabel, timeLabel: startTimeLabel };
  }

  const endDate = new Date(endsAt);
  if (Number.isNaN(endDate.getTime())) {
    return { dateLabel, timeLabel: startTimeLabel };
  }

  return {
    dateLabel,
    timeLabel: `${startTimeLabel}-${formatEventTime(endDate)}`,
  };
}

function getTextOrDefault(value: string | null | undefined, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : fallback;
}

function formatPrices(prices: Price[], language: string, fallback: string): string {
  if (prices.length === 0) {
    return fallback;
  }

  const formatted = prices
    .map((price) =>
      typeof price.amount === "number"
        ? new Intl.NumberFormat(language, {
            style: "currency",
            currency: "EUR",
          }).format(price.amount)
        : undefined
    )
    .filter(
      (amount): amount is string => typeof amount === "string" && amount.length > 0
    )
    .join(", ");

  return formatted || fallback;
}

type EventCardDetailProps = {
  label: string;
  value: string;
};

function EventCardDetail({ label, value }: EventCardDetailProps) {
  return (
    <div className="bg-archive-control rounded-lg border border-[color:color-mix(in_srgb,var(--archive-accent)_12%,transparent)] p-3">
      <dt className="text-[0.6rem] tracking-[0.16em] uppercase opacity-55">{label}</dt>
      <dd className="mt-1 font-medium opacity-95">{value}</dd>
    </div>
  );
}

type EventCardSummaryProps = {
  dateLabel: string;
  locationLabel: string;
  dateText: string;
  locationText: string;
};

function EventCardSummary({
  dateLabel,
  locationLabel,
  dateText,
  locationText,
}: EventCardSummaryProps) {
  const { t } = useTranslation();
  return (
    <summary className="grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 marker:content-none md:px-5">
      <div className="min-w-0">
        <p className="text-[0.62rem] tracking-[0.18em] uppercase opacity-55">
          {dateLabel}
        </p>
        <p className="truncate text-sm font-semibold opacity-95 md:text-base">
          {dateText}
        </p>
      </div>

      <div className="min-w-0">
        <p className="text-[0.62rem] tracking-[0.18em] uppercase opacity-55">
          {locationLabel}
        </p>
        <p className="truncate text-sm font-semibold opacity-95 md:text-base">
          {locationText}
        </p>
      </div>

      <span className="font-sans text-[0.62rem] tracking-[0.18em] uppercase opacity-65 transition group-open:rotate-180">
        {t("productionPage.eventMore")}
      </span>
    </summary>
  );
}

type EventCardProps = {
  event: EventWithResolvedRelations;
};

export function EventCard({ event }: EventCardProps) {
  const { t, i18n } = useTranslation();

  const dateAndTime = formatEventDateTimeRange(event.starts_at, event.ends_at);
  const eventDate = dateAndTime?.dateLabel ?? t("productionPage.fallback.dateUnknown");
  const eventTime = dateAndTime?.timeLabel ?? t("productionPage.fallback.dateUnknown");
  const eventLocation = getTextOrDefault(
    event.resolvedHall?.name ?? event.hall?.name,
    t("productionPage.fallback.locationUnknown")
  );
  const eventPrice = formatPrices(
    event.resolvedPrices,
    i18n.language,
    t("productionPage.noPrice")
  );

  return (
    <li>
      <details className="bg-archive-surface group rounded-xl border border-[color:color-mix(in_srgb,var(--archive-accent)_15%,transparent)] transition open:border-[color:color-mix(in_srgb,var(--archive-accent)_35%,transparent)]">
        <EventCardSummary
          dateLabel={t("productionPage.dateLabel")}
          locationLabel={t("productionPage.placeLabel")}
          dateText={eventDate}
          locationText={eventLocation}
        />

        <div className="border-t border-[color:color-mix(in_srgb,var(--archive-accent)_14%,transparent)] px-4 py-3 md:px-5">
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <EventCardDetail label={t("productionPage.timeLabel")} value={eventTime} />
            <EventCardDetail
              label={t("productionPage.priceLabel")}
              value={eventPrice}
            />
          </div>
        </div>
      </details>
    </li>
  );
}

export function EditableEventCard({
  event,
  onChange,
  onDelete,
}: {
  event: EventWithResolvedRelations;
  onChange: (updated: EventWithResolvedRelations) => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();

  const [hallName, setHallname] = useState<string>(event.hall?.name ?? "");
  const [hallDropdownActive, setHallDropdownActive] = useState<boolean>(false);
  const [allHalls, setAllHalls] = useState<Hall[]>([]);

  const filteredHalls = allHalls.filter((hall) =>
    hall.name.toLowerCase().includes(hallName.toLowerCase())
  );
  useEffect(() => {
    const loadHalls = async () => {
      const halls = await getAllHalls();
      setAllHalls(halls);
    };
    loadHalls();
    return () => {
      return;
    };
  }, []);

  return (
    <li className="bg-archive-surface flex justify-between rounded-xl border border-[color-mix(in_srgb,var(--archive-accent)_15%,transparent)] p-3">
      <div className="grid justify-between gap-4 sm:grid-cols-3">
        <div>
          {/* TODO make it so that you can't put start date after end date */}
          <p className="text-[0.62rem] tracking-[0.18em] uppercase opacity-55">
            {t("productionPage.startDateLabel")}
          </p>
          <input
            className="text-sm font-semibold opacity-95 md:text-base"
            type="datetime-local"
            value={event.starts_at ?? ""}
            onChange={(e) => onChange({ ...event, starts_at: e.target.value })}
          />
        </div>

        <div>
          <p className="text-[0.62rem] tracking-[0.18em] uppercase opacity-55">
            {t("productionPage.endDateLabel")}
          </p>
          <input
            className="text-sm font-semibold opacity-95 md:text-base"
            type="datetime-local"
            value={event.ends_at ?? ""}
            onChange={(e) => onChange({ ...event, ends_at: e.target.value })}
          />
        </div>

        <div>
          <p className="text-[0.62rem] tracking-[0.18em] uppercase opacity-55">
            {t("productionPage.placeLabel")}
          </p>
          <div className="relative">
            <input
              className="overflow-hidden text-sm font-semibold opacity-95 md:text-base"
              value={hallName}
              onFocus={() => setHallDropdownActive(true)}
              onBlur={() => setHallDropdownActive(false)}
              onChange={(e) => {
                setHallname(e.target.value);
                setHallDropdownActive(true);
              }}
            />
            {hallDropdownActive && filteredHalls.length > 0 && (
              <ul className="bg-archive-surface absolute z-10 mt-1 max-h-40 w-full overflow-scroll rounded border shadow">
                {filteredHalls.map((hall) => (
                  <li
                    key={hall.id_url}
                    className="hover:bg-archive-accent/95 cursor-pointer px-2 py-1 hover:text-black"
                    onMouseDown={() => {
                      setHallname(hall.name);
                      setHallDropdownActive(false);

                      onChange({
                        ...event,
                        resolvedHall: hall,
                        hall: hall,
                      });
                    }}
                  >
                    {hall.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      <Protected permissions={[ARCHIVE_PERMISSIONS.delete]}>
        <button
          onClick={onDelete}
          className="text-red-500 hover:text-red-700"
          aria-label="Delete Event"
        >
          <DeleteOutlined />
        </button>
      </Protected>
    </li>
  );
}
