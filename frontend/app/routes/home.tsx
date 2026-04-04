import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import {
  ProductionCardGrid,
  mockProductions,
} from "~/features/archive/components/ProductionCard";

export default function Archive() {
  const { t } = useTranslation();
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
      <title>{`${t("nav.home")} | VIERNULVIER`}</title>

      <main className="mx-auto w-full max-w-[1800px] px-6 py-8 md:px-24 md:py-12">
        <ProductionCardGrid
          productions={mockProductions}
          onDetailClick={handleOpenProductionDetail}
        />
      </main>
    </div>
  );
}
