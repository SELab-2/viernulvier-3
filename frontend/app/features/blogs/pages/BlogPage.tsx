import { useTranslation } from "react-i18next";
import type { Blog } from "../types/blogTypes";
import { useEffect, useState } from "react";
import { BlogCardList } from "../components/BlogCard";
import { getBlogsPaginated } from "../services/blogService";
import { CreateBlogButton } from "../components/CreateBlogButton";
import { useNavigate } from "react-router";
import { useLocalizedPath } from "~/shared/hooks/useLocalizedPath";

export default function BlogPage() {
  const { t } = useTranslation();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const navigate = useNavigate();
  const lp = useLocalizedPath();

  useEffect(() => {
    async function fetchBlogs() {
      const result = await getBlogsPaginated();
      setBlogs(result.blogs);
    }
    fetchBlogs();
  }, []);

  const openCreateBlogPage = () => {
    navigate(lp("/blogs/create"));
  };

  return (
    <>
      <title>{`${t("nav.blogs")} | VIERNULVIER`}</title>
      <div>
        <CreateBlogButton onClick={openCreateBlogPage} />
        <BlogCardList blogs={blogs} />
      </div>
    </>
  );
}
