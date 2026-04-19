import { Protected } from "~/features/auth";
import {
  UserManagementAccessDenied,
  UserManagementPage,
  USER_PERMISSIONS,
} from "~/features/users";

export default function UsersRoute() {
  return (
    <Protected
      permissions={[USER_PERMISSIONS.read]}
      fallback={<UserManagementAccessDenied />}
    >
      <UserManagementPage />
    </Protected>
  );
}
