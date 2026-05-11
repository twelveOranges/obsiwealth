import type { MainViewContext } from "../view/viewContext";
import { parseLocalDate } from "@core/calc/assetMath";
import { createSmoothPath } from "./chartAxis";

/**
 * Smoothed area-like trend chart used on the Stats page.
 *
 * Extracted 1:1 from `ObsiWealthMainView.renderStatsAreaChart` without
 * behavioural change.
 */
export function renderStatsAreaChart(
  ctx: MainViewContext,
  parent: HTMLElement,
  points: Array<{ date: string; value: number }>,
): void {
  if (points.length < 2) {
    ctx.renderEmptyChart(parent);
    return;
  }

  parent.style.position = "relative";

  const width = 620;
  const height = 220;
  const leftPadding = 28;
  const rightPadding = 24;
  const topPadding = 24;
  const bottomPadding = 38;
  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const plotWidth = width - leftPadding - rightPadding;
  const plotHeight = height - topPadding - bottomPadding;
  const yForValue = (value: number) => topPadding + (1 - value / maxValue) * plotHeight;
  const dateTimes = points.map((point) => parseLocalDate(point.date)?.getTime() ?? 0);
  const minTime = Math.min(...dateTimes);
  const maxTime = Math.max(...dateTimes);
  const xForTime = (time: number) => minTime === maxTime
    ? leftPadding + plotWidth / 2
    : leftPadding + ((time - minTime) / (maxTime - minTime)) * plotWidth;
  const positions = points.map((point, index) => ({
    point,
    x: xForTime(dateTimes[index]),
    y: yForValue(point.value),
  }));
  const curvePath = createSmoothPath(positions);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", String(height));

  [maxValue, maxValue / 2].forEach((value) => {
    const y = yForValue(value);
    const grid = document.createElementNS("http://www.w3.org/2000/svg", "line");
    grid.setAttribute("x1", String(leftPadding));
    grid.setAttribute("y1", String(y));
    grid.setAttribute("x2", String(width - rightPadding));
    grid.setAttribute("y2", String(y));
    grid.setAttribute("stroke", "var(--background-modifier-border)");
    grid.setAttribute("stroke-dasharray", "5 5");
    svg.appendChild(grid);
  });

  const axis = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  axis.setAttribute(
    "points",
    `${leftPadding},${topPadding} ${leftPadding},${height - bottomPadding} ${width - rightPadding},${height - bottomPadding}`,
  );
  axis.setAttribute("fill", "none");
  axis.setAttribute("stroke", "var(--background-modifier-border)");
  axis.setAttribute("stroke-width", "2");
  svg.appendChild(axis);

  const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
  line.setAttribute("d", curvePath);
  line.setAttribute("fill", "none");
  line.setAttribute("stroke", "#60a5fa");
  line.setAttribute("stroke-width", "7");
  line.setAttribute("stroke-linecap", "round");
  line.setAttribute("stroke-linejoin", "round");
  svg.appendChild(line);

  const start = document.createElementNS("http://www.w3.org/2000/svg", "text");
  start.textContent = points[0].date;
  start.setAttribute("x", String(leftPadding));
  start.setAttribute("y", String(height - 10));
  start.setAttribute("fill", "var(--text-muted)");
  start.setAttribute("font-size", "16");
  start.setAttribute("font-weight", "800");
  svg.appendChild(start);

  const end = document.createElementNS("http://www.w3.org/2000/svg", "text");
  end.textContent = points[points.length - 1].date;
  end.setAttribute("x", String(width - rightPadding));
  end.setAttribute("y", String(height - 10));
  end.setAttribute("fill", "var(--text-muted)");
  end.setAttribute("font-size", "16");
  end.setAttribute("font-weight", "800");
  end.setAttribute("text-anchor", "end");
  svg.appendChild(end);

  positions.forEach((position) => {
    if (!ctx.plugin.settings.showChartDots) return;
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    marker.setAttribute("cx", String(position.x));
    marker.setAttribute("cy", String(position.y));
    marker.setAttribute("r", "5");
    marker.setAttribute("fill", "var(--background-primary)");
    marker.setAttribute("stroke", "#60a5fa");
    marker.setAttribute("stroke-width", "4");
    svg.appendChild(marker);
  });

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

  positions.forEach((position, index) => {
    const hitArea = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    const nextX = positions[index + 1]?.x ?? width - rightPadding;
    const prevX = positions[index - 1]?.x ?? leftPadding;
    const hitX = index === 0 ? leftPadding : (prevX + position.x) / 2;
    const hitWidth = index === positions.length - 1 ? width - rightPadding - hitX : (position.x + nextX) / 2 - hitX;
    hitArea.setAttribute("x", String(hitX));
    hitArea.setAttribute("y", String(topPadding));
    hitArea.setAttribute("width", String(Math.max(hitWidth, 16)));
    hitArea.setAttribute("height", String(plotHeight));
    hitArea.setAttribute("fill", "transparent");
    hitArea.setAttribute("pointer-events", "all");
    hitArea.style.cursor = "pointer";
    hitArea.onmouseenter = () => {
      tooltip.empty();
      tooltip.createDiv({ text: position.point.date });
      tooltip.createDiv({ text: ctx.displayCurrency(position.point.value) });
      tooltip.style.left = `${Math.min(Math.max((position.x / width) * parent.clientWidth - 72, 8), Math.max(parent.clientWidth - 160, 8))}px`;
      tooltip.style.top = `${Math.max(position.y - 56, 8)}px`;
      tooltip.style.display = "block";
    };
    hitArea.onmouseleave = () => {
      tooltip.style.display = "none";
    };
    svg.appendChild(hitArea);
  });

  parent.appendChild(svg);
}
