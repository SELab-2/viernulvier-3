import { Link, useNavigate } from "react-router";

import {
  ProductionCardGrid,
  mockProductions,
} from "~/features/archive/components/ProductionCard";
import { ThemeToggle } from "~/shared/components/ThemeToggle";

export default function Home() {
  const navigate = useNavigate();
  const previewProductionId = mockProductions[0]?.id_url;

  const handleOpenProductionDetail = (productionId: string) => {
    if (!previewProductionId || productionId !== previewProductionId) {
      return;
    }

    navigate(`/productions/${encodeURIComponent(productionId)}`);
  };

  return (
    <div className="bg-archive-paper text-archive-ink min-h-screen">
      <header className="border-archive-border bg-archive-surface sticky top-0 z-50 border-b backdrop-blur-[14px] [backdrop-filter:blur(14px)]">
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
            <span
              aria-hidden="true"
              className="font-serif text-base italic opacity-50 md:text-[1.125rem]"
            >
              Archief
            </span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1800px] px-6 py-8 md:px-24 md:py-12">
        <ProductionCardGrid
          productions={mockProductions}
          onDetailClick={handleOpenProductionDetail}
        />
      </main>
    </div>
  );
}
