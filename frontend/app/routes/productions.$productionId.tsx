import { useParams } from "react-router";

import { mockProductions } from "~/features/archive/components/ProductionCard";
import { ProductionPage } from "~/features/archive/components/ProductionPage";

export default function ProductionDetailRoute() {
  const { productionId = "" } = useParams();
  const decodedProductionId = decodeURIComponent(productionId);
  const production = mockProductions.find(
    (item) => item.id_url === decodedProductionId
  );

  return <ProductionPage production={production!} />;
}