import { notify } from "@core";
import type { Asset } from "@core/types";
import { BulkCategoryModal } from "../modals/bulkCategoryModal";
import type { MainViewContext } from "../view/viewContext";

/**
 * Bulk-selection action bar rendered on top of the assets grid when
 * `ctx.bulkSelectionMode` is true.
 *
 * Extracted 1:1 from `ObsiWealthMainView` without behavioural change.
 */
export function renderBulkSelectionBar(
  ctx: MainViewContext,
  el: HTMLElement,
  assets: Asset[],
): void {
  if (!ctx.bulkSelectionMode) {
    return;
  }

  const bar = el.createDiv();
  bar.style.display = "flex";
  bar.style.flexWrap = "wrap";
  bar.style.alignItems = "center";
  bar.style.gap = "8px";
  bar.style.margin = "0 0 14px";
  bar.style.padding = "12px";
  bar.style.borderRadius = "16px";
  bar.style.background = "var(--background-secondary)";
  bar.style.border = "1px solid var(--background-modifier-border)";

  const summary = bar.createSpan({ text: `${ctx.tr("selectedAssets")}: ${ctx.selectedAssetIds.size}` });
  summary.style.fontSize = "14px";
  summary.style.fontWeight = "900";
  summary.style.color = "var(--text-muted)";

  createBulkBarButton(bar, "全选", () => {
    assets.forEach((asset) => ctx.selectedAssetIds.add(asset.id));
    ctx.render();
  });

  createBulkBarButton(bar, "取消", () => {
    ctx.bulkSelectionMode = false;
    ctx.selectedAssetIds.clear();
    ctx.render();
  });

  createBulkBarButton(bar, ctx.tr("delete"), async () => {
    await deleteSelectedAssets(ctx);
  }, true);

  createBulkBarButton(bar, "修改分类", () => {
    new BulkCategoryModal(ctx.app, ctx.plugin, Array.from(ctx.selectedAssetIds), () => {
      ctx.bulkSelectionMode = false;
      ctx.selectedAssetIds.clear();
      ctx.render();
    }).open();
  });
}

function createBulkBarButton(
  parent: HTMLElement,
  text: string,
  onClick: () => void | Promise<void>,
  danger = false,
): void {
  const button = parent.createEl("button", { text });
  button.style.border = "1px solid var(--background-modifier-border)";
  button.style.borderRadius = "999px";
  button.style.padding = "7px 14px";
  button.style.cursor = "pointer";
  button.style.fontSize = "13px";
  button.style.fontWeight = "900";
  button.style.background = danger ? "#ef4444" : "var(--background-primary)";
  button.style.color = danger ? "#fff" : "var(--text-normal)";
  button.onclick = async () => {
    await onClick();
  };
}

async function deleteSelectedAssets(ctx: MainViewContext): Promise<void> {
  if (ctx.selectedAssetIds.size === 0) {
    notify(ctx.tr("noAssetsToEdit"));
    return;
  }

  if (!confirm(`删除 ${ctx.selectedAssetIds.size} 个资产？`)) {
    return;
  }

  const selectedIds = new Set(ctx.selectedAssetIds);
  ctx.plugin.assets = ctx.plugin.assets.filter((asset) => !selectedIds.has(asset.id));
  await ctx.plugin.saveAssets();
  ctx.bulkSelectionMode = false;
  ctx.selectedAssetIds.clear();
  ctx.plugin.refreshViews();
  notify(ctx.tr("updated"));
}
