import { useTranslation } from "react-i18next";
import { EventCard, type EventWithResolvedRelations } from "./EventCard";
import type { Hall } from "../types/hallTypes";
import EditableEventCard from "./EditableEventCard";

import Add from "@mui/icons-material/Add";
import { useEffect, useState } from "react";
import { getAllHalls } from "../services/hallService";
import { Protected } from "~/features/auth";
import { ARCHIVE_PERMISSIONS } from "../archive.constants";

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
            <EventCard event={event} key={event.id_url} />
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

// Helper to create an empty event when pressing new event button
function createEmptyEvent(id_url?: string): EventWithResolvedRelations {
  return {
    id_url: "", // temporary ID
    production_id_url: id_url ?? "",
    starts_at: "",
    ends_at: "",
    order_url: "",
    price_urls: [],
    resolvedHall: undefined,
    resolvedPrices: [],
  };
}

function EditEvents({
  draftEvents,
  setDraftEvents,
  setDeletedEvents,
  halls,
  isNewEvents = false,
}: {
  draftEvents: EventWithResolvedRelations[];
  setDraftEvents: React.Dispatch<React.SetStateAction<EventWithResolvedRelations[]>>;
  setDeletedEvents?: React.Dispatch<React.SetStateAction<EventWithResolvedRelations[]>>;
  halls: Hall[];
  isNewEvents?: boolean;
}) {
  return (
    <ul className="mt-6 space-y-2.5">
      {draftEvents.map((event, index) => (
        <EditableEventCard
          key={event.id_url}
          event={event}
          halls={halls}
          onChange={(updated) => {
            setDraftEvents((prev) => {
              const copy = [...prev];
              copy[index] = updated;
              return copy;
            });
          }}
          onDelete={() => {
            setDraftEvents((prev) => prev.filter((_, i) => i !== index));
            if (setDeletedEvents !== undefined) {
              setDeletedEvents((prev) => [...prev, event]);
            }
          }}
          canDeleteWithoutPerms={isNewEvents}
        />
      ))}
    </ul>
  );
}

function NewEventButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="mt-4 flex justify-center">
      <button
        onClick={onClick}
        className="bg-archive-accent hover:bg-archive-accent/90 flex items-center gap-2 rounded-full px-5 py-2.5 text-white shadow-md transition-all duration-100 active:scale-95"
      >
        <Add fontSize="small" />
        <p className="text-sm font-medium tracking-wide uppercase">
          {t("productionPage.newEvent")}
        </p>
      </button>
    </div>
  );
}

export default function EventSection({
  isEditing,
  production_id_url,
  originalEvents,
  draftEvents,
  newEvents,
  setNewEvents,
  setDraftEvents,
  setDeletedEvents,
}: {
  isEditing?: boolean;
  production_id_url?: string;
  originalEvents: EventWithResolvedRelations[];
  draftEvents: EventWithResolvedRelations[];
  setDraftEvents: React.Dispatch<React.SetStateAction<EventWithResolvedRelations[]>>;
  newEvents: EventWithResolvedRelations[];
  setNewEvents: React.Dispatch<React.SetStateAction<EventWithResolvedRelations[]>>;
  setDeletedEvents?: React.Dispatch<React.SetStateAction<EventWithResolvedRelations[]>>;
}) {
  const { t } = useTranslation();

  // Load list of all halls for autocomplete in editing
  const [allHalls, setAllHalls] = useState<Hall[]>([]);
  useEffect(() => {
    if (isEditing) {
      const loadHalls = async () => {
        const halls = await getAllHalls();
        setAllHalls(halls);
      };
      loadHalls();
    }
  }, [isEditing]);

  return (
    <section className="bg-archive-surface-strong mt-8 max-w-3xl rounded-[1.75rem] p-6">
      <h2 className="text-[0.68rem] tracking-[0.25em] uppercase opacity-70">
        {t("productionPage.archiveSchema")}
      </h2>

      {isEditing ? (
        <>
          {/* Events that are being edited */}
          <EditEvents
            draftEvents={draftEvents}
            setDraftEvents={setDraftEvents}
            setDeletedEvents={setDeletedEvents}
            halls={allHalls}
          />
          {/* Events that are being newly created */}
          <EditEvents
            draftEvents={newEvents}
            setDraftEvents={setNewEvents}
            halls={allHalls}
            isNewEvents={true}
          />
          <Protected permissions={[ARCHIVE_PERMISSIONS.create]}>
            <NewEventButton
              onClick={() => {
                setNewEvents((prev) => [...prev, createEmptyEvent(production_id_url)]);
              }}
            />
          </Protected>
        </>
      ) : (
        <Events event_objects={originalEvents} />
      )}
    </section>
  );
}
