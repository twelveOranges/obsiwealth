import type { MainViewContext } from "../view/viewContext";
import type { FundMonthlySlot } from "@core/calc/fundStats";
import { formatAxisValue } from "./chartAxis";

/**
 * Time-series line chart used on the Funds page.
 *
 * Accepts a fixed-width monthly series where `value` may be `null`, meaning
 * "no data this month". Such slots still render an x-axis tick + label, and
 * the line is broken across them (no misleading zero crossings).
 *
 * Every slot draws a vertical dashed grid line, so the user can easily read
 * the x position even when many months are missing.
 */
export function renderStatsLineChart(
  ctx: MainViewContext,
  parent: HTMLElement,
  slots: FundMonthlySlot[],
): void {
  const hasData = slots.some((s) => s.value !== null);
  if (!hasData || slots.length === 0) {
    ctx.renderEmptyChart(parent);
    return;
  }

  parent.style.position = "relative";

  const width = 620;
  const height = 240;
  const leftPadding = 64;
  const rightPadding = 24;
  const topPadding = 24;
  const bottomPadding = 44;

  const values = slots.map((s) => s.value).filter((v): v is number => v !== null);
  const rawMax = Math.max(...values, 1);
  const rawMin = Math.min(...values);
  // 紧凑自适应 y 轴区间：直接贴着数据 min/max，留 ~5% padding 避免最高/最低
  // 点正好卡在图表边缘（影响视觉）。不再用 niceCeil/niceFloor 取整——那会
  // 把 500万~510万 这种窄区间放大到 0~1000万，完全体现不出趋势。
  const span = rawMax - rawMin;
  let yMin: number;
  let yMax: number;
  if (span <= 0) {
    // 所有数据相等：围绕值造一个对称小区间，避免除零
    const v = rawMax;
    const pad = Math.max(Math.abs(v) * 0.1, 1);
    yMin = v - pad;
    yMax = v + pad;
  } else {
    const pad = span * 0.08;
    yMax = rawMax + pad;
    yMin = rawMin - pad;
    // 如果数据全为正且最小值本身离 0 很近（<20% 总 span），就让 y 轴从 0 开始——
    // 这样视觉上更符合"金额类"图表的直觉，不会因为从非零开始而误判趋势。
    if (rawMin > 0 && rawMin < span * 0.2) {
      yMin = 0;
    }
  }
  const yRange = yMax - yMin || 1;
  const plotWidth = width - leftPadding - rightPadding;
  const plotHeight = height - topPadding - bottomPadding;
  const yForValue = (value: number) => topPadding + (1 - (value - yMin) / yRange) * plotHeight;
  const xForIndex = (index: number) => slots.length <= 1
    ? leftPadding + plotWidth / 2
    : leftPadding + (index / (slots.length - 1)) * plotWidth;

  // For points with an actual `YYYY-MM-DD`, place them at the correct day
  // within the month rather than at the month-tick centre. The month tick
  // itself represents "day 1", and the next tick represents "day 1 of the
  // next month", so day D out of M days → tick + (D-1)/M of the step width.
  const daysInMonth = (yyyyMm: string): number => {
    const [y, m] = yyyyMm.split("-").map((s) => parseInt(s, 10));
    if (!y || !m) return 30;
    return new Date(y, m, 0).getDate();
  };
  const stepWidth = slots.length > 1 ? plotWidth / (slots.length - 1) : 0;
  const xForSlot = (index: number): number => {
    const baseX = xForIndex(index);
    const slot = slots[index];
    if (!slot.actualDate) return baseX;
    const parts = slot.actualDate.split("-");
    const day = parseInt(parts[2], 10);
    if (!day || Number.isNaN(day)) return baseX;
    const frac = Math.min(1, Math.max(0, (day - 1) / Math.max(1, daysInMonth(slot.date))));
    const offset = stepWidth * frac;
    // Clamp so the last month's point cannot drift past the plot edge.
    return Math.min(width - rightPadding, baseX + offset);
  };

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", String(height));

  // --- Horizontal grid + y-axis ticks ------------------------------------
  // 5 等分区间（含上下端点），共 5 条刻度线
  const tickCount = 5;
  const yTicks = Array.from({ length: tickCount }, (_, i) => yMin + (yRange * i) / (tickCount - 1));
  yTicks.forEach((value, tickIndex) => {
    const y = yForValue(value);

    // 最底部那条和 x 轴重合，就不重复画 grid 线
    if (tickIndex > 0) {
      const grid = document.createElementNS("http://www.w3.org/2000/svg", "line");
      grid.setAttribute("x1", String(leftPadding));
      grid.setAttribute("y1", String(y));
      grid.setAttribute("x2", String(width - rightPadding));
      grid.setAttribute("y2", String(y));
      grid.setAttribute("stroke", "var(--background-modifier-border)");
      grid.setAttribute("stroke-dasharray", "5 5");
      svg.appendChild(grid);
    }

    const tick = document.createElementNS("http://www.w3.org/2000/svg", "line");
    tick.setAttribute("x1", String(leftPadding - 4));
    tick.setAttribute("y1", String(y));
    tick.setAttribute("x2", String(leftPadding));
    tick.setAttribute("y2", String(y));
    tick.setAttribute("stroke", "var(--background-modifier-border)");
    tick.setAttribute("stroke-width", "2");
    svg.appendChild(tick);

    const tickLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    tickLabel.textContent = formatAxisValue(value);
    tickLabel.setAttribute("x", String(leftPadding - 8));
    tickLabel.setAttribute("y", String(y + 5));
    tickLabel.setAttribute("fill", "var(--text-muted)");
    tickLabel.setAttribute("font-size", "14");
    tickLabel.setAttribute("font-weight", "900");
    tickLabel.setAttribute("text-anchor", "end");
    svg.appendChild(tickLabel);
  });

  // --- Vertical grid + x-axis labels -------------------------------------
  // To avoid crowding when there are many slots (>14), thin out grid lines
  // but keep every label. We aim for roughly 12 gridlines max.
  const gridStride = Math.max(1, Math.ceil(slots.length / 12));
  slots.forEach((slot, index) => {
    const x = xForIndex(index);

    if (index > 0 && index < slots.length - 1 && index % gridStride === 0) {
      const grid = document.createElementNS("http://www.w3.org/2000/svg", "line");
      grid.setAttribute("x1", String(x));
      grid.setAttribute("y1", String(topPadding));
      grid.setAttribute("x2", String(x));
      grid.setAttribute("y2", String(height - bottomPadding));
      grid.setAttribute("stroke", "var(--background-modifier-border)");
      grid.setAttribute("stroke-dasharray", "3 5");
      grid.setAttribute("opacity", "0.6");
      svg.appendChild(grid);
    }

    // x tick mark
    const tick = document.createElementNS("http://www.w3.org/2000/svg", "line");
    tick.setAttribute("x1", String(x));
    tick.setAttribute("y1", String(height - bottomPadding));
    tick.setAttribute("x2", String(x));
    tick.setAttribute("y2", String(height - bottomPadding + 4));
    tick.setAttribute("stroke", "var(--background-modifier-border)");
    tick.setAttribute("stroke-width", "2");
    svg.appendChild(tick);

    // x label (skip every other when crowded)
    const labelStride = Math.max(1, Math.ceil(slots.length / 13));
    if (index % labelStride === 0 || index === slots.length - 1) {
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.textContent = slot.label;
      label.setAttribute("x", String(x));
      label.setAttribute("y", String(height - bottomPadding + 22));
      label.setAttribute("fill", "var(--text-muted)");
      label.setAttribute("font-size", "13");
      label.setAttribute("font-weight", "900");
      label.setAttribute("text-anchor", "middle");
      svg.appendChild(label);
    }
  });

  // --- Axis frame --------------------------------------------------------
  const axis = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  axis.setAttribute(
    "points",
    `${leftPadding},${topPadding} ${leftPadding},${height - bottomPadding} ${width - rightPadding},${height - bottomPadding}`,
  );
  axis.setAttribute("fill", "none");
  axis.setAttribute("stroke", "var(--background-modifier-border)");
  axis.setAttribute("stroke-width", "2");
  svg.appendChild(axis);

  // --- Line path (broken across null slots) ------------------------------
  let pathData = "";
  let penDown = false;
  slots.forEach((slot, index) => {
    if (slot.value === null) {
      penDown = false;
      return;
    }
    const x = xForSlot(index);
    const y = yForValue(slot.value);
    pathData += `${penDown ? "L" : "M"} ${x} ${y} `;
    penDown = true;
  });

  if (pathData) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
    line.setAttribute("d", pathData.trim());
    line.setAttribute("fill", "none");
    line.setAttribute("stroke", "#60a5fa");
    line.setAttribute("stroke-width", "4");
    line.setAttribute("stroke-linecap", "round");
    line.setAttribute("stroke-linejoin", "round");
    svg.appendChild(line);
  }

  // --- Dots (only on data points) ----------------------------------------
  if (ctx.plugin.settings.showChartDots) {
    slots.forEach((slot, index) => {
      if (slot.value === null) return;
      const marker = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      marker.setAttribute("cx", String(xForSlot(index)));
      marker.setAttribute("cy", String(yForValue(slot.value)));
      marker.setAttribute("r", "4");
      marker.setAttribute("fill", "var(--background-primary)");
      marker.setAttribute("stroke", "#60a5fa");
      marker.setAttribute("stroke-width", "3");
      svg.appendChild(marker);
    });
  }

  // --- Hover indicator + tooltip ----------------------------------------
  // One invisible hit-area rect per slot, spanning [(prev+cur)/2, (cur+next)/2].
  // Mirrors the stats area chart so each slot snaps naturally to whichever
  // month the cursor is closest to.
  const guide = document.createElementNS("http://www.w3.org/2000/svg", "line");
  guide.setAttribute("y1", String(topPadding));
  guide.setAttribute("y2", String(height - bottomPadding));
  guide.setAttribute("stroke", "var(--text-muted)");
  guide.setAttribute("stroke-width", "1");
  guide.setAttribute("stroke-dasharray", "4 4");
  guide.setAttribute("opacity", "0");
  guide.setAttribute("pointer-events", "none");
  svg.appendChild(guide);

  const hoverDot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  hoverDot.setAttribute("r", "5");
  hoverDot.setAttribute("fill", "#60a5fa");
  hoverDot.setAttribute("stroke", "var(--background-primary)");
  hoverDot.setAttribute("stroke-width", "2");
  hoverDot.setAttribute("opacity", "0");
  hoverDot.setAttribute("pointer-events", "none");
  svg.appendChild(hoverDot);

  const tooltip = parent.createDiv();
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

  const formatSlotLabel = (slot: FundMonthlySlot): string => {
    // Prefer the real YYYY-MM-DD (for slots that have a data point) – users
    // explicitly asked to see the concrete date a reading was taken on.
    const iso = slot.actualDate ?? slot.date;
    const parts = iso.split("-");
    if (parts.length >= 3) {
      const y = parts[0];
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      if (!isNaN(m) && !isNaN(d)) return `${y}年${m}月${d}日`;
    }
    if (parts.length >= 2) {
      const y = parts[0];
      const m = parseInt(parts[1], 10);
      if (!isNaN(m)) return `${y}年${m}月`;
    }
    return iso;
  };

  const findPrevValueIndex = (index: number): number => {
    for (let i = index - 1; i >= 0; i--) {
      if (slots[i].value !== null) return i;
    }
    return -1;
  };

  const hideHover = () => {
    guide.setAttribute("opacity", "0");
    hoverDot.setAttribute("opacity", "0");
    tooltip.style.display = "none";
  };

  slots.forEach((slot, index) => {
    const x = xForSlot(index);
    const prevX = index > 0 ? xForSlot(index - 1) : leftPadding;
    const nextX = index < slots.length - 1 ? xForSlot(index + 1) : width - rightPadding;
    const hitX = index === 0 ? leftPadding : (prevX + x) / 2;
    const hitWidth = index === slots.length - 1
      ? width - rightPadding - hitX
      : (x + nextX) / 2 - hitX;

    const hit = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    hit.setAttribute("x", String(hitX));
    hit.setAttribute("y", String(topPadding));
    hit.setAttribute("width", String(Math.max(hitWidth, 4)));
    hit.setAttribute("height", String(plotHeight));
    hit.setAttribute("fill", "transparent");
    hit.setAttribute("pointer-events", "all");
    hit.style.cursor = "pointer";

    const showHover = () => {
      guide.setAttribute("x1", String(x));
      guide.setAttribute("x2", String(x));
      guide.setAttribute("opacity", "1");

      tooltip.empty();

      const monthText = tooltip.createDiv({ text: formatSlotLabel(slot) });
      monthText.style.color = "var(--text-muted)";
      monthText.style.fontSize = "11px";
      monthText.style.fontWeight = "700";
      monthText.style.marginBottom = "2px";

      if (slot.value === null) {
        hoverDot.setAttribute("opacity", "0");
        const none = tooltip.createDiv({ text: "—" });
        none.style.color = "var(--text-muted)";
      } else {
        hoverDot.setAttribute("cx", String(x));
        hoverDot.setAttribute("cy", String(yForValue(slot.value)));
        hoverDot.setAttribute("opacity", "1");

        const valueText = tooltip.createDiv({ text: ctx.displayCurrency(slot.value) });
        valueText.style.fontSize = "14px";
        valueText.style.fontWeight = "900";
        valueText.style.color = "var(--text-normal)";

        const prevIdx = findPrevValueIndex(index);
        if (prevIdx >= 0) {
          const prev = slots[prevIdx].value as number;
          const delta = slot.value - prev;
          const sign = delta > 0 ? "+" : delta < 0 ? "-" : "±";
          const color = delta > 0 ? "#22c55e" : delta < 0 ? "#ef4444" : "var(--text-muted)";
          const deltaText = tooltip.createDiv({
            text: `${sign}${ctx.displayCurrency(Math.abs(delta))}`,
          });
          deltaText.style.fontSize = "12px";
          deltaText.style.fontWeight = "800";
          deltaText.style.color = color;
          deltaText.style.marginTop = "2px";

          const hint = tooltip.createDiv({ text: "较上期" });
          hint.style.fontSize = "10px";
          hint.style.fontWeight = "600";
          hint.style.color = "var(--text-faint)";
        }
      }

      // Position the tooltip above the data point (or the top of the plot
      // when the slot has no value). Left is converted from SVG coordinates
      // into CSS pixels using the parent's actual rendered width.
      const parentWidth = parent.clientWidth || width;
      const anchorY = slot.value !== null ? yForValue(slot.value) : topPadding;
      const pxPerUnitY = (parent.clientHeight || height) / height;
      tooltip.style.left = `${Math.min(
        Math.max((x / width) * parentWidth - 72, 8),
        Math.max(parentWidth - 160, 8),
      )}px`;
      tooltip.style.top = `${Math.max(anchorY * pxPerUnitY - 56, 8)}px`;
      tooltip.style.display = "block";
    };

    hit.onmouseenter = showHover;
    hit.onmousemove = showHover;
    hit.onmouseleave = hideHover;
    svg.appendChild(hit);
  });

  parent.appendChild(svg);
}
