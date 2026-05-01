import { useParams } from "react-router";
import { useEffect, useMemo, useState } from "react";

import { useTranslation } from "react-i18next";
import { BlogContentPage } from "~/features/blogs/pages/BlogContentPage";

function getblogNumericIdFromInput(
  blogIdInput: string
): number | undefined {
  if (/^\d+$/.test(blogIdInput)) {
    const numericId = Number(blogIdInput);
    return Number.isInteger(numericId) && numericId > 0 ? numericId : undefined;
  }

  const urlMatch = blogIdInput.match(/\/blogs\/(\d+)(?:[/?#]|$)/);
  if (!urlMatch) {
    return undefined;
  }

  const numericId = Number(urlMatch[1]);
  return Number.isInteger(numericId) && numericId > 0 ? numericId : undefined;
}

export default function BlogContentRoute() {
  const { blogId = "" } = useParams();
  const decodedBlogId = useMemo(
    () => decodeURIComponent(blogId),
    [blogId]
  );
  const { i18n } = useTranslation();
  const { lang } = useParams();
  // const [blog, setBlog] = useState<Blog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const loadBlog = async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        // const numericId = getblogNumericIdFromInput(decodedBlogId);

        // let blogData =
        //   typeof numericId === "number"
        //     ? await getBlog(numericId)
        //     : await getBlogByUrl(decodedBlogId);
        //
        // // Check if the frontend received a blog info, otherwise refetch with another language
        // if (blogData.blog_infos.length === 0 && !isCancelled) {
        //   const otherLanguage = lang === "en" ? "nl" : "en";
        //   blogData =
        //     typeof numericId === "number"
        //       ? await getBlog(numericId, otherLanguage)
        //       : await getBlogByUrl(decodedBlogId, otherLanguage);
        // }
        //
        // if (!isCancelled) {
        //   setBlog(blogData);
        // }
      } catch {
        if (!isCancelled) {
          setHasError(true);
          // setBlog(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    if (decodedBlogId.trim().length === 0) {
      // setBlog(null);
      setHasError(true);
      setIsLoading(false);
      return;
    }

    void loadBlog();

    return () => {
      isCancelled = true;
    };
  }, [decodedBlogId, i18n.resolvedLanguage, lang]);

  if (isLoading) {
    return <div>Loading blog...</div>;
  }

  if (hasError) {
    return <div>Failed to load blog.</div>;
  }

  // if (!blog) {
  //   return <div>Blog not found.</div>;
  // }

  return <BlogContentPage blog={"test"} />;
}
