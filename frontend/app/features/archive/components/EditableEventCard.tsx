import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import { useTranslation } from "react-i18next";
import type { Hall } from "../types/hallTypes";
import type { EventWithResolvedRelations } from "./EventCard";
import { useState } from "react";
import { Protected } from "~/features/auth";
import { ARCHIVE_PERMISSIONS } from "../archive.constants";
import { useParams } from "react-router";

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

  const [hallName, setHallname] = useState<string | undefined>(
    event.hall ? getHallNameForLang(event.hall, lang) : undefined
  );
  const [hallDropdownActive, setHallDropdownActive] = useState<boolean>(false);

  const filteredHalls = halls.filter((hall) =>
    getHallNameForLang(hall, lang)
      .toLowerCase()
      .includes(hallName?.toLowerCase() ?? "")
  );

  const isInvalid =
    event.starts_at &&
    event.ends_at &&
    new Date(event.starts_at) >= new Date(event.ends_at);

  return (
    <li className="bg-archive-surface flex justify-between rounded-xl border border-[color-mix(in_srgb,var(--archive-accent)_15%,transparent)] p-3">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_1fr_auto]">
        {/* Start at Input */}
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

        {/* Ends at Input*/}
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

        {/* Venue Input */}
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
                lang={language}
                onSelect={(hall) => {
                  setHallname(getHallNameForLang(hall, lang));
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
      <Protected
        permissions={!canDeleteWithoutPerms ? [ARCHIVE_PERMISSIONS.delete] : undefined}
      >
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
