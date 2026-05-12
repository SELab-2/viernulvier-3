import { Protected } from "~/features/auth";
import { ARCHIVE_PERMISSIONS } from "~/features/archive/archive.constants";
import { CreateProductionPageAccessDenied, CreateProductionPage } from "~/features/archive/pages/CreateProductionPage";

export default function CreateBlogRoute() {
  return (
    <Protected
      permissions={[ARCHIVE_PERMISSIONS.create]}
      fallback={<CreateProductionPageAccessDenied />}
    >
      <CreateProductionPage />
    </Protected>
  );
}
