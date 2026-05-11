import type { MainViewContext } from "../view/viewContext";
import type { Asset } from "@core/types";
import { getNetAssetCost } from "@core/calc/assetMath";
import { describeDonutSlice } from "./chartAxis";
import { renderStatsGranularityToggle } from "../view/viewStyles";

/**
 * Normalised donut slice + legend entry.
 */
interface DonutItem {
  name: string;
  value: number;
  color: string;
}

/**
 * Append slice paths for the given items to the provided SVG.
 *
 * Shared by the funds and category donut cards.
 */
function appendDonutSlices(svg: SVGElement, items: DonutItem[], total: number): void {
  let startAngle = -90;
  items.forEach((item) => {
    const angle = (item.value / total) * 360;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", describeDonutSlice(120, 120, 108, 66, startAngle, startAngle + angle));
    path.setAttribute("fill", item.color);
    svg.appendChild(path);
    startAngle += angle;
  });
}

/**
 * Append a single legend row (colour dot, name, percentage, value).
 *
 * `showValue=false` omits the trailing currency column – used by the fund
 * distribution donut where the user only wants to see the percentage in the
 * legend.
 */
function appendLegendRow(
  ctx: MainViewContext,
  legend: HTMLElement,
  item: DonutItem,
  percent: number,
  showValue: boolean = true,
): void {
  const row = legend.createDiv();
  row.style.display = "grid";
  // name 列用 minmax(0, 120px)：CSS Grid 会让所有行共享同一列宽（取最长 name
  // 宽度与 120px 的较小值）。因此多行 percent 起点在同一竖线 → 列对齐；
  // 列间隙收紧到 4px，整体更紧凑、减少中间留白。
  row.style.gridTemplateColumns = showValue
    ? "12px minmax(0, 120px) 52px minmax(0, 1fr)"
    : "12px minmax(0, 120px) 52px";
  row.style.alignItems = "center";
  row.style.columnGap = "4px";
  row.style.padding = "0";
  row.style.background = "transparent";
  row.style.border = "0";
  row.style.boxShadow = "none";
  row.style.width = "100%";

  const dot = row.createSpan();
  dot.style.width = "10px";
  dot.style.height = "10px";
  dot.style.borderRadius = "999px";
  dot.style.background = item.color;
  dot.style.flexShrink = "0";

  const nameEl = row.createDiv({ text: item.name });
  nameEl.style.fontSize = "16px";
  nameEl.style.fontWeight = "900";
  nameEl.style.color = "var(--text-normal)";
  nameEl.style.overflow = "hidden";
  nameEl.style.textOverflow = "ellipsis";
  nameEl.style.whiteSpace = "nowrap";
  nameEl.style.textAlign = "left";
  nameEl.style.minWidth = "0";

  const percentEl = row.createDiv();
  percentEl.style.fontSize = "15px";
  percentEl.style.fontWeight = "900";
  percentEl.style.color = "var(--text-muted)";
  // 左对齐 → 所有行的 percent 数字从同一竖线开始对齐
  percentEl.style.textAlign = "left";
  percentEl.style.whiteSpace = "nowrap";
  percentEl.style.display = "flex";
  percentEl.style.justifyContent = "flex-start";
  ctx.renderSlotNumber(percentEl.createDiv(), `${percent}%`);

  if (!showValue) {
    return;
  }

  const valueEl = row.createDiv();
  valueEl.style.fontSize = "15px";
  valueEl.style.fontWeight = "900";
  valueEl.style.color = "var(--text-normal)";
  valueEl.style.textAlign = "right";
  valueEl.style.display = "flex";
  valueEl.style.justifyContent = "flex-end";
  valueEl.style.whiteSpace = "nowrap";
  ctx.renderSlotNumber(valueEl.createDiv(), ctx.displayCurrency(item.value));
}

/**
 * Create the responsive two-column wrapper shared by donut cards
 * (chart on the left, legend on the right).
 */
function createDonutLayout(card: HTMLElement): { wrap: HTMLElement; chartWrap: HTMLElement; legend: HTMLElement } {
  const wrap = card.createDiv();
  wrap.style.display = "grid";
  // chart 列 ~320px、legend 列 ≥ 220px 才能放下：色块 12 + name 120 + percent 52
  // + value 自适应 + 3 个 4px 间隙。legend 列上限略收紧以减少中间留白。
  wrap.style.gridTemplateColumns = "minmax(320px, 1fr) minmax(220px, 1fr)";
  wrap.style.alignItems = "center";
  wrap.style.gap = "14px";
  wrap.style.minHeight = "340px";

  const chartWrap = wrap.createDiv();
  chartWrap.style.display = "flex";
  chartWrap.style.alignItems = "center";
  chartWrap.style.justifyContent = "center";
  chartWrap.style.minHeight = "320px";

  const legend = wrap.createDiv();
  legend.style.display = "flex";
  legend.style.flexDirection = "column";
  legend.style.alignSelf = "center";
  legend.style.gap = "8px";
  legend.style.width = "100%";
  legend.style.minWidth = "0";

  return { wrap, chartWrap, legend };
}

function createDonutSvg(): SVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 240 240");
  svg.setAttribute("width", "320");
  svg.setAttribute("height", "320");
  svg.style.maxWidth = "100%";
  svg.style.display = "block";
  return svg;
}

/**
 * Fund asset / liability / net-asset donut card. Middle is an HTML overlay
 * showing the total with the slot-machine animation.
 *
 * Extracted 1:1 from `ObsiWealthMainView.renderFundPieCard`.
 */
export function renderFundPieCard(
  ctx: MainViewContext,
  parent: HTMLElement,
  tab: "asset" | "liability" | "netAsset",
  label: string,
  totalValue: number,
): void {
  const card = ctx.createFundStatsCard(parent, `${label}分布`);

  // Only asset/liability tabs aggregate many accounts → granularity applies.
  // netAsset tab only ever has 2 slices (资金/负债), so skip the toggle.
  if (tab !== "netAsset") {
    renderStatsGranularityToggle(ctx, card);
  }

  const items = ctx.getFundRanking(
    tab,
    tab === "netAsset" ? "category" : ctx.statsGranularity,
  );
  const absTotal = items.reduce((sum, item) => sum + item.value, 0);

  if (items.length === 0 || absTotal <= 0) {
    ctx.renderEmptyChart(card);
    return;
  }

  const { chartWrap, legend } = createDonutLayout(card);

  // 用一个与 svg 同尺寸的内层容器，确保中间 overlay 和 svg 的圆心对齐
  const chartInner = chartWrap.createDiv();
  chartInner.style.position = "relative";
  chartInner.style.width = "320px";
  chartInner.style.height = "320px";
  chartInner.style.maxWidth = "100%";

  const svg = createDonutSvg();
  appendDonutSlices(svg, items, absTotal);
  chartInner.appendChild(svg);

  // 中间内容叠加层（HTML，支持老虎机动画）
  const centerOverlay = chartInner.createDiv();
  centerOverlay.style.position = "absolute";
  centerOverlay.style.inset = "0";
  centerOverlay.style.display = "flex";
  centerOverlay.style.flexDirection = "column";
  centerOverlay.style.alignItems = "center";
  centerOverlay.style.justifyContent = "center";
  centerOverlay.style.pointerEvents = "none";
  centerOverlay.style.gap = "6px";

  const centerLabel = centerOverlay.createDiv({ text: label });
  centerLabel.style.fontSize = "12px";
  centerLabel.style.fontWeight = "800";
  centerLabel.style.color = "var(--text-muted)";

  const centerValue = centerOverlay.createDiv();
  centerValue.style.fontSize = "18px";
  centerValue.style.fontWeight = "950";
  centerValue.style.color = tab === "liability" ? "#ef4444" : "var(--text-normal)";
  centerValue.style.display = "flex";
  centerValue.style.maxWidth = "170px";
  centerValue.style.overflow = "hidden";
  ctx.renderSlotNumber(centerValue.createDiv(), ctx.displayCurrency(totalValue));

  items.forEach((item) => {
    const percent = Math.round((item.value / absTotal) * 100);
    appendLegendRow(ctx, legend, item, percent, false);
  });
}

/**
 * Asset category donut card. Middle is native SVG text (count + label).
 *
 * Always aggregates by category — the old "汇总 / 详细" pill toggle has
 * been removed because a per-asset breakdown on the stats page duplicated
 * the card grid that already sits below and added little insight.
 */
export function renderCategoryPieCard(
  ctx: MainViewContext,
  el: HTMLElement,
  assets: Asset[],
): void {
  const card = ctx.createStatsCard(el, ctx.tr("categoryDistribution"));

  const totalValue = assets.reduce((sum, asset) => sum + getNetAssetCost(asset), 0);

  if (totalValue <= 0 || assets.length === 0) {
    ctx.renderEmptyChart(card);
    return;
  }

  const { chartWrap, legend } = createDonutLayout(card);

  const categories = ctx.getCategoryStats(assets);
  const items: DonutItem[] = categories.map((category) => ({
    name: ctx.getCategoryLabel(category.category),
    value: category.value,
    color: ctx.getCategoryColor(category.category),
  }));

  if (items.length === 0) {
    ctx.renderEmptyChart(card);
    return;
  }

  const svg = createDonutSvg();
  appendDonutSlices(svg, items, totalValue);

  const centerCount = document.createElementNS("http://www.w3.org/2000/svg", "text");
  centerCount.textContent = String(assets.length);
  centerCount.setAttribute("x", "120");
  centerCount.setAttribute("y", "115");
  centerCount.setAttribute("text-anchor", "middle");
  centerCount.setAttribute("fill", "var(--text-normal)");
  centerCount.setAttribute("font-size", "44");
  centerCount.setAttribute("font-weight", "950");
  svg.appendChild(centerCount);

  const centerLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
  centerLabel.textContent = ctx.tr("totalCount");
  centerLabel.setAttribute("x", "120");
  centerLabel.setAttribute("y", "150");
  centerLabel.setAttribute("text-anchor", "middle");
  centerLabel.setAttribute("fill", "var(--text-muted)");
  centerLabel.setAttribute("font-size", "17");
  centerLabel.setAttribute("font-weight", "900");
  svg.appendChild(centerLabel);

  chartWrap.appendChild(svg);

  items.forEach((item) => {
    const percent = totalValue > 0 ? Math.round((item.value / totalValue) * 100) : 0;
    appendLegendRow(ctx, legend, item, percent);
  });
}
