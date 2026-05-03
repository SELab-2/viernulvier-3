import { Protected } from "~/features/auth";
import { BLOG_PERMISSIONS } from "~/features/blogs/blog.constants";
import {
  CreateBlogAccessDenied,
  CreateBlogPage,
} from "~/features/blogs/pages/CreateBlogPage";

export default function CreateBlogRoute() {
  return (
    <Protected
      permissions={[BLOG_PERMISSIONS.create]}
      fallback={<CreateBlogAccessDenied />}
    >
      <CreateBlogPage />;
    </Protected>
  );
}
