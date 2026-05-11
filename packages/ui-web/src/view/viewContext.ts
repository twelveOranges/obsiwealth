import type { App } from "obsidian";
import type { AppModel } from "@ui/host/appModel";
import type { TranslationKey } from "@core/i18n";
import type { PageKey } from "./types";
import type { Asset, AssetStatus, FundItem, WishlistItem } from "@core/types";
import type { SortDirection, SortField } from "@core/calc/sortTypes";
import type { BankLogoLoader } from "../fund/fundLogo";
import type { FundSortMode } from "../pages/fundsPage";

/** Status filter used by the assets page. */
export type StatusFilter = "all" | AssetStatus | "appreciated";

/** Ranking entry shown in fund pie / legend / ranking cards. */
export interface FundRankingEntry {
  name: string;
  value: number;
  color: string;
}

/** Per-category aggregate used by the assets category pie chart. */
export interface CategoryStatEntry {
  category: string;
  value: number;
}

/**
 * MainViewContext is the facade that page / component / chart modules use to
 * read and mutate the main view's state without depending on the concrete
 * `ObsiWealthMainView` class. `ObsiWealthMainView` satisfies this interface
 * via TypeScript structural typing, so no explicit `implements` is needed.
 *
 * Kept intentionally narrow: only expose the members that extracted modules
 * actually use, so we can see the coupling surface at a glance.
 */
export interface MainViewContext {
  // --- Obsidian handles ---------------------------------------------------
  app: App;
  plugin: AppModel;

  // --- View state (mutable from handlers) ---------------------------------
  currentPage: PageKey;
  cols: number;
  statsTrendCols: number;
  hideMoney: boolean;

  // Filters / bulk / sort state (read & written by filters + bulkBar)
  statusFilter: StatusFilter;
  categoryFilter: "all" | string;
  selectedCategoryFilters: Set<string>;
  sortField: SortField;
  sortDirection: SortDirection;
  bulkSelectionMode: boolean;
  selectedAssetIds: Set<string>;

  // Funds page state (read & written by fundsPage)
  fundSortMode: FundSortMode;
  fundBulkMode: boolean;
  selectedFundIds: Set<string>;
  fundStatsTab: "asset" | "liability" | "netAsset";
  fundTrendRange: string;
  /**
   * Granularity used by both charts that aggregate many items into a few
   * slices: the assets page's "资产分布" pie and the funds page's
   * "资金排行榜". When `"category"` we aggregate by category (current
   * behaviour); when `"item"` each account / asset is its own slice.
   */
  statsGranularity: "category" | "item";
  bankLogoLoader: BankLogoLoader;
  // Stats page: set of collapsed card titles (toggled by createStatsCard /
  // createFundStatsCard in view/viewStyles.ts).
  collapsedStatsCards: Set<string>;

  // --- Core view lifecycle -----------------------------------------------
  render(): void;

  // --- Shared helpers (still implemented on the view itself) --------------
  tr(key: TranslationKey, replacements?: Record<string, string>): string;
  displayCurrency(value: number): string;
  formatCurrency(value: number): string;
  applyGridStyle(grid: HTMLElement): void;
  applyCardStyle(card: HTMLElement): void;
  applyStickyTop(card: HTMLElement): void;
  createStatsHeroCard(el: HTMLElement, title: string): HTMLElement;
  createStatsCard(el: HTMLElement, title: string): HTMLElement;
  createFundStatsCard(el: HTMLElement, title: string): HTMLElement;
  createActionButton(
    parent: HTMLElement,
    text: string,
    title: string,
    onClick: () => void | Promise<void>,
    danger?: boolean,
  ): HTMLElement;
  createFundToolbarButton(
    parent: HTMLElement,
    iconName: string,
    tip: string,
    style: "ghost" | "accent" | "danger",
  ): HTMLButtonElement;
  applyToolbarBtnStyle(
    btn: HTMLButtonElement,
    style: "ghost" | "accent" | "danger",
    disabled?: boolean,
  ): void;
  renderSlotNumber(parent: HTMLElement, value: string, shrinkDecimals?: boolean): void;
  renderEmptyChart(parent: HTMLElement): void;

  // Fund / asset aggregates used by charts + stats
  getFundTotal(): number;
  getFundAssetTotal(): number;
  getFundLiabilityTotal(): number;
  getFundRanking(
    tab: "asset" | "liability" | "netAsset",
    granularity?: "category" | "item",
  ): FundRankingEntry[];
  getVisibleAssetTotal(assets: Asset[]): number;
  getCategoryStats(assets: Asset[]): CategoryStatEntry[];
  getCategoryColor(category: string): string;
  getCategoryLabel(value: string): string;
  getWishlistCurrentPrice(item: WishlistItem): number;
  getWishlistAccessoriesTotal(item: WishlistItem): number;
  getFundCategory(fund: FundItem): { id: string; name: string };

  // Asset status helpers (shared by assetsPage + statsPage)
  getStatusColor(status: AssetStatus): string;
  getStatusShadowColor(status: AssetStatus): string;
  getStatusLabel(status: AssetStatus): string;
  getAssetUsageText(asset: Asset): string;
}
