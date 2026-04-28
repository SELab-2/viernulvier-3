import { useTranslation } from "react-i18next";

function FilterIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      data-darkreader-inline-stroke=""
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
      ></path>
    </svg>
  );
}

export function MobileToggleButton({ onClick }: { onClick?: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      onClick={onClick}
      className="bg-archive-ink/5 border-archive-ink/10 mb-8 flex w-full cursor-pointer items-center justify-center space-x-3 rounded-xl border py-3 text-xs font-bold tracking-widest uppercase lg:hidden"
    >
      <FilterIcon />
      <span>{t("filter.toggle_menu")}</span>
    </button>
  );
}
