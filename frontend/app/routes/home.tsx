import { useTranslation } from "react-i18next";

import {
  ProductionCardGrid,
  mockProductions,
} from "~/features/archive/components/ProductionCard";

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="bg-archive-paper text-archive-ink min-h-screen">
      <title>{`${t("nav.home")} | VIERNULVIER`}</title>

      <main className="mx-auto w-full max-w-[1800px] px-6 py-8 md:px-24 md:py-12">
        <ProductionCardGrid productions={mockProductions} />
      </main>
    </div>
  );
}
