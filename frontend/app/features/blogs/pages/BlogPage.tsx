import type { Blog } from "../types/blogTypes";
import { useEffect, useState } from "react";
import { BlogCardList } from "../components/BlogCard";
import { getBlogsPaginated } from "../services/blogService";
import { CreateBlogButton } from "../components/CreateBlogButton";

export default function BlogPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);

  useEffect(() => {
    async function fetchBlogs() {
      const result = await getBlogsPaginated();
      setBlogs(result.blogs);
    }
    fetchBlogs();
  }, []);

  return (
    <div>
      <CreateBlogButton />
      <BlogCardList blogs={blogs} />
    </div>
  );
}
