import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useState } from "react";

import { Protected } from "~/features/auth";
import { BLOG_PERMISSIONS } from "../blog.constants";
import { deleteBlog } from "../services/blogService";
import { useLocalizedPath } from "~/shared/hooks/useLocalizedPath";

type DeleteBlogButtonProps = {
  blogId: number;
};

export function DeleteBlogButton({ blogId }: DeleteBlogButtonProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const lp = useLocalizedPath();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(t("blogs.contentPage.delete.confirm"));
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteBlog(blogId);
      navigate(lp("/blogs"));
    } catch {
      window.alert(t("blogs.contentPage.delete.error"));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Protected permissions={[BLOG_PERMISSIONS.delete]}>
      <button
        id="delete-blog-button"
        onClick={handleDelete}
        disabled={isDeleting}
        className="hover:bg-archive-control-hover text-archive-ink bg-archive-accent inline-flex cursor-pointer rounded-full px-6 py-3 font-semibold text-white shadow-lg transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isDeleting
          ? t("blogs.contentPage.delete.deleting")
          : t("blogs.contentPage.delete.delete")}
      </button>
    </Protected>
  );
}
