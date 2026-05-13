import type { ProductionGroup } from "../types/productionGroupTypes";

export const PRODUCTION_GROUP_QUERY_PARAM = "group";

export function getProductionGroupId(
  productionGroup: Pick<ProductionGroup, "id_url">
): string {
  return productionGroup.id_url.split("/").pop() ?? "";
}

export function getRequestedProductionGroupIds(
  searchParams: URLSearchParams
): string[] {
  const seen = new Set<string>();
  const requestedIds: string[] = [];

  for (const value of searchParams.getAll(PRODUCTION_GROUP_QUERY_PARAM)) {
    const id = value.trim();

    if (!/^\d+$/.test(id) || seen.has(id)) {
      continue;
    }

    seen.add(id);
    requestedIds.push(id);
  }

  return requestedIds;
}

export function resolveProductionGroupsByIds(
  productionGroups: ProductionGroup[],
  requestedIds: string[]
): ProductionGroup[] {
  const groupsById = new Map(
    productionGroups.map((productionGroup) => [
      getProductionGroupId(productionGroup),
      productionGroup,
    ])
  );

  return requestedIds
    .map((id) => groupsById.get(id))
    .filter((productionGroup): productionGroup is ProductionGroup => !!productionGroup);
}

export function normalizeProductionGroupText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function matchesProductionGroupQuery(
  productionGroup: ProductionGroup,
  query: string
): boolean {
  const normalizedQuery = normalizeProductionGroupText(query);

  if (normalizedQuery.length === 0) {
    return false;
  }

  return normalizeProductionGroupText(productionGroup.title).includes(normalizedQuery);
}
