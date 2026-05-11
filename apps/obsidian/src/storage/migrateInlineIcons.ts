/**
 * One-shot migration: convert inline PNG data URLs embedded in icon fields
 * of assets / funds / wishlist items into hash-addressed files under
 * `.obsiwealth/icons/` and replace the YAML value with an `obsiwealth:`
 * reference.
 *
 * Also normalises legacy ref shapes to the single canonical form:
 *
 *   canonical:  `obsiwealth:icons/<hash>.png`              (prefix-free body)
 *   legacy:     `obsiwealth:.obsiwealth/icons/<hash>.png`  (early migration bug)
 *
 * Anything in the legacy shape is rewritten in place so downstream code
 * (preload, resolveUrl, backup export, GC) only has to handle one form.
 *
 * Runs on every plugin load but is effectively a no-op once there are no
 * more `data:image/...` icons or legacy refs left. Safe to re-run because
 * `saveCustomImageFromDataUrl` is idempotent for identical bytes.
 */
import {
  bodyToCustomImageRef,
  customImageRefBody,
  isCustomImageRef,
  isInlinePngDataUrl,
  saveCustomImageFromDataUrl,
} from "@core/storage/customImageStore";
import type { Asset, FundItem, WishlistItem } from "@core/types";

interface HasIcon {
  icon?: string;
}

async function migrateIconField<T extends HasIcon>(item: T): Promise<boolean> {
  if (!item.icon) return false;

  // 1) Inline data URL → disk-backed file.
  if (isInlinePngDataUrl(item.icon)) {
    try {
      const ref = await saveCustomImageFromDataUrl(item.icon);
      item.icon = ref;
      return true;
    } catch (err) {
      console.warn("[obsiwealth] icon migration failed", err);
      return false;
    }
  }

  // 2) Existing ref → strip the legacy `.obsiwealth/` prefix if present.
  if (isCustomImageRef(item.icon)) {
    const body = customImageRefBody(item.icon);
    if (!body) return false;
    const canonical = bodyToCustomImageRef(body);
    if (canonical !== item.icon) {
      item.icon = canonical;
      return true;
    }
  }

  return false;
}

export interface IconMigrationTargets {
  assets: Asset[];
  funds: FundItem[];
  wishlist: WishlistItem[];
  /** Persist each collection when its icon field changed. */
  saveAssets: () => Promise<void>;
  saveFunds: () => Promise<void>;
  saveWishlist: () => Promise<void>;
}

export async function migrateInlineIconsToFiles(t: IconMigrationTargets): Promise<void> {
  let assetChanged = false;
  for (const a of t.assets) {
    // Asset carries accessories with their own icons; cover both.
    if (await migrateIconField(a as HasIcon)) assetChanged = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accessories = (a as any).accessories as HasIcon[] | undefined;
    if (Array.isArray(accessories)) {
      for (const acc of accessories) {
        if (await migrateIconField(acc)) assetChanged = true;
      }
    }
  }
  if (assetChanged) await t.saveAssets();

  let fundChanged = false;
  for (const f of t.funds) {
    if (await migrateIconField(f as HasIcon)) fundChanged = true;
  }
  if (fundChanged) await t.saveFunds();

  let wishChanged = false;
  for (const w of t.wishlist) {
    if (await migrateIconField(w as HasIcon)) wishChanged = true;
  }
  if (wishChanged) await t.saveWishlist();
}
