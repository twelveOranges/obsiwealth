import { Plugin } from "obsidian";
import {
  DATA_DIR,
  DATA_PATH,
  FUNDS_PATH,
  SETTINGS_PATH,
  VIEW_TYPE,
  WISHLIST_PATH,
} from "@core/storage/paths";
import { yamlParse, yamlStringify } from "@core/storage/yaml";
import { ObsiWealthMainView } from "./mainView";

import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS, CUSTOM_ICON_SIZE_STEPS } from "@core/types";
import type {
  Asset,
  CategoryOption,
  DecimalPreference,
  DefaultCardColumns,
  FundHistoryPoint,
  FundItem,
  ObsiWealthSettings,
  WishlistItem,
} from "@core/types";
import type { SortDirection, SortField } from "@core/calc/sortTypes";
import { JsonArrayRepository } from "@core/storage/jsonArrayRepo";
import type { HostContext } from "@core/storage/hostContext";
import type { AppModel } from "@ui/host/appModel";
import { notify, setHost } from "@core/storage/hostRegistry";
import {
  collectCustomImageRefs,
  preloadCustomImagesFromItems,
  pruneOrphanCustomImages,
  setDefaultCustomIconSize,
} from "@core/storage/customImageStore";
import { createObsidianHost } from "./storage/obsidianHost";
import { migrateInlineIconsToFiles } from "./storage/migrateInlineIcons";
import { ObsiWealthSettingTab, SORT_FIELD_LABELS } from "./settings/settingsTab";

// Keep DATA_DIR in the bundle (it's used transitively by the repository).
void DATA_DIR;

export default class ObsiWealthPlugin extends Plugin {
  settings: ObsiWealthSettings = { ...DEFAULT_SETTINGS };

  private host!: HostContext;
  private assetsRepo!: JsonArrayRepository<Asset>;
  private wishlistRepo!: JsonArrayRepository<WishlistItem>;
  private fundsRepo!: JsonArrayRepository<FundItem>;

  // ---- legacy array accessors used across the codebase ----

  get assets(): Asset[] {
    return this.assetsRepo?.items ?? [];
  }
  set assets(value: Asset[]) {
    if (this.assetsRepo) this.assetsRepo.items = value;
  }

  get wishlist(): WishlistItem[] {
    return this.wishlistRepo?.items ?? [];
  }
  set wishlist(value: WishlistItem[]) {
    if (this.wishlistRepo) this.wishlistRepo.items = value;
  }

  get funds(): FundItem[] {
    return this.fundsRepo?.items ?? [];
  }
  set funds(value: FundItem[]) {
    if (this.fundsRepo) this.fundsRepo.items = value;
  }

  async onload() {
    this.buildRepositories();

    await this.assetsRepo.load();
    await this.wishlistRepo.load();
    await this.fundsRepo.load();
    await this.loadSettings();

    // Best-effort migration of any legacy inline PNG icons to disk-backed
    // files. Fully idempotent — items already holding `obsiwealth:` refs
    // are skipped instantly.
    try {
      await migrateInlineIconsToFiles({
        assets: this.assets,
        funds: this.funds,
        wishlist: this.wishlist,
        saveAssets: () => this.saveAssets(),
        saveFunds: () => this.saveFunds(),
        saveWishlist: () => this.saveWishlist(),
      });
    } catch (err) {
      console.warn("[obsiwealth] inline icon migration failed", err);
    }

    // Preload every `obsiwealth:` icon reference into an in-memory Blob URL
    // so that `<img src>` works reliably even on hosts where the native
    // resource resolver can't reach vault-root dot directories.
    try {
      await preloadCustomImagesFromItems([this.assets, this.funds, this.wishlist]);
    } catch (err) {
      console.warn("[obsiwealth] custom image preload failed", err);
    }

    // Sweep any orphan PNGs left over from before the GC hook existed
    // (previous icon replacements that never cleaned up after themselves).
    this.scheduleIconGc();

    this.registerMainView();
    this.registerCommands();
  }

  private buildRepositories() {
    const refresh = () => this.refreshViews();
    this.host = createObsidianHost(this.app);
    setHost(this.host);

    this.assetsRepo = new JsonArrayRepository<Asset>({
      store: this.host.store,
      notifier: this.host.notifier,
      path: DATA_PATH,
      getId: (item) => item.id,
      label: "资产数据",
      afterChange: refresh,
    });

    this.wishlistRepo = new JsonArrayRepository<WishlistItem>({
      store: this.host.store,
      notifier: this.host.notifier,
      path: WISHLIST_PATH,
      getId: (item) => item.id,
      label: "心愿数据",
      afterChange: refresh,
    });

    this.fundsRepo = new JsonArrayRepository<FundItem>({
      store: this.host.store,
      notifier: this.host.notifier,
      path: FUNDS_PATH,
      getId: (item) => item.id,
      label: "资金数据",
      afterChange: refresh,
      onLoad: healFundHistory,
    });
  }

  async openMainPage() {
    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.setViewState({ type: VIEW_TYPE, active: true });
  }

  // ---- asset / wishlist / fund CRUD (thin wrappers over the repositories) ----

  async loadAssets() {
    await this.assetsRepo.load();
  }
  async saveAssets() {
    await this.assetsRepo.save();
    this.scheduleIconGc();
  }
  async addAsset(asset: Asset) {
    await this.assetsRepo.add(asset);
  }
  async updateAsset(asset: Asset) {
    await this.assetsRepo.update(asset);
  }
  async deleteAsset(id: string) {
    await this.assetsRepo.remove(id);
    this.scheduleIconGc();
    notify("已删除");
  }

  async loadWishlist() {
    await this.wishlistRepo.load();
  }
  async saveWishlist() {
    await this.wishlistRepo.save();
    this.scheduleIconGc();
  }
  async addWishlistItem(item: WishlistItem) {
    await this.wishlistRepo.add(item);
  }
  async updateWishlistItem(item: WishlistItem) {
    await this.wishlistRepo.update(item);
  }
  async deleteWishlistItem(id: string) {
    await this.wishlistRepo.remove(id);
    this.scheduleIconGc();
    notify("已删除");
  }

  async loadFunds() {
    await this.fundsRepo.load();
  }
  async saveFunds() {
    await this.fundsRepo.save();
    this.scheduleIconGc();
  }
  async addFund(item: FundItem) {
    await this.fundsRepo.add(item);
  }
  async updateFund(item: FundItem) {
    await this.fundsRepo.update(item);
  }
  async deleteFund(id: string) {
    await this.fundsRepo.remove(id);
    this.scheduleIconGc();
    notify("已删除");
  }

  // ---- custom-icon garbage collection ------------------------------------

  /**
   * Coalesced orphan-icon cleanup. Every save / delete that might have
   * freed a PNG schedules a pass; multiple rapid edits collapse into a
   * single run on the next tick. Failures are swallowed — GC is an
   * optimisation, never a correctness requirement.
   */
  private iconGcTimer: number | null = null;
  private scheduleIconGc() {
    if (this.iconGcTimer !== null) return;
    this.iconGcTimer = window.setTimeout(() => {
      this.iconGcTimer = null;
      this.runIconGc().catch((err) => {
        console.warn("[obsiwealth] custom-icon GC failed", err);
      });
    }, 250);
  }
  private async runIconGc() {
    const refsInUse = collectCustomImageRefs([this.assets, this.funds, this.wishlist]);
    await pruneOrphanCustomImages(refsInUse);
  }

  // ---- settings persistence (kept in main because it has custom normalization) ----

  async loadSettings() {
    try {
      if (!(await this.host.store.exists(SETTINGS_PATH))) {
        this.settings = { ...DEFAULT_SETTINGS };
        setDefaultCustomIconSize(this.settings.customIconDefaultSize);
        return;
      }

      const data = await this.host.store.read(SETTINGS_PATH);
      this.settings = this.normalizeSettings(decodeSettings(data));
      setDefaultCustomIconSize(this.settings.customIconDefaultSize);
    } catch {
      this.settings = { ...DEFAULT_SETTINGS };
      setDefaultCustomIconSize(this.settings.customIconDefaultSize);
      notify("设置读取失败，已使用默认设置");
    }
  }

  async saveSettings() {
    if (!(await this.host.store.exists(DATA_DIR))) {
      await this.host.store.mkdir(DATA_DIR);
    }
    await this.host.store.write(SETTINGS_PATH, yamlStringify(this.settings));
  }

  async updateSettings(settings: ObsiWealthSettings) {
    const applyDefaultViewSettings =
      this.settings.defaultCardColumns !== settings.defaultCardColumns ||
      this.settings.defaultSortField !== settings.defaultSortField ||
      this.settings.defaultSortDirection !== settings.defaultSortDirection;

    this.settings = settings;
    await this.saveSettings();
    setDefaultCustomIconSize(this.settings.customIconDefaultSize);
    this.refreshViews(applyDefaultViewSettings);
  }

  refreshViews(applyDefaultViewSettings = false) {
    this.app.workspace.getLeavesOfType(VIEW_TYPE).forEach((leaf) => {
      const view = leaf.view;

      if (view instanceof ObsiWealthMainView) {
        if (applyDefaultViewSettings) {
          view.applyDefaultViewSettings();
        }
        view.render();
      }
    });
  }

  // ---- registration helpers ----

  private registerMainView() {
    this.registerView(VIEW_TYPE, (leaf) => new ObsiWealthMainView(leaf, this));

    this.addRibbonIcon("wallet", "ObsiWealth", () => {
      this.openMainPage();
    });

    this.addSettingTab(new ObsiWealthSettingTab(this.app, this));
  }

  private registerCommands() {
    this.addCommand({
      id: "open-obsiwealth",
      name: "Open ObsiWealth",
      callback: () => this.openMainPage(),
    });
  }

  // ---- settings normalization ----

  private normalizeSettings(settings: Partial<ObsiWealthSettings>): ObsiWealthSettings {
    const categories =
      Array.isArray(settings.categories) && settings.categories.length > 0
        ? this.normalizeCategories(settings.categories)
        : DEFAULT_CATEGORIES;

    return {
      ...DEFAULT_SETTINGS,
      ...settings,
      decimalPlaces: this.normalizeDecimalPlaces(settings.decimalPlaces),
      defaultCardColumns: this.normalizeDefaultCardColumns(settings.defaultCardColumns),
      defaultSortField: this.normalizeDefaultSortField(settings.defaultSortField),
      defaultSortDirection: this.normalizeDefaultSortDirection(settings.defaultSortDirection),
      customIconDefaultSize: this.normalizeCustomIconDefaultSize(settings.customIconDefaultSize),
      categories,
      statusColors: {
        ...DEFAULT_SETTINGS.statusColors,
        ...(settings.statusColors ?? {}),
      },
    };
  }

  private normalizeCategories(categories: CategoryOption[]) {
    return categories.map((category) => {
      const defaultCategory = DEFAULT_CATEGORIES.find((item) => item.id === category.id);

      if (defaultCategory && (!category.name || category.name === category.id)) {
        return defaultCategory;
      }

      return category;
    });
  }

  private normalizeDecimalPlaces(value: unknown): DecimalPreference {
    return value === 0 || value === 1 || value === 2 ? value : DEFAULT_SETTINGS.decimalPlaces;
  }

  private normalizeDefaultCardColumns(value: unknown): DefaultCardColumns {
    return value === 1 || value === 2 || value === 3 || value === 4
      ? value
      : DEFAULT_SETTINGS.defaultCardColumns;
  }

  private normalizeDefaultSortField(value: unknown): SortField {
    return typeof value === "string" && value in SORT_FIELD_LABELS
      ? (value as SortField)
      : DEFAULT_SETTINGS.defaultSortField;
  }

  private normalizeDefaultSortDirection(value: unknown): SortDirection {
    return value === "asc" || value === "desc" ? value : DEFAULT_SETTINGS.defaultSortDirection;
  }

  private normalizeCustomIconDefaultSize(value: unknown): number {
    // Accept any positive finite number, then snap to the nearest allowed
    // step so the slider has a one-to-one correspondence with the setting.
    const raw = typeof value === "number" && Number.isFinite(value) && value > 0
      ? value
      : DEFAULT_SETTINGS.customIconDefaultSize;
    let best = CUSTOM_ICON_SIZE_STEPS[0];
    let bestDelta = Math.abs(CUSTOM_ICON_SIZE_STEPS[0] - raw);
    for (let i = 1; i < CUSTOM_ICON_SIZE_STEPS.length; i++) {
      const delta = Math.abs(CUSTOM_ICON_SIZE_STEPS[i] - raw);
      if (delta < bestDelta) {
        best = CUSTOM_ICON_SIZE_STEPS[i];
        bestDelta = delta;
      }
    }
    return best;
  }
}

/**
 * Decode the on-disk YAML settings payload. Returns `{}` when the file is
 * empty or unparseable so that `normalizeSettings` can fall back to
 * defaults cleanly.
 */
function decodeSettings(source: string): Partial<ObsiWealthSettings> {
  const trimmed = (source ?? "").trim();
  if (trimmed === "") return {};
  const parsed = yamlParse(trimmed);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as Partial<ObsiWealthSettings>)
    : {};
}

/**
 * Self-heals fund history: if there is a history entry later than
 * `fund.amount/date`, overwrite the flat fields so that the "current
 * balance" always matches the most recent history point.
 */
function healFundHistory(raw: FundItem[]): { items: FundItem[]; mutated: boolean } {
  let mutated = false;

  const fixed = raw.map((fund) => {
    const history: FundHistoryPoint[] = fund.history ?? [];
    if (history.length === 0) return fund;

    let latest = history[0];
    for (let i = 1; i < history.length; i++) {
      if ((history[i].date || "").localeCompare(latest.date || "") > 0) {
        latest = history[i];
      }
    }

    if (fund.amount !== latest.amount || fund.date !== latest.date) {
      mutated = true;
      return { ...fund, amount: latest.amount, date: latest.date };
    }
    return fund;
  });

  return { items: fixed, mutated };
}

/**
 * Compile-time assertion: `ObsiWealthPlugin` must structurally satisfy
 * {@link AppModel}. If the interface adds a member that the plugin no
 * longer implements, this line fails to type-check – catching it here
 * rather than at a random UI call site.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _pluginSatisfiesAppModel: AppModel = null as unknown as ObsiWealthPlugin;