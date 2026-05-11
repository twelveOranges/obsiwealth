import type { Asset, AssetStatus } from "@core/types";
import type { MainViewContext } from "../view/viewContext";
import {
  formatLocalDate,
  getAssetEndDateValue,
  getAssetStatus,
  getNetAssetCost,
  getTodayISODate,
  getUsedDays,
  parseLocalDate,
} from "@core/calc/assetMath";
import { renderStatsAreaChart } from "../charts/areaChart";
import { renderCategoryPieCard } from "../charts/donutChart";

/**
 * Render the asset Stats page (summary card + trend/pie/usage grid).
 *
 * Extracted verbatim from `ObsiWealthMainView.renderStatsPage` without any
 * behavioural change; `this.xxx` references are now `ctx.xxx` and previously
 * private asset-math helpers live alongside as module-local helpers.
 */
export function renderStatsPage(ctx: MainViewContext, el: HTMLElement): void {
  const assets = ctx.plugin.assets;

  const summaryCard = renderStatsSummaryCard(ctx, el, assets);
  ctx.applyStickyTop(summaryCard);

  const statsGrid = el.createDiv();
  statsGrid.style.display = "grid";
  // 每列至少 640px：donut wrap 最小 320+260+22=602px，加卡片自身 padding ~40px
  // 才能不压缩图例。page 的 minWidth 保证虚拟画布放得下，然后整体 zoom 缩放。
  statsGrid.style.gridTemplateColumns = `repeat(${ctx.statsTrendCols}, minmax(640px, 1fr))`;
  statsGrid.style.gap = "18px";
  statsGrid.style.alignItems = "stretch";

  renderAssetValueTrendCard(ctx, statsGrid, assets);
  renderDailyCostTrendCard(ctx, statsGrid, assets);
  renderCategoryPieCard(ctx, statsGrid, assets);
  renderCategoryAverageUsageCard(ctx, statsGrid, assets);
}

function renderStatsSummaryCard(
  ctx: MainViewContext,
  el: HTMLElement,
  assets: Asset[],
): HTMLElement {
  const totalValue = assets.reduce((sum, asset) => sum + getNetAssetCost(asset), 0);
  const card = ctx.createStatsHeroCard(el, ctx.tr("assetTotalValue"));

  const value = card.createDiv();
  value.style.fontSize = "42px";
  value.style.fontWeight = "950";
  value.style.lineHeight = "1.05";
  value.style.marginBottom = "16px";
  value.style.display = "flex";
  ctx.renderSlotNumber(value.createDiv(), ctx.displayCurrency(totalValue));

  renderStatusValuePill(ctx, card, assets, totalValue);

  const rows = card.createDiv();
  rows.style.display = "grid";
  rows.style.gridTemplateColumns = "repeat(3, minmax(0, 1fr))";
  rows.style.gap = "14px";

  (["active", "sold", "retired"] as AssetStatus[]).forEach((status) => {
    const statusAssets = assets.filter((asset) => getAssetStatus(asset) === status);
    const statusValue = statusAssets.reduce((sum, asset) => sum + getNetAssetCost(asset), 0);
    const percent = totalValue > 0 ? Math.round((statusValue / totalValue) * 100) : 0;
    const item = rows.createDiv();
    item.style.padding = "18px";
    item.style.borderRadius = "20px";
    item.style.background = "var(--background-primary)";
    item.style.border = `3px solid ${ctx.getStatusColor(status)}`;
    item.style.boxShadow = "0 10px 24px rgba(0,0,0,0.1)";

    const header = item.createDiv();
    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.justifyContent = "space-between";
    header.style.gap = "10px";
    header.style.color = "var(--text-normal)";

    const statusWrap = header.createDiv();
    statusWrap.style.display = "flex";
    statusWrap.style.alignItems = "center";
    statusWrap.style.gap = "8px";
    statusWrap.style.minWidth = "0";

    const dot = statusWrap.createSpan();
    dot.style.width = "12px";
    dot.style.height = "12px";
    dot.style.borderRadius = "999px";
    dot.style.background = ctx.getStatusColor(status);
    dot.style.flexShrink = "0";

    const label = statusWrap.createSpan({ text: ctx.getStatusLabel(status) });
    label.style.color = "var(--text-normal)";
    label.style.fontSize = "15px";
    label.style.fontWeight = "900";
    label.style.overflow = "hidden";
    label.style.textOverflow = "ellipsis";
    label.style.whiteSpace = "nowrap";

    const percentEl = header.createSpan();
    percentEl.style.fontSize = "16px";
    percentEl.style.fontWeight = "950";
    percentEl.style.color = "var(--text-normal)";
    percentEl.style.whiteSpace = "nowrap";
    percentEl.style.display = "inline-flex";
    ctx.renderSlotNumber(percentEl.createSpan(), `${percent}%`);

    const valueEl = item.createDiv();
    valueEl.style.marginTop = "12px";
    valueEl.style.fontSize = "28px";
    valueEl.style.fontWeight = "950";
    valueEl.style.lineHeight = "1.05";
    valueEl.style.color = "var(--text-normal)";
    valueEl.style.display = "flex";
    ctx.renderSlotNumber(valueEl.createDiv(), ctx.displayCurrency(statusValue));

    const count = item.createDiv();
    count.style.marginTop = "10px";
    count.style.fontSize = "15px";
    count.style.fontWeight = "800";
    count.style.color = "var(--text-normal)";
    count.style.display = "flex";
    ctx.renderSlotNumber(count.createSpan(), `${statusAssets.length}/${assets.length}`);
  });

  return card;
}

function renderStatusValuePill(
  ctx: MainViewContext,
  parent: HTMLElement,
  assets: Asset[],
  totalValue: number,
): void {
  const pill = parent.createDiv();
  pill.style.display = "flex";
  pill.style.width = "100%";
  pill.style.height = "26px";
  pill.style.margin = "0 0 20px";
  pill.style.borderRadius = "999px";
  pill.style.overflow = "hidden";
  pill.style.background = "var(--background-primary)";
  pill.style.border = "1px solid var(--background-modifier-border)";
  pill.style.boxShadow = "inset 0 1px 5px rgba(0,0,0,0.1)";

  (["active", "sold", "retired"] as AssetStatus[]).forEach((status) => {
    const statusValue = assets
      .filter((asset) => getAssetStatus(asset) === status)
      .reduce((sum, asset) => sum + getNetAssetCost(asset), 0);
    const width = totalValue > 0 ? (statusValue / totalValue) * 100 : 0;

    if (width <= 0) {
      return;
    }

    const segment = pill.createDiv();
    segment.style.width = `${width}%`;
    segment.style.height = "100%";
    segment.style.background = ctx.getStatusColor(status);
    segment.title = `${ctx.getStatusLabel(status)} ${Math.round(width)}%`;
  });
}

function renderAssetValueTrendCard(ctx: MainViewContext, el: HTMLElement, assets: Asset[]): void {
  const card = ctx.createStatsCard(el, ctx.tr("assetValueTrend"));
  renderTrendCurrentValue(ctx, card, ctx.displayCurrency(getTotalAssetValueOnDate(assets, getTodayISODate())));
  renderStatsAreaChart(ctx, card, getStatsTrendPoints(assets, "value"));
}

function renderDailyCostTrendCard(ctx: MainViewContext, el: HTMLElement, assets: Asset[]): void {
  const card = ctx.createStatsCard(el, ctx.tr("dailyCostTrend"));
  renderTrendCurrentValue(
    ctx,
    card,
    `${ctx.displayCurrency(getTotalDailyCostOnDate(assets, getTodayISODate()))} / ${ctx.tr("perDay")}`,
  );
  renderStatsAreaChart(ctx, card, getStatsTrendPoints(assets, "daily"));
}

function renderTrendCurrentValue(ctx: MainViewContext, parent: HTMLElement, value: string): void {
  const current = parent.createDiv();
  current.style.margin = "-4px 0 14px";
  current.style.fontSize = "31px";
  current.style.fontWeight = "950";
  current.style.lineHeight = "1.05";
  current.style.color = "var(--text-normal)";
  current.style.display = "flex";
  ctx.renderSlotNumber(current.createDiv(), value);
}

function renderCategoryAverageUsageCard(
  ctx: MainViewContext,
  el: HTMLElement,
  assets: Asset[],
): void {
  const card = ctx.createStatsCard(el, ctx.tr("averageUsageByCategory"));
  const stats = getCategoryAverageUsageStats(assets);

  if (stats.length === 0) {
    ctx.renderEmptyChart(card);
    return;
  }

  const maxDays = Math.max(...stats.map((stat) => stat.averageDays), 1);
  const wrap = card.createDiv();
  wrap.style.display = "flex";
  wrap.style.flexDirection = "column";
  wrap.style.gap = "16px";

  stats.forEach((stat) => {
    const item = wrap.createDiv();
    item.style.display = "grid";
    item.style.gridTemplateColumns = "minmax(120px, 1fr) max-content";
    item.style.alignItems = "center";
    item.style.gap = "14px";

    const barWrap = item.createDiv();
    barWrap.style.height = "38px";
    barWrap.style.display = "flex";
    barWrap.style.alignItems = "stretch";

    const bar = barWrap.createDiv();
    bar.style.width = `${Math.max(14, (stat.averageDays / maxDays) * 100)}%`;
    bar.style.height = "100%";
    bar.style.borderRadius = "6px";
    bar.style.background = ctx.getCategoryColor(stat.category);
    bar.style.boxShadow = "0 10px 22px rgba(0,0,0,0.16)";

    const label = item.createDiv();
    label.style.display = "flex";
    label.style.flexDirection = "column";
    label.style.gap = "4px";
    label.style.minWidth = "82px";

    const category = label.createDiv({ text: ctx.getCategoryLabel(stat.category) });
    category.style.fontSize = "19px";
    category.style.fontWeight = "950";
    category.style.lineHeight = "1.1";
    category.style.color = "var(--text-normal)";

    const days = label.createDiv();
    days.style.fontSize = "22px";
    days.style.fontWeight = "950";
    days.style.lineHeight = "1.05";
    days.style.color = "var(--text-normal)";
    days.style.display = "flex";
    ctx.renderSlotNumber(days.createSpan(), `${stat.averageDays}天`);
  });
}

// -------------------------------------------------------------------------
// Pure asset-math helpers used by the trend / usage cards.
// -------------------------------------------------------------------------

function getStatsTrendPoints(assets: Asset[], mode: "value" | "daily"): Array<{ date: string; value: number }> {
  const todayDate = parseLocalDate(getTodayISODate());

  if (!todayDate) {
    return [];
  }

  const dateSet = new Set<string>();

  assets.forEach((asset) => {
    addTrendDate(dateSet, asset.buy_date, todayDate);
  });

  return Array.from(dateSet)
    .sort((a, b) => (parseLocalDate(a)?.getTime() ?? 0) - (parseLocalDate(b)?.getTime() ?? 0))
    .map((date) => ({
      date,
      value: mode === "value" ? getTotalAssetValueOnDate(assets, date) : getTotalDailyCostOnDate(assets, date),
    }));
}

function addTrendDate(dateSet: Set<string>, dateValue: string | undefined, today: Date): void {
  if (!dateValue) {
    return;
  }

  const date = parseLocalDate(dateValue);

  if (!date || date.getTime() > today.getTime()) {
    return;
  }

  dateSet.add(formatLocalDate(date));
}

function getAssetTotalCostOnDate(asset: Asset, date: Date): number {
  const accessoryTotal = (asset.accessories ?? [])
    .filter((accessory) => {
      const buyDate = parseLocalDate(accessory.buy_date);
      return accessory.include_total && buyDate && buyDate.getTime() <= date.getTime();
    })
    .reduce((sum, accessory) => sum + accessory.price, 0);

  return asset.price + accessoryTotal;
}

function getAssetNetCostOnDate(asset: Asset, date: Date): number {
  return getAssetStatus(asset) === "sold"
    ? getAssetTotalCostOnDate(asset, date) - (asset.lifecycle?.sold_price ?? 0)
    : getAssetTotalCostOnDate(asset, date);
}

function getTotalAssetValueOnDate(assets: Asset[], dateValue: string): number {
  const date = parseLocalDate(dateValue);

  if (!date) {
    return 0;
  }

  return assets.reduce((sum, asset) => {
    const buyDate = parseLocalDate(asset.buy_date);
    const endDate = parseLocalDate(getAssetEndDateValue(asset));

    if (!buyDate || !endDate || buyDate.getTime() > date.getTime() || date.getTime() > endDate.getTime()) {
      return sum;
    }

    return sum + (date.getTime() >= endDate.getTime() ? getAssetNetCostOnDate(asset, date) : getAssetTotalCostOnDate(asset, date));
  }, 0);
}

function getTotalDailyCostOnDate(assets: Asset[], dateValue: string): number {
  const date = parseLocalDate(dateValue);

  if (!date) {
    return 0;
  }

  return assets.reduce((sum, asset) => {
    const buyDate = parseLocalDate(asset.buy_date);
    const endDate = parseLocalDate(getAssetEndDateValue(asset));

    if (!buyDate || !endDate || buyDate.getTime() > date.getTime() || date.getTime() > endDate.getTime()) {
      return sum;
    }

    const effectiveEndDate = date.getTime() > endDate.getTime() ? endDate : date;
    const days = Math.max(1, Math.floor((effectiveEndDate.getTime() - buyDate.getTime()) / (1000 * 3600 * 24)) + 1);
    const cost = date.getTime() >= endDate.getTime()
      ? getAssetNetCostOnDate(asset, date)
      : getAssetTotalCostOnDate(asset, date);

    return sum + cost / days;
  }, 0);
}

function getCategoryAverageUsageStats(assets: Asset[]): Array<{ category: string; averageDays: number }> {
  const map = new Map<string, { totalDays: number; count: number }>();

  assets.forEach((asset) => {
    const current = map.get(asset.category) ?? { totalDays: 0, count: 0 };
    current.totalDays += getUsedDays(asset);
    current.count += 1;
    map.set(asset.category, current);
  });

  return Array.from(map.entries())
    .map(([category, value]) => ({
      category,
      averageDays: value.count > 0 ? Math.round(value.totalDays / value.count) : 0,
    }))
    .sort((a, b) => b.averageDays - a.averageDays);
}
