import type { MainViewContext } from "../view/viewContext";
import type { PageKey } from "../view/types";
import { createNavIcon } from "./navIcon";

/**
 * Bottom-right floating navigation bar.
 *
 * Extracted from `ObsiWealthMainView.renderBottomNav` / `renderNavButton` /
 * `renderSettingsNavButton` with behaviour preserved 1:1.
 */
export function renderBottomNav(ctx: MainViewContext, el: HTMLElement): void {
  const nav = el.createDiv();
  nav.style.display = "flex";
  nav.style.alignItems = "center";
  nav.style.gap = "6px";
  // 磨砂胶囊背景：让浮动按钮组在视觉上独立于内容卡片，
  // 防止资产 / 资产图表页右下角的卡片或图表透出来与按钮"重合"。
  nav.style.padding = "6px 10px";
  nav.style.borderRadius = "999px";
  nav.style.background = "var(--background-primary)";
  nav.style.border = "1px solid var(--background-modifier-border)";
  nav.style.boxShadow = "0 8px 24px rgba(0,0,0,0.18)";
  // 现代浏览器再叠一层模糊，看起来更"漂浮"。
  nav.style.backdropFilter = "saturate(180%) blur(10px)";
  (nav.style as unknown as { webkitBackdropFilter?: string }).webkitBackdropFilter =
    "saturate(180%) blur(10px)";
  nav.style.position = "fixed";
  nav.style.right = "20px";
  nav.style.bottom = "20px";
  nav.style.width = "max-content";
  nav.style.zIndex = "20";

  renderNavButton(ctx, nav, "home", ctx.tr("home"), "home");
  renderNavButton(ctx, nav, "funds", "资金", "funds");
  renderNavButton(ctx, nav, "assets", "资产", "assets");
  renderNavButton(ctx, nav, "assetStats", "资产图表", "chart");
  renderNavButton(ctx, nav, "wishlist", ctx.tr("wishlist"), "heart");
  renderSettingsNavButton(ctx, nav);
}

function renderNavButton(
  ctx: MainViewContext,
  parent: HTMLElement,
  key: PageKey,
  label: string,
  icon: string,
): void {
  const active = ctx.currentPage === key;
  const button = parent.createEl("button");
  button.ariaLabel = label;
  button.title = label;
  button.style.width = "36px";
  button.style.height = "36px";
  button.style.border = "0";
  button.style.borderRadius = "10px";
  button.style.padding = "0";
  button.style.cursor = "pointer";
  button.style.background = "transparent";
  button.style.color = active ? "var(--interactive-accent)" : "var(--text-muted)";
  button.style.display = "flex";
  button.style.alignItems = "center";
  button.style.justifyContent = "center";
  button.style.transition = "color 0.15s, transform 0.15s";
  button.style.opacity = active ? "1" : "0.72";
  button.appendChild(createNavIcon(icon, active ? 24 : 22));
  button.onmouseenter = () => {
    button.style.opacity = "1";
    button.style.transform = "translateY(-1px)";
  };
  button.onmouseleave = () => {
    button.style.opacity = active ? "1" : "0.72";
    button.style.transform = "translateY(0)";
  };
  button.onclick = () => {
    ctx.currentPage = key;
    ctx.render();
  };
}

function renderSettingsNavButton(ctx: MainViewContext, parent: HTMLElement): void {
  const settingsButton = parent.createEl("button");
  settingsButton.ariaLabel = ctx.tr("settings");
  settingsButton.title = ctx.tr("settings");
  settingsButton.style.width = "36px";
  settingsButton.style.height = "36px";
  settingsButton.style.border = "0";
  settingsButton.style.borderRadius = "10px";
  settingsButton.style.padding = "0";
  settingsButton.style.cursor = "pointer";
  settingsButton.style.background = "transparent";
  settingsButton.style.color = "var(--text-muted)";
  settingsButton.style.display = "flex";
  settingsButton.style.alignItems = "center";
  settingsButton.style.justifyContent = "center";
  settingsButton.style.opacity = "0.72";
  settingsButton.style.transition = "color 0.15s, transform 0.15s, opacity 0.15s";
  settingsButton.appendChild(createNavIcon("settings", 22));
  settingsButton.onmouseenter = () => {
    settingsButton.style.opacity = "1";
    settingsButton.style.transform = "translateY(-1px)";
  };
  settingsButton.onmouseleave = () => {
    settingsButton.style.opacity = "0.72";
    settingsButton.style.transform = "translateY(0)";
  };
  settingsButton.onclick = () => {
    // @ts-expect-error Obsidian exposes plugin settings panes through the internal setting API.
    ctx.app.setting.open();
    // @ts-expect-error Obsidian exposes plugin settings panes through the internal setting API.
    ctx.app.setting.openTabById(ctx.plugin.manifest.id);
  };
}
