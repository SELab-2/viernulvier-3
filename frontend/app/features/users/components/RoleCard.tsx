import { Button } from "@mui/material";
import { useTranslation } from "react-i18next";

import type { IRole } from "../users.types";

type RoleCardProps = {
  role: IRole;
  onDelete?: () => void;
};

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

export function RoleCard({ role, onDelete }: RoleCardProps) {
  const { t } = useTranslation();

  return (
    <article className="border-archive-border bg-archive-surface flex h-full flex-col rounded-[1.75rem] border p-6 shadow-[0_20px_70px_rgba(45,40,37,0.05)] backdrop-blur-sm">
      <div className="mb-5">
        <p className="text-xs font-bold tracking-[0.22em] uppercase opacity-40">
          {t("users.roles.card.label")}
        </p>
        <h2 className="mt-2 font-serif text-3xl leading-tight [overflow-wrap:anywhere] italic">
          {role.name}
        </h2>
      </div>

      <div className="mt-auto space-y-4">
        <section>
          <h3 className="mb-2 text-xs font-bold tracking-[0.2em] uppercase opacity-45">
            {t("users.fields.permissions")}
          </h3>
          <TokenList
            values={role.permissions}
            emptyLabel={t("users.roles.empty.permissions")}
          />
        </section>
      </div>

      {onDelete ? (
        <div className="border-archive-border mt-5 border-t pt-4">
          <Button onClick={onDelete} sx={deleteButtonSx}>
            {t("users.actions.delete")}
          </Button>
        </div>
      ) : null}
    </article>
  );
}

const deleteButtonSx = {
  py: 1,
  px: 2,
  borderRadius: "999px",
  textTransform: "none" as const,
  fontFamily: "var(--font-sans)",
  fontSize: "0.72rem",
  fontWeight: 700,
  letterSpacing: "0.18em",
  color: "#c0392b",
  border: "1px solid rgba(192, 57, 43, 0.35)",
};
