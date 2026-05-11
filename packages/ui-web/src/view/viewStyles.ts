import type { MainViewContext } from "./viewContext";
import { createNavIcon } from "../components/navIcon";

/**
 * Visual primitives shared across the main view's pages / components.
 *
 * Everything in this file is a pure DOM-styling function. Helpers that need
 * to read or mutate view state take a `MainViewContext` so they can work
 * through the same facade the page modules use.
 *
 * Extracted from `ObsiWealthMainView` without behavioural change.
 */

// ---------------------------------------------------------------------------
// Card / layout primitives
// ---------------------------------------------------------------------------

export function applyCardStyle(card: HTMLElement): void {
  card.style.position = "relative";
  card.style.display = "flex";
  card.style.alignItems = "center";
  card.style.justifyContent = "space-between";
  card.style.gap = "24px";
  card.style.padding = "18px 21px";
  card.style.minHeight = "132px";
  card.style.borderRadius = "21px";
  card.style.background = "var(--background-secondary)";
  card.style.border = "1px solid var(--background-modifier-border)";
  card.style.boxShadow = "0 4px 14px rgba(0,0,0,0.08)";
  card.style.cursor = "pointer";
}

export function applyGridStyle(ctx: MainViewContext, grid: HTMLElement): void {
  grid.style.display = "grid";
  // 每列最小 660px：资产卡片内一行 nowrap 内容可能很长
  //   padding(42) + icon(96) + gap(24) + center 文字(最长约 340) + gap(24) + 状态徽章(~120) ≈ 646
  // page 的 minWidth 保证虚拟画布总宽足够撑下 cols 列，然后
  // ResponsiveZoomController 的 zoom 视觉上等比缩回面板宽度。
  grid.style.gridTemplateColumns = `repeat(${ctx.cols}, minmax(660px, 1fr))`;
  grid.style.rowGap = "16px";
  grid.style.columnGap = "12px";
}

export function applyStickyTop(card: HTMLElement): void {
  card.style.position = "sticky";
  card.style.top = "0";
  card.style.zIndex = "5";
}

export function createStatsHeroCard(el: HTMLElement, title: string): HTMLElement {
  const card = el.createDiv();
  card.style.padding = "24px";
  card.style.marginBottom = "18px";
  card.style.borderRadius = "24px";
  card.style.background = "linear-gradient(145deg, var(--background-secondary), var(--background-primary))";
  card.style.border = "1px solid var(--background-modifier-border)";
  card.style.boxShadow = "0 16px 38px rgba(0,0,0,0.14)";
  card.style.width = "100%";
  card.style.boxSizing = "border-box";
  card.style.overflow = "hidden";

  const titleEl = card.createDiv();
  titleEl.innerText = title;
  titleEl.style.fontSize = "22px";
  titleEl.style.fontWeight = "950";
  titleEl.style.letterSpacing = "0.01em";
  titleEl.style.color = "var(--text-normal)";
  titleEl.style.marginBottom = "18px";

  return card;
}

/**
 * A collapsible "stats" card used by the stats page.
 * Collapse state is stored on the view (via `ctx.collapsedStatsCards`) and
 * toggling re-renders via `ctx.render()`.
 */
export function createStatsCard(ctx: MainViewContext, el: HTMLElement, title: string): HTMLElement {
  const card = el.createDiv();
  card.style.padding = "22px";
  card.style.marginBottom = "18px";
  card.style.borderRadius = "22px";
  card.style.background = "linear-gradient(145deg, var(--background-secondary), var(--background-primary))";
  card.style.border = "1px solid var(--background-modifier-border)";
  card.style.boxShadow = "0 14px 34px rgba(0,0,0,0.12)";
  card.style.alignSelf = "stretch";
  card.style.height = "100%";
  card.style.boxSizing = "border-box";
  card.style.overflow = "hidden";

  const header = card.createDiv();
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.justifyContent = "space-between";
  header.style.cursor = "pointer";
  header.style.gap = "14px";

  const titleEl = header.createDiv();
  titleEl.innerText = title;
  titleEl.style.fontSize = "22px";
  titleEl.style.fontWeight = "900";
  titleEl.style.letterSpacing = "0.01em";
  titleEl.style.color = "var(--text-normal)";

  const collapsed = ctx.collapsedStatsCards.has(title);
  const toggle = header.createDiv();
  toggle.innerText = collapsed ? "▸" : "▾";
  toggle.style.color = "var(--text-muted)";
  toggle.style.fontSize = "22px";
  toggle.style.fontWeight = "900";

  const body = card.createDiv();
  body.style.marginTop = "18px";
  body.style.display = collapsed ? "none" : "block";
  body.style.height = collapsed ? "auto" : "calc(100% - 48px)";

  header.onclick = () => {
    if (ctx.collapsedStatsCards.has(title)) {
      ctx.collapsedStatsCards.delete(title);
    } else {
      ctx.collapsedStatsCards.add(title);
    }
    ctx.render();
  };

  return body;
}

/**
 * A lighter card variant used by the funds page's right-side stats column.
 *
 * The returned body element also carries two hidden references so callers can
 * inject controls (range picker, granularity toggle, …) directly into the
 * card header – to the left of the collapse chevron – via
 * {@link mountFundStatsHeaderExtra}. This keeps the controls at a consistent
 * position and size across every fund stats card.
 */
export function createFundStatsCard(ctx: MainViewContext, el: HTMLElement, title: string): HTMLElement {
  const card = el.createDiv();
  card.style.padding = "8px 2px 10px";
  card.style.marginBottom = "12px";
  card.style.alignSelf = "stretch";
  card.style.height = "100%";
  card.style.boxSizing = "border-box";

  const header = card.createDiv();
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.justifyContent = "space-between";
  header.style.cursor = "pointer";
  header.style.gap = "14px";
  header.style.padding = "0 2px";

  const titleEl = header.createDiv();
  titleEl.innerText = title;
  titleEl.style.fontSize = "23px";
  titleEl.style.fontWeight = "950";
  titleEl.style.letterSpacing = "0.01em";
  titleEl.style.color = "var(--text-normal)";

  // Right-side group: [extra slot] [collapse toggle]. Having them in a shared
  // flex container means injected controls always sit to the LEFT of the
  // chevron with a consistent gap.
  const rightGroup = header.createDiv();
  rightGroup.style.display = "flex";
  rightGroup.style.alignItems = "center";
  rightGroup.style.gap = "8px";

  const extraSlot = rightGroup.createDiv();
  extraSlot.style.display = "flex";
  extraSlot.style.alignItems = "center";
  extraSlot.style.gap = "8px";

  const collapsed = ctx.collapsedStatsCards.has(title);
  const toggle = rightGroup.createDiv();
  toggle.innerText = collapsed ? "▸" : "▾";
  toggle.style.color = "var(--text-muted)";
  toggle.style.fontSize = "22px";
  toggle.style.fontWeight = "900";

  const body = card.createDiv();
  body.style.marginTop = "14px";
  body.style.display = collapsed ? "none" : "block";
  body.style.height = collapsed ? "auto" : "auto";

  header.onclick = () => {
    if (ctx.collapsedStatsCards.has(title)) {
      ctx.collapsedStatsCards.delete(title);
    } else {
      ctx.collapsedStatsCards.add(title);
    }
    ctx.render();
  };

  // Expose header/slot so callers can mount extras without extra plumbing.
  (body as FundStatsBody).__cardHeader = header;
  (body as FundStatsBody).__cardExtraSlot = extraSlot;

  return body;
}

interface FundStatsBody extends HTMLElement {
  __cardHeader?: HTMLElement;
  __cardExtraSlot?: HTMLElement;
}

/**
 * Mount a control (range picker, granularity toggle, …) into the fund stats
 * card's header, to the left of the collapse chevron. Clicks on the control
 * are prevented from bubbling to the header (which would toggle collapse).
 *
 * Returns `true` when mounting succeeded; returns `false` when `body` is not
 * a fund stats card body (so callers can fall back to their legacy layout).
 */
export function mountFundStatsHeaderExtra(body: HTMLElement, el: HTMLElement): boolean {
  const slot = (body as FundStatsBody).__cardExtraSlot;
  if (!slot) {
    return false;
  }
  el.addEventListener("click", (event) => event.stopPropagation());
  el.addEventListener("mousedown", (event) => event.stopPropagation());
  slot.appendChild(el);
  return true;
}

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------

export function createActionButton(
  parent: HTMLElement,
  text: string,
  title: string,
  onClick: () => void | Promise<void>,
  danger = false,
): HTMLElement {
  const button = parent.createDiv({ text });
  button.title = title;
  button.style.width = "30px";
  button.style.height = "30px";
  button.style.display = "flex";
  button.style.alignItems = "center";
  button.style.justifyContent = "center";
  button.style.borderRadius = "999px";
  button.style.border = "1px solid var(--background-modifier-border)";
  button.style.background = danger ? "#fee2e2" : "var(--background-primary)";
  button.style.color = danger ? "#dc2626" : "var(--text-normal)";
  button.style.cursor = "pointer";
  button.style.fontSize = "17px";
  button.style.fontWeight = "950";
  button.style.opacity = "0.86";
  button.style.boxShadow = "0 6px 14px rgba(0,0,0,0.14)";

  button.onmouseover = () => {
    button.style.opacity = "1";
    button.style.transform = "translateY(-1px)";
  };

  button.onmouseout = () => {
    button.style.opacity = "0.86";
    button.style.transform = "";
  };

  button.onclick = async (event) => {
    event.stopPropagation();
    await onClick();
  };

  return button;
}

export function applyToolbarBtnStyle(
  btn: HTMLButtonElement,
  style: "ghost" | "accent" | "danger",
  disabled = false,
): void {
  btn.style.display = "inline-flex";
  btn.style.alignItems = "center";
  btn.style.justifyContent = "center";
  btn.style.gap = "6px";
  btn.style.height = "34px";
  btn.style.minWidth = "34px";
  btn.style.padding = btn.childElementCount > 0 ? "0 10px" : "0 14px";
  btn.style.borderRadius = "10px";
  btn.style.fontSize = "13px";
  btn.style.fontWeight = "900";
  btn.style.cursor = disabled ? "not-allowed" : "pointer";
  btn.style.transition = "background 0.15s, color 0.15s, transform 0.15s, border-color 0.15s";
  btn.style.boxShadow = "none";

  if (style === "accent") {
    btn.style.border = "1px solid var(--interactive-accent)";
    btn.style.background = "var(--interactive-accent)";
    btn.style.color = "var(--text-on-accent)";
  } else if (style === "danger") {
    btn.style.border = `1px solid ${disabled ? "var(--background-modifier-border)" : "#ef4444"}`;
    btn.style.background = disabled ? "var(--background-primary)" : "#ef4444";
    btn.style.color = disabled ? "var(--text-muted)" : "#fff";
  } else {
    btn.style.border = "1px solid var(--background-modifier-border)";
    btn.style.background = "var(--background-primary)";
    btn.style.color = "var(--text-normal)";
  }
}

export function createFundToolbarButton(
  parent: HTMLElement,
  iconName: string,
  tip: string,
  style: "ghost" | "accent" | "danger",
): HTMLButtonElement {
  const btn = parent.createEl("button");
  btn.title = tip;
  btn.ariaLabel = tip;
  btn.appendChild(createNavIcon(iconName, 18));
  applyToolbarBtnStyle(btn, style);
  return btn;
}

// ---------------------------------------------------------------------------
// Empty chart placeholder
// ---------------------------------------------------------------------------

export function renderEmptyChart(ctx: MainViewContext, parent: HTMLElement): void {
  const empty = parent.createDiv();
  empty.innerText = ctx.tr("emptyChart");
  empty.style.height = "160px";
  empty.style.display = "flex";
  empty.style.alignItems = "center";
  empty.style.justifyContent = "center";
  empty.style.color = "var(--text-muted)";
  empty.style.fontSize = "16px";
  empty.style.fontWeight = "900";
  empty.style.borderRadius = "18px";
  empty.style.background = "var(--background-primary)";
  empty.style.border = "1px solid var(--background-modifier-border)";
}

// ---------------------------------------------------------------------------
// Stats granularity toggle (used by "资产分布" / "资金分布" / "资金排行榜")
// ---------------------------------------------------------------------------

/**
 * Render a two-state pill button that flips `ctx.statsGranularity` between
 * `"category"` (aggregate by category) and `"item"` (one entry per account).
 *
 * The helper is intentionally small: callers pass the body of their own
 * stats card, we take care of positioning (right-aligned) and re-render.
 */
export function renderStatsGranularityToggle(ctx: MainViewContext, body: HTMLElement): HTMLElement {
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.title = "切换汇总 / 详细";
  applyFundStatsPillStyle(toggle);

  const syncLabel = () => {
    toggle.innerText = ctx.statsGranularity === "item" ? "详细" : "汇总";
  };
  syncLabel();

  toggle.onclick = (event) => {
    event.stopPropagation();
    ctx.statsGranularity = ctx.statsGranularity === "item" ? "category" : "item";
    ctx.render();
  };

  // Prefer the fund stats card header slot (aligned with the trend range
  // picker, always to the left of the collapse chevron). Fall back to the
  // legacy in-body layout for callers that don't use createFundStatsCard
  // (e.g. the stats page's asset category donut).
  if (mountFundStatsHeaderExtra(body, toggle)) {
    return toggle;
  }

  const bar = body.createDiv();
  bar.style.display = "flex";
  bar.style.justifyContent = "flex-end";
  bar.style.alignItems = "center";
  bar.style.marginBottom = "6px";
  bar.appendChild(toggle);
  return bar;
}

/**
 * Shared style for the small pill-shaped controls placed in the fund stats
 * card header (range picker, granularity toggle). Keeping a single helper
 * guarantees all three pickers have the same size and border.
 */
export function applyFundStatsPillStyle(el: HTMLElement): void {
  el.style.display = "inline-flex";
  el.style.alignItems = "center";
  el.style.justifyContent = "center";
  el.style.height = "32px";
  // A shared minWidth guarantees "最近" / "全部" / "汇总" / "详细"
  // (all 2中-char labels) render in identical-sized boxes, so the three
  // pickers line up visually regardless of which tab is active.
  el.style.minWidth = "66px";
  el.style.boxSizing = "border-box";
  el.style.margin = "0";
  el.style.padding = "0 12px";
  el.style.fontSize = "14px";
  el.style.fontWeight = "900";
  el.style.lineHeight = "1";
  el.style.borderRadius = "6px";
  el.style.border = "1px solid var(--background-modifier-border)";
  el.style.background = "var(--background-primary)";
  el.style.color = "var(--text-normal)";
  el.style.cursor = "pointer";
  el.style.userSelect = "none";
  el.style.whiteSpace = "nowrap";
  // Flat look: no drop shadow, no browser focus outline.
  el.style.boxShadow = "none";
  el.style.outline = "none";
}
