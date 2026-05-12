import { useTranslation } from "react-i18next";
import type { BlogContent } from "../types/blogTypes";
import { Protected } from "~/features/auth";
import { BLOG_PERMISSIONS } from "../blog.constants";

const Spinner = () => (
  <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-white/40 border-t-white" />
);

type EditButtonProps = {
  action: string;
  isEditing: boolean;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
  originalContent: BlogContent | null;
  setDraftContent: React.Dispatch<React.SetStateAction<BlogContent | null>>;
  enable_save: boolean;
  is_saving: boolean;
  _handleSave: () => Promise<void>;
};

export default function EditButton({
  action,
  isEditing,
  setIsEditing,
  originalContent,
  setDraftContent,
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
    <Protected permissions={[BLOG_PERMISSIONS.update]}>
      {!isEditing ? (
        <button
          id="edit-blog-button"
          onClick={() => setIsEditing(true)}
          className={`${shared_css} bg-archive-accent`}
        >
          {action}
        </button>
      ) : (
        <div id="edit-actions" className="flex gap-3">
          <button
            id="cancel-edit-blog-button"
            onClick={() => {
              // Copy (not by reference)
              setDraftContent(originalContent ? { ...originalContent } : null);
              setIsEditing(false);
            }}
            className={`${shared_css} bg-gray-300`}
          >
            {t("blogs.contentPage.edit.cancel")}
          </button>

          <button
            id="save-edit-production-button"
            onClick={_handleSave}
            className={` ${shared_css} bg-archive-accent disabled:hover:bg-archive-accent flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-40`}
            disabled={!enable_save || is_saving}
          >
            {is_saving ? <Spinner /> : t("blogs.contentPage.edit.save")}
          </button>
        </div>
      )}
    </Protected>
  );
}
