import { useTranslation } from "react-i18next";
import { Protected } from "~/features/auth";

type SimpleEditableFieldProps = {
  label: string;
  value: string;
  isEditing: boolean;
  onChange: (value: string) => void;
  renderView: (value: string) => React.ReactNode;
  isModified: boolean;
  permissions: string[];
};
// <Protected permissions={[ARCHIVE_PERMISSIONS.update]}>
// </Protected>
export default function SimpleEditableField({
  label,
  value,
  isEditing,
  onChange,
  renderView,
  isModified,
  permissions,
}: SimpleEditableFieldProps) {
  const normal_view = <>{renderView(value)}</>;
  const { t } = useTranslation();

  if (isEditing) {
    return (
      <Protected permissions={permissions} fallback={normal_view}>
        <div
          className={`bg-archive-ink/50 bg-archive-ink-dark/60 mb-1 rounded-2xl border p-2 backdrop-blur-md transition md:p-4 ${isModified ? "border-archive-accent border-l-10" : "border-archive-ink/5 border-archive-ink-dark/5"} `}
        >
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-archive-ink/70 dark:text-archive-paper/70 text-xs font-bold tracking-[0.2em] uppercase">
              {label}
            </h3>

            {isModified && (
              <span className="text-archive-paper text-[10px] tracking-widest uppercase opacity-80">
                {t("editfield.modified")}
              </span>
            )}
          </div>

          {/* Input */}
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`bg-archive-paper border-archive-ink/10 focus:ring-archive-accent/40 focus:border-archive-accent w-full rounded-lg border px-3 py-2 text-sm focus:ring-4 focus:outline-none`}
          />
        </div>
      </Protected>
    );
  }

  return normal_view;
}
