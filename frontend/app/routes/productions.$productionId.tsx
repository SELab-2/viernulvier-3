import { useParams } from "react-router";

import { ProductionPage } from "~/features/archive/components/ProductionPage";
import { getMockProductionPageById } from "~/features/archive/components/productionPageMock";

export default function ProductionDetailRoute() {
  const { productionId = "" } = useParams();
  const decodedProductionId = decodeURIComponent(productionId);
  
  //TODO remove mocks
  const production = getMockProductionPageById(decodedProductionId);

  if (!production) {
    return <div>Production not found.</div>;
  }

  return <ProductionPage production={production} />;
}
