import { useTranslation } from "react-i18next";
import SimpleEditableField from "~/shared/components/SimpleEditableField";
import { ARCHIVE_PERMISSIONS } from "../archive.constants";
import { getTextOrDefault } from "../utils/productionPageFunctions";

function isFieldModified(
  original: string | undefined,
  draft: string | undefined
): boolean {
  return (original ?? "") !== (draft ?? "");
}

type ProductionGeneralInfoProps = {
  isCreateGeneralInfo: boolean;
  isEditing: boolean;
  attendanceMode: string;
  originalAttendanceMode: string | undefined;
  performerType: string;
  originalPerformerType: string | undefined;
  onSave: (field: string, html: string) => void;
};

/* ProductionGeneralInfo contains attendance mode and performer type */
export function ProductionGeneralInfo({
  isCreateGeneralInfo,
  isEditing,
  attendanceMode,
  originalAttendanceMode,
  performerType,
  originalPerformerType,
  onSave,
}: ProductionGeneralInfoProps) {
  const { t } = useTranslation();

  const effectiveIsEditing = isCreateGeneralInfo || isEditing;

  const modified = (orig: string | undefined, draft: string | undefined) =>
    !isCreateGeneralInfo && isFieldModified(orig, draft);

  const permissions = isCreateGeneralInfo
    ? [ARCHIVE_PERMISSIONS.create]
    : [ARCHIVE_PERMISSIONS.update];

  return (
    <div className="flex w-full gap-4">
      <div className="flex-1">
        <SimpleEditableField
          value={attendanceMode}
          placeholder={t("archive.add_info.attendance_mode")}
          isEditing={effectiveIsEditing}
          onChange={(value) => onSave("attendance_mode", value)}
          label={t("productionPage.edit.attendance_mode")}
          renderView={(value) => (
            <p className="bg-archive-paper border-archive-ink/10 focus:ring-archive-accent/40 focus:border-archive-accent w-full rounded-lg border px-3 py-2 text-sm focus:ring-4 focus:outline-none">
              <span className="text-xs font-bold tracking-[0.24em] uppercase opacity-40">
                {t("productionPage.edit.attendance_mode")}:
              </span>{" "}
              {getTextOrDefault(
                value,
                t("productionPage.fallback.unknownAttendanceMode")
              )}
            </p>
          )}
          isModified={modified(originalAttendanceMode, attendanceMode)}
          permissions={permissions}
        />
      </div>
      <div className="flex-1">
        <SimpleEditableField
          value={performerType}
          placeholder={t("archive.add_info.performer_type")}
          isEditing={effectiveIsEditing}
          onChange={(value) => onSave("performer_type", value)}
          label={t("productionPage.edit.performer_type")}
          renderView={(value) => (
            <p className="bg-archive-paper border-archive-ink/10 focus:ring-archive-accent/40 focus:border-archive-accent w-full rounded-lg border px-3 py-2 text-sm focus:ring-4 focus:outline-none">
              <span className="text-xs font-bold tracking-[0.24em] uppercase opacity-40">
                {t("productionPage.edit.performer_type")}:
              </span>{" "}
              {getTextOrDefault(
                value,
                t("productionPage.fallback.unknownPerformerType")
              )}
            </p>
          )}
          isModified={modified(originalPerformerType, performerType)}
          permissions={permissions}
        />
      </div>
    </div>
  );
}
