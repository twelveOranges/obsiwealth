import type {
  Asset,
  FundItem,
  ObsiWealthSettings,
  WishlistItem,
} from "@core/types";

/**
 * Host-agnostic facade of the application's mutable state and business
 * operations. Implemented by the Obsidian `AppModel` class today;
 * future hosts (RN app, miniapp, web app) will provide their own
 * implementation without needing to subclass anything platform-specific.
 *
 * UI code depends on this interface, not on the concrete plugin class, so
 * `packages/ui-web` is one step closer to being fully platform-neutral.
 *
 * Everything exposed here is purely domain logic – there is deliberately
 * no Obsidian `App` or `Plugin` handle. UI helpers that used to reach for
 * `plugin.app` should instead go through the {@link HostContext} singleton
 * (`host()` from `@core`).
 */
export interface AppModel {
  // --- state (read/write) ---------------------------------------------
  settings: ObsiWealthSettings;
  assets: Asset[];
  funds: FundItem[];
  wishlist: WishlistItem[];

  // --- asset CRUD -----------------------------------------------------
  addAsset(asset: Asset): Promise<void>;
  updateAsset(asset: Asset): Promise<void>;
  deleteAsset(id: string): Promise<void>;
  saveAssets(): Promise<void>;

  // --- fund CRUD ------------------------------------------------------
  addFund(fund: FundItem): Promise<void>;
  updateFund(fund: FundItem): Promise<void>;
  deleteFund(id: string): Promise<void>;
  saveFunds(): Promise<void>;

  // --- wishlist CRUD --------------------------------------------------
  addWishlistItem(item: WishlistItem): Promise<void>;
  updateWishlistItem(item: WishlistItem): Promise<void>;
  deleteWishlistItem(id: string): Promise<void>;

  // --- view refresh ---------------------------------------------------
  /**
   * Ask every live view to redraw. When `applyDefaults` is true, views that
   * track mutable display defaults (column count / sort) reset them to
   * settings-driven values first.
   */
  refreshViews(applyDefaults?: boolean): void;

  // --- package / asset directory discovery ---------------------------
  /**
   * Optional: the platform-specific directory that holds bundled icons /
   * logos. Obsidian populates this via `this.manifest.dir`. Other hosts
   * may leave it undefined and fall back to a platform default inside
   * {@link import("@core/storage/paths").PLUGIN_DIR}.
   */
  manifest?: { dir?: string };
}
