import { useEffect, useState, type FormEvent } from "react";
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
import { ArchiveTextField } from "~/shared/components/ArchiveTextField";

import { UserCard } from "../components/UserCard";
import { RoleCard } from "../components/RoleCard";
import { USER_PERMISSIONS } from "../users.constants";
import { createUser, deleteUser, listUsers } from "../services/userManagementService";
import { createRole, listRoles } from "../services/roleManagementService";
import type {
  IRole,
  IRoleCreateRequest,
  IUser,
  IUserCreateRequest,
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
    <div className="border-archive-border bg-archive-surface rounded-[1.5rem] border p-5 backdrop-blur-sm">
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

function CreateUserDialog({
  open,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}: {
  open: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSubmit: (payload: IUserCreateRequest) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const trimmedUsername = username.trim();

  function resetForm() {
    setUsername("");
    setPassword("");
    setValidationError(null);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!trimmedUsername) {
      setValidationError(t("users.messages.usernameRequired"));
      return;
    }

    if (!password) {
      setValidationError(t("users.messages.passwordRequired"));
      return;
    }

    setValidationError(null);
    await onSubmit({ username: trimmedUsername, password });
  }

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : handleClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: dialogPaperSx,
        },
        backdrop: {
          sx: dialogBackdropSx,
        },
      }}
    >
      <DialogTitle sx={dialogTitleSx}>{t("users.dialogs.create.title")}</DialogTitle>
      <DialogContent sx={dialogContentSx}>
        <p className="mb-5 text-sm leading-relaxed text-[color:var(--archive-ink)] opacity-70">
          {t("users.dialogs.create.description")}
        </p>

        <UserMutationAlert message={validationError || errorMessage} />

        <form
          id="user-form-dialog"
          onSubmit={handleSubmit}
          className="mt-6 flex flex-col gap-5"
        >
          <ArchiveTextField
            label={t("users.fields.username")}
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              if (validationError) {
                setValidationError(null);
              }
            }}
          />
          <ArchiveTextField
            label={t("users.fields.password")}
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            helperText={t("users.form.passwordCreateHint")}
            slotProps={{
              formHelperText: {
                sx: helperTextSx,
              },
            }}
            onChange={(event) => {
              setPassword(event.target.value);
              if (validationError) {
                setValidationError(null);
              }
            }}
          />
        </form>
      </DialogContent>
      <DialogActions sx={dialogActionsSx}>
        <Button onClick={handleClose} disabled={isSubmitting} sx={secondaryButtonSx}>
          {t("users.actions.cancel")}
        </Button>
        <Button
          type="submit"
          form="user-form-dialog"
          disabled={isSubmitting || !trimmedUsername || !password}
          sx={primaryButtonSx}
        >
          {isSubmitting ? (
            <>
              <CircularProgress size={13} sx={{ color: "inherit", mr: 1 }} />
              {t("users.actions.creating")}
            </>
          ) : (
            t("users.actions.create")
          )}
        </Button>
      </DialogActions>
    </Dialog>
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

function CreateRoleDialog({
  open,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}: {
  open: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSubmit: (payload: IRoleCreateRequest) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const trimmedName = name.trim();

  function resetForm() {
    setName("");
    setValidationError(null);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!trimmedName) {
      setValidationError(t("users.roles.messages.nameRequired"));
      return;
    }

    setValidationError(null);
    await onSubmit({ name: trimmedName });
  }

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : handleClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: { sx: dialogPaperSx },
        backdrop: { sx: dialogBackdropSx },
      }}
    >
      <DialogTitle sx={dialogTitleSx}>
        {t("users.roles.dialogs.create.title")}
      </DialogTitle>
      <DialogContent sx={dialogContentSx}>
        <p className="mb-5 text-sm leading-relaxed text-[color:var(--archive-ink)] opacity-70">
          {t("users.roles.dialogs.create.description")}
        </p>

        <UserMutationAlert message={validationError || errorMessage} />

        <form
          id="role-form-dialog"
          onSubmit={handleSubmit}
          className="mt-6 flex flex-col gap-5"
        >
          <ArchiveTextField
            label={t("users.roles.fields.name")}
            name="roleName"
            autoFocus
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (validationError) {
                setValidationError(null);
              }
            }}
          />
        </form>
      </DialogContent>
      <DialogActions sx={dialogActionsSx}>
        <Button onClick={handleClose} disabled={isSubmitting} sx={secondaryButtonSx}>
          {t("users.actions.cancel")}
        </Button>
        <Button
          type="submit"
          form="role-form-dialog"
          disabled={isSubmitting || !trimmedName}
          sx={primaryButtonSx}
        >
          {isSubmitting ? (
            <>
              <CircularProgress size={13} sx={{ color: "inherit", mr: 1 }} />
              {t("users.roles.actions.creating")}
            </>
          ) : (
            t("users.roles.actions.create")
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
  const { user: currentUser } = useAuthSession();
  const [users, setUsers] = useState<IUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createMutationError, setCreateMutationError] = useState<string | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [deleteMutationError, setDeleteMutationError] = useState<string | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [userIdToDelete, setUserIdToDelete] = useState<number | null>(null);
  const [roles, setRoles] = useState<IRole[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [isCreateRoleDialogOpen, setIsCreateRoleDialogOpen] = useState(false);
  const [createRoleError, setCreateRoleError] = useState<string | null>(null);
  const [isCreatingRole, setIsCreatingRole] = useState(false);

  const userToDelete =
    userIdToDelete === null
      ? null
      : (users.find((managedUser) => managedUser.id === userIdToDelete) ?? null);

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

  function canDeleteManagedUser(managedUser: IUser) {
    return canDeleteUsers && managedUser.id !== currentUser?.id;
  }

  function openDeleteDialog(userId: number) {
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
      const createdUser = await createUser(payload);
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

  async function handleDeleteUser() {
    if (userIdToDelete === null) {
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
    setIsCreatingRole(true);
    setCreateRoleError(null);

    try {
      const createdRole = await createRole(payload);
      setRoles((current) => [...current, createdRole]);
      setIsCreateRoleDialogOpen(false);
    } catch (error) {
      setCreateRoleError(
        getApiErrorMessage(error, t("users.roles.messages.createFailed"))
      );
    } finally {
      setIsCreatingRole(false);
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
  const canCreateUsers = hasPermission(
    currentUser?.permissions,
    currentUser?.isSuperUser,
    USER_PERMISSIONS.create
  );

  const canDeleteUsers = hasPermission(
    currentUser?.permissions,
    currentUser?.isSuperUser,
    USER_PERMISSIONS.delete
  );

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <title>{`${t("nav.users")} | VIERNULVIER`}</title>

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
          {canCreateUsers ? (
            <Button sx={primaryButtonSx} onClick={openCreateDialog}>
              {t("users.actions.add")}
            </Button>
          ) : null}
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
            {canCreateUsers ? (
              <Button sx={primaryButtonSx} onClick={openCreateRoleDialog}>
                {t("users.roles.actions.add")}
              </Button>
            ) : null}
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
                <RoleCard key={role.id} role={role} />
              ))}
            </div>
          )}
        </div>
      </section>

      <CreateUserDialog
        open={isCreateDialogOpen}
        isSubmitting={isCreatingUser}
        errorMessage={isCreateDialogOpen ? createMutationError : null}
        onClose={closeCreateDialog}
        onSubmit={handleCreateUser}
      />

      <DeleteUserDialog
        user={userToDelete}
        isSubmitting={isDeletingUser}
        errorMessage={userToDelete ? deleteMutationError : null}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteUser}
      />

      {isCreateRoleDialogOpen ? (
        <CreateRoleDialog
          open={true}
          isSubmitting={isCreatingRole}
          errorMessage={createRoleError}
          onClose={closeCreateRoleDialog}
          onSubmit={handleCreateRole}
        />
      ) : null}
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

const secondaryButtonSx = {
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

const primaryButtonSx = {
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

const dialogTitleSx = {
  fontFamily: "var(--font-serif)",
  fontStyle: "italic",
  fontSize: "1.9rem",
  color: "var(--archive-ink)",
  pb: 1,
  px: 3,
  pt: 3,
};

const dialogContentSx = {
  pt: "0.25rem !important",
  pb: 1,
  px: 3,
  color: "var(--archive-ink)",
};

const dialogActionsSx = {
  px: 3,
  pt: 2,
  pb: 3,
  gap: 1.5,
  borderTop: "1px solid var(--archive-border)",
};

const helperTextSx = {
  marginTop: "0.55rem",
  lineHeight: 1.45,
};

const dialogPaperSx = {
  borderRadius: "1.75rem",
  border: "1px solid var(--archive-border)",
  backgroundColor: "var(--archive-surface-strong)",
  color: "var(--archive-ink)",
  backdropFilter: "blur(18px)",
  boxShadow: "0 28px 90px rgba(0, 0, 0, 0.24)",
};

const dialogBackdropSx = {
  backgroundColor: "rgba(17, 16, 14, 0.48)",
  backdropFilter: "blur(4px)",
};
