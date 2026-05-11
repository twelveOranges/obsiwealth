/**
 * Applies the configured theme mode (light / dark / system) to the given
 * element by toggling CSS custom properties.
 *
 * In "system" mode we follow Obsidian's current appearance (detected via the
 * `theme-dark` / `theme-light` class on `<body>`) and reapply automatically
 * whenever the user toggles Obsidian's appearance.
 */
export type ThemeMode = "system" | "light" | "dark";

// --- palette ---------------------------------------------------------------
// Softer tones so cards (secondary) layer gently over the page background
// (primary) without the "harsh floating box" look in dark mode.
const LIGHT_PALETTE = {
  pageBg: "#f6f7fb",
  primary: "#ffffff",
  secondary: "#f1f4fa",
  border: "#dfe4ee",
  hover: "#e6eaf3",
  textNormal: "#0f172a",
  textMuted: "#64748b",
  accent: "#3b82f6",
} as const;

// Dark palette: neutral blue-grey, matching Obsidian's default dark theme
// feel (around #1e1e1e / #262626) rather than the very cold slate-950.
const DARK_PALETTE = {
  pageBg: "#1a1f2b",
  primary: "#222834",
  secondary: "#2a3142",
  border: "#3a4256",
  hover: "#333b4e",
  textNormal: "#e6e9ef",
  textMuted: "#9aa3b5",
  accent: "#3b82f6",
} as const;

type Palette = typeof LIGHT_PALETTE;

function applyPalette(el: HTMLElement, palette: Palette, dark: boolean): void {
  const style = el.style;
  style.colorScheme = dark ? "dark" : "light";
  style.background = palette.pageBg;
  style.color = palette.textNormal;
  style.setProperty("--background-primary", palette.primary);
  style.setProperty("--background-secondary", palette.secondary);
  style.setProperty("--background-modifier-border", palette.border);
  style.setProperty("--background-modifier-hover", palette.hover);
  style.setProperty("--text-normal", palette.textNormal);
  style.setProperty("--text-muted", palette.textMuted);
  style.setProperty("--text-on-accent", "#ffffff");
  style.setProperty("--interactive-accent", palette.accent);
}

function isObsidianDark(): boolean {
  try {
    const body = document.body;
    if (!body) return false;
    if (body.classList.contains("theme-dark")) return true;
    if (body.classList.contains("theme-light")) return false;
    // Fallback: honour the OS preference when Obsidian hasn't tagged the body.
    return (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  } catch {
    return false;
  }
}

// Track the observer so that a later applyThemeMode() call can detach the
// previous watcher (e.g. when the user switches from "system" to "dark").
interface ThemedElement extends HTMLElement {
  __obsiwealthThemeObserver?: MutationObserver;
  __obsiwealthMediaQuery?: MediaQueryList;
  __obsiwealthMediaListener?: (event: MediaQueryListEvent) => void;
}

function detachSystemWatcher(el: ThemedElement): void {
  if (el.__obsiwealthThemeObserver) {
    el.__obsiwealthThemeObserver.disconnect();
    el.__obsiwealthThemeObserver = undefined;
  }
  if (el.__obsiwealthMediaQuery && el.__obsiwealthMediaListener) {
    try {
      el.__obsiwealthMediaQuery.removeEventListener("change", el.__obsiwealthMediaListener);
    } catch {
      // older Safari fallback
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (el.__obsiwealthMediaQuery as any).removeListener?.(el.__obsiwealthMediaListener);
    }
    el.__obsiwealthMediaQuery = undefined;
    el.__obsiwealthMediaListener = undefined;
  }
}

function attachSystemWatcher(el: ThemedElement): void {
  detachSystemWatcher(el);

  // Re-apply whenever Obsidian flips the theme-dark / theme-light class on
  // <body>, so the in-view card palette stays in sync with the host UI.
  try {
    const observer = new MutationObserver(() => {
      const dark = isObsidianDark();
      applyPalette(el, dark ? DARK_PALETTE : LIGHT_PALETTE, dark);
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    el.__obsiwealthThemeObserver = observer;
  } catch {
    // no-op if DOM observer is unavailable
  }

  // Also respond to OS-level appearance changes when Obsidian itself is set
  // to follow the system (covers the edge case where <body> class doesn't
  // change but the OS preference does).
  try {
    if (typeof window !== "undefined" && window.matchMedia) {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = () => {
        const dark = isObsidianDark();
        applyPalette(el, dark ? DARK_PALETTE : LIGHT_PALETTE, dark);
      };
      try {
        mq.addEventListener("change", listener);
      } catch {
        // older Safari fallback
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mq as any).addListener?.(listener);
      }
      el.__obsiwealthMediaQuery = mq;
      el.__obsiwealthMediaListener = listener;
    }
  } catch {
    // no-op
  }
}

export function applyThemeMode(el: HTMLElement, mode: ThemeMode): void {
  const themed = el as ThemedElement;

  if (mode === "system") {
    const dark = isObsidianDark();
    applyPalette(themed, dark ? DARK_PALETTE : LIGHT_PALETTE, dark);
    attachSystemWatcher(themed);
    return;
  }

  // Fixed mode: tear down any previous watcher and pin the palette.
  detachSystemWatcher(themed);
  const dark = mode === "dark";
  applyPalette(themed, dark ? DARK_PALETTE : LIGHT_PALETTE, dark);
}

/**
 * Detach any watcher previously installed by `applyThemeMode` in "system"
 * mode. Call this from your view's `onClose` to avoid leaking observers.
 */
export function teardownThemeWatcher(el: HTMLElement): void {
  detachSystemWatcher(el as ThemedElement);
}
