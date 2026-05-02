import { BlogCardList } from "../components/BlogCard";
import { getBlogsPaginated } from "../services/blogService";

export default async function BlogPage() {
  const blogs = await getBlogsPaginated();
  return <BlogCardList blogs={blogs.blogs} />;
}
