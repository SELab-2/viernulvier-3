import { useEffect, useState } from "react";
import axios from "axios";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { useAuthSession } from "~/features/auth";

import { RoleCard } from "../components/RoleCard";
import { RoleFormDialog } from "../components/RoleFormDialog";
import { UserCard } from "../components/UserCard";
import { UserFormDialog } from "../components/UserFormDialog";
import { USER_PERMISSIONS } from "../users.constants";
import { listPermissions } from "../services/permissionManagementService";
import {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
} from "../services/userManagementService";
import {
  createRole,
  deleteRole,
  listRoles,
  updateRole,
} from "../services/roleManagementService";
import type {
  IRole,
  IRoleCreateRequest,
  IRoleUpdateRequest,
  IUser,
  IUserCreateRequest,
  IUserUpdateRequest,
} from "../users.types";

function getApiErrorMessage(error: unknown, fallbackMessage: string): string {
  if (!axios.isAxiosError(error)) {
    return fallbackMessage;
  }

  const detail = error.response?.data;

  if (
    detail &&
    typeof detail === "object" &&
    "detail" in detail &&
    typeof detail.detail === "string"
  ) {
    return detail.detail;
  }

  return fallbackMessage;
}

function SummaryCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-archive-border bg-archive-surface rounded-3xl border p-5 backdrop-blur-sm">
      <div className="font-serif text-4xl italic">{value}</div>
      <div className="mt-2 text-[0.68rem] font-bold tracking-[0.24em] uppercase opacity-45">
        {label}
      </div>
    </div>
  );
}

function hasPermission(
  permissions: readonly string[] | undefined,
  isSuperUser: boolean | undefined,
  permission: string
) {
  return Boolean(isSuperUser || permissions?.includes(permission));
}

function sortRolesByName(roles: IRole[]) {
  return [...roles].sort((left, right) => left.name.localeCompare(right.name));
}

function UserMutationAlert({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <Alert severity="error" variant="outlined" sx={bannerSx}>
      {message}
    </Alert>
  );
}

function DeleteUserDialog({
  user,
  isSubmitting,
  errorMessage,
  onClose,
  onConfirm,
}: {
  user: IUser | null;
  isSubmitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const { t } = useTranslation();

  async function handleConfirm() {
    await onConfirm();
  }

  return (
    <Dialog
      open={Boolean(user)}
      onClose={isSubmitting ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: { sx: dialogPaperSx },
        backdrop: { sx: dialogBackdropSx },
      }}
    >
      <DialogTitle sx={dialogTitleSx}>{t("users.dialogs.delete.title")}</DialogTitle>
      <DialogContent sx={dialogContentSx}>
        <p className="mb-2 text-sm leading-relaxed text-[color:var(--archive-ink)] opacity-70">
          {t("users.dialogs.delete.description", { username: user?.username })}
        </p>

        <UserMutationAlert message={errorMessage} />
      </DialogContent>
      <DialogActions sx={dialogActionsSx}>
        <Button onClick={onClose} disabled={isSubmitting} sx={secondaryButtonSx}>
          {t("users.actions.cancel")}
        </Button>
        <Button onClick={handleConfirm} disabled={isSubmitting} sx={dangerButtonSx}>
          {isSubmitting ? (
            <>
              <CircularProgress size={13} sx={{ color: "inherit", mr: 1 }} />
              {t("users.actions.deleting")}
            </>
          ) : (
            t("users.actions.delete")
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DeleteRoleDialog({
  role,
  isSubmitting,
  errorMessage,
  onClose,
  onConfirm,
}: {
  role: IRole | null;
  isSubmitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const { t } = useTranslation();

  async function handleConfirm() {
    await onConfirm();
  }

  return (
    <Dialog
      open={Boolean(role)}
      onClose={isSubmitting ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: { sx: dialogPaperSx },
        backdrop: { sx: dialogBackdropSx },
      }}
    >
      <DialogTitle sx={dialogTitleSx}>
        {t("users.roles.dialogs.delete.title")}
      </DialogTitle>
      <DialogContent sx={dialogContentSx}>
        <p className="mb-2 text-sm leading-relaxed text-[color:var(--archive-ink)] opacity-70">
          {t("users.roles.dialogs.delete.description", { roleName: role?.name })}
        </p>

        <UserMutationAlert message={errorMessage} />
      </DialogContent>
      <DialogActions sx={dialogActionsSx}>
        <Button onClick={onClose} disabled={isSubmitting} sx={secondaryButtonSx}>
          {t("users.actions.cancel")}
        </Button>
        <Button onClick={handleConfirm} disabled={isSubmitting} sx={dangerButtonSx}>
          {isSubmitting ? (
            <>
              <CircularProgress size={13} sx={{ color: "inherit", mr: 1 }} />
              {t("users.roles.actions.deleting")}
            </>
          ) : (
            t("users.roles.actions.delete")
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function UserManagementAccessDenied() {
  const { t } = useTranslation();

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
      <div className="border-archive-border bg-archive-surface rounded-[2rem] border p-8 shadow-[0_20px_70px_rgba(45,40,37,0.05)]">
        <p className="text-xs font-bold tracking-[0.24em] uppercase opacity-40">
          {t("users.accessDenied.sectionLabel")}
        </p>
        <h1 className="mt-3 font-serif text-4xl italic md:text-5xl">
          {t("users.accessDenied.title")}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed opacity-70">
          {t("users.accessDenied.description")}
        </p>
      </div>
    </section>
  );
}

export default function UserManagementPage() {
  const { t, i18n } = useTranslation();
  const { user: currentUser, refreshSession } = useAuthSession();
  const [users, setUsers] = useState<IUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createMutationError, setCreateMutationError] = useState<string | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [editMutationError, setEditMutationError] = useState<string | null>(null);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [userIdToEdit, setUserIdToEdit] = useState<number | null>(null);
  const [deleteMutationError, setDeleteMutationError] = useState<string | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [userIdToDelete, setUserIdToDelete] = useState<number | null>(null);
  const [roles, setRoles] = useState<IRole[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [isCreateRoleDialogOpen, setIsCreateRoleDialogOpen] = useState(false);
  const [createRoleError, setCreateRoleError] = useState<string | null>(null);
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [editRoleError, setEditRoleError] = useState<string | null>(null);
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [roleIdToEdit, setRoleIdToEdit] = useState<number | null>(null);
  const [deleteRoleError, setDeleteRoleError] = useState<string | null>(null);
  const [isDeletingRole, setIsDeletingRole] = useState(false);
  const [roleIdToDelete, setRoleIdToDelete] = useState<number | null>(null);
  const [availablePermissions, setAvailablePermissions] = useState<string[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);

  const userToDelete =
    userIdToDelete === null
      ? null
      : (users.find((managedUser) => managedUser.id === userIdToDelete) ?? null);
  const userToEdit =
    userIdToEdit === null
      ? null
      : (users.find((managedUser) => managedUser.id === userIdToEdit) ?? null);
  const roleToEdit =
    roleIdToEdit === null
      ? null
      : (roles.find((managedRole) => managedRole.id === roleIdToEdit) ?? null);
  const roleToDelete =
    roleIdToDelete === null
      ? null
      : (roles.find((managedRole) => managedRole.id === roleIdToDelete) ?? null);

  useEffect(() => {
    // Ignore any in-flight response once this effect is cleaned up or rerun.
    let isDisposed = false;

    async function loadData() {
      // Reset the request state before fetching the current user list.
      setIsLoading(true);
      setPageError(null);

      try {
        const fetchedUsers = await listUsers();

        // The component may have unmounted while the request was pending.
        if (isDisposed) {
          return;
        }

        setUsers(fetchedUsers);
      } catch (error) {
        if (isDisposed) {
          return;
        }

        setPageError(getApiErrorMessage(error, t("users.messages.loadFailed")));
      } finally {
        if (!isDisposed) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      // Prevent late async state updates after unmount or dependency changes.
      isDisposed = true;
    };
  }, [reloadToken, t]);

  useEffect(() => {
    let isDisposed = false;

    async function loadRoles() {
      setIsLoadingRoles(true);
      setRolesError(null);

      try {
        const fetchedRoles = await listRoles();

        if (isDisposed) {
          return;
        }

        setRoles(fetchedRoles);
      } catch (error) {
        if (isDisposed) {
          return;
        }

        setRolesError(getApiErrorMessage(error, t("users.roles.messages.loadFailed")));
      } finally {
        if (!isDisposed) {
          setIsLoadingRoles(false);
        }
      }
    }

    void loadRoles();

    return () => {
      isDisposed = true;
    };
  }, [reloadToken, t]);

  useEffect(() => {
    let isDisposed = false;

    async function loadPermissions() {
      setIsLoadingPermissions(true);
      setPermissionsError(null);

      try {
        const fetchedPermissions = await listPermissions();

        if (isDisposed) {
          return;
        }

        setAvailablePermissions(fetchedPermissions);
      } catch (error) {
        if (isDisposed) {
          return;
        }

        setPermissionsError(
          getApiErrorMessage(error, t("users.roles.messages.permissionsLoadFailed"))
        );
      } finally {
        if (!isDisposed) {
          setIsLoadingPermissions(false);
        }
      }
    }

    void loadPermissions();

    return () => {
      isDisposed = true;
    };
  }, [reloadToken, t]);

  function refreshUsers() {
    setReloadToken((value) => value + 1);
  }

  function openCreateDialog() {
    setCreateMutationError(null);
    setIsCreateDialogOpen(true);
  }

  function closeCreateDialog() {
    if (isCreatingUser) {
      return;
    }

    setCreateMutationError(null);
    setIsCreateDialogOpen(false);
  }

  function canEditManagedUser(managedUser: IUser) {
    return canEditUsers && (canManageSuperUsers || !managedUser.isSuperUser);
  }

  function canDeleteManagedUser(managedUser: IUser) {
    return (
      canDeleteUsers &&
      managedUser.id !== currentUser?.id &&
      (canManageSuperUsers || !managedUser.isSuperUser)
    );
  }

  function openEditDialog(userId: number) {
    const managedUser = users.find((candidate) => candidate.id === userId);

    if (!managedUser || !canEditManagedUser(managedUser)) {
      return;
    }

    setEditMutationError(null);
    setUserIdToEdit(userId);
  }

  function closeEditDialog() {
    if (isEditingUser) {
      return;
    }

    setEditMutationError(null);
    setUserIdToEdit(null);
  }

  function openDeleteDialog(userId: number) {
    const managedUser = users.find((candidate) => candidate.id === userId);

    if (!managedUser || !canDeleteManagedUser(managedUser)) {
      return;
    }

    setDeleteMutationError(null);
    setUserIdToDelete(userId);
  }

  function closeDeleteDialog() {
    if (isDeletingUser) {
      return;
    }

    setDeleteMutationError(null);
    setUserIdToDelete(null);
  }

  async function handleCreateUser(payload: IUserCreateRequest) {
    setIsCreatingUser(true);
    setCreateMutationError(null);

    try {
      const createdUser = await createUser(
        canAssignRoles ? payload : { ...payload, roles: undefined }
      );
      setUsers((currentUsers) => [...currentUsers, createdUser]);
      setIsCreateDialogOpen(false);
    } catch (error) {
      setCreateMutationError(
        getApiErrorMessage(error, t("users.messages.createFailed"))
      );
    } finally {
      setIsCreatingUser(false);
    }
  }

  async function handleEditUser(payload: IUserUpdateRequest) {
    if (userIdToEdit === null || !userToEdit || !canEditManagedUser(userToEdit)) {
      return;
    }

    setIsEditingUser(true);
    setEditMutationError(null);

    try {
      const updatedUser = await updateUser(
        userIdToEdit,
        canAssignRoles ? payload : { ...payload, roles: undefined }
      );
      setUsers((currentUsers) =>
        currentUsers.map((managedUser) =>
          managedUser.id === updatedUser.id ? updatedUser : managedUser
        )
      );
      setUserIdToEdit(null);

      if (updatedUser.id === currentUser?.id) {
        try {
          await refreshSession();
        } catch (error) {
          setPageError(
            getApiErrorMessage(error, t("users.messages.sessionRefreshFailed"))
          );
        }
      }
    } catch (error) {
      setEditMutationError(getApiErrorMessage(error, t("users.messages.updateFailed")));
    } finally {
      setIsEditingUser(false);
    }
  }

  async function handleDeleteUser() {
    if (
      userIdToDelete === null ||
      !userToDelete ||
      !canDeleteManagedUser(userToDelete)
    ) {
      return;
    }

    setIsDeletingUser(true);
    setDeleteMutationError(null);

    try {
      await deleteUser(userIdToDelete);
      setUsers((currentUsers) =>
        currentUsers.filter((managedUser) => managedUser.id !== userIdToDelete)
      );
      setUserIdToDelete(null);
    } catch (error) {
      setDeleteMutationError(
        getApiErrorMessage(error, t("users.messages.deleteFailed"))
      );
    } finally {
      setIsDeletingUser(false);
    }
  }

  function openCreateRoleDialog() {
    if (!canCreateRoles) {
      return;
    }

    setCreateRoleError(null);
    setIsCreateRoleDialogOpen(true);
  }

  function closeCreateRoleDialog() {
    if (isCreatingRole) {
      return;
    }

    setCreateRoleError(null);
    setIsCreateRoleDialogOpen(false);
  }

  async function handleCreateRole(payload: IRoleCreateRequest) {
    if (!canCreateRoles) {
      return;
    }

    setIsCreatingRole(true);
    setCreateRoleError(null);

    try {
      const createdRole = await createRole(payload);
      setRoles((current) => sortRolesByName([...current, createdRole]));
      setIsCreateRoleDialogOpen(false);
    } catch (error) {
      setCreateRoleError(
        getApiErrorMessage(error, t("users.roles.messages.createFailed"))
      );
    } finally {
      setIsCreatingRole(false);
    }
  }

  function openEditRoleDialog(roleId: number) {
    if (!canEditRoles) {
      return;
    }

    setEditRoleError(null);
    setRoleIdToEdit(roleId);
  }

  function closeEditRoleDialog() {
    if (isEditingRole) {
      return;
    }

    setEditRoleError(null);
    setRoleIdToEdit(null);
  }

  async function handleEditRole(payload: IRoleUpdateRequest) {
    if (roleIdToEdit === null || !canEditRoles) {
      return;
    }

    setIsEditingRole(true);
    setEditRoleError(null);

    try {
      const updatedRole = await updateRole(roleIdToEdit, payload);
      setRoles((currentRoles) =>
        sortRolesByName(
          currentRoles.map((managedRole) =>
            managedRole.id === updatedRole.id ? updatedRole : managedRole
          )
        )
      );
      setRoleIdToEdit(null);
      refreshUsers();

      try {
        await refreshSession();
      } catch (error) {
        setPageError(
          getApiErrorMessage(error, t("users.messages.sessionRefreshFailed"))
        );
      }
    } catch (error) {
      setEditRoleError(
        getApiErrorMessage(error, t("users.roles.messages.updateFailed"))
      );
    } finally {
      setIsEditingRole(false);
    }
  }

  function openDeleteRoleDialog(roleId: number) {
    if (!canDeleteRoles) {
      return;
    }

    setDeleteRoleError(null);
    setRoleIdToDelete(roleId);
  }

  function closeDeleteRoleDialog() {
    if (isDeletingRole) {
      return;
    }

    setDeleteRoleError(null);
    setRoleIdToDelete(null);
  }

  async function handleDeleteRole() {
    if (roleIdToDelete === null || !canDeleteRoles) {
      return;
    }

    setIsDeletingRole(true);
    setDeleteRoleError(null);

    try {
      await deleteRole(roleIdToDelete);
      setRoles((currentRoles) =>
        currentRoles.filter((managedRole) => managedRole.id !== roleIdToDelete)
      );
      setRoleIdToDelete(null);
    } catch (error) {
      setDeleteRoleError(
        getApiErrorMessage(error, t("users.roles.messages.deleteFailed"))
      );
    } finally {
      setIsDeletingRole(false);
    }
  }

  function formatDateTime(value: string | null) {
    if (!value) {
      return t("users.empty.date");
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(i18n.language, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(parsedDate);
  }

  const superUserCount = users.filter((managedUser) => managedUser.isSuperUser).length;
  const canManageSuperUsers = Boolean(currentUser?.isSuperUser);
  const canCreateUsers = hasPermission(
    currentUser?.permissions,
    currentUser?.isSuperUser,
    USER_PERMISSIONS.create
  );
  const canEditUsers = hasPermission(
    currentUser?.permissions,
    currentUser?.isSuperUser,
    USER_PERMISSIONS.update
  );
  const canAssignRoles = canCreateUsers || canEditUsers;

  const canCreateRoles = hasPermission(
    currentUser?.permissions,
    currentUser?.isSuperUser,
    USER_PERMISSIONS.create
  );
  const canEditRoles = hasPermission(
    currentUser?.permissions,
    currentUser?.isSuperUser,
    USER_PERMISSIONS.update
  );
  const canDeleteUsers = hasPermission(
    currentUser?.permissions,
    currentUser?.isSuperUser,
    USER_PERMISSIONS.delete
  );
  const canDeleteRoles = hasPermission(
    currentUser?.permissions,
    currentUser?.isSuperUser,
    USER_PERMISSIONS.delete
  );

  return (
    <>
      <title>{`${t("nav.users")} | VIERNULVIER`}</title>
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <div className="max-w-3xl">
          <p className="text-xs font-bold tracking-[0.24em] uppercase opacity-40">
            {t("users.sectionLabel")}
          </p>
          <h1 className="mt-3 font-serif text-4xl italic md:text-6xl">
            {t("users.title")}
          </h1>
          <p className="mt-4 text-base leading-relaxed opacity-70 md:text-lg">
            {t("users.description")}
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <SummaryCard
            value={isLoading ? "-" : String(users.length)}
            label={t("users.summary.totalUsers")}
          />
          <SummaryCard
            value={isLoading ? "-" : String(superUserCount)}
            label={t("users.summary.superUsers")}
          />
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button sx={secondaryButtonSx} onClick={refreshUsers}>
            {t("users.actions.refresh")}
          </Button>
          {canCreateUsers && (
            <Button sx={primaryButtonSx} onClick={openCreateDialog}>
              {t("users.actions.add")}
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex min-h-80 items-center justify-center">
            <div className="border-archive-border bg-archive-surface inline-flex items-center gap-3 rounded-full border px-5 py-3 text-sm tracking-[0.15em] uppercase opacity-75">
              <CircularProgress size={16} sx={{ color: "var(--archive-accent)" }} />
              <span>{t("users.loading")}</span>
            </div>
          </div>
        ) : pageError ? (
          <div className="border-archive-border bg-archive-surface mt-8 max-w-2xl rounded-[2rem] border p-6 shadow-[0_20px_70px_rgba(45,40,37,0.05)]">
            <Alert severity="error" variant="outlined" sx={bannerSx}>
              {pageError}
            </Alert>
            <Button sx={secondaryButtonSx} onClick={refreshUsers}>
              {t("users.actions.retry")}
            </Button>
          </div>
        ) : users.length === 0 ? (
          <div className="border-archive-border bg-archive-surface mt-8 rounded-[2rem] border border-dashed p-8 text-center shadow-[0_20px_70px_rgba(45,40,37,0.05)]">
            <h2 className="font-serif text-3xl italic">{t("users.empty.title")}</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed opacity-65">
              {t("users.empty.description")}
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {users.map((managedUser) => (
              <UserCard
                key={managedUser.id}
                user={managedUser}
                formatDateTime={formatDateTime}
                onEdit={
                  canEditManagedUser(managedUser)
                    ? () => openEditDialog(managedUser.id)
                    : undefined
                }
                onDelete={
                  canDeleteManagedUser(managedUser)
                    ? () => openDeleteDialog(managedUser.id)
                    : undefined
                }
              />
            ))}
          </div>
        )}

        <div className="border-archive-border mt-14 border-t pt-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-[0.24em] uppercase opacity-40">
                {t("users.roles.sectionLabel")}
              </p>
              <h2 className="mt-2 font-serif text-3xl italic md:text-4xl">
                {t("users.roles.title")}
              </h2>
            </div>
            {canCreateRoles && (
              <Button sx={primaryButtonSx} onClick={openCreateRoleDialog}>
                {t("users.roles.actions.add")}
              </Button>
            )}
          </div>

          {isLoadingRoles ? (
            <div className="flex min-h-40 items-center justify-center">
              <div className="border-archive-border bg-archive-surface inline-flex items-center gap-3 rounded-full border px-5 py-3 text-sm tracking-[0.15em] uppercase opacity-75">
                <CircularProgress size={16} sx={{ color: "var(--archive-accent)" }} />
                <span>{t("users.roles.loading")}</span>
              </div>
            </div>
          ) : rolesError ? (
            <div className="border-archive-border bg-archive-surface mt-8 max-w-2xl rounded-[2rem] border p-6 shadow-[0_20px_70px_rgba(45,40,37,0.05)]">
              <Alert severity="error" variant="outlined" sx={bannerSx}>
                {rolesError}
              </Alert>
            </div>
          ) : roles.length === 0 ? (
            <div className="border-archive-border bg-archive-surface mt-8 rounded-[2rem] border border-dashed p-8 text-center shadow-[0_20px_70px_rgba(45,40,37,0.05)]">
              <h3 className="font-serif text-2xl italic">
                {t("users.roles.empty.title")}
              </h3>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed opacity-65">
                {t("users.roles.empty.description")}
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
              {roles.map((role) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  onEdit={canEditRoles ? () => openEditRoleDialog(role.id) : undefined}
                  onDelete={
                    canDeleteRoles ? () => openDeleteRoleDialog(role.id) : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {isCreateDialogOpen && (
        <UserFormDialog
          key="create-user-dialog"
          mode="create"
          open={true}
          isSubmitting={isCreatingUser}
          availableRoles={roles}
          canAssignRoles={canAssignRoles}
          errorMessage={createMutationError}
          onClose={closeCreateDialog}
          onSubmit={handleCreateUser}
        />
      )}

      {userToEdit && (
        <UserFormDialog
          key={userToEdit.id}
          mode="edit"
          open={true}
          user={userToEdit}
          isSubmitting={isEditingUser}
          availableRoles={roles}
          canAssignRoles={canAssignRoles}
          errorMessage={editMutationError}
          onClose={closeEditDialog}
          onSubmit={handleEditUser}
        />
      )}

      <DeleteUserDialog
        user={userToDelete}
        isSubmitting={isDeletingUser}
        errorMessage={userToDelete ? deleteMutationError : null}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteUser}
      />

      <DeleteRoleDialog
        role={roleToDelete}
        isSubmitting={isDeletingRole}
        errorMessage={roleToDelete ? deleteRoleError : null}
        onClose={closeDeleteRoleDialog}
        onConfirm={handleDeleteRole}
      />

      {isCreateRoleDialogOpen && (
        <RoleFormDialog
          key="create-role-dialog"
          mode="create"
          open={true}
          isSubmitting={isCreatingRole}
          availablePermissions={availablePermissions}
          isLoadingPermissions={isLoadingPermissions}
          permissionsErrorMessage={permissionsError}
          errorMessage={createRoleError}
          onClose={closeCreateRoleDialog}
          onSubmit={handleCreateRole}
        />
      )}

      {roleToEdit && (
        <RoleFormDialog
          key={roleToEdit.id}
          mode="edit"
          open={true}
          role={roleToEdit}
          isSubmitting={isEditingRole}
          availablePermissions={availablePermissions}
          isLoadingPermissions={isLoadingPermissions}
          permissionsErrorMessage={permissionsError}
          errorMessage={editRoleError}
          onClose={closeEditRoleDialog}
          onSubmit={handleEditRole}
        />
      )}
    </>
  );
}

const bannerSx = {
  "mt": 4,
  "fontFamily": "var(--font-sans)",
  "fontSize": "0.875rem",
  "borderColor": "rgba(196, 164, 132, 0.4)",
  "color": "var(--archive-ink)",
  "& .MuiAlert-icon": { color: "var(--archive-accent)" },
};

export const secondaryButtonSx = {
  py: 1.15,
  px: 2.35,
  borderRadius: "999px",
  textTransform: "none" as const,
  fontFamily: "var(--font-sans)",
  fontSize: "0.72rem",
  fontWeight: 700,
  letterSpacing: "0.18em",
  color: "var(--archive-ink)",
  border: "1px solid var(--archive-border)",
};

export const primaryButtonSx = {
  ...secondaryButtonSx,
  "color": "#f6f0e8",
  "borderColor": "transparent",
  "backgroundColor": "var(--archive-accent)",
  "&:hover": {
    backgroundColor: "#92653e",
  },
};

const dangerButtonSx = {
  ...secondaryButtonSx,
  "color": "#c0392b",
  "borderColor": "rgba(192, 57, 43, 0.4)",
  "&:hover": {
    backgroundColor: "rgba(192, 57, 43, 0.08)",
  },
};

export const dialogTitleSx = {
  fontFamily: "var(--font-serif)",
  fontStyle: "italic",
  fontSize: "1.9rem",
  color: "var(--archive-ink)",
  pb: 1,
  px: 3,
  pt: 3,
};

export const dialogContentSx = {
  pt: "0.25rem !important",
  pb: 1,
  px: 3,
  color: "var(--archive-ink)",
};

export const dialogActionsSx = {
  px: 3,
  pt: 2,
  pb: 3,
  gap: 1.5,
  borderTop: "1px solid var(--archive-border)",
};

export const dialogPaperSx = {
  borderRadius: "1.75rem",
  border: "1px solid var(--archive-border)",
  backgroundColor: "var(--archive-surface-strong)",
  color: "var(--archive-ink)",
  backdropFilter: "blur(18px)",
  boxShadow: "0 28px 90px rgba(0, 0, 0, 0.24)",
};

export const dialogBackdropSx = {
  backgroundColor: "rgba(17, 16, 14, 0.48)",
  backdropFilter: "blur(4px)",
};
