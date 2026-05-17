import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import { useTranslation } from "react-i18next";
import type { Hall } from "../types/hallTypes";
import type { Price } from "../types/eventTypes";
import type { EventWithResolvedRelations } from "./EventCard";
import { useEffect, useMemo, useState } from "react";
import { Protected } from "~/features/auth";
import { ARCHIVE_PERMISSIONS } from "../archive.constants";
import { useParams } from "react-router";
import { useDebouncedState } from "../utils/debouncedState";

const invalidClass = "border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]";

function getHallNameForLang(hall: Hall, lang?: string): string {
  return hall.names.find((n) => n.language === lang)?.name ?? hall.names[0]?.name ?? "";
}

function HallDropdown({
  halls,
  lang,
  onSelect,
}: {
  halls: Hall[];
  lang?: string;
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
          {getHallNameForLang(hall, lang)}
        </li>
      ))}
    </ul>
  );
}

type EditablePriceRowProps = {
  price: Price;
  onUpdate: (updatedPrice: Price) => void;
  onDelete: () => void;
};

function EditablePriceRow({ price, onUpdate, onDelete }: EditablePriceRowProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [draftAmount, setDraftAmount] = useState<string>(
    price.amount !== null && price.amount !== undefined ? String(price.amount) : ""
  );
  const [draftAvailable, setDraftAvailable] = useState<string>(
    price.available !== null && price.available !== undefined
      ? String(price.available)
      : ""
  );

  const isModified =
    draftAmount !==
      (price.amount !== null && price.amount !== undefined
        ? String(price.amount)
        : "") ||
    draftAvailable !==
      (price.available !== null && price.available !== undefined
        ? String(price.available)
        : "");

  function startEditing() {
    setDraftAmount(
      price.amount !== null && price.amount !== undefined ? String(price.amount) : ""
    );
    setDraftAvailable(
      price.available !== null && price.available !== undefined
        ? String(price.available)
        : ""
    );
    setIsEditing(true);
  }

  function cancelEditing() {
    setDraftAmount(
      price.amount !== null && price.amount !== undefined ? String(price.amount) : ""
    );
    setDraftAvailable(
      price.available !== null && price.available !== undefined
        ? String(price.available)
        : ""
    );
    setIsEditing(false);
  }

  function saveEditing() {
    const updated: Price = { ...price };
    const parsedAmount = parseFloat(draftAmount);
    updated.amount = isNaN(parsedAmount) ? undefined : parsedAmount;

    const parsedAvailable = parseInt(draftAvailable, 10);
    updated.available = isNaN(parsedAvailable) ? undefined : parsedAvailable;

    onUpdate(updated);
    setIsEditing(false);
  }

  function handleDelete() {
    const confirmed = window.confirm(t("productionPage.price.deleteConfirm"));
    if (!confirmed) return;
    onDelete();
  }

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-[color:color-mix(in_srgb,var(--archive-accent)_30%,transparent)] p-2">
        <div className="flex items-center gap-2">
          <label className="min-w-[60px] text-[0.6rem] tracking-[0.16em] uppercase opacity-55">
            {t("productionPage.price.amountLabel")}
          </label>
          <input
            type="number"
            step="0.01"
            value={draftAmount}
            onChange={(e) => setDraftAmount(e.target.value)}
            placeholder="0.00"
            className="border-archive-ink/10 bg-archive-paper focus:border-archive-accent focus:ring-archive-accent/40 w-full rounded border px-2 py-1 text-sm focus:ring-2 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="min-w-[60px] text-[0.6rem] tracking-[0.16em] uppercase opacity-55">
            {t("productionPage.price.availableLabel")}
          </label>
          <input
            type="number"
            value={draftAvailable}
            onChange={(e) => setDraftAvailable(e.target.value)}
            placeholder="—"
            className="border-archive-ink/10 bg-archive-paper focus:border-archive-accent focus:ring-archive-accent/40 w-full rounded border px-2 py-1 text-sm focus:ring-2 focus:outline-none"
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={cancelEditing}
            className="text-archive-ink rounded bg-gray-300 px-3 py-1 text-xs font-semibold transition hover:bg-gray-400"
          >
            {t("productionPage.edit.cancel")}
          </button>
          <button
            onClick={saveEditing}
            disabled={!isModified}
            className="bg-archive-accent rounded px-3 py-1 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("productionPage.edit.save")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group/price flex items-center justify-between gap-2 rounded-lg border border-[color:color-mix(in_srgb,var(--archive-accent)_12%,transparent)] p-2">
      <div className="text-sm">
        {price.amount !== null && price.amount !== undefined
          ? new Intl.NumberFormat(undefined, {
              style: "currency",
              currency: "EUR",
            }).format(price.amount)
          : t("productionPage.noPrice")}
        {price.available !== null && price.available !== undefined && (
          <span className="ml-2 text-xs opacity-60">
            ({price.available} {t("productionPage.price.available")})
          </span>
        )}
      </div>
      <div className="flex shrink-0 gap-2">
        <Protected permissions={[ARCHIVE_PERMISSIONS.update]}>
          <button
            onClick={startEditing}
            className="text-[0.62rem] tracking-[0.12em] uppercase opacity-0 transition group-hover/price:opacity-60 hover:!opacity-100"
            aria-label={t("productionPage.price.edit")}
          >
            {t("productionPage.price.edit")}
          </button>
        </Protected>
        <Protected permissions={[ARCHIVE_PERMISSIONS.delete]}>
          <button
            onClick={handleDelete}
            className="text-[0.62rem] tracking-[0.12em] text-red-400 uppercase opacity-0 transition group-hover/price:opacity-60 hover:!opacity-100"
            aria-label={t("productionPage.price.deleteLabel")}
          >
            {t("productionPage.price.deleteLabel")}
          </button>
        </Protected>
      </div>
    </div>
  );
}

type AddPriceFormProps = {
  onCreated: (price: Price) => void;
  onCancel: () => void;
};

function AddPriceForm({ onCreated, onCancel }: AddPriceFormProps) {
  const { t } = useTranslation();
  const [draftAmount, setDraftAmount] = useState("");
  const [draftAvailable, setDraftAvailable] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newPrice: Price = {
      id_url: `temp-price-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      amount: isNaN(parseFloat(draftAmount)) ? undefined : parseFloat(draftAmount),
      available: isNaN(parseInt(draftAvailable, 10))
        ? undefined
        : parseInt(draftAvailable, 10),
    };
    onCreated(newPrice);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 rounded-lg border border-dashed border-[color:color-mix(in_srgb,var(--archive-accent)_40%,transparent)] p-2"
    >
      <div className="flex items-center gap-2">
        <label className="min-w-[60px] text-[0.6rem] tracking-[0.16em] uppercase opacity-55">
          {t("productionPage.price.amountLabel")}
        </label>
        <input
          type="number"
          step="0.01"
          value={draftAmount}
          onChange={(e) => setDraftAmount(e.target.value)}
          placeholder="0.00"
          className="border-archive-ink/10 bg-archive-paper focus:border-archive-accent focus:ring-archive-accent/40 w-full rounded border px-2 py-1 text-sm focus:ring-2 focus:outline-none"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="min-w-[60px] text-[0.6rem] tracking-[0.16em] uppercase opacity-55">
          {t("productionPage.price.availableLabel")}
        </label>
        <input
          type="number"
          value={draftAvailable}
          onChange={(e) => setDraftAvailable(e.target.value)}
          placeholder="—"
          className="border-archive-ink/10 bg-archive-paper focus:border-archive-accent focus:ring-archive-accent/40 w-full rounded border px-2 py-1 text-sm focus:ring-2 focus:outline-none"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="text-archive-ink rounded bg-gray-300 px-3 py-1 text-xs font-semibold transition hover:bg-gray-400"
        >
          {t("productionPage.edit.cancel")}
        </button>
        <button
          type="submit"
          className="bg-archive-accent rounded px-3 py-1 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("productionPage.price.addLabel")}
        </button>
      </div>
    </form>
  );
}

export default function EditableEventCard({
  event,
  halls,
  preferredLanguage,
  onChange,
  onDelete,
  canDeleteWithoutPerms = false,
}: {
  event: EventWithResolvedRelations;
  halls: Hall[];
  preferredLanguage?: string;
  onChange: (updated: EventWithResolvedRelations) => void;
  onDelete: () => void;
  canDeleteWithoutPerms?: boolean;
}) {
  const { t } = useTranslation();
  const { lang } = useParams();
  const language = preferredLanguage ?? lang;

  const [isAddingPrice, setIsAddingPrice] = useState(false);

  const [hallName, debouncedHallName, setHallname] = useDebouncedState<string>(
    event.hall ? getHallNameForLang(event.hall, language) : ""
  );
  const [hallDropdownActive, setHallDropdownActive] = useState<boolean>(false);

  const filteredHalls = useMemo(
    () =>
      halls.filter((hall) =>
        getHallNameForLang(hall, language)
          .toLowerCase()
          .includes(debouncedHallName.toLowerCase())
      ),
    [halls, language, debouncedHallName]
  );
  const matchingHall = halls.find(
    (hall) =>
      getHallNameForLang(hall, language).trim().toLowerCase() ===
      debouncedHallName.trim().toLowerCase()
  );

  const isValidHall = debouncedHallName.trim() === "" || matchingHall !== undefined;

  useEffect(() => {
    const normalizedInput = debouncedHallName.trim();
    let nextHall: Hall | undefined;

    if (normalizedInput) {
      nextHall = matchingHall;
    }

    const currentHallId = event.hall?.id_url;
    const nextHallId = nextHall?.id_url;

    if (currentHallId === nextHallId) {
      return;
    }

    onChange({
      ...event,
      hall: nextHall,
      resolvedHall: nextHall,
    });
  }, [debouncedHallName, matchingHall, event, onChange]);

  const isInvalidDate =
    event.starts_at &&
    event.ends_at &&
    new Date(event.starts_at) >= new Date(event.ends_at);

  const dateTimeStyle = `border-archive-accent/95 w-full rounded-md border px-2 py-1 text-sm font-semibold opacity-95 md:text-base ${isInvalidDate && invalidClass}`;

  function handlePriceUpdate(updatedPrice: Price) {
    const updatedPrices = event.resolvedPrices.map((p) =>
      p.id_url === updatedPrice.id_url ? updatedPrice : p
    );
    onChange({ ...event, resolvedPrices: updatedPrices });
  }

  function handlePriceDelete(priceIdUrl: string) {
    const updatedPrices = event.resolvedPrices.filter((p) => p.id_url !== priceIdUrl);
    onChange({ ...event, resolvedPrices: updatedPrices });
  }

  function handlePriceCreated(newPrice: Price) {
    const updatedPrices = [...event.resolvedPrices, newPrice];
    onChange({ ...event, resolvedPrices: updatedPrices });
    setIsAddingPrice(false);
  }

  return (
    <li className="bg-archive-surface flex flex-col gap-3 rounded-xl border border-[color:color-mix(in_srgb,var(--archive-accent)_15%,transparent)] p-3">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr]">
        {/* Start at Input */}
        <div>
          <p className="text-[0.62rem] tracking-[0.18em] uppercase opacity-55">
            {t("productionPage.startDateLabel")}
          </p>
          <input
            className={dateTimeStyle}
            type="datetime-local"
            aria-label={`${t("productionPage.startDateLabel")} input`}
            value={event.starts_at ?? ""}
            max={event.ends_at ?? undefined}
            onChange={(e) => onChange({ ...event, starts_at: e.target.value })}
          />
        </div>

        {/* Ends at Input*/}
        <div>
          <p className="text-[0.62rem] tracking-[0.18em] uppercase opacity-55">
            {t("productionPage.endDateLabel")}
          </p>
          <input
            className={dateTimeStyle}
            type="datetime-local"
            aria-label={`${t("productionPage.endDateLabel")} input`}
            value={event.ends_at ?? ""}
            min={event.starts_at ?? undefined}
            onChange={(e) => onChange({ ...event, ends_at: e.target.value })}
          />
        </div>

        {/* Venue Input */}
        <div>
          <p className="text-[0.62rem] tracking-[0.18em] uppercase opacity-55">
            {t("productionPage.placeLabel")}
          </p>
          <div className="relative">
            <input
              className={`bg-archive-control/20 w-full rounded-md border px-3 py-1 text-sm font-semibold opacity-95 transition-colors focus:outline-none md:text-base ${
                isValidHall
                  ? "border-archive-accent/95 focus:border-blue-500"
                  : invalidClass
              }`}
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
                lang={language}
                onSelect={(hall) => {
                  setHallname(getHallNameForLang(hall, language));
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

      {/* Prices section */}
      <div className="flex flex-col gap-2">
        <p className="text-[0.62rem] tracking-[0.18em] uppercase opacity-55">
          {t("productionPage.priceLabel")}
        </p>
        {event.resolvedPrices.length > 0 &&
          event.resolvedPrices.map((price) => (
            <EditablePriceRow
              key={price.id_url}
              price={price}
              onUpdate={handlePriceUpdate}
              onDelete={() => handlePriceDelete(price.id_url)}
            />
          ))}
        {isAddingPrice && (
          <AddPriceForm
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

      <div className="flex items-center justify-between">
        <Protected
          permissions={
            !canDeleteWithoutPerms ? [ARCHIVE_PERMISSIONS.delete] : undefined
          }
        >
          <button
            onClick={onDelete}
            className="text-red-500 hover:text-red-700"
            aria-label="Delete Event"
          >
            <DeleteOutlined />
          </button>
        </Protected>
      </div>
    </li>
  );
}
