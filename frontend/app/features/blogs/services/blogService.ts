import type { JsonPaginationRequest } from "~/features/archive/types/paginationTypes";
import { createApiClient } from "~/shared/services/apiClient";
import type { Blog, BlogCreate, BlogList, BlogUpdate } from "../types/blogTypes";
import {
  deleteFromArchive,
  getByUrl,
  getFromArchive,
  patchByUrl,
  patchToArchive,
  postToArchive,
} from "~/shared/services/sharedService";
import type { Production } from "~/features/archive/types/productionTypes";

const ARCHIVE_PATH: string = "/api/v1/archive";

export async function getBlogsPaginated(
  params?: JsonPaginationRequest & {
    blog_name?: string;
    sort_order?: string;
  }
): Promise<BlogList> {
  const apiClient = createApiClient();

  const response = await apiClient.get<BlogList>(`${ARCHIVE_PATH}/blogs`, {
    params: { ...params },
  });

  return response.data;
}

export async function getBlog(blogId: number, lang?: string): Promise<Blog> {
  return getFromArchive<Blog>(`/blogs/${blogId}`, lang);
}

export async function getBlogByUrl(blogUrl: string, lang?: string): Promise<Blog> {
  return getByUrl<Blog>(blogUrl, lang);
}

export async function createBlog(blogData: BlogCreate): Promise<Blog> {
  return postToArchive<Blog>("/blogs", blogData);
}

export async function updateBlogByUrl(
  blog_url: string,
  blogData: BlogUpdate
): Promise<Blog> {
  return patchByUrl<Blog>(blog_url, blogData);
}

export async function updateBlog(blogId: number, blogData: BlogUpdate): Promise<Blog> {
  return patchToArchive<Blog>(`/blogs/${blogId}`, blogData);
}

export async function deleteBlog(blogId: number): Promise<void> {
  return deleteFromArchive(`/blogs/${blogId}`);
}

export async function getBlogsForProduction(productionUrl: string): Promise<Blog[]> {
  try {
    const productionId = productionUrl.split("/").pop();
    if (!productionId) {
      return [];
    }

    const apiClient = createApiClient();
    const response = await apiClient.get<BlogList>(
      `${ARCHIVE_PATH}/productions/${productionId}/blogs`
    );

    return response.data.blogs;
  } catch {
    return [];
  }
}

// Volgende interface (en eventueel ook de functie) zijn tijdelijke functies tot
// reeksen officieel in de frontend zitten
interface ProductionGroup {
  id_url: string;
  production_id_urls: string[];
}

export async function getProductionsForBlog(blog: Blog): Promise<Production[]> {
  try {
    const productionGroupIdUrl = blog.production_group_id_url;
    const apiClient = createApiClient();
    const response = await apiClient.get<ProductionGroup>(productionGroupIdUrl);
    const productionIdUrls = response.data.production_id_urls;

    const productions = await Promise.all(
      productionIdUrls.map((url) =>
        apiClient.get<Production>(url).then((res) => res.data)
      )
    );

    return productions;
  } catch {
    return [];
  }
}
