import { useTranslation } from "react-i18next";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import type { Event, Price } from "~/features/archive/types/eventTypes";
import type { Hall } from "~/features/archive/types/hallTypes";
import { Protected } from "~/features/auth";
import { ARCHIVE_PERMISSIONS } from "../archive.constants";
import { useState } from "react";

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

function HallDropdown({
  halls,
  onSelect,
}: {
  halls: Hall[];
  onSelect: (hall: Hall) => void;
}) {
  return (
    <ul className="bg-archive-surface border-archive-ink/20 absolute z-10 mt-1 max-h-40 w-full overflow-scroll rounded shadow">
      {halls.map((hall) => (
        <li
          key={hall.id_url}
          className="hover:bg-archive-accent/95 cursor-pointer px-2 py-1 hover:text-black"
          onMouseDown={() => onSelect(hall)}
        >
          {hall.name}
        </li>
      ))}
    </ul>
  );
}

export function EditableEventCard({
  event,
  halls,
  onChange,
  onDelete,
}: {
  event: EventWithResolvedRelations;
  halls: Hall[];
  onChange: (updated: EventWithResolvedRelations) => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();

  const [hallName, setHallname] = useState<string>(event.hall?.name ?? "");
  const [hallDropdownActive, setHallDropdownActive] = useState<boolean>(false);

  const filteredHalls = halls.filter((hall) =>
    hall.name.toLowerCase().includes(hallName.toLowerCase())
  );

  const isInvalid =
    event.starts_at &&
    event.ends_at &&
    new Date(event.starts_at) >= new Date(event.ends_at);

  return (
    <li className="bg-archive-surface flex justify-between rounded-xl border border-[color-mix(in_srgb,var(--archive-accent)_15%,transparent)] p-3">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_1fr_auto]">
        <div>
          <p className="text-[0.62rem] tracking-[0.18em] uppercase opacity-55">
            {t("productionPage.startDateLabel")}
          </p>
          <input
            className={`text-sm font-semibold opacity-95 md:text-base ${isInvalid ? "border-2 border-red-500" : ""}`}
            type="datetime-local"
            aria-label={`${t("productionPage.startDateLabel")} input`}
            value={event.starts_at ?? ""}
            max={event.ends_at ?? undefined}
            onChange={(e) => onChange({ ...event, starts_at: e.target.value })}
          />
        </div>

        <div>
          <p className="text-[0.62rem] tracking-[0.18em] uppercase opacity-55">
            {t("productionPage.endDateLabel")}
          </p>
          <input
            className={`text-sm font-semibold opacity-95 md:text-base ${isInvalid ? "border-2 border-red-500" : ""}`}
            type="datetime-local"
            aria-label={`${t("productionPage.endDateLabel")} input`}
            value={event.ends_at ?? ""}
            min={event.starts_at ?? undefined}
            onChange={(e) => onChange({ ...event, ends_at: e.target.value })}
          />
        </div>

        <div>
          <p className="text-[0.62rem] tracking-[0.18em] uppercase opacity-55">
            {t("productionPage.placeLabel")}
          </p>
          <div className="relative">
            <input
              className="border-archive-accent/95 bg-archive-control/20 w-full rounded-md border px-3 py-1 text-sm font-semibold opacity-95 focus:border-blue-500 focus:outline-none md:text-base"
              placeholder={t("productionPage.placeLabel")}
              value={hallName}
              onFocus={() => setHallDropdownActive(true)}
              onBlur={() => setHallDropdownActive(false)}
              onChange={(e) => {
                setHallname(e.target.value);
                setHallDropdownActive(true);
              }}
            />
            {hallDropdownActive && filteredHalls.length > 0 && (
              <HallDropdown
                halls={filteredHalls}
                onSelect={(hall) => {
                  setHallname(hall.name);
                  setHallDropdownActive(false);

                  onChange({
                    ...event,
                    resolvedHall: hall,
                    hall: hall,
                  });
                }}
              />
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
