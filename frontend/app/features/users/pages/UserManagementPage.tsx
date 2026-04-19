import { useEffect, useState } from "react";
import axios from "axios";
import { Alert, Button, CircularProgress } from "@mui/material";
import { useTranslation } from "react-i18next";

import { UserCard } from "../components/UserCard";
import { listUsers } from "../services/userManagementService";
import type { IUser } from "../users.types";

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

export function UserManagementAccessDenied() {
  const { t } = useTranslation();

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
      <div className="border-archive-border bg-archive-surface rounded-[2rem] border p-8 shadow-[0_20px_70px_rgba(45,40,37,0.05)]">
        <p className="text-xs font-bold tracking-[0.24em] uppercase opacity-40">
          {t("users.accessDenied.eyebrow")}
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
  const [users, setUsers] = useState<IUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);
  const [pageError, setPageError] = useState<string | null>(null);

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

  function refreshUsers() {
    setReloadToken((value) => value + 1);
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

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
      <title>{`${t("nav.users")} | VIERNULVIER`}</title>

      <div className="max-w-3xl">
        <p className="text-xs font-bold tracking-[0.24em] uppercase opacity-40">
          {t("users.eyebrow")}
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
          value={isLoading ? "—" : String(users.length)}
          label={t("users.summary.totalUsers")}
        />
        <SummaryCard
          value={isLoading ? "—" : String(superUserCount)}
          label={t("users.summary.superUsers")}
        />
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
            />
          ))}
        </div>
      )}
    </section>
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
