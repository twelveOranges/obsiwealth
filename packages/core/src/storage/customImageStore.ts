/**
 * Storage helper for user-uploaded PNG icons.
 *
 * Instead of inlining every picked image as a multi-kilobyte
 * `data:image/png;base64,...` string inside `assets.yaml` / `funds.yaml`,
 * we persist the binary to its own file under `.obsiwealth/icons/` and
 * keep only a short reference in the YAML payload.
 *
 * On-disk layout:
 *
 *   .obsiwealth/
 *     icons/
 *       <hash>.png      <-- content-addressed, so identical images dedupe
 *
 * In-YAML form (single canonical shape):
 *
 *   icon: "obsiwealth:icons/<hash>.png"
 *
 * The scheme body is the path *relative to the data dir*, **without** the
 * `.obsiwealth/` prefix. Keeping refs short and prefix-free is what gets
 * stored and what the resolver expects — there is no other accepted form.
 *
 * The `obsiwealth:` prefix is a synthetic scheme that both `iconResolver`
 * (for <img src>) and `customImageStore` (for path lookup) understand. It
 * sidesteps collisions with built-in icon ids and with host-resolved URLs.
 */
import { host } from "./hostRegistry";
import { DATA_DIR, ICONS_DIR } from "./paths";

/** Synthetic scheme that marks a YAML-stored reference to a user PNG. */
export const CUSTOM_IMAGE_SCHEME = "obsiwealth:";

/** Regex form of {@link CUSTOM_IMAGE_SCHEME}, used to detect stored refs. */
const CUSTOM_IMAGE_RE = /^obsiwealth:(.+)$/;

/** True when `value` is a stored reference (e.g. `obsiwealth:icons/ab12.png`). */
export function isCustomImageRef(value: string | undefined | null): boolean {
  if (!value) return false;
  return CUSTOM_IMAGE_RE.test(value);
}

/** True when `value` is an inline PNG data URL that should be migrated to disk. */
export function isInlinePngDataUrl(value: string | undefined | null): boolean {
  if (!value) return false;
  return value.startsWith("data:image/png;base64,") || value.startsWith("data:image/jpeg;base64,");
}

/**
 * Resolve a stored ref to its *actual* vault-relative path by gluing the
 * data dir onto the body. The ref body is always in the form
 * `icons/<hash>.png` — no other shape is produced by the writer.
 *
 * Returns null when `value` isn't one of our refs. Values that already
 * carry the data-dir prefix (legacy one-shot migration output) are
 * accepted for backward-compat: they're stripped back down to the
 * prefix-free body so downstream normalisation can rewrite them.
 */
export function customImageRefToVaultPath(value: string): string | null {
  const body = customImageRefBody(value);
  if (body === null) return null;
  return `${DATA_DIR}/${body}`;
}

/**
 * Return the canonical ref body (the part after `obsiwealth:`, always
 * prefix-free — e.g. `icons/abc.png`). Null when `value` isn't a ref.
 * Exported so the legacy-ref migration can call it without re-implementing
 * the stripping rules.
 */
export function customImageRefBody(value: string): string | null {
  const match = CUSTOM_IMAGE_RE.exec(value);
  if (!match) return null;
  const raw = match[1];
  // Strip the legacy `.obsiwealth/` prefix if someone fed us the old shape.
  const prefix = `${DATA_DIR}/`;
  return raw.startsWith(prefix) ? raw.slice(prefix.length) : raw;
}

/** Build the canonical ref from a prefix-free body (e.g. `icons/abc.png`). */
export function bodyToCustomImageRef(body: string): string {
  const prefix = `${DATA_DIR}/`;
  const clean = body.startsWith(prefix) ? body.slice(prefix.length) : body;
  return `${CUSTOM_IMAGE_SCHEME}${clean}`;
}

// ---------------------------------------------------------------------------
// Runtime configuration
// ---------------------------------------------------------------------------

/**
 * Default output resolution (px, square) used by the icon cropper when the
 * user hasn't explicitly moved the size slider. The host (plugin main.ts)
 * pushes the user's preference in here on load + whenever settings change;
 * the picker reads it synchronously so it doesn't need a direct settings
 * dependency.
 */
let DEFAULT_CUSTOM_ICON_SIZE = 256;

export function setDefaultCustomIconSize(px: number): void {
  if (Number.isFinite(px) && px > 0) {
    DEFAULT_CUSTOM_ICON_SIZE = Math.round(px);
  }
}

export function getDefaultCustomIconSize(): number {
  return DEFAULT_CUSTOM_ICON_SIZE;
}

// ---------------------------------------------------------------------------
// Write path
// ---------------------------------------------------------------------------

/**
 * Persist a base64 PNG/JPEG data URL to `.obsiwealth/icons/<hash>.png` and
 * return the reference string to store in YAML.
 *
 * The filename is derived from a content hash so saving the same image twice
 * is a no-op (and identical images dedupe across the whole vault).
 *
 * The returned ref uses the canonical prefix-free body, i.e.
 * `obsiwealth:icons/<hash>.png`.
 */
export async function saveCustomImageFromDataUrl(dataUrl: string): Promise<string> {
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) {
    throw new Error("saveCustomImageFromDataUrl: not a base64 data URL");
  }

  const { bytes, extension } = parsed;
  const hash = await shortContentHash(bytes);
  const body = `icons/${hash}.${extension}`;
  const vaultPath = `${DATA_DIR}/${body}`;

  const store = host().store;
  await store.mkdir(ICONS_DIR);
  const exists = await store.exists(vaultPath);
  if (!exists) {
    await store.writeBinary(vaultPath, bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  }
  return bodyToCustomImageRef(body);
}

// ---------------------------------------------------------------------------
// Read / resolve path
// ---------------------------------------------------------------------------

/**
 * In-memory cache mapping vault-relative icon paths to object URLs.
 *
 * Some hosts (notably Obsidian's `getResourcePath` on vault-root dot
 * directories such as `.obsiwealth/`) return URLs that the webview cannot
 * actually load. To avoid that whole class of problems we preload every
 * referenced PNG into a `Blob` → `URL.createObjectURL(...)` once at plugin
 * startup, and `resolveCustomImageUrl` hands out the cached object URL.
 * Falls back to `host().resources.resolveUrl(...)` when the cache misses,
 * so rendering still works before preload completes (or on other hosts).
 */
const OBJECT_URL_CACHE = new Map<string, string>();

/**
 * Ensure a single reference is cached as a Blob object URL. Subsequent
 * calls are no-ops. Silently ignores missing files – the caller will fall
 * back to the host resolver and/or a broken-image placeholder, which is
 * still preferable to throwing during plugin startup.
 */
export async function preloadCustomImage(ref: string): Promise<void> {
  const vaultPath = customImageRefToVaultPath(ref);
  if (!vaultPath) return;
  if (OBJECT_URL_CACHE.has(vaultPath)) return;

  try {
    const store = host().store;
    if (!(await store.exists(vaultPath))) return;
    const buf = await store.readBinary(vaultPath);
    const mime = guessMimeFromExtension(vaultPath);
    const blob = new Blob([buf], { type: mime });
    const url = URL.createObjectURL(blob);
    OBJECT_URL_CACHE.set(vaultPath, url);
  } catch (err) {
    console.warn("[obsiwealth] preloadCustomImage failed", ref, err);
  }
}

/**
 * Batch variant: walks a list of items with an optional `icon` field and
 * preloads every `obsiwealth:` reference found. Nested `accessories` are
 * walked too. Safe and idempotent.
 */
export async function preloadCustomImagesFromItems(
  groups: Array<Array<{ icon?: string; accessories?: Array<{ icon?: string }> }>>,
): Promise<void> {
  const refs = new Set<string>();
  for (const group of groups) {
    for (const item of group) {
      if (item.icon && isCustomImageRef(item.icon)) refs.add(item.icon);
      const accs = item.accessories;
      if (Array.isArray(accs)) {
        for (const acc of accs) {
          if (acc.icon && isCustomImageRef(acc.icon)) refs.add(acc.icon);
        }
      }
    }
  }
  await Promise.all(Array.from(refs).map((r) => preloadCustomImage(r)));
}

/**
 * Resolve a stored reference to a URL usable inside `<img src>` on the
 * current host. Returns the empty string when `ref` isn't one of ours.
 */
export function resolveCustomImageUrl(ref: string): string {
  const vaultPath = customImageRefToVaultPath(ref);
  if (!vaultPath) return "";
  const cached = OBJECT_URL_CACHE.get(vaultPath);
  if (cached) return cached;
  // Fallback: let the host try. If preload has already run and there is
  // still no cache entry, the file is missing — returning a host URL
  // produces a broken-image icon, which is the right visual signal.
  return host().resources.resolveUrl(vaultPath);
}

/**
 * Read a previously saved custom image back as a data URL. Used by the
 * backup exporter so a single self-contained YAML still includes the image
 * bytes.
 */
export async function readCustomImageAsDataUrl(ref: string): Promise<string | null> {
  const vaultPath = customImageRefToVaultPath(ref);
  if (!vaultPath) return null;

  const store = host().store;
  if (!(await store.exists(vaultPath))) return null;

  const base64 = await readFileAsBase64(vaultPath);
  if (!base64) return null;

  const mime = guessMimeFromExtension(vaultPath);
  return `data:${mime};base64,${base64}`;
}

// ---------------------------------------------------------------------------
// Garbage collection
// ---------------------------------------------------------------------------

/**
 * Walk a batch of items (assets / funds / wishlist) and collect every
 * custom-image ref their `icon` fields — plus any nested accessory icons —
 * currently reference. The returned set holds the canonical ref strings
 * (`obsiwealth:icons/<hash>.png`); it is the exact "in-use" set that the
 * GC pass wants to keep.
 */
export function collectCustomImageRefs(
  groups: Array<Array<{ icon?: string; accessories?: Array<{ icon?: string }> }>>,
): Set<string> {
  const refs = new Set<string>();
  for (const group of groups) {
    for (const item of group) {
      if (item.icon && isCustomImageRef(item.icon)) {
        // Normalise on the way in so legacy `.obsiwealth/`-prefixed refs
        // collide with their canonical siblings in the set.
        const body = customImageRefBody(item.icon);
        if (body) refs.add(bodyToCustomImageRef(body));
      }
      const accs = item.accessories;
      if (Array.isArray(accs)) {
        for (const acc of accs) {
          if (acc.icon && isCustomImageRef(acc.icon)) {
            const body = customImageRefBody(acc.icon);
            if (body) refs.add(bodyToCustomImageRef(body));
          }
        }
      }
    }
  }
  return refs;
}

/**
 * Delete every file inside `.obsiwealth/icons/` that isn't referenced by
 * `refsInUse`. Runs after each save of the owning collection so that
 * replacing an icon on an asset immediately frees the previous PNG.
 *
 * Conservative — any I/O error just logs and continues; GC is a best-effort
 * cleanup and must never break the save flow itself.
 *
 * Returns the number of files actually removed (mostly useful for tests).
 */
export async function pruneOrphanCustomImages(refsInUse: Set<string>): Promise<number> {
  const store = host().store;
  let removed = 0;

  // Compute the set of vault paths still needed.
  const keepPaths = new Set<string>();
  for (const ref of refsInUse) {
    const p = customImageRefToVaultPath(ref);
    if (p) keepPaths.add(p);
  }

  try {
    if (!(await store.exists(ICONS_DIR))) return 0;
    const { files } = await store.list(ICONS_DIR);
    for (const filePath of files) {
      if (!isIconFilePath(filePath)) continue;
      if (keepPaths.has(filePath)) continue;
      try {
        await store.remove(filePath);
        // Also drop any cached object URL so the next preload reflects the
        // new reality (and we don't leak the blob URL).
        const cached = OBJECT_URL_CACHE.get(filePath);
        if (cached) {
          try { URL.revokeObjectURL(cached); } catch { /* noop */ }
          OBJECT_URL_CACHE.delete(filePath);
        }
        removed++;
      } catch (err) {
        console.warn("[obsiwealth] failed to prune orphan icon", filePath, err);
      }
    }
  } catch (err) {
    console.warn("[obsiwealth] pruneOrphanCustomImages failed", err);
  }

  return removed;
}

/** Only consider `.png` / `.jpg` files so we never touch sibling metadata. */
function isIconFilePath(p: string): boolean {
  const lower = p.toLowerCase();
  return lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg");
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface ParsedDataUrl {
  bytes: Uint8Array;
  extension: "png" | "jpg";
}

function parseDataUrl(dataUrl: string): ParsedDataUrl | null {
  const match = /^data:image\/(png|jpeg|jpg);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const extension = match[1].startsWith("png") ? "png" : "jpg";
  try {
    const binary = atob(match[2]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return { bytes, extension };
  } catch {
    return null;
  }
}

function guessMimeFromExtension(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "image/png";
}

/**
 * Read a vault-relative binary file and return its base64 encoding. We go
 * through the host's regular `read()` path via a fetch on the resolved URL
 * so that the miniapp / web fallbacks keep working.
 */
async function readFileAsBase64(vaultPath: string): Promise<string | null> {
  try {
    const url = host().resources.resolveUrl(vaultPath);
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return arrayBufferToBase64(buf);
  } catch {
    return null;
  }
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  return btoa(binary);
}

/**
 * Short (16-hex-char) content hash. Uses SubtleCrypto when available, and
 * falls back to a deterministic FNV-1a mix so older runtimes still get a
 * stable filename.
 */
async function shortContentHash(bytes: Uint8Array): Promise<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subtle = (globalThis as any).crypto?.subtle;
    if (subtle) {
      const digest = await subtle.digest("SHA-1", bytes);
      const hex = arrayBufferToHex(digest);
      return hex.slice(0, 16);
    }
  } catch {
    // fall through to FNV
  }
  return fnv1aHex(bytes);
}

function arrayBufferToHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

function fnv1aHex(bytes: Uint8Array): string {
  // 64-bit FNV-1a, output as 16-hex chars.
  let hHi = 0xcbf29ce4;
  let hLo = 0x84222325;
  for (let i = 0; i < bytes.length; i++) {
    hLo ^= bytes[i];
    // multiply by 0x100000001b3
    const mLoLo = (hLo & 0xffff) * 0x01b3;
    const mLoHi = (hLo >>> 16) * 0x01b3;
    const mHiLo = (hHi & 0xffff) * 0x01b3 + (hLo & 0xffff) * 0x0100;
    let lo = (mLoLo + ((mLoHi & 0xffff) << 16)) >>> 0;
    let carry = Math.floor((mLoLo + (mLoHi * 0x10000)) / 0x100000000);
    let hi = (mHiLo + carry + ((mLoHi >>> 16) & 0xffff)) >>> 0;
    hHi = hi;
    hLo = lo;
  }
  return hHi.toString(16).padStart(8, "0") + hLo.toString(16).padStart(8, "0");
}
