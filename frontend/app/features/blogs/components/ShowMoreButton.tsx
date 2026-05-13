import { useTranslation } from "react-i18next";
import type { SortOrderEnum } from "~/shared/components/SortOrderSelection";
import { frontendSortOrderToBackendSortOrder } from "~/shared/utils/orderMapping";
import type { BlogList } from "../types/blogTypes";
import { getBlogsPaginated } from "../services/blogService";

export function ShowMoreButton({
  blogList,
  setBlogList,
  sortOrder,
  blog_name,
}: {
  blogList: BlogList;
  setBlogList: React.Dispatch<React.SetStateAction<BlogList | null>>;
  sortOrder: SortOrderEnum;
  blog_name?: string;
}) {
  const { t } = useTranslation();

  async function onClick() {
    const next_blogs = await getBlogsPaginated({
      cursor: blogList.pagination.next_cursor,
      sort_order: frontendSortOrderToBackendSortOrder[sortOrder],
      blog_name: blog_name,
    });

    setBlogList({
      blogs: [...blogList.blogs, ...next_blogs.blogs],
      pagination: next_blogs.pagination,
    });
  }
  return (
    <div className="mt-15 w-full text-center">
      <button
        onClick={onClick}
        className="bg-archive-accent/90 hover:bg-archive-accent cursor-pointer rounded-md px-5 py-2 font-sans text-sm font-bold tracking-[0.2em] uppercase transition-all"
      >
        {t("blogs.showMore")}
      </button>
    </div>
  );
}
