import { useTranslation } from "react-i18next";
import {
  ProductionCardGrid,
  mockProductions,
} from "~/features/archive/components/ProductionCard";

export default function Archive() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <title>{`${t("nav.archive")} | VIERNULVIER`}</title>

      <h1 className="text-3xl font-bold">{t("nav.archive")}</h1>
      <ProductionCardGrid productions={mockProductions} />
    </div>
  );
}
