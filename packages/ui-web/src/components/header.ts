import type { MainViewContext } from "../view/viewContext";
import { createNavIcon } from "./navIcon";

/**
 * Top header strip with the page title and the right-aligned controls:
 * privacy toggle, plus the per-page column +/- buttons.
 *
 * Extracted from `ObsiWealthMainView.renderHeader` and its helpers with no
 * behavioural change.
 */
export function renderHeader(ctx: MainViewContext, el: HTMLElement): void {
  const header = el.createDiv();
  header.style.display = "flex";
  header.style.justifyContent = "space-between";
  header.style.alignItems = "center";
  header.style.marginBottom = "12px";

  header.createEl("h2", { text: ctx.tr("appTitle") });

  const control = header.createDiv();
  control.style.display = "flex";
  control.style.alignItems = "center";
  control.style.gap = "8px";

  createPrivacyToggleButton(ctx, control);

  if (ctx.currentPage === "assets") {
    createHomeColumnButton(ctx, control, "-", 1);
    createHomeColumnButton(ctx, control, "+", -1);
  } else if (ctx.currentPage === "assetStats") {
    createStatsTrendColumnButton(ctx, control, "-", 2);
    createStatsTrendColumnButton(ctx, control, "+", 1);
  }
}

function createPrivacyToggleButton(ctx: MainViewContext, parent: HTMLElement): void {
  const button = parent.createEl("button");
  button.title = ctx.hideMoney ? "显示金额" : "隐藏金额";
  button.ariaLabel = button.title;
  button.style.border = "0";
  button.style.borderRadius = "10px";
  button.style.width = "34px";
  button.style.height = "34px";
  button.style.padding = "0";
  button.style.cursor = "pointer";
  button.style.background = "transparent";
  button.style.color = "var(--text-muted)";
  button.style.display = "flex";
  button.style.alignItems = "center";
  button.style.justifyContent = "center";
  button.style.opacity = "0.82";
  button.style.transition = "opacity 0.15s, transform 0.15s";
  button.appendChild(createNavIcon(ctx.hideMoney ? "eyeOff" : "eye", 22));
  button.onmouseenter = () => {
    button.style.opacity = "1";
    button.style.transform = "translateY(-1px)";
  };
  button.onmouseleave = () => {
    button.style.opacity = "0.82";
    button.style.transform = "translateY(0)";
  };
  button.onclick = () => {
    ctx.hideMoney = !ctx.hideMoney;
    ctx.render();
  };
}

function createHomeColumnButton(
  ctx: MainViewContext,
  parent: HTMLElement,
  text: string,
  delta: number,
): void {
  const button = parent.createEl("button", { text });
  button.title = delta < 0 ? "放大主页卡片" : "缩小主页卡片";

  button.onclick = () => {
    ctx.cols = Math.min(4, Math.max(1, ctx.cols + delta));
    ctx.render();
  };
}

function createStatsTrendColumnButton(
  ctx: MainViewContext,
  parent: HTMLElement,
  text: string,
  cols: number,
): void {
  const button = parent.createEl("button", { text });
  button.title = cols === 1 ? "放大趋势卡片为一行一个" : "缩小趋势卡片为一行两个";

  button.onclick = () => {
    ctx.statsTrendCols = cols;
    ctx.render();
  };
}
