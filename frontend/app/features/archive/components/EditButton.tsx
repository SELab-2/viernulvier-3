import { Protected } from "~/features/auth";
import { ARCHIVE_PERMISSIONS } from "../archive.constants";
import type { ProductionInfo } from "../types/productionTypes";
import { useTranslation } from "react-i18next";
import type { Tag } from "../types/tagTypes";
import type { EventWithResolvedRelations } from "./EventCard";

const Spinner = () => (
  <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-white/40 border-t-white" />
);

type EditButtonProps = {
  action: string;
  isEditing: boolean;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
  originalInfo: ProductionInfo | null;
  setDraftInfo: React.Dispatch<React.SetStateAction<ProductionInfo | null>>;
  originalTags: Tag[] | null;
  setDraftTags: React.Dispatch<React.SetStateAction<Tag[]>>;
  originalEvents: EventWithResolvedRelations[] | null;
  setDraftEvents: React.Dispatch<React.SetStateAction<EventWithResolvedRelations[]>>;
  setNewEvents: React.Dispatch<React.SetStateAction<EventWithResolvedRelations[]>>;
  setDeletedEvents: React.Dispatch<React.SetStateAction<EventWithResolvedRelations[]>>;
  enable_save: boolean;
  is_saving: boolean;
  _handleSave: () => Promise<void>;
};

export function EditButton({
  action,
  isEditing,
  setIsEditing,
  originalInfo,
  setDraftInfo,
  originalTags,
  setDraftTags,
  originalEvents,
  setDraftEvents,
  setNewEvents,
  setDeletedEvents,
  enable_save,
  is_saving,
  _handleSave,
}: EditButtonProps) {
  const { t } = useTranslation();
  const shared_css = `
    shadow-lg
    hover:bg-archive-control-hover
    rounded-full
    cursor-pointer
    transition-colors
    duration-150
    text-archive-ink
    inline-flex
    px-6 py-3
    font-semibold text-white
  `;
  return (
    <Protected permissions={[ARCHIVE_PERMISSIONS.update]}>
      {!isEditing ? (
        <button
          id="edit-production-button"
          onClick={() => setIsEditing(true)}
          className={`${shared_css} bg-archive-accent`}
        >
          {action}
        </button>
      ) : (
        <div id="edit-actions" className="flex gap-3">
          <button
            id="cancel-edit-production-button"
            onClick={() => {
              // Copy (not by reference)
              setDraftInfo(originalInfo ? { ...originalInfo } : null);
              setDraftTags(originalTags ? [...originalTags] : []);
              setDraftEvents(
                originalEvents ? originalEvents.map((e) => ({ ...e })) : []
              );
              setNewEvents([]);
              setDeletedEvents([]);
              setIsEditing(false);
            }}
            className={`${shared_css} bg-gray-300`}
          >
            {t("productionPage.edit.cancel")}
          </button>

          <button
            id="save-edit-production-button"
            onClick={_handleSave}
            className={` ${shared_css} bg-archive-accent disabled:hover:bg-archive-accent flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-40`}
            disabled={!enable_save || is_saving}
          >
            {is_saving ? <Spinner /> : t("productionPage.edit.save")}
          </button>
        </div>
      )}
    </Protected>
  );
}
