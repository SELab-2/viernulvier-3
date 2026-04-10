import { useParams } from "react-router";

import { ProductionPage } from "~/features/archive/components/ProductionPage";
import { getMockProductionPageById } from "~/features/archive/components/productionPageMock";

export default function ProductionDetailRoute() {
  const { productionId = "" } = useParams();
  const decodedProductionId = decodeURIComponent(productionId);
  const production = getMockProductionPageById(decodedProductionId);

  return <ProductionPage production={production!} />;
}
