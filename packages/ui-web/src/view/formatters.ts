import type { AppModel } from "@ui/host/appModel";
import type { Asset, AssetStatus } from "@core/types";
import { getNetAssetCost, getUsageDuration, getUsedDays } from "@core/calc/assetMath";
import { defaultCategoryLabel, statusLabel, t } from "@core/i18n";

/**
 * Value-formatting and labelling helpers shared across the view layer.
 *
 * These used to live as tiny `private` methods on `ObsiWealthMainView`; now
 * they are plain functions that take the pieces they actually need
 * (`plugin` for settings-driven formats, the raw value, etc.).
 */

// ---------------------------------------------------------------------------
// Currency
// ---------------------------------------------------------------------------

export function formatCurrency(plugin: AppModel, value: number): string {
  const amount = value.toLocaleString(undefined, {
    minimumFractionDigits: plugin.settings.decimalPlaces,
    maximumFractionDigits: plugin.settings.decimalPlaces,
    useGrouping: plugin.settings.useThousandsSeparator,
  });

  return `${plugin.settings.currencySymbol} ${amount}`;
}

export function displayCurrency(plugin: AppModel, value: number, hideMoney: boolean): string {
  return hideMoney ? "****" : formatCurrency(plugin, value);
}

// ---------------------------------------------------------------------------
// Category helpers
// ---------------------------------------------------------------------------

const CATEGORY_PALETTE = ["#60a5fa", "#4ade80", "#f59e0b", "#f472b6", "#a78bfa", "#22d3ee"];

export function getCategoryColor(plugin: AppModel, category: string): string {
  const categories = plugin.settings.categories.map((item) => item.id);
  const categoryIndex = categories.indexOf(category);
  const index = categoryIndex >= 0
    ? categoryIndex
    : Math.abs(Array.from(category).reduce((hash, char) => hash + char.charCodeAt(0), 0));

  return CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];
}

export function getCategoryLabel(plugin: AppModel, value: string): string {
  return (
    plugin.settings.categories.find((category) => category.id === value)?.name ??
    defaultCategoryLabel(plugin.settings.language, value)
  );
}

export function getCategoryStats(assets: Asset[]): Array<{ category: string; value: number }> {
  const map = new Map<string, number>();

  assets.forEach((asset) => {
    map.set(asset.category, (map.get(asset.category) ?? 0) + getNetAssetCost(asset));
  });

  return Array.from(map.entries()).map(([category, value]) => ({ category, value }));
}

// ---------------------------------------------------------------------------
// Asset status helpers
// ---------------------------------------------------------------------------

export function getStatusColor(plugin: AppModel, status: AssetStatus): string {
  return plugin.settings.statusColors[status];
}

export function getStatusShadowColor(plugin: AppModel, status: AssetStatus): string {
  return `${getStatusColor(plugin, status)}33`;
}

export function getStatusLabel(plugin: AppModel, status: AssetStatus): string {
  const labels: Record<AssetStatus, string> = {
    active: statusLabel(plugin.settings.language, "active"),
    retired: statusLabel(plugin.settings.language, "retired"),
    sold: statusLabel(plugin.settings.language, "sold"),
  };

  return labels[status];
}

// ---------------------------------------------------------------------------
// Asset usage text (e.g. "1年2月3天" or "365天")
// ---------------------------------------------------------------------------

export function getAssetUsageText(plugin: AppModel, asset: Asset): string {
  const tr = (key: Parameters<typeof t>[1]) => t(plugin.settings.language, key);

  if (plugin.settings.durationDisplayMode === "days") {
    return `${getUsedDays(asset)}${tr("days")}`;
  }

  const duration = getUsageDuration(asset);
  const parts = [
    duration.years > 0 ? `${duration.years}${tr("years")}` : "",
    duration.months > 0 ? `${duration.months}${tr("months")}` : "",
    duration.days > 0 ? `${duration.days}${tr("days")}` : "",
  ].filter(Boolean);

  return parts.length > 0 ? parts.join("") : `0${tr("days")}`;
}

// ---------------------------------------------------------------------------
// Asset totals
// ---------------------------------------------------------------------------

/** Total of assets not flagged as excluded from the global total. */
export function getVisibleAssetTotal(assets: Asset[]): number {
  return assets
    .filter((asset) => !asset.flags?.exclude_total)
    .reduce((sum, asset) => sum + getNetAssetCost(asset), 0);
}
