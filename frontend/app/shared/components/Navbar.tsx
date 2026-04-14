import { useState, type JSX } from "react";
import { NavLink, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import { Protected, useAuthSession } from "~/features/auth";
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
    <div className="sticky top-0 z-50 flex items-end space-x-2">
      <img
        src="/logo.svg"
        alt={`${nav_name} logo`}
        className="h-8 w-auto md:h-10"
        style={{ filter: "var(--archive-logo-filter)" }}
      />
      <span aria-hidden="true" className="font-serif text-base italic opacity-50 md:text-[1.125rem] mb-[2px]">
        {nav_name}
      </span>
    </div>
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

const authActionClassName =
  "hover:text-archive-accent inline-flex cursor-pointer items-center gap-2 border-b-2 border-transparent px-1 py-1 opacity-60 transition-colors";

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

function NavbarAuthControls({ onNavigate, className }: NavLinksProps & { className?: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const lp = useLocalizedPath();
  const { logout } = useAuthSession();

  function handleLogout() {
    logout();
    onNavigate?.();
    navigate(lp("/"), { replace: true });
  }

  return (
    <div className={className}> 
      <Protected>
      <button
        type="button"
        className={authActionClassName}
        onClick={handleLogout}
        aria-label={t("auth.actions.logout")}
      >
        <LogoutOutlinedIcon fontSize="small" />
        <span>{t("auth.actions.logout")}</span>
      </button>
    </Protected>
    </div>
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
      className="ml-auto flex cursor-pointer flex-col space-y-1 lg:hidden"
      onClick={onToggle}
    >
      <span className="h-0.5 w-6 bg-current" />
      <span className="h-0.5 w-6 bg-current" />
      <span className="h-0.5 w-6 bg-current" />
    </button>
  );
}

function Navbar(): JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useTranslation();
  return (
    <nav
      aria-label="Main navigation bar"
      className="border-archive-ink/10 bg-archive-paper/80 sticky top-0 z-50 border-b backdrop-blur-md"
    >
      <div className="mx-auto flex h-20 max-w-[1800px] items-center justify-between px-6 md:px-24">
        <Logo nav_name={t("nav.archive")} />
        <ul className="hidden items-center space-x-8 text-sm font-medium tracking-widest uppercase lg:flex">
          <NavLinks />
        </ul>
        <div className="flex items-center space-x-4 text-sm font-medium tracking-widest uppercase">
          <LanguageSwitcher />
          <ThemeToggle />
          <NavbarAuthControls className="hidden lg:flex" />
          <HamburgerMenuButton
            isOpen={menuOpen}
            onToggle={() => setMenuOpen(!menuOpen)}
          />
        </div>
        {menuOpen && (
          <div
            data-testid="mobile-menu"
            id="mobile-menu"
            className="bg-archive-paper border-archive-ink/10 absolute top-20 left-0 w-full border-t lg:hidden"
          >
            <ul className="flex flex-col items-center space-y-6 py-6 text-sm font-medium tracking-widest uppercase">
              <NavLinks onNavigate={() => setMenuOpen(false)} />
              <li>
                <NavbarAuthControls onNavigate={() => setMenuOpen(false)} />
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
