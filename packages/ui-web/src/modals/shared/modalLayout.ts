/**
 * Shared layout primitives for detail modals.
 *
 * Extracts three recurring structures seen across `fundDetailModal` and
 * `assetDetailModal`:
 *
 *  1. `createSurfaceCard`      — the "var(--background-secondary) + border +
 *                                 14px radius + padding" chip used everywhere
 *                                 from balance bars to accessory cards.
 *  2. `createSection`          — a small grey section title followed by an
 *                                 empty `<div>` body for child layout.
 *  3. `createSectionHeaderWithCount` — title + optional count + right slot,
 *                                 mirrors fundDetailModal "操作记录 N 条 +".
 *  4. `createLabelValueCard`   — label/value stacked pair boxed in a surface
 *                                 card, used by metrics + detail items.
 *
 * The helpers only emit DOM + inline styles; behaviour is unchanged from the
 * hand-written originals.
 */

// ---------------------------------------------------------------------------
// Surface card (rounded rect with secondary background + border)
// ---------------------------------------------------------------------------

export interface SurfaceCardOptions {
  padding?: string;
  borderRadius?: string;
  background?: string;
  border?: string;
  /** Extra inline styles applied after the defaults. */
  style?: Partial<CSSStyleDeclaration>;
}

export function createSurfaceCard(parent: HTMLElement, options?: SurfaceCardOptions): HTMLDivElement {
  const card = parent.createDiv();
  card.style.padding = options?.padding ?? "10px 12px";
  card.style.borderRadius = options?.borderRadius ?? "12px";
  card.style.background = options?.background ?? "var(--background-secondary)";
  card.style.border = options?.border ?? "1px solid var(--background-modifier-border)";
  if (options?.style) {
    Object.assign(card.style, options.style);
  }
  return card;
}

// ---------------------------------------------------------------------------
// Section title + body
// ---------------------------------------------------------------------------

/**
 * Renders a small grey section title and returns the body `<div>` where
 * children should be appended. Matches `assetDetailModal.createSection`.
 */
export function createSection(contentEl: HTMLElement, title: string): HTMLDivElement {
  const titleEl = contentEl.createDiv();
  titleEl.innerText = title;
  titleEl.style.fontSize = "13px";
  titleEl.style.fontWeight = "700";
  titleEl.style.color = "var(--text-muted)";
  titleEl.style.margin = "18px 0 8px";
  return contentEl.createDiv();
}

// ---------------------------------------------------------------------------
// Section header with optional count + right slot
// ---------------------------------------------------------------------------

export interface SectionHeaderOptions {
  title: string;
  /** Secondary muted count string (e.g. "3 条"). Shown next to the title. */
  count?: string;
  /** Margin shorthand. Default "6px 0 8px". */
  margin?: string;
}

/**
 * Renders a horizontal header `<div>` containing a title (and optional count),
 * and returns the header element so the caller can append a right-aligned
 * action button into it.
 */
export function createSectionHeaderWithCount(
  contentEl: HTMLElement,
  options: SectionHeaderOptions,
): HTMLDivElement {
  const header = contentEl.createDiv();
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.justifyContent = "space-between";
  header.style.margin = options.margin ?? "6px 0 8px";

  const titleWrap = header.createDiv();
  titleWrap.style.display = "flex";
  titleWrap.style.alignItems = "baseline";
  titleWrap.style.gap = "6px";

  const title = titleWrap.createDiv({ text: options.title });
  title.style.fontSize = "13px";
  title.style.fontWeight = "800";
  title.style.color = "var(--text-muted)";

  if (options.count !== undefined) {
    const countEl = titleWrap.createDiv({ text: options.count });
    countEl.style.fontSize = "12px";
    countEl.style.fontWeight = "800";
    countEl.style.color = "var(--text-muted)";
    countEl.style.opacity = "0.7";
    countEl.style.fontVariantNumeric = "tabular-nums";
  }

  return header;
}

// ---------------------------------------------------------------------------
// Label + value stacked card
// ---------------------------------------------------------------------------

export interface LabelValueCardOptions {
  label: string;
  value: string;
  /** Default 14px (detail items). Pass 16px for metric cards. */
  valueFontSize?: string;
  /** Default 600. */
  valueFontWeight?: string;
  /** Optional value color override (defaults to --text-normal). */
  valueColor?: string;
}

/**
 * Creates a surface-card containing a small muted label over a prominent
 * value string. Used by `assetDetailModal.renderMetric` and
 * `assetDetailModal.renderDetailItem` (they differ only in value font size).
 */
export function createLabelValueCard(
  parent: HTMLElement,
  options: LabelValueCardOptions,
): HTMLDivElement {
  const item = createSurfaceCard(parent);

  const labelEl = item.createDiv();
  labelEl.innerText = options.label;
  labelEl.style.fontSize = "12px";
  labelEl.style.color = "var(--text-muted)";
  labelEl.style.marginBottom = "6px";

  const valueEl = item.createDiv();
  valueEl.innerText = options.value;
  valueEl.style.fontSize = options.valueFontSize ?? "14px";
  valueEl.style.fontWeight = options.valueFontWeight ?? "600";
  if (options.valueColor) {
    valueEl.style.color = options.valueColor;
  } else if (options.valueFontSize === "16px") {
    // metric cards originally set color explicitly
    valueEl.style.color = "var(--text-normal)";
  }
  return item;
}
