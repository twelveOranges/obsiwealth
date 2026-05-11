/**
 * Shared button factories for modal dialogs.
 *
 * Four flavours, matching every hand-written button across asset/fund modals:
 *
 *  1. `createIconButton`  — 34px circular button with an SVG or emoji icon
 *                           (edit/close buttons pinned to modal corners).
 *  2. `createPillButton`  — capsule CTA button (primary / ghost variants),
 *                           used in inline dialogs and the "更新余额" chip.
 *  3. `createFullWidthDeleteButton` — full-width rounded-rect red button
 *                           stacked at the bottom of detail modals.
 *  4. `createCircleAddButton` — 26px circular "+" button with a line-art svg
 *                           used next to section titles.
 *
 * All factories return the button element so the caller can attach an onclick
 * handler (and further tweak styles if needed).
 *
 * Behaviour is a 1:1 extraction of the previously duplicated `<button>`
 * blocks — no visual changes.
 */

// ---------------------------------------------------------------------------
// 34px circular icon button (corner edit button)
// ---------------------------------------------------------------------------

export interface IconButtonOptions {
  ariaLabel: string;
  /**
   * Either a DOM node to append (SVG icon) OR a plain text string (emoji).
   * When a string is passed it becomes the button's text content, and the
   * default font-size is tuned to 16px so emoji render properly.
   */
  content: SVGElement | HTMLElement | string;
  /** Pin to a corner. When set, the button is position:absolute. */
  corner?: "top-right";
  /** Tint for the icon (stroke color via `color`). Default: var(--text-muted). */
  color?: string;
  /** Diameter in px. Default 34. */
  size?: number;
}

export function createIconButton(parent: HTMLElement, options: IconButtonOptions): HTMLButtonElement {
  const button = parent.createEl("button");
  button.ariaLabel = options.ariaLabel;
  const size = options.size ?? 34;

  if (options.corner === "top-right") {
    button.style.position = "absolute";
    button.style.top = "0";
    button.style.right = "0";
  }

  button.style.width = `${size}px`;
  button.style.height = `${size}px`;
  button.style.borderRadius = "999px";
  button.style.padding = "0";
  button.style.cursor = "pointer";
  button.style.display = "flex";
  button.style.alignItems = "center";
  button.style.justifyContent = "center";

  if (typeof options.content === "string") {
    button.setText(options.content);
    button.style.fontSize = "16px";
  } else {
    button.appendChild(options.content);
    button.style.color = options.color ?? "var(--text-muted)";
  }

  return button;
}

// ---------------------------------------------------------------------------
// Pill / capsule button (primary CTA or ghost/secondary)
// ---------------------------------------------------------------------------

export type PillVariant = "primary" | "ghost";

export interface PillButtonOptions {
  text: string;
  variant?: PillVariant;
  /** Custom padding; defaults match the dominant look ("7px 16px"). */
  padding?: string;
}

export function createPillButton(parent: HTMLElement, options: PillButtonOptions): HTMLButtonElement {
  const button = parent.createEl("button", { text: options.text });
  const variant = options.variant ?? "primary";

  button.style.padding = options.padding ?? "7px 16px";
  button.style.borderRadius = "999px";
  button.style.cursor = "pointer";
  button.style.whiteSpace = "nowrap";

  if (variant === "primary") {
    button.style.border = "1px solid var(--interactive-accent)";
    button.style.background = "var(--interactive-accent)";
    button.style.color = "var(--text-on-accent)";
    button.style.fontWeight = "900";
  }
  // ghost: rely on Obsidian's default button styling (no overrides)

  return button;
}

// ---------------------------------------------------------------------------
// Full-width rounded-rect red delete button
// ---------------------------------------------------------------------------

export interface FullWidthDeleteButtonOptions {
  ariaLabel: string;
  /** Marginal offset from the previous section. Default 18px. */
  marginTop?: number;
  /**
   * Primary content. When a string is passed the button shows plain text
   * (emoji-safe). When a DOM node is passed the button becomes a flex row
   * with the icon on the left and the `text` (if provided) on the right.
   */
  icon?: SVGElement | HTMLElement;
  text?: string;
  /** When only emoji is needed (assetDetailModal), pass plain text here. */
  plainText?: string;
  /** Optional explicit fontSize override; default 15px for text, 18px for emoji. */
  fontSize?: string;
}

export function createFullWidthDeleteButton(
  parent: HTMLElement,
  options: FullWidthDeleteButtonOptions,
): HTMLButtonElement {
  const wrapper = parent.createDiv();
  wrapper.style.marginTop = `${options.marginTop ?? 18}px`;

  const button = wrapper.createEl("button");
  button.ariaLabel = options.ariaLabel;
  button.style.width = "100%";
  button.style.padding = "10px 14px";
  button.style.borderRadius = "12px";
  button.style.cursor = "pointer";
  button.style.background = "var(--background-modifier-error)";
  button.style.color = "var(--text-on-accent)";

  if (options.plainText !== undefined) {
    // Emoji / plain text form (assetDetailModal 🗑️)
    button.setText(options.plainText);
    button.style.fontSize = options.fontSize ?? "18px";
    return button;
  }

  // Icon + label form (fundDetailModal)
  button.style.fontSize = options.fontSize ?? "15px";
  button.style.fontWeight = "900";
  button.style.display = "flex";
  button.style.alignItems = "center";
  button.style.justifyContent = "center";
  button.style.gap = "8px";

  if (options.icon) {
    // Align icon color with the button's foreground
    options.icon.setAttribute("stroke", "currentColor");
    button.appendChild(options.icon);
  }
  if (options.text !== undefined) {
    const span = button.createSpan({ text: options.text });
    span.style.lineHeight = "1";
  }

  return button;
}

// ---------------------------------------------------------------------------
// Small circular "+" add button (section header "新增记录")
// ---------------------------------------------------------------------------

export interface CircleAddButtonOptions {
  ariaLabel: string;
  /** Diameter. Default 26. */
  size?: number;
  /** Inner SVG size. Default 16. */
  iconSize?: number;
}

export function createCircleAddButton(
  parent: HTMLElement,
  options: CircleAddButtonOptions,
): HTMLButtonElement {
  const button = parent.createEl("button");
  button.ariaLabel = options.ariaLabel;
  const size = options.size ?? 26;
  const iconSize = options.iconSize ?? 16;

  button.style.width = `${size}px`;
  button.style.height = `${size}px`;
  button.style.borderRadius = "999px";
  button.style.padding = "0";
  button.style.cursor = "pointer";
  button.style.display = "flex";
  button.style.alignItems = "center";
  button.style.justifyContent = "center";
  button.style.border = "1px solid var(--background-modifier-border)";
  button.style.background = "var(--background-secondary)";
  button.style.color = "var(--text-normal)";

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", String(iconSize));
  svg.setAttribute("height", String(iconSize));
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  ["M12 5v14", "M5 12h14"].forEach((d) => {
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", d);
    svg.appendChild(p);
  });
  button.appendChild(svg);

  return button;
}
