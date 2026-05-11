export const PLUGIN_ID = "obsiwealth";

/**
 * Conventional plugin asset root. Used as a fallback only; production
 * code should always prefer `plugin.manifest.dir` (populated by the host
 * shell) over this constant. Strictly Obsidian-flavoured; other platforms
 * will derive their own asset dir from the {@link HostContext}.
 */
export const PLUGIN_DIR = `.obsidian/plugins/${PLUGIN_ID}`;

/** Vault-relative data directory (not Obsidian-specific – it's just a folder name). */
export const DATA_DIR = ".obsiwealth";

/** Sub-directory that stores user-uploaded PNG icons as individual files. */
export const ICONS_DIR = `${DATA_DIR}/icons`;

// Storage paths — YAML for human readability.
export const DATA_PATH = `${DATA_DIR}/assets.yaml`;
export const WISHLIST_PATH = `${DATA_DIR}/wishlist.yaml`;
export const FUNDS_PATH = `${DATA_DIR}/funds.yaml`;
export const SETTINGS_PATH = `${DATA_DIR}/settings.yaml`;

/** Obsidian `ItemView` type id – consumed by the Obsidian shell only. */
export const VIEW_TYPE = "obsiwealth-main";
