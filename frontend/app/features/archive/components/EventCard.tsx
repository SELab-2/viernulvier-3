import { useTranslation } from "react-i18next";
import React, { useState } from "react";

import type { Event, Price, PriceCreate, PriceUpdate } from "~/features/archive/types/eventTypes";
import type { Hall } from "~/features/archive/types/hallTypes";
import { updatePriceByUrl, deletePrice, createPrice } from "~/features/archive/services/eventService";
import { Protected } from "~/features/auth";
import { ARCHIVE_PERMISSIONS } from "~/features/archive/archive.constants";

export type EventWithResolvedRelations = Event & {
  resolvedHall: Hall | undefined;
  resolvedPrices: Price[];
};

function formatEventTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
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

type PriceRowProps = {
  price: Price;
  eventId: number;
  onUpdate: (priceUrl: string, updated: Price) => void;
  onDelete: (priceUrl: string) => void;
};

function PriceRow({ price, eventId, onUpdate, onDelete }: PriceRowProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draftAmount, setDraftAmount] = useState<string>(
    price.amount != null ? String(price.amount) : ""
  );
  const [draftAvailable, setDraftAvailable] = useState<string>(
    price.available != null ? String(price.available) : ""
  );

  const isModified =
    (draftAmount !== (price.amount != null ? String(price.amount) : "")) ||
    (draftAvailable !== (price.available != null ? String(price.available) : ""));

  function startEditing() {
    setDraftAmount(price.amount != null ? String(price.amount) : "");
    setDraftAvailable(price.available != null ? String(price.available) : "");
    setIsEditing(true);
  }

  function cancelEditing() {
    setDraftAmount(price.amount != null ? String(price.amount) : "");
    setDraftAvailable(price.available != null ? String(price.available) : "");
    setIsEditing(false);
  }

  async function saveEditing() {
    setIsSaving(true);
    try {
      const updateData: PriceUpdate = {};
      const parsedAmount = parseFloat(draftAmount);
      updateData.amount = isNaN(parsedAmount) ? undefined : parsedAmount;

      const parsedAvailable = parseInt(draftAvailable, 10);
      updateData.available = isNaN(parsedAvailable) ? undefined : parsedAvailable;

      const updated = await updatePriceByUrl(price.id_url, updateData);
      onUpdate(price.id_url, updated);
      setIsEditing(false);
    } catch {
      window.alert(t("productionPage.price.saveError"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(t("productionPage.price.deleteConfirm"));
    if (!confirmed) return;

    const match = price.id_url.match(/\/prices\/(\d+)/);
    const priceId = match ? Number(match[1]) : undefined;
    if (!priceId) return;

    try {
      await deletePrice(eventId, priceId);
      onDelete(price.id_url);
    } catch {
      window.alert(t("productionPage.price.deleteError"));
    }
  }

  if (isEditing) {
    return (
      <div className="bg-archive-control flex flex-col gap-2 rounded-lg border border-[color:color-mix(in_srgb,var(--archive-accent)_30%,transparent)] p-3">
        <div className="flex items-center gap-2">
          <label className="text-[0.6rem] tracking-[0.16em] uppercase opacity-55 min-w-[60px]">
            {t("productionPage.price.amountLabel")}
          </label>
          <input
            type="number"
            step="0.01"
            value={draftAmount}
            onChange={(e) => setDraftAmount(e.target.value)}
            placeholder="0.00"
            className="bg-archive-paper border-archive-ink/10 focus:ring-archive-accent/40 focus:border-archive-accent w-full rounded border px-2 py-1 text-sm focus:ring-2 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[0.6rem] tracking-[0.16em] uppercase opacity-55 min-w-[60px]">
            {t("productionPage.price.availableLabel")}
          </label>
          <input
            type="number"
            value={draftAvailable}
            onChange={(e) => setDraftAvailable(e.target.value)}
            placeholder="—"
            className="bg-archive-paper border-archive-ink/10 focus:ring-archive-accent/40 focus:border-archive-accent w-full rounded border px-2 py-1 text-sm focus:ring-2 focus:outline-none"
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={cancelEditing}
            className="rounded bg-gray-300 px-3 py-1 text-xs font-semibold text-archive-ink transition hover:bg-gray-400"
          >
            {t("productionPage.edit.cancel")}
          </button>
          <button
            onClick={saveEditing}
            disabled={!isModified || isSaving}
            className="bg-archive-accent rounded px-3 py-1 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSaving ? "…" : t("productionPage.edit.save")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-archive-control group/price flex items-center justify-between gap-2 rounded-lg border border-[color:color-mix(in_srgb,var(--archive-accent)_12%,transparent)] p-3">
      <div>
        <dt className="text-[0.6rem] tracking-[0.16em] uppercase opacity-55">
          {t("productionPage.priceLabel")}
        </dt>
        <dd className="mt-1 font-medium opacity-95">
          {price.amount != null
            ? new Intl.NumberFormat(undefined, {
                style: "currency",
                currency: "EUR",
              }).format(price.amount)
            : t("productionPage.noPrice")}
          {price.available != null && (
            <span className="ml-2 text-xs opacity-60">
              ({price.available} {t("productionPage.price.available")})
            </span>
          )}
        </dd>
      </div>
      <Protected permissions={[ARCHIVE_PERMISSIONS.update]}>
        <button
          onClick={startEditing}
          className="shrink-0 text-[0.62rem] tracking-[0.12em] uppercase opacity-0 transition group-hover/price:opacity-60 hover:!opacity-100"
          aria-label={t("productionPage.price.edit")}
        >
          {t("productionPage.price.edit")}
        </button>
      </Protected>
      <Protected permissions={[ARCHIVE_PERMISSIONS.delete]}>
        <button
          onClick={handleDelete}
          className="shrink-0 text-[0.62rem] tracking-[0.12em] uppercase text-red-400 opacity-0 transition group-hover/price:opacity-60 hover:!opacity-100"
          aria-label={t("productionPage.price.deleteLabel")}
        >
          {t("productionPage.price.deleteLabel")}
        </button>
      </Protected>
    </div>
  );
}

type AddPriceFormProps = {
  eventId: number;
  onCreated: (price: Price) => void;
  onCancel: () => void;
};

function AddPriceForm({ eventId, onCreated, onCancel }: AddPriceFormProps) {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [draftAmount, setDraftAmount] = useState("");
  const [draftAvailable, setDraftAvailable] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      const priceData: PriceCreate = {};
      const parsedAmount = parseFloat(draftAmount);
      if (!isNaN(parsedAmount)) priceData.amount = parsedAmount;

      const parsedAvailable = parseInt(draftAvailable, 10);
      if (!isNaN(parsedAvailable)) priceData.available = parsedAvailable;

      const created = await createPrice(eventId, priceData);
      onCreated(created);
    } catch {
      window.alert(t("productionPage.price.createError"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-archive-control flex flex-col gap-2 rounded-lg border border-dashed border-[color:color-mix(in_srgb,var(--archive-accent)_40%,transparent)] p-3"
    >
      <div className="flex items-center gap-2">
        <label className="text-[0.6rem] tracking-[0.16em] uppercase opacity-55 min-w-[60px]">
          {t("productionPage.price.amountLabel")}
        </label>
        <input
          type="number"
          step="0.01"
          value={draftAmount}
          onChange={(e) => setDraftAmount(e.target.value)}
          placeholder="0.00"
          className="bg-archive-paper border-archive-ink/10 focus:ring-archive-accent/40 focus:border-archive-accent w-full rounded border px-2 py-1 text-sm focus:ring-2 focus:outline-none"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-[0.6rem] tracking-[0.16em] uppercase opacity-55 min-w-[60px]">
          {t("productionPage.price.availableLabel")}
        </label>
        <input
          type="number"
          value={draftAvailable}
          onChange={(e) => setDraftAvailable(e.target.value)}
          placeholder="—"
          className="bg-archive-paper border-archive-ink/10 focus:ring-archive-accent/40 focus:border-archive-accent w-full rounded border px-2 py-1 text-sm focus:ring-2 focus:outline-none"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="rounded bg-gray-300 px-3 py-1 text-xs font-semibold text-archive-ink transition hover:bg-gray-400"
        >
          {t("productionPage.edit.cancel")}
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="bg-archive-accent rounded px-3 py-1 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSaving ? "…" : t("productionPage.price.addLabel")}
        </button>
      </div>
    </form>
  );
}

type EventCardProps = {
  event: EventWithResolvedRelations;
  onPricesChanged?: (eventId: string, prices: Price[]) => void;
};

export function EventCard({ event, onPricesChanged }: EventCardProps) {
  const { t, i18n } = useTranslation();
  const [prices, setPrices] = useState<Price[]>(event.resolvedPrices);
  const [isAddingPrice, setIsAddingPrice] = useState(false);

  const dateAndTime = formatEventDateTimeRange(event.starts_at, event.ends_at);
  const eventDate = dateAndTime?.dateLabel ?? t("productionPage.fallback.dateUnknown");
  const eventTime = dateAndTime?.timeLabel ?? t("productionPage.fallback.dateUnknown");
  const eventLocation = getTextOrDefault(
    event.resolvedHall?.name ?? event.hall?.name,
    t("productionPage.fallback.locationUnknown")
  );

  const match = event.id_url.match(/\/events\/(\d+)/);
  const eventId = match ? Number(match[1]) : undefined;

  function handlePriceUpdate(_priceUrl: string, updated: Price) {
    setPrices((prev) =>
      prev.map((p) => (p.id_url === updated.id_url ? updated : p))
    );
    const updatedList = prices.map((p) =>
      p.id_url === updated.id_url ? updated : p
    );
    onPricesChanged?.(event.id_url, updatedList);
  }

  function handlePriceDelete(priceUrl: string) {
    const updatedList = prices.filter((p) => p.id_url !== priceUrl);
    setPrices(updatedList);
    onPricesChanged?.(event.id_url, updatedList);
  }

  function handlePriceCreated(created: Price) {
    const updatedList = [...prices, created];
    setPrices(updatedList);
    setIsAddingPrice(false);
    onPricesChanged?.(event.id_url, updatedList);
  }

  const hasPrices = prices.length > 0;

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
          <div className="grid gap-3 text-sm sm:grid-cols-2 items-start">
            <EventCardDetail label={t("productionPage.timeLabel")} value={eventTime} />
            {hasPrices ? (
              <div className="flex flex-col gap-2">
                {prices.map((price) => (
                  <PriceRow
                    key={price.id_url}
                    price={price}
                    eventId={eventId!}
                    onUpdate={handlePriceUpdate}
                    onDelete={handlePriceDelete}
                  />
                ))}
                {isAddingPrice && (
                  <AddPriceForm
                    eventId={eventId!}
                    onCreated={handlePriceCreated}
                    onCancel={() => setIsAddingPrice(false)}
                  />
                )}
                <Protected permissions={[ARCHIVE_PERMISSIONS.create]}>
                  {!isAddingPrice && (
                    <button
                      onClick={() => setIsAddingPrice(true)}
                      className="text-archive-accent text-[0.62rem] tracking-[0.14em] uppercase opacity-70 transition hover:opacity-100"
                    >
                      + {t("productionPage.price.addLabel")}
                    </button>
                  )}
                </Protected>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {isAddingPrice ? (
                  <AddPriceForm
                    eventId={eventId!}
                    onCreated={handlePriceCreated}
                    onCancel={() => setIsAddingPrice(false)}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <EventCardDetail
                      label={t("productionPage.priceLabel")}
                      value={t("productionPage.noPrice")}
                    />
                    <Protected permissions={[ARCHIVE_PERMISSIONS.create]}>
                      <button
                        onClick={() => setIsAddingPrice(true)}
                        className="shrink-0 text-[0.62rem] tracking-[0.14em] uppercase text-archive-accent opacity-70 transition hover:opacity-100"
                      >
                        + {t("productionPage.price.addLabel")}
                      </button>
                    </Protected>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </details>
    </li>
  );
}
