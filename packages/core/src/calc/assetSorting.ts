import { getAssetStatus, getDailyCost, getNetAssetCost, getUsedDays, parseLocalDate } from "./assetMath";
import type { Asset, AssetStatus } from "../types";
import type { SortDirection, SortField } from "./sortTypes";

const STATUS_WEIGHT: Record<AssetStatus, number> = {
  active: 0,
  sold: 1,
  retired: 2,
};

export function sortAssets(assets: Asset[], field: SortField, direction: SortDirection) {
  if (field === "manual") {
    return [...assets];
  }

  const directionMultiplier = direction === "asc" ? 1 : -1;

  return [...assets].sort((a, b) => {
    const diff = getSortValue(a, field) - getSortValue(b, field);

    if (diff !== 0) {
      return diff * directionMultiplier;
    }

    return a.name.localeCompare(b.name) * directionMultiplier;
  });
}

function getSortValue(asset: Asset, field: SortField) {
  if (field === "buyDate") {
    return parseLocalDate(asset.buy_date)?.getTime() ?? 0;
  }

  if (field === "dailyCost") {
    return getDailyCost(asset);
  }

  if (field === "status") {
    return STATUS_WEIGHT[getAssetStatus(asset)];
  }

  if (field === "serviceTime") {
    return getUsedDays(asset);
  }

  if (field === "value") {
    return getNetAssetCost(asset);
  }

  return 0;
}
