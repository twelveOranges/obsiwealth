import { PLUGIN_DIR } from "@core/storage/paths";
import { host } from "@core/storage/hostRegistry";
import { isCustomImageRef, resolveCustomImageUrl } from "@core/storage/customImageStore";
import { findIcon } from "./icons";

/**
 * Resolve an icon id to a URL suitable for `<img src>`.
 *
 * Priority order:
 *   1. `obsiwealth:icons/<hash>.png` — a reference to a user-uploaded PNG
 *      stored on disk (resolved through the host's resource resolver so the
 *      Obsidian webview gets an `app://…` URL).
 *   2. `data:` URL — an inline image (legacy path for pre-migration icons,
 *      or freshly cropped PNG before it has been persisted).
 *   3. Built-in icon id — resolved against the bundled asset directory.
 */
export function getIconPath(iconId: string, plugin?: { manifest?: { dir?: string } }): string {
  if (iconId && isCustomImageRef(iconId)) {
    return resolveCustomImageUrl(iconId);
  }

  // 自定义本地图片以 dataURL 形式存储，直接返回即可作为 <img src>
  if (iconId && iconId.startsWith("data:")) {
    return iconId;
  }

  const icon = findIcon(iconId);
  if (!icon) {
    return "";
  }

  // findIcon 在遇到 dataURL 时也会直接把 id 当成 src，这里做个兜底
  if (icon.src.startsWith("data:")) {
    return icon.src;
  }

  const pluginDir = plugin?.manifest?.dir ?? PLUGIN_DIR;
  return host().resources.resolveUrl(`${pluginDir}/${icon.src}`);
}