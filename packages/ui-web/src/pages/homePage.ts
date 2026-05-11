import type { MainViewContext } from "../view/viewContext";
import { renderSlotNumber } from "../components/slotNumber";

/**
 * Render the Home page: a two-column grid with two hero metrics
 * (total funds / total assets).
 *
 * Extracted from `ObsiWealthMainView.renderHomePage` without behavioural change.
 */
export function renderHomePage(ctx: MainViewContext, el: HTMLElement): void {
  const assets = ctx.plugin.assets;
  const assetTotal = ctx.getVisibleAssetTotal(assets);
  const fundTotal = ctx.getFundTotal();

  const metrics = el.createDiv();
  metrics.style.display = "grid";
  metrics.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
  metrics.style.gap = "16px";
  metrics.style.marginBottom = "18px";

  renderHomeMetric(metrics, "资金", ctx.displayCurrency(fundTotal));
  renderHomeMetric(metrics, "资产", ctx.displayCurrency(assetTotal));
}

function renderHomeMetric(parent: HTMLElement, label: string, value: string): void {
  const item = parent.createDiv();
  item.style.padding = "28px 22px";
  item.style.borderRadius = "22px";
  item.style.background = "var(--background-primary)";
  item.style.border = "1px solid var(--background-modifier-border)";
  item.style.boxShadow = "0 10px 24px rgba(0,0,0,0.08)";
  item.style.display = "flex";
  item.style.flexDirection = "column";
  item.style.alignItems = "center";
  item.style.justifyContent = "center";
  item.style.textAlign = "center";
  item.style.gap = "12px";

  const labelEl = item.createDiv({ text: label });
  labelEl.style.fontSize = "24px";
  labelEl.style.fontWeight = "950";
  labelEl.style.letterSpacing = "0.04em";
  labelEl.style.color = "var(--text-muted)";

  const valueEl = item.createDiv();
  valueEl.style.fontSize = "38px";
  valueEl.style.fontWeight = "950";
  valueEl.style.lineHeight = "1.05";
  valueEl.style.color = "var(--text-normal)";
  valueEl.style.display = "flex";
  valueEl.style.justifyContent = "center";
  valueEl.style.width = "100%";

  const slotWrap = valueEl.createDiv();
  renderSlotNumber(slotWrap, value);
}
