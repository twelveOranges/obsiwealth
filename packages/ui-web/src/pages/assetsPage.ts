import type { Asset } from "@core/types";
import type { MainViewContext } from "../view/viewContext";
import {
  getAssetStatus,
  getAssetTotalCost,
  getDailyCost,
  getNetAssetCost,
  isAssetAppreciated,
} from "@core/calc/assetMath";
import { findIcon } from "../icons";
import { getIconPath } from "../iconResolver";
import { sortAssets } from "@core/calc/assetSorting";
import { renderFilters } from "../components/filters";
import { renderBulkSelectionBar } from "../components/bulkBar";
import { AssetDetailModal } from "../modals/assetDetailModal";
import { AssetModal } from "../modals/assetModal";

/**
 * Render the Assets page (sticky overview + filters + bulk bar, then the
 * asset grid + "add" card).
 *
 * Extracted verbatim from `ObsiWealthMainView.renderAssetsPage` and its
 * helper methods; `this.xxx` references became `ctx.xxx`.
 */
export function renderAssetsPage(ctx: MainViewContext, el: HTMLElement): void {
  const assets = sortAssets(getFilteredAssets(ctx), ctx.sortField, ctx.sortDirection);

  // 顶部固定栏：overviewCard + filters + bulkbar 整体 sticky
  const topBar = el.createDiv();
  topBar.style.position = "sticky";
  topBar.style.top = "0";
  topBar.style.zIndex = "5";
  topBar.style.background = "var(--background-primary)";
  topBar.style.paddingBottom = "2px";

  renderOverviewCard(ctx, topBar, assets);
  renderFilters(ctx, topBar);
  renderBulkSelectionBar(ctx, topBar, assets);

  const grid = el.createDiv();
  ctx.applyGridStyle(grid);

  assets.forEach((asset) => renderAssetCard(ctx, grid, asset));

  if (!ctx.bulkSelectionMode) {
    renderAddCard(ctx, grid);
  }
}

export function getFilteredAssets(ctx: MainViewContext): Asset[] {
  return ctx.plugin.assets.filter((asset) => {
    const matchCategory = ctx.selectedCategoryFilters.size === 0 || ctx.selectedCategoryFilters.has(asset.category);
    const matchStatus = ctx.statusFilter === "all"
      || (ctx.statusFilter === "appreciated" ? isAssetAppreciated(asset) : getAssetStatus(asset) === ctx.statusFilter);

    return matchCategory && matchStatus;
  });
}

function renderOverviewCard(ctx: MainViewContext, el: HTMLElement, assets: Asset[]): HTMLElement {
  const totalValue = assets
    .filter((asset) => !asset.flags?.exclude_total)
    .reduce((sum, asset) => sum + getNetAssetCost(asset), 0);
  const dailyCost = assets
    .filter((asset) => !asset.flags?.exclude_daily)
    .reduce((sum, asset) => sum + getDailyCost(asset), 0);
  const activeCount = assets.filter((asset) => getAssetStatus(asset) === "active").length;
  const retiredCount = assets.filter((asset) => getAssetStatus(asset) === "retired").length;
  const soldCount = assets.filter((asset) => getAssetStatus(asset) === "sold").length;

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

  const title = card.createDiv();
  title.innerText = ctx.tr("overview");
  title.style.fontSize = "22px";
  title.style.fontWeight = "950";
  title.style.letterSpacing = "0.01em";
  title.style.marginBottom = "18px";
  title.style.color = "var(--text-normal)";

  const metrics = card.createDiv();
  metrics.style.display = "grid";
  metrics.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
  metrics.style.gap = "14px";
  metrics.style.marginBottom = "20px";

  renderOverviewMetric(ctx, metrics, ctx.tr("totalAssets"), ctx.displayCurrency(totalValue), true);
  renderOverviewMetric(
    ctx,
    metrics,
    ctx.tr("dailyCost"),
    `${ctx.displayCurrency(dailyCost)} / ${ctx.tr("perDay")}`,
    true,
  );

  const bars = card.createDiv();
  bars.style.display = "grid";
  bars.style.gridTemplateColumns = "repeat(3, minmax(0, 1fr))";
  bars.style.gap = "12px";

  renderOverviewBar(ctx, bars, ctx.getStatusLabel("active"), activeCount, assets.length, ctx.getStatusColor("active"));
  renderOverviewBar(ctx, bars, ctx.getStatusLabel("sold"), soldCount, assets.length, ctx.getStatusColor("sold"));
  renderOverviewBar(ctx, bars, ctx.getStatusLabel("retired"), retiredCount, assets.length, ctx.getStatusColor("retired"));

  return card;
}

function renderOverviewMetric(
  ctx: MainViewContext,
  parent: HTMLElement,
  label: string,
  value: string,
  animate = false,
): void {
  const item = parent.createDiv();
  item.style.padding = "16px 18px";
  item.style.borderRadius = "18px";
  item.style.background = "var(--background-primary)";
  item.style.border = "1px solid var(--background-modifier-border)";
  item.style.boxShadow = "0 8px 18px rgba(0,0,0,0.08)";

  const labelEl = item.createDiv();
  labelEl.innerText = label;
  labelEl.style.fontSize = "15px";
  labelEl.style.fontWeight = "900";
  labelEl.style.color = "var(--text-muted)";
  labelEl.style.marginBottom = "10px";

  const valueEl = item.createDiv();
  valueEl.style.fontSize = "34px";
  valueEl.style.fontWeight = "950";
  valueEl.style.lineHeight = "1.05";
  valueEl.style.color = "var(--text-normal)";

  if (animate) {
    ctx.renderSlotNumber(valueEl, value);
    return;
  }

  valueEl.innerText = value;
}

function renderOverviewBar(
  ctx: MainViewContext,
  parent: HTMLElement,
  label: string,
  count: number,
  total: number,
  color: string,
): void {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
  const item = parent.createDiv();

  const header = item.createDiv();
  header.style.display = "flex";
  header.style.justifyContent = "space-between";
  header.style.alignItems = "center";
  header.style.marginBottom = "8px";

  const labelEl = header.createSpan();
  labelEl.style.fontSize = "15px";
  labelEl.style.fontWeight = "900";
  labelEl.style.color = "var(--text-normal)";
  labelEl.style.display = "inline-flex";
  ctx.renderSlotNumber(labelEl.createSpan(), `${label} ${count}`);

  const valueEl = header.createSpan();
  valueEl.style.fontSize = "15px";
  valueEl.style.fontWeight = "950";
  valueEl.style.color = "var(--text-normal)";
  valueEl.style.display = "inline-flex";
  ctx.renderSlotNumber(valueEl.createSpan(), `${percent}%`);

  const track = item.createDiv();
  track.style.height = "10px";
  track.style.borderRadius = "999px";
  track.style.background = "var(--background-modifier-border)";
  track.style.overflow = "hidden";

  const bar = track.createDiv();
  bar.style.width = `${percent}%`;
  bar.style.height = "100%";
  bar.style.borderRadius = "999px";
  bar.style.background = color;
}

function renderAssetCard(ctx: MainViewContext, grid: HTMLElement, asset: Asset): void {
  const card = grid.createDiv();
  ctx.applyCardStyle(card);
  card.dataset.assetId = asset.id;

  card.onclick = () => {
    if (ctx.bulkSelectionMode) {
      toggleSelectedAsset(ctx, asset.id);
      return;
    }

    new AssetDetailModal(ctx.app, ctx.plugin, asset).open();
  };

  card.ondragover = (event) => {
    event.preventDefault();
    card.style.outline = "2px solid var(--interactive-accent)";
  };

  card.ondragleave = () => {
    card.style.outline = "";
  };

  card.ondrop = async (event) => {
    event.preventDefault();
    card.style.outline = "";
    const draggedId = event.dataTransfer?.getData("text/plain");

    if (draggedId && draggedId !== asset.id) {
      await moveAssetBefore(ctx, draggedId, asset.id);
    }
  };

  renderDragHandle(ctx, card, asset);
  renderSelectionCheckbox(ctx, card, asset);
  renderActions(ctx, card, asset);
  renderIcon(ctx, card, asset);
  renderAssetInfo(ctx, card, asset);
  renderStatus(ctx, card, asset);
}

function renderDragHandle(ctx: MainViewContext, card: HTMLElement, asset: Asset): void {
  const handle = card.createDiv({ text: "⠿" });
  handle.title = "拖动排序";
  handle.style.position = "absolute";
  handle.style.left = "8px";
  handle.style.top = "8px";
  handle.style.width = "30px";
  handle.style.height = "30px";
  handle.style.display = "flex";
  handle.style.alignItems = "center";
  handle.style.justifyContent = "center";
  handle.style.borderRadius = "10px";
  handle.style.background = "var(--background-primary)";
  handle.style.border = "1px solid var(--background-modifier-border)";
  handle.style.color = "var(--text-muted)";
  handle.style.fontSize = "18px";
  handle.style.fontWeight = "950";
  handle.style.cursor = "grab";
  handle.style.zIndex = "2";
  handle.style.opacity = "0";
  handle.style.transition = "opacity 0.15s";
  card.addEventListener("mouseenter", () => {
    handle.style.opacity = "1";
  });
  card.addEventListener("mouseleave", () => {
    handle.style.opacity = "0";
  });
  handle.draggable = true;
  handle.onclick = (event) => event.stopPropagation();
  handle.ondragstart = (event) => {
    event.stopPropagation();
    card.style.opacity = "0.55";
    event.dataTransfer?.setData("text/plain", asset.id);
    event.dataTransfer?.setDragImage(card, 20, 20);
  };
  handle.ondragend = () => {
    card.style.opacity = "1";
  };
  void ctx;
}

function renderSelectionCheckbox(ctx: MainViewContext, card: HTMLElement, asset: Asset): void {
  if (!ctx.bulkSelectionMode) {
    return;
  }

  const checkbox = card.createEl("input");
  checkbox.type = "checkbox";
  checkbox.checked = ctx.selectedAssetIds.has(asset.id);
  checkbox.style.position = "absolute";
  checkbox.style.left = "10px";
  checkbox.style.bottom = "10px";
  checkbox.style.width = "22px";
  checkbox.style.height = "22px";
  checkbox.style.zIndex = "3";
  checkbox.onclick = (event) => {
    event.stopPropagation();
    toggleSelectedAsset(ctx, asset.id);
  };
}

function toggleSelectedAsset(ctx: MainViewContext, id: string): void {
  if (ctx.selectedAssetIds.has(id)) {
    ctx.selectedAssetIds.delete(id);
  } else {
    ctx.selectedAssetIds.add(id);
  }

  ctx.render();
}

async function moveAssetBefore(ctx: MainViewContext, draggedId: string, targetId: string): Promise<void> {
  const draggedIndex = ctx.plugin.assets.findIndex((asset) => asset.id === draggedId);
  const targetIndex = ctx.plugin.assets.findIndex((asset) => asset.id === targetId);

  if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
    return;
  }

  const nextAssets = [...ctx.plugin.assets];
  const [dragged] = nextAssets.splice(draggedIndex, 1);
  const nextTargetIndex = nextAssets.findIndex((asset) => asset.id === targetId);
  nextAssets.splice(nextTargetIndex, 0, dragged);
  ctx.plugin.assets = nextAssets;
  ctx.sortField = "manual";
  await ctx.plugin.saveAssets();
  ctx.plugin.refreshViews();
}

function renderActions(ctx: MainViewContext, card: HTMLElement, asset: Asset): void {
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
    new AssetModal(ctx.app, ctx.plugin, asset).open();
  });

  ctx.createActionButton(actions, "⌫", ctx.tr("delete"), async () => {
    if (confirm(ctx.tr("deleteConfirm", { name: asset.name }))) {
      await ctx.plugin.deleteAsset(asset.id);
    }
  }, true);
}

function renderIcon(ctx: MainViewContext, card: HTMLElement, asset: Asset): void {
  const iconWrap = card.createDiv();
  iconWrap.style.display = "flex";
  iconWrap.style.alignItems = "center";
  iconWrap.style.justifyContent = "center";
  iconWrap.style.width = "96px";
  iconWrap.style.height = "96px";
  iconWrap.style.flexShrink = "0";
  iconWrap.style.overflow = "visible";

  const icon = findIcon(asset.icon);

  if (!icon) {
    iconWrap.setText("📦");
    iconWrap.style.fontSize = "69px";
    iconWrap.style.lineHeight = "1";
    return;
  }

  const img = iconWrap.createEl("img");
  img.src = getIconPath(icon.id);
  img.alt = icon.name;
  img.style.width = "93px";
  img.style.height = "93px";
  img.style.maxWidth = "93px";
  img.style.maxHeight = "93px";
  img.style.objectFit = "contain";
  img.style.display = "block";
}

function renderAssetInfo(ctx: MainViewContext, card: HTMLElement, asset: Asset): void {
  const center = card.createDiv();
  center.style.flex = "1";
  center.style.display = "flex";
  center.style.flexDirection = "column";
  center.style.justifyContent = "center";
  center.style.gap = "6px";
  center.style.marginLeft = "6px";

  const title = center.createDiv();
  title.innerText = asset.name;
  title.style.fontSize = "21px";
  title.style.fontWeight = "650";
  title.style.color = "var(--text-normal)";
  title.style.whiteSpace = "nowrap";
  title.style.overflow = "hidden";
  title.style.textOverflow = "ellipsis";

  const row2 = center.createDiv();
  row2.style.display = "flex";
  row2.style.alignItems = "center";
  row2.style.flexWrap = "nowrap";
  row2.style.whiteSpace = "nowrap";
  row2.style.gap = "6px";
  row2.style.fontSize = "18px";
  row2.style.color = "var(--text-muted)";
  renderAssetCost(ctx, row2, asset);
  row2.createSpan({ text: `｜ ${ctx.tr("used")} ` });
  const usageSpan = row2.createSpan();
  usageSpan.style.display = "inline-flex";
  ctx.renderSlotNumber(usageSpan, ctx.getAssetUsageText(asset));

  const row3 = center.createDiv();
  row3.style.fontSize = "22px";
  row3.style.fontWeight = "750";
  row3.style.color = "var(--text-normal)";
  row3.style.display = "flex";
  row3.style.flexWrap = "nowrap";
  row3.style.whiteSpace = "nowrap";
  // 资产卡片里的金额数字：小数位不再缩小（与整数位同大小）
  ctx.renderSlotNumber(
    row3.createSpan(),
    `${ctx.displayCurrency(getDailyCost(asset))} / ${ctx.tr("perDay")}`,
    false,
  );
}

function renderAssetCost(ctx: MainViewContext, parent: HTMLElement, asset: Asset): void {
  const totalCost = getAssetTotalCost(asset);

  if (getAssetStatus(asset) !== "sold") {
    const span = parent.createSpan();
    span.style.display = "inline-flex";
    ctx.renderSlotNumber(span, ctx.displayCurrency(totalCost), false);
    return;
  }

  const original = parent.createSpan();
  original.style.textDecoration = "line-through";
  original.style.opacity = "0.62";
  original.style.display = "inline-flex";
  ctx.renderSlotNumber(original, ctx.displayCurrency(totalCost), false);

  const net = parent.createSpan();
  net.style.color = "var(--text-normal)";
  net.style.fontWeight = "850";
  net.style.display = "inline-flex";
  ctx.renderSlotNumber(net, ctx.displayCurrency(getNetAssetCost(asset)), false);
}

function renderStatus(ctx: MainViewContext, card: HTMLElement, asset: Asset): void {
  const status = card.createDiv();
  const state = getAssetStatus(asset);

  status.style.display = "flex";
  status.style.alignItems = "center";
  status.style.gap = "9px";
  status.style.flexShrink = "0";
  status.style.padding = "9px 15px";
  status.style.borderRadius = "15px";
  status.style.background = "var(--background-primary)";
  status.style.border = "1px solid var(--background-modifier-border)";
  status.style.color = "var(--text-muted)";
  status.style.fontSize = "18px";
  status.style.fontWeight = "750";
  status.style.whiteSpace = "nowrap";

  const dot = status.createSpan();
  dot.style.width = "14px";
  dot.style.height = "14px";
  dot.style.borderRadius = "999px";
  dot.style.background = ctx.getStatusColor(state);
  dot.style.boxShadow = `0 0 0 3px ${ctx.getStatusShadowColor(state)}`;

  const label = status.createSpan();
  label.innerText = ctx.getStatusLabel(state);
}

function renderAddCard(ctx: MainViewContext, grid: HTMLElement): void {
  const addCard = grid.createDiv();
  addCard.style.border = "2px dashed var(--background-modifier-border)";
  addCard.style.borderRadius = "14px";
  addCard.style.display = "flex";
  addCard.style.alignItems = "center";
  addCard.style.justifyContent = "center";
  addCard.style.cursor = "pointer";
  addCard.style.minHeight = "120px";
  addCard.innerHTML = `<div style="font-size:32px;opacity:0.5">+</div>`;

  addCard.onclick = () => {
    new AssetModal(ctx.app, ctx.plugin).open();
  };
}
