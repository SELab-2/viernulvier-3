import type { BlogList } from "../types/blogTypes";
import { useEffect, useState } from "react";
import { BlogCardList } from "../components/BlogCard";
import { getBlogsPaginated } from "../services/blogService";
import { useTranslation } from "react-i18next";
import { Divider } from "@mui/material";
import { SortOrderEnum, SortOrderSelection } from "~/shared/components/SortOrderSelection";
import { ShowMoreButton } from "../components/ShowMoreButton";

function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="relative flex-1">
      <svg
        className="text-archive-ink pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 opacity-40"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle cx="11" cy="11" r="8" />
        <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("blogs.search.placeholder", "Search blogs…")}
        className="
          border-archive-ink/15 text-archive-ink placeholder:text-archive-ink/40
          focus:border-archive-ink/40 w-full rounded-lg border bg-transparent
          py-2 pr-4 pl-9 text-sm outline-none transition
        "
      />
    </div>
  );
}

export default function BlogPage() {
  const { t } = useTranslation();

  const [blogList, setBlogList] = useState<BlogList | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrderEnum>(
    SortOrderEnum.NewestFirst
  );

  useEffect(() => {
    async function fetchBlogs() {
      const result = await getBlogsPaginated();
      setBlogList(result);
    }
    fetchBlogs();
  }, []);

  const blogs = blogList?.blogs ?? [];

  return (
    <div className="mx-6 md:mx-10">
      <div className="mb-10 md:mb-16">
        <h1 className="mt-10 h-20 font-serif text-5xl italic md:text-7xl">
          {t("blogs.title", "Blogs")}
        </h1>
      </div>

      {/* Search + sort toolbar */}
      <div className="mb-4 flex flex-row items-center justify-between gap-3">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <SortOrderSelection sortOrder={sortOrder} setSortOrder={setSortOrder} />
      </div>

      <Divider className="bg-archive-ink/5" />

      <BlogCardList blogs={blogs} />

      {blogList?.pagination.has_more && (
        <ShowMoreButton blogList={blogList} setBlogList={setBlogList} sortOrder={SortOrderEnum.NewestFirst} />
      )}
    </div>
  );
}
