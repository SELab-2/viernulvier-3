import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Alert,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { ArchiveTextField } from "~/shared/components/ArchiveTextField";

import type {
  IRole,
  IUser,
  IUserCreateRequest,
  IUserUpdateRequest,
} from "../users.types";

type BaseUserFormDialogProps = {
  open: boolean;
  isSubmitting: boolean;
  availableRoles: IRole[];
  errorMessage: string | null;
  onClose: () => void;
};

type CreateUserFormDialogProps = BaseUserFormDialogProps & {
  mode: "create";
  user?: never;
  onSubmit: (payload: IUserCreateRequest) => Promise<void>;
};

type EditUserFormDialogProps = BaseUserFormDialogProps & {
  mode: "edit";
  user: IUser | null;
  onSubmit: (payload: IUserUpdateRequest) => Promise<void>;
};

type UserFormDialogProps = CreateUserFormDialogProps | EditUserFormDialogProps;

type UserFormState = {
  username: string;
  password: string;
  selectedRoles: string[];
};

function getInitialState(user: IUser | null | undefined): UserFormState {
  return {
    username: user?.username ?? "",
    password: "",
    selectedRoles: user?.roles ?? [],
  };
}

export function UserFormDialog(props: UserFormDialogProps) {
  const { open, isSubmitting, availableRoles, errorMessage, onClose, mode } = props;
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const initialUser = props.mode === "edit" ? props.user : null;
  const initialState = useMemo(() => getInitialState(initialUser), [initialUser]);
  const trimmedUsername = username.trim();
  const formId = `user-form-dialog-${mode}`;

  useEffect(() => {
    if (!open) {
      return;
    }

    setUsername(initialState.username);
    setPassword("");
    setSelectedRoles(initialState.selectedRoles);
    setValidationError(null);
  }, [initialState, open]);

  function toggleRole(roleName: string) {
    setSelectedRoles((currentRoles) =>
      currentRoles.includes(roleName)
        ? currentRoles.filter((currentRole) => currentRole !== roleName)
        : [...currentRoles, roleName]
    );
  }

  function handleClose() {
    if (isSubmitting) {
      return;
    }

    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!trimmedUsername) {
      setValidationError(t("users.messages.usernameRequired"));
      return;
    }

    if (mode === "create" && !password) {
      setValidationError(t("users.messages.passwordRequired"));
      return;
    }

    setValidationError(null);

    if (mode === "create") {
      await props.onSubmit({
        username: trimmedUsername,
        password,
        roles: selectedRoles,
      });
      return;
    }

    await props.onSubmit({
      username: trimmedUsername,
      roles: selectedRoles,
      ...(password ? { password } : {}),
    });
  }

  const roleHint =
    availableRoles.length > 0
      ? mode === "create"
        ? t("users.form.rolesHint")
        : t("users.form.rolesEditHint")
      : t("users.form.rolesEmptyHint");

  return (
    <Dialog
      open={open}
      onClose={handleClose}
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
      <DialogTitle sx={dialogTitleSx}>
        {mode === "create"
          ? t("users.dialogs.create.title")
          : t("users.dialogs.edit.title")}
      </DialogTitle>
      <DialogContent sx={dialogContentSx}>
        <p className="mb-5 text-sm leading-relaxed text-[color:var(--archive-ink)] opacity-70">
          {mode === "create"
            ? t("users.dialogs.create.description")
            : t("users.dialogs.edit.description")}
        </p>

        {validationError || errorMessage ? (
          <Alert severity="error" variant="outlined" sx={bannerSx}>
            {validationError || errorMessage}
          </Alert>
        ) : null}

        <form id={formId} onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
          <ArchiveTextField
            label={t("users.fields.username")}
            name={`${mode}-username`}
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
            name={`${mode}-password`}
            type="password"
            autoComplete="new-password"
            value={password}
            helperText={
              mode === "create"
                ? t("users.form.passwordCreateHint")
                : t("users.form.passwordEditHint")
            }
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

          <div>
            <div className="text-[0.72rem] font-bold tracking-[0.18em] uppercase opacity-55">
              {t("users.fields.roles")}
            </div>
            <p className="mt-2 text-sm leading-relaxed opacity-65">{roleHint}</p>

            {availableRoles.length > 0 ? (
              <div className="mt-4 grid gap-2">
                {availableRoles.map((role) => {
                  const isSelected = selectedRoles.includes(role.name);

                  return (
                    <label
                      key={role.id}
                      className="flex cursor-pointer items-center gap-3 rounded-[1rem] px-2 py-1.5 transition-colors hover:bg-[rgba(196,164,132,0.08)]"
                    >
                      <Checkbox
                        checked={isSelected}
                        onChange={() => toggleRole(role.name)}
                        sx={roleCheckboxSx}
                      />
                      <span className="text-sm font-medium text-[color:var(--archive-ink)]">
                        {role.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            ) : null}
          </div>
        </form>
      </DialogContent>
      <DialogActions sx={dialogActionsSx}>
        <Button onClick={handleClose} disabled={isSubmitting} sx={secondaryButtonSx}>
          {t("users.actions.cancel")}
        </Button>
        <Button
          type="submit"
          form={formId}
          disabled={
            isSubmitting || !trimmedUsername || (mode === "create" && !password)
          }
          sx={primaryButtonSx}
        >
          {isSubmitting ? (
            <>
              <CircularProgress size={13} sx={{ color: "inherit", mr: 1 }} />
              {mode === "create"
                ? t("users.actions.creating")
                : t("users.actions.updating")}
            </>
          ) : mode === "create" ? (
            t("users.actions.create")
          ) : (
            t("users.actions.update")
          )}
        </Button>
      </DialogActions>
    </Dialog>
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

const roleCheckboxSx = {
  "color": "rgba(196, 164, 132, 0.7)",
  "padding": 0,
  "&.Mui-checked": {
    color: "var(--archive-accent)",
  },
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
