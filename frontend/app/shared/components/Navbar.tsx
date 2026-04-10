import { useState, type JSX } from "react";
import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "~/shared/components/ThemeToggle";
import { useLocalizedPath } from "../hooks/useLocalizedPath";

// This contains all the links with their I18N key and (non-localized) path
const NAV_ITEMS = [
  { i18n_key: "nav.home", path: "/" },
  { i18n_key: "nav.archive", path: "/archive" },
  { i18n_key: "nav.history", path: "/history" },
];

type LogoProps = { nav_name: string };

function Logo({ nav_name }: LogoProps) {
  return (
    <header className="sticky top-0 z-50">
      <div className="group flex items-center space-x-2">
        <img
          src="/logo.svg"
          alt={`${nav_name} logo`}
          className="h-8 w-auto md:h-10"
          style={{ filter: "var(--archive-logo-filter)" }}
        />
        <span
          aria-hidden="true"
          className="font-serif text-base italic opacity-50 md:text-[1.125rem]"
        >
          {nav_name}
        </span>
      </div>
    </header>
  );
}

// Helper function that will underline the link of the page we're currently on
function navLinkClass({ isActive }: { isActive: boolean }) {
  return `hover:text-archive-accent transition-colors ${
    isActive
      ? "border-archive-accent border-b-2"
      : "border-b-2 border-transparent opacity-60"
  }`;
}

type NavLinksProps = { onNavigate?: () => void };

function NavLinks({ onNavigate }: NavLinksProps) {
  const { t } = useTranslation();
  const lp = useLocalizedPath();

  return (
    <>
      {NAV_ITEMS.map(({ i18n_key, path }) => (
        <li key={i18n_key}>
          <NavLink
            to={lp(path)}
            className={navLinkClass}
            end={path === "/"}
            onClick={onNavigate}
          >
            {t(i18n_key)}
          </NavLink>
        </li>
      ))}
    </>
  );
}

type HamburgerMenuProps = {
  isOpen: boolean;
  onToggle: () => void;
};

function HamburgerMenuButton({ isOpen, onToggle }: HamburgerMenuProps) {
  return (
    <button
      aria-label="Toggle navigation menu"
      aria-expanded={isOpen}
      aria-controls="mobile-menu"
      data-testid="hamburger-menu-button"
      className="ml-auto flex cursor-pointer flex-col space-y-1 md:hidden"
      onClick={onToggle}
    >
      <span className="h-0.5 w-6 bg-current" />
      <span className="h-0.5 w-6 bg-current" />
      <span className="h-0.5 w-6 bg-current" />
    </button>
  );
}

function Navbar(): JSX.Element {
  // Mobile dropdown state
  const [menuOpen, setMenuOpen] = useState(false);

  // i18n
  const { t } = useTranslation();

  return (
    <nav
      aria-label="Main navigation bar"
      className="border-archive-ink/10 bg-archive-paper/80 sticky top-0 z-50 border-b backdrop-blur-md"
    >
      <div className="mx-auto flex h-20 max-w-[1800px] items-center justify-between px-6 md:px-24">
        <Logo nav_name={t("nav.archive")} />
        <ul className="hidden items-center space-x-8 text-sm font-medium tracking-widest uppercase md:flex">
          <NavLinks />
        </ul>
        <div className="hidden items-center space-x-8 text-sm font-medium tracking-widest uppercase md:flex">
          <LanguageSwitcher className="hidden sm:flex" />
          <ThemeToggle />
        </div>
        <HamburgerMenuButton
          isOpen={menuOpen}
          onToggle={() => setMenuOpen(!menuOpen)}
        />
        {menuOpen && (
          <div
            data-testid="mobile-menu"
            id="mobile-menu"
            className="bg-archive-paper border-archive-ink/10 absolute top-20 left-0 w-full border-t md:hidden"
          >
            <ul className="flex flex-col items-center space-y-6 py-6 text-sm font-medium tracking-widest uppercase">
              <NavLinks onNavigate={() => setMenuOpen(false)} />
              <li>
                <LanguageSwitcher />
              </li>
              <li>
                <ThemeToggle />
              </li>
            </ul>
            <div className="bg-archive-ink/10 h-px" />
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
