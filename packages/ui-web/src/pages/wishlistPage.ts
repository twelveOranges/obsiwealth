import type { MainViewContext } from "../view/viewContext";
import type { WishlistItem } from "@core/types";
import { WishlistModal } from "../modals/wishlistModal";
import { findIcon } from "../icons";
import { getIconPath } from "../iconResolver";
import { renderSlotNumber } from "../components/slotNumber";
import { formatAxisValue } from "../charts/chartAxis";

/**
 * Render the Wishlist page: hero total card + a responsive grid of wishlist
 * cards + an add-card button.
 *
 * Extracted 1:1 from `ObsiWealthMainView.renderWishlistPage` and its helpers.
 */
export function renderWishlistPage(ctx: MainViewContext, el: HTMLElement): void {

  const items = ctx.plugin.wishlist;
  const totalValue = items.reduce(
    (sum, item) => sum + getWishlistCurrentPrice(item) + getWishlistAccessoriesTotal(item),
    0,
  );
  const card = ctx.createStatsHeroCard(el, ctx.tr("wishlistTotal"));
  ctx.applyStickyTop(card);

  const value = card.createDiv();
  value.style.fontSize = "44px";
  value.style.fontWeight = "950";
  value.style.lineHeight = "1.05";
  value.style.color = "var(--text-normal)";
  value.style.display = "flex";
  renderSlotNumber(value.createDiv(), ctx.displayCurrency(totalValue));

  const desc = card.createDiv();
  desc.style.marginTop = "12px";
  desc.style.fontSize = "16px";
  desc.style.fontWeight = "800";
  desc.style.color = "var(--text-muted)";
  desc.style.display = "flex";
  desc.style.justifyContent = "center";
  renderSlotNumber(
    desc.createSpan(),
    items.length > 0 ? `${items.length} 个心愿` : ctx.tr("noWishlistData"),
  );

  const grid = el.createDiv();
  ctx.applyGridStyle(grid);

  items.forEach((item) => renderWishlistCard(ctx, grid, item));
  renderAddWishlistCard(ctx, grid);
}

function renderWishlistCard(ctx: MainViewContext, grid: HTMLElement, item: WishlistItem): void {
  const card = grid.createDiv();
  ctx.applyCardStyle(card);
  // 左信息列 + 右折线图列：左纵向堆叠（图标 / 名称 / 价格 / 信息），右图占据剩余空间。
  // 顶部 padding 加大，避免与右上角的「编辑/删除」按钮重叠。
  card.style.display = "grid";
  card.style.gridTemplateColumns = "minmax(220px, 0.8fr) minmax(0, 1.6fr)";
  card.style.alignItems = "stretch";
  card.style.justifyContent = "stretch";
  card.style.gap = "20px";
  card.style.padding = "48px 22px 22px 22px";
  card.style.minHeight = "260px";
  card.onclick = () => new WishlistModal(ctx.app, ctx.plugin, item).open();

  renderWishlistActions(ctx, card, item);

  // ---- 左列：图标在最上，名称 / 价格 / 信息 紧随其下 ----
  const left = card.createDiv();
  left.style.display = "flex";
  left.style.flexDirection = "column";
  left.style.alignItems = "flex-start";
  left.style.justifyContent = "flex-start";
  left.style.gap = "10px";
  left.style.minWidth = "0";

  renderWishlistIcon(ctx, left, item);

  const info = left.createDiv();
  info.style.minWidth = "0";
  info.style.maxWidth = "100%";
  info.style.display = "flex";
  info.style.flexDirection = "column";
  info.style.gap = "4px";

  const name = info.createDiv({ text: item.name });
  name.style.fontSize = "22px";
  name.style.fontWeight = "850";
  name.style.color = "var(--text-normal)";
  name.style.whiteSpace = "nowrap";
  name.style.overflow = "hidden";
  name.style.textOverflow = "ellipsis";

  const currentPrice = getWishlistCurrentPrice(item);
  const totalPrice = currentPrice + getWishlistAccessoriesTotal(item);
  const price = info.createDiv();
  price.style.fontSize = "28px";
  price.style.fontWeight = "950";
  price.style.color = "var(--text-normal)";
  price.style.display = "flex";
  renderSlotNumber(price.createSpan(), ctx.displayCurrency(totalPrice));

  const meta = info.createDiv();
  meta.style.fontSize = "13px";
  meta.style.fontWeight = "800";
  meta.style.color = "var(--text-muted)";
  meta.style.display = "flex";
  renderSlotNumber(
    meta.createSpan(),
    `${item.priceHistory.length} 条价格 · ${(item.accessories ?? []).length} 个附加物品`,
  );

  // ---- 右列：折线趋势图，上下沾满 ----
  const chartCol = card.createDiv();
  chartCol.style.display = "flex";
  chartCol.style.alignItems = "stretch";
  chartCol.style.justifyContent = "stretch";
  chartCol.style.minWidth = "0";
  renderWishlistTrendChart(ctx, chartCol, item);
}

function renderWishlistActions(ctx: MainViewContext, card: HTMLElement, item: WishlistItem): void {
  const actions = card.createDiv();
  actions.style.position = "absolute";
  actions.style.top = "6px";
  actions.style.right = "6px";
  actions.style.display = "flex";
  actions.style.gap = "6px";
  actions.style.opacity = "0";
  actions.style.transition = "opacity 0.15s";

  card.addEventListener("mouseenter", () => {
    actions.style.opacity = "1";
  });

  card.addEventListener("mouseleave", () => {
    actions.style.opacity = "0";
  });

  ctx.createActionButton(actions, "✎", ctx.tr("edit"), () => {
    new WishlistModal(ctx.app, ctx.plugin, item).open();
  });

  ctx.createActionButton(
    actions,
    "⌫",
    ctx.tr("delete"),
    async () => {
      if (confirm(ctx.tr("deleteConfirm", { name: item.name }))) {
        await ctx.plugin.deleteWishlistItem(item.id);
      }
    },
    true,
  );
}

function renderWishlistIcon(ctx: MainViewContext, parent: HTMLElement, item: WishlistItem): void {
  const iconWrap = parent.createDiv();
  iconWrap.style.display = "flex";
  iconWrap.style.alignItems = "center";
  iconWrap.style.justifyContent = "center";
  iconWrap.style.width = "82px";
  iconWrap.style.height = "82px";
  iconWrap.style.overflow = "visible";

  const icon = findIcon(item.icon);

  if (!icon) {
    iconWrap.setText("♡");
    iconWrap.style.fontSize = "56px";
    iconWrap.style.lineHeight = "1";
    return;
  }

  const img = iconWrap.createEl("img");
  img.src = getIconPath(icon.id);
  img.alt = icon.name;
  img.style.width = "78px";
  img.style.height = "78px";
  img.style.objectFit = "contain";
}

/**
 * Wishlist trend chart: line chart with x/y axes, hover tooltip and "vs last
 * record" delta. Visual & interaction language mirrors the fund trend chart
 * in {@link ../charts/lineChart.ts}, with two key differences:
 *
 * 1. Data points are placed at their real timestamps along the x-axis (not
 *    monthly slots), and the x ticks span the full plot width so the date
 *    labels always reach both edges.
 * 2. Axis labels are rendered as absolutely-positioned HTML on top of the
 *    SVG instead of `<text>` nodes, so they remain crisp and at a fixed
 *    pixel size even though the SVG itself is stretched (preserveAspectRatio
 *    = none) to fill the card's right column.
 */
function renderWishlistTrendChart(
  ctx: MainViewContext,
  parent: HTMLElement,
  item: WishlistItem,
): void {
  const wrap = parent.createDiv();
  wrap.style.position = "relative";
  wrap.style.flex = "1 1 auto";
  wrap.style.alignSelf = "stretch";
  // 透明背景 + 无边框，让图表融入卡片。
  wrap.style.background = "transparent";
  wrap.style.border = "none";
  wrap.style.padding = "0";
  wrap.style.boxSizing = "border-box";
  wrap.style.minHeight = "190px";
  wrap.style.display = "flex";

  const points = [...item.priceHistory]
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter((p) => Number.isFinite(p.price));

  if (points.length === 0) {
    renderChartPlaceholder(wrap, "暂无价格记录");
    return;
  }
  if (points.length === 1) {
    renderChartPlaceholder(wrap, `单条记录 · ${ctx.displayCurrency(points[0].price)}`);
    return;
  }

  // ---- 布局：左侧 Y 轴标签列 + 右侧图区 + 底部 X 轴标签行 -----------
  // 用绝对定位 HTML 标签做坐标轴，避免 SVG 拉伸时文字水平变形。
  const Y_AXIS_FONT = 17;      // 纵轴刻度字号（保持大字）
  const X_AXIS_FONT = 13;      // 横轴刻度字号（小一些避免日期重叠）
  const Y_LABEL_WIDTH = 64;    // 留给 Y 轴标签的像素宽度
  const X_LABEL_HEIGHT = 30;   // 留给 X 轴标签的像素高度
  const TOP_PAD = 14;          // 图表顶部留白
  const RIGHT_PAD = 14;        // 图表右侧留白

  // 整体容器：grid 划分坐标轴区
  const layout = wrap.createDiv();
  layout.style.position = "relative";
  layout.style.flex = "1 1 auto";
  layout.style.alignSelf = "stretch";
  layout.style.minHeight = "190px";

  // 图区（折线 + 网格 + 坐标框），绝对定位铺满除坐标轴标签以外的空间。
  const plot = layout.createDiv();
  plot.style.position = "absolute";
  plot.style.left = `${Y_LABEL_WIDTH}px`;
  plot.style.right = `${RIGHT_PAD}px`;
  plot.style.top = `${TOP_PAD}px`;
  plot.style.bottom = `${X_LABEL_HEIGHT}px`;

  // Y 轴标签列：绝对定位，覆盖图区左侧。
  const yAxis = layout.createDiv();
  yAxis.style.position = "absolute";
  yAxis.style.left = "0";
  yAxis.style.top = `${TOP_PAD}px`;
  yAxis.style.bottom = `${X_LABEL_HEIGHT}px`;
  yAxis.style.width = `${Y_LABEL_WIDTH}px`;
  yAxis.style.pointerEvents = "none";

  // X 轴标签行：底部水平贯穿。
  const xAxis = layout.createDiv();
  xAxis.style.position = "absolute";
  xAxis.style.left = `${Y_LABEL_WIDTH}px`;
  xAxis.style.right = `${RIGHT_PAD}px`;
  xAxis.style.bottom = "0";
  xAxis.style.height = `${X_LABEL_HEIGHT}px`;
  xAxis.style.pointerEvents = "none";

  // ---- Y 轴：紧凑自适应 ------------------------------------------------
  const values = points.map((p) => p.price);
  const rawMax = Math.max(...values);
  const rawMin = Math.min(...values);
  const span = rawMax - rawMin;
  let yMin: number;
  let yMax: number;
  if (span <= 0) {
    const v = rawMax;
    const pad = Math.max(Math.abs(v) * 0.1, 1);
    yMin = v - pad;
    yMax = v + pad;
  } else {
    const pad = span * 0.08;
    yMax = rawMax + pad;
    yMin = rawMin - pad;
    if (rawMin > 0 && rawMin < span * 0.2) {
      yMin = 0;
    }
  }
  const yRange = yMax - yMin || 1;

  // ---- X 轴：按真实日期分布；刻度根据数据范围/宽度自适应 -----------
  const dateMs = points.map((p) => parseDateMs(p.date));
  const tMin = dateMs[0];
  const tMax = dateMs[dateMs.length - 1];
  const tRange = Math.max(1, tMax - tMin);

  // 决定 X 刻度数量：以数据点数量为上限，至少 2（首尾），最多 7。
  const xTickCount = Math.min(7, Math.max(2, points.length));

  // ---- 绘制 Y 轴 5 条刻度的 HTML 标签 + 横向网格线（HTML） ----------
  const Y_TICK_COUNT = 5;
  const yTicks: number[] = [];
  for (let i = 0; i < Y_TICK_COUNT; i += 1) {
    yTicks.push(yMin + (yRange * i) / (Y_TICK_COUNT - 1));
  }
  yTicks.forEach((value, tickIndex) => {
    // 比例：i=0 在底（最低值），i=last 在顶（最高值）。
    const ratio = tickIndex / (Y_TICK_COUNT - 1); // 0..1
    const bottomPct = ratio * 100;

    // 网格线（除了最底部那条与 X 轴重合的）
    if (tickIndex > 0) {
      const grid = plot.createDiv();
      grid.style.position = "absolute";
      grid.style.left = "0";
      grid.style.right = "0";
      grid.style.bottom = `${bottomPct}%`;
      grid.style.height = "0";
      grid.style.borderTop = "1px dashed var(--background-modifier-border)";
      grid.style.pointerEvents = "none";
    }

    // 标签
    const label = yAxis.createDiv({ text: formatAxisValue(value) });
    label.style.position = "absolute";
    label.style.right = "8px";
    label.style.bottom = `calc(${bottomPct}% - ${Y_AXIS_FONT / 2}px)`;
    label.style.fontSize = `${Y_AXIS_FONT}px`;
    label.style.fontWeight = "900";
    label.style.color = "var(--text-muted)";
    label.style.lineHeight = "1";
    label.style.whiteSpace = "nowrap";
  });

  // ---- 绘制 X 轴刻度 HTML 标签（按时间线性插值，撑满宽度） --------
  for (let i = 0; i < xTickCount; i += 1) {
    const ratio = xTickCount === 1 ? 0.5 : i / (xTickCount - 1);
    const ms = tMin + ratio * tRange;

    // 刻度线（短竖线，画在 plot 区底部）
    const tick = plot.createDiv();
    tick.style.position = "absolute";
    tick.style.left = `${ratio * 100}%`;
    tick.style.bottom = "-5px";
    tick.style.width = "0";
    tick.style.height = "5px";
    tick.style.borderLeft = "2px solid var(--background-modifier-border)";
    tick.style.transform = "translateX(-1px)";
    tick.style.pointerEvents = "none";

    // 文本：仅在首个刻度或年份变化时显示年份，否则只显示月份；日不显示。
    const prevMs = i === 0 ? null : tMin + ((i - 1) / (xTickCount - 1)) * tRange;
    const label = xAxis.createDiv({ text: formatXTickLabel(ms, prevMs) });
    label.style.position = "absolute";
    label.style.left = `${ratio * 100}%`;
    label.style.top = "8px";
    label.style.fontSize = `${X_AXIS_FONT}px`;
    label.style.fontWeight = "900";
    label.style.color = "var(--text-muted)";
    label.style.lineHeight = "1";
    label.style.whiteSpace = "nowrap";
    // 首尾左/右对齐避免被裁剪，其余居中。
    if (i === 0) {
      label.style.transform = "translateX(0)";
    } else if (i === xTickCount - 1) {
      label.style.transform = "translateX(-100%)";
    } else {
      label.style.transform = "translateX(-50%)";
    }
  }

  // ---- 绘制 SVG 折线（铺满 plot 区，preserveAspectRatio=none） -----
  // viewBox 用 0..1 的归一化坐标。bottom = price 越大 y 越小（SVG 坐标向下为正）。
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 1000 1000`);
  svg.setAttribute("preserveAspectRatio", "none");
  svg.style.position = "absolute";
  svg.style.left = "0";
  svg.style.top = "0";
  svg.style.width = "100%";
  svg.style.height = "100%";
  svg.style.display = "block";
  svg.style.overflow = "visible";

  const xForMs = (ms: number) => ((ms - tMin) / tRange) * 1000;
  const yForValue = (value: number) =>
    (1 - (value - yMin) / yRange) * 1000;

  const positions = points.map((point, index) => ({
    point,
    index,
    x: xForMs(dateMs[index]),
    y: yForValue(point.price),
  }));

  // 坐标轴框（左侧 + 底部）
  const axis = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  axis.setAttribute("points", `0,0 0,1000 1000,1000`);
  axis.setAttribute("fill", "none");
  axis.setAttribute("stroke", "var(--background-modifier-border)");
  axis.setAttribute("stroke-width", "1");
  axis.setAttribute("vector-effect", "non-scaling-stroke");
  svg.appendChild(axis);

  // 折线
  let pathData = "";
  positions.forEach((p, index) => {
    pathData += `${index === 0 ? "M" : "L"} ${p.x} ${p.y} `;
  });
  const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
  line.setAttribute("d", pathData.trim());
  line.setAttribute("fill", "none");
  line.setAttribute("stroke", "#60a5fa");
  line.setAttribute("stroke-width", "3");
  line.setAttribute("stroke-linecap", "round");
  line.setAttribute("stroke-linejoin", "round");
  line.setAttribute("vector-effect", "non-scaling-stroke");
  svg.appendChild(line);

  // 数据点（可选）
  if (ctx.plugin.settings.showChartDots) {
    positions.forEach((p) => {
      const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      dot.setAttribute("cx", String(p.x));
      dot.setAttribute("cy", String(p.y));
      dot.setAttribute("r", "5");
      dot.setAttribute("fill", "var(--background-secondary)");
      dot.setAttribute("stroke", "#60a5fa");
      dot.setAttribute("stroke-width", "3");
      dot.setAttribute("vector-effect", "non-scaling-stroke");
      svg.appendChild(dot);
    });
  }

  // Hover 指示线 + 高亮点
  const guide = document.createElementNS("http://www.w3.org/2000/svg", "line");
  guide.setAttribute("y1", "0");
  guide.setAttribute("y2", "1000");
  guide.setAttribute("stroke", "var(--text-muted)");
  guide.setAttribute("stroke-width", "1");
  guide.setAttribute("stroke-dasharray", "4 4");
  guide.setAttribute("opacity", "0");
  guide.setAttribute("pointer-events", "none");
  guide.setAttribute("vector-effect", "non-scaling-stroke");
  svg.appendChild(guide);

  const hoverDot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  hoverDot.setAttribute("r", "6");
  hoverDot.setAttribute("fill", "#60a5fa");
  hoverDot.setAttribute("stroke", "var(--background-secondary)");
  hoverDot.setAttribute("stroke-width", "2");
  hoverDot.setAttribute("opacity", "0");
  hoverDot.setAttribute("pointer-events", "none");
  hoverDot.setAttribute("vector-effect", "non-scaling-stroke");
  svg.appendChild(hoverDot);

  plot.appendChild(svg);

  // tooltip：相对 wrap 定位（避免被 plot 裁剪）。
  const tooltip = wrap.createDiv();
  tooltip.style.position = "absolute";
  tooltip.style.display = "none";
  tooltip.style.pointerEvents = "none";
  tooltip.style.padding = "9px 11px";
  tooltip.style.borderRadius = "12px";
  tooltip.style.background = "var(--background-primary)";
  tooltip.style.border = "1px solid var(--background-modifier-border)";
  tooltip.style.boxShadow = "0 12px 28px rgba(0,0,0,0.2)";
  tooltip.style.fontSize = "13px";
  tooltip.style.fontWeight = "900";
  tooltip.style.zIndex = "2";
  tooltip.style.lineHeight = "1.5";
  tooltip.style.whiteSpace = "nowrap";

  const hideHover = () => {
    guide.setAttribute("opacity", "0");
    hoverDot.setAttribute("opacity", "0");
    tooltip.style.display = "none";
  };

  positions.forEach((p, index) => {
    const prevX = index > 0 ? positions[index - 1].x : 0;
    const nextX = index < positions.length - 1 ? positions[index + 1].x : 1000;
    const hitX = index === 0 ? 0 : (prevX + p.x) / 2;
    const hitWidth =
      index === positions.length - 1
        ? 1000 - hitX
        : (p.x + nextX) / 2 - hitX;

    const hit = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    hit.setAttribute("x", String(hitX));
    hit.setAttribute("y", "0");
    hit.setAttribute("width", String(Math.max(hitWidth, 4)));
    hit.setAttribute("height", "1000");
    hit.setAttribute("fill", "transparent");
    hit.setAttribute("pointer-events", "all");
    hit.style.cursor = "pointer";

    const showHover = () => {
      guide.setAttribute("x1", String(p.x));
      guide.setAttribute("x2", String(p.x));
      guide.setAttribute("opacity", "1");

      hoverDot.setAttribute("cx", String(p.x));
      hoverDot.setAttribute("cy", String(p.y));
      hoverDot.setAttribute("opacity", "1");

      tooltip.empty();

      const dateText = tooltip.createDiv({ text: formatTooltipDate(p.point.date) });
      dateText.style.color = "var(--text-muted)";
      dateText.style.fontSize = "12px";
      dateText.style.fontWeight = "700";
      dateText.style.marginBottom = "2px";

      const valueText = tooltip.createDiv({ text: ctx.displayCurrency(p.point.price) });
      valueText.style.fontSize = "15px";
      valueText.style.fontWeight = "900";
      valueText.style.color = "var(--text-normal)";

      if (index > 0) {
        const prev = positions[index - 1].point.price;
        const delta = p.point.price - prev;
        const sign = delta > 0 ? "+" : delta < 0 ? "-" : "±";
        const color = delta > 0 ? "#22c55e" : delta < 0 ? "#ef4444" : "var(--text-muted)";
        const deltaText = tooltip.createDiv({
          text: `${sign}${ctx.displayCurrency(Math.abs(delta))}`,
        });
        deltaText.style.fontSize = "13px";
        deltaText.style.fontWeight = "800";
        deltaText.style.color = color;
        deltaText.style.marginTop = "2px";

        const hint = tooltip.createDiv({ text: "较上期" });
        hint.style.fontSize = "11px";
        hint.style.fontWeight = "600";
        hint.style.color = "var(--text-faint)";
      }

      // 把 SVG 0..1000 坐标换算成 plot 像素，再加上 plot 相对 wrap 的偏移。
      const plotRect = plot.getBoundingClientRect();
      const wrapRect = wrap.getBoundingClientRect();
      const plotOffsetX = plotRect.left - wrapRect.left;
      const plotOffsetY = plotRect.top - wrapRect.top;
      const px = plotOffsetX + (p.x / 1000) * plotRect.width;
      const py = plotOffsetY + (p.y / 1000) * plotRect.height;

      const wrapWidth = wrap.clientWidth || 1;
      tooltip.style.left = `${Math.min(Math.max(px - 72, 8), Math.max(wrapWidth - 160, 8))}px`;
      tooltip.style.top = `${Math.max(py - 64, 8)}px`;
      tooltip.style.display = "block";
    };

    hit.onmouseenter = showHover;
    hit.onmousemove = showHover;
    hit.onmouseleave = hideHover;
    svg.appendChild(hit);
  });
}

function renderChartPlaceholder(wrap: HTMLElement, text: string): void {
  wrap.style.alignItems = "center";
  wrap.style.justifyContent = "center";
  wrap.style.color = "var(--text-muted)";
  wrap.style.fontSize = "13px";
  wrap.style.fontWeight = "850";
  wrap.setText(text);
}

/** Parse `YYYY-MM-DD` (or any ISO date) into UTC ms; falls back to 0. */
function parseDateMs(iso: string): number {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

/**
 * Compact x-axis tick label, e.g. `3月` for typical ticks and `2024-3月` for
 * the first tick or whenever the year flips compared with the previous tick.
 * Day is intentionally dropped to keep neighbouring labels from overlapping.
 */
function formatXTickLabel(ms: number, prevMs: number | null): string {
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const showYear =
    prevMs === null || new Date(prevMs).getFullYear() !== y;
  return showYear ? `${y}-${m}月` : `${m}月`;
}

/** `2024-03-12` → `2024年3月12日` for the hover tooltip. */
function formatTooltipDate(iso: string): string {
  const parts = iso.split("-");
  if (parts.length >= 3) {
    const y = parts[0];
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (!Number.isNaN(m) && !Number.isNaN(d)) {
      return `${y}年${m}月${d}日`;
    }
  }
  return iso;
}

function renderAddWishlistCard(ctx: MainViewContext, grid: HTMLElement): void {
  const card = grid.createDiv();
  card.style.minHeight = "132px";
  card.style.display = "flex";
  card.style.alignItems = "center";
  card.style.justifyContent = "center";
  card.style.borderRadius = "21px";
  card.style.border = "1px dashed var(--background-modifier-border)";
  card.style.background = "var(--background-primary)";
  card.style.color = "var(--text-muted)";
  card.style.fontSize = "44px";
  card.style.fontWeight = "850";
  card.style.cursor = "pointer";
  card.style.boxShadow = "0 4px 14px rgba(0,0,0,0.06)";
  card.title = "添加心愿";
  card.innerText = "+";
  card.onclick = () => new WishlistModal(ctx.app, ctx.plugin).open();
}

/** Latest recorded price for a wishlist item, or 0 when none. */
export function getWishlistCurrentPrice(item: WishlistItem): number {
  const prices = [...item.priceHistory].sort((a, b) => a.date.localeCompare(b.date));
  return prices[prices.length - 1]?.price ?? 0;
}

/** Sum of all accessories' prices for a wishlist item. */
export function getWishlistAccessoriesTotal(item: WishlistItem): number {
  return (item.accessories ?? []).reduce((sum, accessory) => sum + accessory.price, 0);
}
