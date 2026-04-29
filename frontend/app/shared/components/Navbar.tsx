import { useState, type JSX } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import { Protected, useAuthSession } from "~/features/auth";
import { USER_PERMISSIONS } from "~/features/users";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "~/shared/components/ThemeToggle";
import { useLocalizedPath } from "../hooks/useLocalizedPath";

// This contains all the links with their I18N key and (non-localized) path
const NAV_ITEMS = [
  { i18n_key: "nav.home", path: "/" },
  { i18n_key: "nav.archive", path: "/archive" },
  { i18n_key: "nav.history", path: "/history" },
  { i18n_key: "nav.blogs", path: "/blogs" },
  {
    i18n_key: "nav.users",
    path: "/users",
    permissions: [USER_PERMISSIONS.read],
  },
];

type LogoProps = { nav_name: string };

function Logo({ nav_name }: LogoProps) {
  const lp = useLocalizedPath();
  return (
    <Link to={lp("/")}>
      <div className="sticky top-0 z-50 flex items-end sm:space-x-2">
        <img
          src="/logo.svg"
          alt={`${nav_name} logo`}
          className="xs:h-8 h-6 w-auto md:h-10"
          style={{ filter: "var(--archive-logo-filter)" }}
        />
        <span
          aria-hidden="true"
          className="xs:text-[0.8rem] mb-[2px] font-serif text-[0.6rem] italic opacity-50 md:text-[1.125rem]"
        >
          {nav_name}
        </span>
      </div>
    </Link>
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
  "hover:text-archive-accent inline-flex cursor-pointer items-center gap-2 border-b-2 border-transparent px-1 py-1 opacity-60 transition-colors hidden lg:flex";

type NavLinksProps = { onNavigate?: () => void };

function NavLinks({ onNavigate }: NavLinksProps) {
  const { t } = useTranslation();
  const lp = useLocalizedPath();
  const { pathname } = useLocation();

  return (
    <>
      {NAV_ITEMS.map(({ i18n_key, path, permissions }) => {
        const link = (
          <li key={i18n_key}>
            <NavLink
              to={lp(path)}
              className={() => {
                const current = pathname.replace(/\/+$/, "");
                const target = lp(path).replace(/\/+$/, "");
                return navLinkClass({ isActive: current === target });
              }}
              end={path === "/"}
              onClick={onNavigate}
            >
              {t(i18n_key)}
            </NavLink>
          </li>
        );

        if (!permissions) {
          return link;
        }

        return (
          <Protected key={i18n_key} permissions={permissions} fallback={null}>
            {link}
          </Protected>
        );
      })}
    </>
  );
}

function NavbarAuthControls({
  onNavigate,
  className,
  asList,
}: NavLinksProps & { className?: string; asList?: boolean }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const lp = useLocalizedPath();
  const { logout } = useAuthSession();

  function handleLogout() {
    logout();
    onNavigate?.();
    navigate(lp("/"), { replace: true });
  }

  const button = (
    <button
      type="button"
      className={authActionClassName}
      onClick={handleLogout}
      aria-label={t("auth.actions.logout")}
    >
      <LogoutOutlinedIcon fontSize="small" />
      <span>{t("auth.actions.logout")}</span>
    </button>
  );

  if (asList) {
    return (
      <Protected>
        <li>{button}</li>
      </Protected>
    );
  }

  return (
    <Protected>
      <div className={className}>{button}</div>
    </Protected>
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
      <div className="mx-auto flex h-20 max-w-[1800px] items-center justify-between px-4 sm:px-6 md:px-24">
        <Logo nav_name={t("nav.archive")} />
        <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center space-x-8 text-sm font-medium tracking-widest uppercase lg:flex">
          <NavLinks />
        </ul>
        <div className="flex items-center space-x-2 text-sm font-medium tracking-widest uppercase sm:space-x-4">
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
              <NavbarAuthControls asList={true} onNavigate={() => setMenuOpen(false)} />
            </ul>
            <div className="bg-archive-ink/10 h-px" />
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
