import { useParams } from "react-router";
import { useEffect, useMemo, useState } from "react";

import {
  getProduction,
  getProductionByUrl,
} from "~/features/archive/services/productionService";
import type { Production } from "~/features/archive/types/productionTypes";
import { useTranslation } from "react-i18next";
import { ProductionPage } from "~/features/archive/pages/ProductionPage";

function getProductionNumericIdFromInput(
  productionIdInput: string
): number | undefined {
  if (/^\d+$/.test(productionIdInput)) {
    const numericId = Number(productionIdInput);
    return Number.isInteger(numericId) && numericId > 0 ? numericId : undefined;
  }

  const urlMatch = productionIdInput.match(/\/productions\/(\d+)(?:[/?#]|$)/);
  if (!urlMatch) {
    return undefined;
  }

  const numericId = Number(urlMatch[1]);
  return Number.isInteger(numericId) && numericId > 0 ? numericId : undefined;
}

export default function ProductionDetailRoute() {
  const { productionId = "" } = useParams();
  const decodedProductionId = useMemo(
    () => decodeURIComponent(productionId),
    [productionId]
  );
  const { i18n } = useTranslation();
  const { lang } = useParams();
  const [production, setProduction] = useState<Production | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const loadProduction = async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        const numericId = getProductionNumericIdFromInput(decodedProductionId);

        let productionData =
          typeof numericId === "number"
            ? await getProduction(numericId)
            : await getProductionByUrl(decodedProductionId);

        // Check if the frontend received a production info, otherwise refetch with another language
        if (productionData.production_infos.length === 0 && !isCancelled) {
          const otherLanguage = lang === "en" ? "nl" : "en";
          productionData =
            typeof numericId === "number"
              ? await getProduction(numericId, otherLanguage)
              : await getProductionByUrl(decodedProductionId, otherLanguage);
        }

        if (!isCancelled) {
          setProduction(productionData);
        }
      } catch {
        if (!isCancelled) {
          setHasError(true);
          setProduction(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    if (decodedProductionId.trim().length === 0) {
      setProduction(null);
      setHasError(true);
      setIsLoading(false);
      return;
    }

    void loadProduction();

    return () => {
      isCancelled = true;
    };
  }, [decodedProductionId, i18n.resolvedLanguage, lang]);

  if (isLoading) {
    return <div>Loading production...</div>;
  }

  if (hasError) {
    return <div>Failed to load production.</div>;
  }

  if (!production) {
    return <div>Production not found.</div>;
  }

  return <ProductionPage production={production} />;
}
