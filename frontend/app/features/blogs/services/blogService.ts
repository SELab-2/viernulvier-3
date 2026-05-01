import type { PaginationRequest } from "~/features/archive/types/paginationTypes";
import { createApiClient } from "~/shared/services/apiClient";
import type { Blog, BlogCreate, BlogList, BlogUpdate } from "../types/blogTypes";
import { deleteFromArchive, getByUrl, getFromArchive, patchByUrl, patchToArchive, postToArchive } from "~/shared/services/sharedService";

const ARCHIVE_PATH: string = "/api/v1/archive";

export async function getBlogsPaginated(
	params?: PaginationRequest
): Promise<BlogList> {
	const apiClient = createApiClient();

	const response = await apiClient.get<BlogList>(`${ARCHIVE_PATH}/blogs`, {
		params: {...params}
	});

	return response.data;
}

export async function getBlog(
	blogId: number,
	lang?: string
): Promise<Blog> {
	return getFromArchive<Blog>(`/blogs/${blogId}`, lang);
}

export async function getBlogByUrl(
	blogUrl: string,
	lang?: string
): Promise<Blog> {
	return getByUrl<Blog>(blogUrl, lang);
}

export async function createBlog(
  blogData: BlogCreate
): Promise<Blog> {
  return postToArchive<Blog>("/blogs", blogData);
}

export async function updateBlogByUrl(
  blog_url: string,
  blogData: BlogUpdate
): Promise<Blog> {
  return patchByUrl<Blog>(blog_url, blogData);
}

export async function updateBlog(
  blogId: number,
  blogData: BlogUpdate
): Promise<Blog> {
  return patchToArchive<Blog>(`/blogs/${blogId}`, blogData);
}

export async function deleteBlog(blogId: number): Promise<void> {
  return deleteFromArchive(`/blogs/${blogId}`);
}

