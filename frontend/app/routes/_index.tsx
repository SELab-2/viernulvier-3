import { Link } from "react-router";

import { ThemeToggle } from "~/shared/components/ThemeToggle";

export default function Home() {
  return (
    <div className="min-h-screen bg-archive-paper text-archive-ink">
      <header className="sticky top-0 z-50 border-b border-archive-border bg-archive-surface backdrop-blur-[14px] [backdrop-filter:blur(14px)]">
        <div className="mx-auto flex h-20 max-w-[1800px] items-center justify-between px-6 md:px-24">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[inherit] no-underline"
            aria-label="VIERNULVIER Archief"
          >
            <img
              src="/logo.svg"
              alt=""
              className="h-8 w-auto md:h-10"
              style={{ filter: "var(--archive-logo-filter)" }}
            />
            {/* TODO: Fix deze Archief text, out-of-scope voor deze wijziging */}
            <span aria-hidden="true" className="font-serif text-base italic opacity-50 md:text-[1.125rem]">
              Archief
            </span>
          </Link>
          <ThemeToggle />
        </div>
      </header>
    </div>
  );
}
