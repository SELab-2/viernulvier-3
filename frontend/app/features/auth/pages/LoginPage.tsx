import { useState } from "react";
import axios from "axios";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  Alert,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
  type TextFieldProps,
} from "@mui/material";
import { Navigate, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

import { useAuthSession } from "~/features/auth";
import { useLocalizedPath } from "~/shared/hooks/useLocalizedPath";

function getLoginErrorMessage(
  error: unknown,
  fallbackMessage: string,
  invalidMessage: string
): string {
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    return invalidMessage;
  }

  return fallbackMessage;
}

function LoginErrorAlert({ errorMessage }: { errorMessage: string | null }) {
  if (!errorMessage) {
    return null;
  }

  return (
    <Alert
      severity="error"
      variant="outlined"
      sx={{
        "mb": 3,
        "fontFamily": "var(--font-sans)",
        "fontSize": "0.875rem",
        "borderColor": "rgba(196, 164, 132, 0.4)",
        "color": "var(--archive-ink)",
        "& .MuiAlert-icon": { color: "var(--archive-accent)" },
      }}
    >
      {errorMessage}
    </Alert>
  );
}

function LoginTextField(props: Omit<TextFieldProps, "fullWidth" | "size" | "sx">) {
  return <TextField fullWidth size="small" sx={fieldSx} {...props} />;
}

function PasswordVisibilityAdornment({
  showPassword,
  showPasswordLabel,
  hidePasswordLabel,
  onToggle,
}: {
  showPassword: boolean;
  showPasswordLabel: string;
  hidePasswordLabel: string;
  onToggle: () => void;
}) {
  return (
    <InputAdornment position="end">
      <IconButton
        edge="end"
        size="small"
        onClick={onToggle}
        aria-label={showPassword ? hidePasswordLabel : showPasswordLabel}
        sx={{
          "color": "var(--archive-ink)",
          "opacity": 0.45,
          "&:hover": {
            opacity: 1,
            backgroundColor: "var(--archive-control-hover)",
          },
        }}
      >
        {showPassword ? (
          <VisibilityOffOutlinedIcon fontSize="small" />
        ) : (
          <VisibilityOutlinedIcon fontSize="small" />
        )}
      </IconButton>
    </InputAdornment>
  );
}

function LoginCredentialsFields({
  username,
  password,
  showPassword,
  usernameLabel,
  passwordLabel,
  showPasswordLabel,
  hidePasswordLabel,
  onUsernameChange,
  onPasswordChange,
  onTogglePasswordVisibility,
}: {
  username: string;
  password: string;
  showPassword: boolean;
  usernameLabel: string;
  passwordLabel: string;
  showPasswordLabel: string;
  hidePasswordLabel: string;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onTogglePasswordVisibility: () => void;
}) {
  return (
    <>
      <LoginTextField
        label={usernameLabel}
        id="username"
        name="username"
        autoComplete="username"
        autoFocus
        value={username}
        onChange={(event) => onUsernameChange(event.target.value)}
      />

      <LoginTextField
        label={passwordLabel}
        id="password"
        name="password"
        type={showPassword ? "text" : "password"}
        autoComplete="current-password"
        value={password}
        onChange={(event) => onPasswordChange(event.target.value)}
        slotProps={{
          input: {
            endAdornment: (
              <PasswordVisibilityAdornment
                showPassword={showPassword}
                showPasswordLabel={showPasswordLabel}
                hidePasswordLabel={hidePasswordLabel}
                onToggle={onTogglePasswordVisibility}
              />
            ),
          },
        }}
      />
    </>
  );
}

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const localizedPath = useLocalizedPath();
  const { isAuthenticated, isLoading, login } = useAuthSession();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const homePath = localizedPath("/");

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center">
        <span className="text-xs tracking-widest uppercase opacity-40">
          {t("auth.login.loading")}
        </span>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={homePath} replace />;
  }

  function handleUsernameChange(value: string) {
    setUsername(value);
    if (errorMessage) {
      setErrorMessage(null);
    }
  }

  function handlePasswordChange(value: string) {
    setPassword(value);
    if (errorMessage) {
      setErrorMessage(null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await login({ username: trimmedUsername, password });
      navigate(homePath, { replace: true });
    } catch (error) {
      setErrorMessage(
        getLoginErrorMessage(
          error,
          t("auth.login.errors.generic"),
          t("auth.login.errors.invalidCredentials")
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 font-serif text-3xl italic">{t("auth.login.formTitle")}</h1>
        <p className="mb-8 text-sm leading-relaxed opacity-60">
          {t("auth.login.formDescription")}
        </p>

        <LoginErrorAlert errorMessage={errorMessage} />

        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
          <LoginCredentialsFields
            username={username}
            password={password}
            showPassword={showPassword}
            usernameLabel={t("auth.login.usernameLabel")}
            passwordLabel={t("auth.login.passwordLabel")}
            showPasswordLabel={t("auth.login.showPassword")}
            hidePasswordLabel={t("auth.login.hidePassword")}
            onUsernameChange={handleUsernameChange}
            onPasswordChange={handlePasswordChange}
            onTogglePasswordVisibility={() => setShowPassword((value) => !value)}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isSubmitting || !username.trim() || !password}
            sx={submitSx}
          >
            {isSubmitting ? (
              <>
                <CircularProgress size={13} sx={{ color: "inherit", mr: 1 }} />
                {t("auth.login.submitting")}
              </>
            ) : (
              t("auth.login.submit")
            )}
          </Button>
        </form>

        <a
          href={homePath}
          className="mt-8 inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase opacity-40 transition-opacity hover:opacity-100"
        >
          <span>←</span>
          <span>{t("auth.login.backToSite")}</span>
        </a>
      </div>
    </div>
  );
}

const fieldSx = {
  "& .MuiInputLabel-root": {
    fontFamily: "var(--font-sans)",
    fontSize: "0.8125rem",
    color: "color-mix(in srgb, var(--archive-ink) 55%, transparent)",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "var(--archive-accent)",
  },
  "& .MuiOutlinedInput-root": {
    "fontFamily": "var(--font-sans)",
    "fontSize": "0.875rem",
    "color": "var(--archive-ink)",
    "borderRadius": "0.5rem",
    "& fieldset": {
      borderColor: "var(--archive-border)",
    },
    "&:hover fieldset": {
      borderColor: "var(--archive-border-hover)",
    },
    "&.Mui-focused fieldset": {
      borderColor: "var(--archive-accent)",
      borderWidth: "1px",
    },
  },
};

const submitSx = {
  "py": 1.25,
  "borderRadius": "999px",
  "textTransform": "none" as const,
  "fontFamily": "var(--font-sans)",
  "fontSize": "0.75rem",
  "fontWeight": 700,
  "letterSpacing": "0.2em",
  "boxShadow": "none",
  "backgroundColor": "var(--archive-ink)",
  "color": "var(--archive-paper)",
  "&:hover": {
    backgroundColor: "var(--archive-ink)",
    boxShadow: "none",
    opacity: 0.8,
  },
  "&.Mui-disabled": {
    backgroundColor: "var(--archive-ink)",
    color: "var(--archive-paper)",
    opacity: 0.3,
  },
};
