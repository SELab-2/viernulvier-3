import type { JsonPaginationResponse } from "~/features/archive/types/paginationTypes";

export interface BlogContent {
  blog_id_url: string;
  language: string;

  title: string;
  content: string;
}

export interface Blog {
  id_url: string;
  blog_contents: BlogContent[];
  production_id_urls: string[];
}

export interface BlogList {
  blogs: Blog[];
  pagination: JsonPaginationResponse;
}

export interface BlogContentCreate {
  language: string;

  title: string;
  content: string;
}

export interface BlogCreate {
  blog_content: BlogContentCreate;
  production_id_urls: string[];
}

export interface BlogContentUpdate {
  language: string;

  title: string;
  content: string;
}

export interface BlogUpdate {
  blog_contents: BlogContentUpdate[];
  production_id_urls: string[];
  remove_languages?: string[];
}
