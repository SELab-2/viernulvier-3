import { useTranslation } from "react-i18next";

import type { IUser } from "../users.types";

type UserCardProps = {
  user: IUser;
  formatDateTime: (value: string | null) => string;
};

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm leading-relaxed">
      <span className="opacity-50">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

function TokenList({ values, emptyLabel }: { values: string[]; emptyLabel: string }) {
  if (values.length === 0) {
    return <p className="text-sm opacity-50">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <span
          key={value}
          className="border-archive-border bg-archive-control rounded-full border px-3 py-1 text-xs tracking-[0.14em] uppercase"
        >
          {value}
        </span>
      ))}
    </div>
  );
}

function UserBadge({ children }: { children: string }) {
  return (
    <span className="border-archive-border bg-archive-control rounded-full border px-3 py-1 text-[0.65rem] font-bold tracking-[0.18em] uppercase">
      {children}
    </span>
  );
}

export function UserCard({ user, formatDateTime }: UserCardProps) {
  const { t } = useTranslation();

  return (
    <article className="border-archive-border bg-archive-surface flex h-full flex-col rounded-[1.75rem] border p-6 shadow-[0_20px_70px_rgba(45,40,37,0.05)] backdrop-blur-sm">
      <div className="mb-5">
        <p className="text-xs font-bold tracking-[0.22em] uppercase opacity-40">
          {t("users.card.userLabel", { id: user.id })}
        </p>
        <h2 className="mt-2 font-serif text-3xl leading-tight [overflow-wrap:anywhere] italic">
          {user.username}
        </h2>

        {user.isSuperUser ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {user.isSuperUser ? (
              <UserBadge>{t("users.badges.superUser")}</UserBadge>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="border-archive-border space-y-2 border-y py-4">
        <MetaRow
          label={t("users.meta.createdAt")}
          value={formatDateTime(user.createdAt)}
        />
        <MetaRow
          label={t("users.meta.lastLoginAt")}
          value={formatDateTime(user.lastLoginAt)}
        />
      </div>

      <div className="mt-5 space-y-4">
        <section>
          <h3 className="mb-2 text-xs font-bold tracking-[0.2em] uppercase opacity-45">
            {t("users.fields.roles")}
          </h3>
          <TokenList values={user.roles} emptyLabel={t("users.empty.roles")} />
        </section>

        <section>
          <h3 className="mb-2 text-xs font-bold tracking-[0.2em] uppercase opacity-45">
            {t("users.fields.permissions")}
          </h3>
          <TokenList
            values={user.permissions}
            emptyLabel={t("users.empty.permissions")}
          />
        </section>
      </div>
    </article>
  );
}
