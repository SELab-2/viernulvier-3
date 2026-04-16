import type { ReactNode } from "react";

import { useAuthSession } from "../context/AuthSessionContext";

type ProtectedProps = {
  children: ReactNode;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
  permissions?: readonly string[];
  roles?: readonly string[];
  requireAllPermissions?: boolean;
  requireAllRoles?: boolean;
  requireSuperUser?: boolean;
};

function matchesRequirements(
  actualValues: readonly string[],
  requiredValues: readonly string[],
  requireAll: boolean
) {
  if (requiredValues.length === 0) {
    return true;
  }

  return requireAll
    ? requiredValues.every((value) => actualValues.includes(value))
    : requiredValues.some((value) => actualValues.includes(value));
}

export function Protected({
  children,
  fallback = null,
  loadingFallback = null,
  permissions = [],
  roles = [],
  requireAllPermissions = true,
  requireAllRoles = true,
  requireSuperUser = false,
}: ProtectedProps) {
  const { isAuthenticated, isLoading, user } = useAuthSession();

  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }

  if (requireSuperUser) {
    return user.isSuperUser ? <>{children}</> : <>{fallback}</>;
  }

  if (user.isSuperUser) {
    return <>{children}</>;
  }

  const hasRequiredRoles = matchesRequirements(user.roles, roles, requireAllRoles);
  const hasRequiredPermissions = matchesRequirements(
    user.permissions,
    permissions,
    requireAllPermissions
  );

  if (!hasRequiredRoles || !hasRequiredPermissions) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
