import { ItemView, WorkspaceLeaf } from "obsidian";
import { VIEW_TYPE } from "@core/storage/paths";
import { renderSlotNumber } from "@ui/components/slotNumber";
import { BankLogoLoader } from "@ui/fund/fundLogo";
import { IdleWatermarkController } from "@ui/components/idleWatermark";
import { renderPasswordGate } from "@ui/lock/passwordGate";
import { ResponsiveZoomController } from "@ui/view/responsiveZoom";
import { renderHomePage } from "@ui/pages/homePage";
import {
  getWishlistAccessoriesTotal,
  getWishlistCurrentPrice,
  renderWishlistPage,
} from "@ui/pages/wishlistPage";
import { renderBottomNav } from "@ui/components/bottomNav";
import { createNavIcon } from "@ui/components/navIcon";
import { renderHeader } from "@ui/components/header";
import {
  getFundAssetTotal,
  getFundLiabilityTotal,
  getFundRanking,
  getFundTotal,
} from "@core/calc/fundStats";
import { getFundCategory } from "@core/calc/fundCategory";
import type ObsiWealthPlugin from "./main";
import type { SortDirection, SortField } from "@core/calc/sortTypes";
import { t } from "@core/i18n";
import type { PageKey } from "@ui/view/types";
import type { MainViewContext, StatusFilter } from "@ui/view/viewContext";
import { renderFundsPage, type FundSortMode } from "@ui/pages/fundsPage";
import { renderAssetsPage } from "@ui/pages/assetsPage";
import { renderStatsPage } from "@ui/pages/statsPage";
import {
  applyCardStyle,
  applyGridStyle,
  applyStickyTop,
  applyToolbarBtnStyle,
  createActionButton,
  createFundStatsCard,
  createFundToolbarButton,
  createStatsCard,
  createStatsHeroCard,
  renderEmptyChart,
} from "@ui/view/viewStyles";
import {
  displayCurrency,
  formatCurrency,
  getAssetUsageText,
  getCategoryColor,
  getCategoryLabel,
  getCategoryStats,
  getStatusColor,
  getStatusLabel,
  getStatusShadowColor,
  getVisibleAssetTotal,
} from "@ui/view/formatters";
import { applyThemeMode, teardownThemeWatcher } from "@ui/view/themeMode";

/**
 * ObsiWealth's main Obsidian view.
 *
 * This class is intentionally thin: it owns the mutable state and the
 * top-level lifecycle (`onOpen` / `render` / `onClose`), and delegates every
 * piece of UI rendering to the modules under `pages/`, `components/`,
 * `charts/`, and `view/`.
 *
 * The facade exposed to those modules (`MainViewContext`) is built on
 * demand by `buildContext()`, which wires state fields as object properties
 * (so mutations from pages flow back to the view via shared references) and
 * every helper method as a one-line delegate to the owning module.
 */
export class ObsiWealthMainView extends ItemView {
  // --- View state (mutable from handlers) ---------------------------------
  cols: number;
  statsTrendCols = 2;
  fundStatsTab: "asset" | "liability" | "netAsset" = "asset";
  fundTrendRange: string = "recent"; // "recent" | "all" | YYYY
  statsGranularity: "category" | "item" = "category";
  fundSortMode: FundSortMode = "grouped";
  fundBulkMode = false;
  selectedFundIds = new Set<string>();
  categoryFilter: "all" | string = "all";
  selectedCategoryFilters = new Set<string>();
  statusFilter: StatusFilter = "all";
  currentPage: PageKey = "home";
  sortField: SortField;
  sortDirection: SortDirection;
  bulkSelectionMode = false;
  selectedAssetIds = new Set<string>();
  collapsedStatsCards = new Set<string>();
  hideMoney = false;
  unlocked = false;
  idleWatermark: IdleWatermarkController | null = null;
  // 页面自适应缩放控制器：窗口窄于基准宽度时给 page 容器加上 CSS zoom
  // 避免卡片/图表换行，整体等比例缩小。
  responsiveZoom: ResponsiveZoomController | null = null;
  // 银行 / 机构 logo 的 SVG 缓存 / 懒加载管理器
  bankLogoLoader = new BankLogoLoader(this.plugin);

  constructor(leaf: WorkspaceLeaf, public plugin: ObsiWealthPlugin) {
    super(leaf);
    this.applyDefaultViewSettings();
  }

  applyDefaultViewSettings() {
    this.cols = this.plugin.settings.defaultCardColumns;
    this.sortField = this.plugin.settings.defaultSortField;
    this.sortDirection = this.plugin.settings.defaultSortDirection;
  }

  getViewType() {
    return VIEW_TYPE;
  }

  getDisplayText() {
    return "ObsiWealth";
  }

  async onOpen() {
    this.render();
  }

  async onClose() {
    this.idleWatermark?.teardown();
    this.responsiveZoom?.teardown();
    this.responsiveZoom = null;
    teardownThemeWatcher(this.containerEl);
  }

  render() {
    const el = this.containerEl;
    el.empty();
    el.style.height = "100%";
    el.style.display = "flex";
    el.style.flexDirection = "column";
    el.style.minHeight = "0";
    el.style.overflow = "hidden";
    applyThemeMode(el, this.plugin.settings.themeMode);

    if (!this.renderLockGateIfNeeded(el)) {
      return;
    }

    const ctx = this.buildContext();
    renderHeader(ctx, el);

    const page = el.createDiv();
    page.style.flex = "1 1 auto";
    page.style.minHeight = "0";
    page.style.overflowY = "auto";
    page.style.overflowX = "hidden";
    page.style.scrollBehavior = "smooth";

    if (this.currentPage === "home") {
      renderHomePage(ctx, page);
    } else if (this.currentPage === "funds") {
      renderFundsPage(ctx, page);
    } else if (this.currentPage === "assets") {
      renderAssetsPage(ctx, page);
    } else if (this.currentPage === "assetStats") {
      renderStatsPage(ctx, page);
    } else {
      renderWishlistPage(ctx, page);
    }

    // 物理底部安全区：与 page 平级、不在 ResponsiveZoom 的缩放范围内，
    // 始终保留 80px 不画任何页面内容，确保右下角浮动按钮组（renderBottomNav）
    // 永远不会和资产 / 资产图表页的卡片或图表"叠加"。
    // 资金页自身已用两列独立滚动 + columns.paddingBottom 处理过底部留白，
    // 叠加这块 host-level 安全区也只会多出一点点空白，不影响布局。
    const bottomSafeArea = el.createDiv();
    bottomSafeArea.style.flex = "0 0 auto";
    bottomSafeArea.style.height = "80px";
    bottomSafeArea.style.pointerEvents = "none";

    renderBottomNav(ctx, el);

    this.setupIdleWatermark(el);
    this.setupResponsiveZoom(el, page);
  }

  private renderLockGateIfNeeded(el: HTMLElement): boolean {
    if (!this.plugin.settings.passwordEnabled || this.unlocked) {
      return true;
    }
    renderPasswordGate(
      {
        plugin: this.plugin,
        tr: (key, replacements) => t(this.plugin.settings.language, key, replacements),
        onUnlock: () => {
          this.unlocked = true;
          this.render();
        },
      },
      el,
    );
    return false;
  }

  private setupIdleWatermark(host: HTMLElement) {
    if (!this.idleWatermark) {
      this.idleWatermark = new IdleWatermarkController({
        plugin: this.plugin,
        host,
        getCurrentPage: () => this.currentPage,
        createNavIcon: (name, size) => createNavIcon(name, size),
      });
    }
    this.idleWatermark.setup();
  }

  /**
   * Observe the (unscaled) view container's width and apply CSS zoom to the
   * current `page` so cards / charts shrink proportionally instead of
   * wrapping when the pane is narrower than the baseline.
   *
   * Baseline is derived from the current grid column count so that users
   * who pick more columns also implicitly raise the baseline width — a
   * 4-column pane needs more horizontal room than a 1-column one before
   * everything is laid out comfortably.
   *
   * Each `render()` rebuilds `page`, so we tear down and re-attach the
   * observer every call.
   */
  private setupResponsiveZoom(host: HTMLElement, page: HTMLElement) {
    this.responsiveZoom?.teardown();
    const getBaseline = () => {
      const pagePadding = 24;
      // Assets page: a column of asset cards needs enough width to hold the
      // icon (96) + info block (~340 on one line, sold assets have even
      // longer text) + status badge (~120) plus gaps/padding → ~660. This
      // matches `applyGridStyle`'s per-column min.
      const assetsNeed =
        this.cols * 660 + Math.max(0, this.cols - 1) * 12 + pagePadding;
      // Stats page: a donut card needs 320 + 260 + 22 = 602 inside its card;
      // plus card padding ~40 → 640 per column. See `renderStatsPage`.
      const statsNeed =
        this.statsTrendCols * 640 +
        Math.max(0, this.statsTrendCols - 1) * 18 +
        pagePadding;
      // Funds page: left/right two-column layout. Right column hosts a
      // donut card too, so it needs ~640. Left column (list) only needs
      // ~320 to look comfortable. Gap 18.
      const fundsNeed = 320 + 18 + 640 + pagePadding;
      // Never shrink below 780 — narrower than that and even single-column
      // pages (home / wishlist) start to feel cramped.
      return Math.max(780, assetsNeed, statsNeed, fundsNeed);
    };
    this.responsiveZoom = new ResponsiveZoomController(host, page, getBaseline, 0.35);
    this.responsiveZoom.setup();
  }

  /**
   * Build the `MainViewContext` facade given to every page / component /
   * chart module. State fields are shared by reference via the object
   * literal, so mutations from handlers flow directly back to `this`.
   */
  private buildContext(): MainViewContext {
    const view = this;
    const plugin = this.plugin;
    const ctx: MainViewContext = {
      // Obsidian handles
      app: this.app,
      plugin,

      // Proxy state fields (getters/setters so scalars stay in sync with view)
      get currentPage() { return view.currentPage; },
      set currentPage(v) { view.currentPage = v; },
      get cols() { return view.cols; },
      set cols(v) { view.cols = v; },
      get statsTrendCols() { return view.statsTrendCols; },
      set statsTrendCols(v) { view.statsTrendCols = v; },
      get hideMoney() { return view.hideMoney; },
      set hideMoney(v) { view.hideMoney = v; },
      get statusFilter() { return view.statusFilter; },
      set statusFilter(v) { view.statusFilter = v; },
      get categoryFilter() { return view.categoryFilter; },
      set categoryFilter(v) { view.categoryFilter = v; },
      get sortField() { return view.sortField; },
      set sortField(v) { view.sortField = v; },
      get sortDirection() { return view.sortDirection; },
      set sortDirection(v) { view.sortDirection = v; },
      get bulkSelectionMode() { return view.bulkSelectionMode; },
      set bulkSelectionMode(v) { view.bulkSelectionMode = v; },
      get fundSortMode() { return view.fundSortMode; },
      set fundSortMode(v) { view.fundSortMode = v; },
      get fundBulkMode() { return view.fundBulkMode; },
      set fundBulkMode(v) { view.fundBulkMode = v; },
      get fundStatsTab() { return view.fundStatsTab; },
      set fundStatsTab(v) { view.fundStatsTab = v; },
      get fundTrendRange() { return view.fundTrendRange; },
      set fundTrendRange(v) { view.fundTrendRange = v; },
      get statsGranularity() { return view.statsGranularity; },
      set statsGranularity(v) { view.statsGranularity = v; },

      // Shared reference fields (Set / object — mutations naturally flow back)
      selectedCategoryFilters: this.selectedCategoryFilters,
      selectedAssetIds: this.selectedAssetIds,
      selectedFundIds: this.selectedFundIds,
      collapsedStatsCards: this.collapsedStatsCards,
      bankLogoLoader: this.bankLogoLoader,

      // Lifecycle
      render: () => view.render(),
      tr: (key, replacements) => t(plugin.settings.language, key, replacements),

      // Formatters
      formatCurrency: (v) => formatCurrency(plugin, v),
      displayCurrency: (v) => displayCurrency(plugin, v, view.hideMoney),

      // Card / layout styles
      applyCardStyle,
      applyStickyTop,
      applyGridStyle: (grid) => applyGridStyle(ctx, grid),
      createStatsHeroCard,
      createStatsCard: (el, title) => createStatsCard(ctx, el, title),
      createFundStatsCard: (el, title) => createFundStatsCard(ctx, el, title),
      createActionButton,
      createFundToolbarButton,
      applyToolbarBtnStyle,
      renderSlotNumber,
      renderEmptyChart: (parent) => renderEmptyChart(ctx, parent),

      // Fund aggregates
      getFundTotal: () => getFundTotal(plugin),
      getFundAssetTotal: () => getFundAssetTotal(plugin),
      getFundLiabilityTotal: () => getFundLiabilityTotal(plugin),
      getFundRanking: (tab, granularity) =>
        getFundRanking(plugin, tab, granularity, (fund) => {
          // 详情模式下只显示「中国银行 / 支付宝 / 花呗 / 现金」这种简洁名称：
          // 不拼卡号尾号、不拼备注、也不拼 fund.name，避免"中国银行（1234）中国银行储蓄卡"
          // 这种又长又重复的标签。
          if (fund.bank) {
            return fund.bank;
          }
          if (fund.name && fund.name.trim()) {
            return fund.name.trim();
          }
          return getFundCategory(fund).name;
        }),
      getFundCategory,

      // Asset aggregates / labels
      getVisibleAssetTotal,
      getCategoryStats,
      getCategoryColor: (c) => getCategoryColor(plugin, c),
      getCategoryLabel: (v) => getCategoryLabel(plugin, v),

      // Asset status
      getStatusColor: (s) => getStatusColor(plugin, s),
      getStatusShadowColor: (s) => getStatusShadowColor(plugin, s),
      getStatusLabel: (s) => getStatusLabel(plugin, s),
      getAssetUsageText: (a) => getAssetUsageText(plugin, a),

      // Wishlist
      getWishlistCurrentPrice,
      getWishlistAccessoriesTotal,
    };
    return ctx;
  }
}
