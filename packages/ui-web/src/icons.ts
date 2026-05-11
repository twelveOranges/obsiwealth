import type { IconDefinition } from "@core/types";
import { isCustomImageRef } from "@core/storage/customImageStore";
import { ASSET_ICON_GROUPS, ASSET_FLAT_ICONS } from "./assetIcons";

/**
 * Full ICONS registry used by `findIcon`.
 *
 * All built-in icons are bundled inline SVGs (see `assetIcons.ts`), so the
 * registry travels with the published release and works for every user.
 * User-uploaded PNGs are stored under `.obsiwealth/icons/` and referenced
 * via the `obsiwealth:` scheme — resolved separately in `iconResolver`.
 */
export const ICONS: IconDefinition[] = [...ASSET_FLAT_ICONS];

export { ASSET_ICON_GROUPS };

export function findIcon(id: string) {
  if (!id) {
    return undefined;
  }
  // 自定义本地图片以 dataURL 形式存储，直接构造一个临时 IconDefinition 返回
  if (id.startsWith("data:")) {
    return { id, name: "自定义图片", src: id } as IconDefinition;
  }
  // 用户上传的 PNG 以 `obsiwealth:icons/<hash>.png` 形式存储。调用方只负
  // 责通过 `findIcon` 检查图标是否"存在"，真正的 URL 会由 `getIconPath`
  // 走 host 的 resource resolver 拿到；这里返回一个占位 IconDefinition
  // 让渲染分支不被跳过即可。
  if (isCustomImageRef(id)) {
    return { id, name: "自定义图片", src: id } as IconDefinition;
  }
  return ICONS.find((icon) => icon.id === id);
}
