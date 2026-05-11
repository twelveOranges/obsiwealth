import type { IconDefinition } from "@core/types";
import { ICON_LIBRARY, IconCategory } from "./iconLibrary";

/**
 * Back-compat shim for the old `ASSET_ICON_GROUPS` shape used by the (legacy)
 * flat icon picker. The new icon picker drives itself from
 * `ICON_LIBRARY` directly — this module only exists so modules outside the
 * picker (e.g. the flat icon registry in `icons.ts`) keep compiling.
 *
 * The ordering is: first the 3D groups (prefixed with their dimension in the
 * id so we don't collide with 2D), then the 2D groups.
 */

export type AssetIconGroupId = string;

export interface AssetIconGroup {
  id: AssetIconGroupId;
  name: string;
  icons: IconDefinition[];
}

function buildGroups(): AssetIconGroup[] {
  const out: AssetIconGroup[] = [];
  ICON_LIBRARY.forEach((dim) => {
    dim.categories.forEach((cat: IconCategory) => {
      out.push({
        id: dim.dimension === "3d" ? `${cat.id}3d` : cat.id,
        name: dim.dimension === "3d" ? `3D ${cat.name}` : cat.name,
        icons: cat.icons,
      });
    });
  });
  return out;
}

export const ASSET_ICON_GROUPS: AssetIconGroup[] = buildGroups();

function flattenIcons(groups: AssetIconGroup[]): IconDefinition[] {
  const out: IconDefinition[] = [];
  groups.forEach((g) => {
    g.icons.forEach((icon) => out.push(icon));
  });
  return out;
}

/** Flat list (ordered by group) — convenient for registry lookup. */
export const ASSET_FLAT_ICONS: IconDefinition[] = flattenIcons(ASSET_ICON_GROUPS);
