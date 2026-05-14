import { useState, type SubmitEvent } from "react";
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

import type { IRole, IRoleCreateRequest, IRoleUpdateRequest } from "../users.types";

type BaseRoleFormDialogProps = {
  open: boolean;
  isSubmitting: boolean;
  availablePermissions: string[];
  isLoadingPermissions: boolean;
  permissionsErrorMessage: string | null;
  errorMessage: string | null;
  onClose: () => void;
};

type CreateRoleFormDialogProps = BaseRoleFormDialogProps & {
  mode: "create";
  role?: never;
  onSubmit: (payload: IRoleCreateRequest) => Promise<void>;
};

type EditRoleFormDialogProps = BaseRoleFormDialogProps & {
  mode: "edit";
  role: IRole | null;
  onSubmit: (payload: IRoleUpdateRequest) => Promise<void>;
};

type RoleFormDialogProps = CreateRoleFormDialogProps | EditRoleFormDialogProps;

type RoleFormState = {
  name: string;
  selectedPermissions: string[];
};

function getInitialState(role: IRole | null | undefined): RoleFormState {
  return {
    name: role?.name ?? "",
    selectedPermissions: [...(role?.permissions ?? [])],
  };
}

export function RoleFormDialog(props: RoleFormDialogProps) {
  const {
    open,
    isSubmitting,
    availablePermissions,
    isLoadingPermissions,
    permissionsErrorMessage,
    errorMessage,
    onClose,
    mode,
  } = props;
  const { t } = useTranslation();

  const initialRole = props.mode === "edit" ? props.role : null;
  const initialState = getInitialState(initialRole);
  const [name, setName] = useState(() => initialState.name);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    () => initialState.selectedPermissions
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const trimmedName = name.trim();
  const formId = `role-form-dialog-${mode}`;

  function togglePermission(permissionName: string) {
    setSelectedPermissions((currentPermissions) =>
      currentPermissions.includes(permissionName)
        ? currentPermissions.filter(
            (currentPermission) => currentPermission !== permissionName
          )
        : [...currentPermissions, permissionName]
    );
  }

  function handleClose() {
    if (isSubmitting) {
      return;
    }

    onClose();
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!trimmedName) {
      setValidationError(t("users.roles.messages.nameRequired"));
      return;
    }

    setValidationError(null);
    await props.onSubmit({
      name: trimmedName,
      permissions: selectedPermissions,
    });
  }

  const permissionsHint =
    availablePermissions.length > 0
      ? mode === "create"
        ? t("users.roles.form.permissionsHint")
        : t("users.roles.form.permissionsEditHint")
      : t("users.roles.form.permissionsEmptyHint");

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: { sx: dialogPaperSx },
        backdrop: { sx: dialogBackdropSx },
      }}
    >
      <DialogTitle sx={dialogTitleSx}>
        {mode === "create"
          ? t("users.roles.dialogs.create.title")
          : t("users.roles.dialogs.edit.title")}
      </DialogTitle>
      <DialogContent sx={dialogContentSx}>
        <p className="mb-5 text-sm leading-relaxed text-(--archive-ink) opacity-70">
          {mode === "create"
            ? t("users.roles.dialogs.create.description")
            : t("users.roles.dialogs.edit.description")}
        </p>

        {validationError || errorMessage ? (
          <Alert severity="error" variant="outlined" sx={bannerSx}>
            {validationError || errorMessage}
          </Alert>
        ) : null}

        <form id={formId} onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
          <ArchiveTextField
            label={t("users.roles.fields.name")}
            name={`${mode}-role-name`}
            autoFocus
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (validationError) {
                setValidationError(null);
              }
            }}
          />

          <div>
            <div className="text-[0.72rem] font-bold tracking-[0.18em] uppercase opacity-55">
              {t("users.roles.fields.permissions")}
            </div>
            <p
              className={`mt-2 text-sm leading-relaxed ${
                permissionsErrorMessage ? "text-[#a04238]" : "opacity-65"
              }`}
            >
              {permissionsErrorMessage
                ? permissionsErrorMessage
                : isLoadingPermissions
                  ? t("users.roles.form.permissionsLoading")
                  : permissionsHint}
            </p>

            {availablePermissions.length > 0 ? (
              <div className="mt-4 grid gap-2">
                {availablePermissions.map((permission) => {
                  const isSelected = selectedPermissions.includes(permission);

                  return (
                    <label
                      key={permission}
                      className="flex cursor-pointer items-center gap-3 rounded-2xl px-2 py-1.5 transition-colors hover:bg-[rgba(196,164,132,0.08)]"
                    >
                      <Checkbox
                        checked={isSelected}
                        onChange={() => togglePermission(permission)}
                        sx={roleCheckboxSx}
                      />
                      <span className="text-sm font-medium text-(--archive-ink)">
                        {permission}
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
          disabled={isSubmitting || !trimmedName}
          sx={primaryButtonSx}
        >
          {isSubmitting ? (
            <>
              <CircularProgress size={13} sx={{ color: "inherit", mr: 1 }} />
              {mode === "create"
                ? t("users.roles.actions.creating")
                : t("users.roles.actions.updating")}
            </>
          ) : mode === "create" ? (
            t("users.roles.actions.create")
          ) : (
            t("users.roles.actions.update")
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

const dialogPaperSx = {
  background:
    "linear-gradient(180deg, rgba(251,247,242,0.97) 0%, rgba(246,239,231,0.98) 100%)",
  borderRadius: "1.75rem",
  border: "1px solid rgba(160, 124, 84, 0.18)",
  boxShadow: "0 28px 90px rgba(32, 24, 20, 0.16)",
  backdropFilter: "blur(20px)",
};

const dialogBackdropSx = {
  backgroundColor: "rgba(37, 29, 24, 0.34)",
  backdropFilter: "blur(6px)",
};

const roleCheckboxSx = {
  "color": "var(--archive-border)",
  "&.Mui-checked": {
    color: "var(--archive-accent)",
  },
};
