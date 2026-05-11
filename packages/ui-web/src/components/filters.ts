import type { MainViewContext } from "../view/viewContext";
import { SortModal } from "../modals/sortModal";
import { defaultCategoryLabel } from "@core/i18n";

/**
 * Top filter bar of the assets page.
 *
 * - First row: horizontal tabs for category filter (with multi-select support)
 * - Second row: status filter pills + sort button + bulk edit toggle
 *
 * Extracted 1:1 from `ObsiWealthMainView` without behavioural change.
 */
export function renderFilters(ctx: MainViewContext, el: HTMLElement): void {
  const wrapper = el.createDiv();
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.gap = "10px";
  wrapper.style.margin = "0 0 12px";
  wrapper.style.background = "var(--background-primary)";

  renderCategoryFilterRow(ctx, wrapper);

  renderFilterRow(
    ctx,
    wrapper,
    ["all", "active", "sold", "retired", "appreciated"],
    ctx.statusFilter,
    (value) => {
      ctx.statusFilter = value as typeof ctx.statusFilter;
      ctx.render();
    },
    true,
  );
}

function renderCategoryFilterRow(ctx: MainViewContext, parent: HTMLElement): void {
  const row = parent.createDiv();
  row.style.display = "flex";
  row.style.flexWrap = "wrap";
  row.style.gap = "16px";
  row.style.alignItems = "center";
  row.style.marginBottom = "2px";

  getCategoryFilters(ctx).forEach((value) => {
    const active = value === "all"
      ? ctx.selectedCategoryFilters.size === 0
      : ctx.selectedCategoryFilters.has(value);
    renderCategoryFilterButton(ctx, row, value, active, () => {
      if (value === "all") {
        ctx.selectedCategoryFilters.clear();
      } else if (ctx.selectedCategoryFilters.has(value)) {
        ctx.selectedCategoryFilters.delete(value);
      } else {
        ctx.selectedCategoryFilters.add(value);
      }

      ctx.categoryFilter = ctx.selectedCategoryFilters.size === 0
        ? "all"
        : Array.from(ctx.selectedCategoryFilters)[0];
      ctx.render();
    });
  });
}

function renderFilterRow(
  ctx: MainViewContext,
  parent: HTMLElement,
  values: string[],
  activeValue: string,
  onSelect: (value: string) => void,
  showSort = false,
): void {
  const row = parent.createDiv();
  row.style.display = "flex";
  row.style.flexWrap = "wrap";
  row.style.gap = "8px";
  row.style.alignItems = "center";

  values.forEach((value) => {
    renderFilterButton(ctx, row, value, value === activeValue, () => onSelect(value));
  });

  if (showSort) {
    const spacer = row.createDiv();
    spacer.style.flex = "1 1 auto";

    const sortBtn = ctx.createFundToolbarButton(row, "sortShuffle", "排序", "ghost");
    sortBtn.onclick = () => {
      new SortModal(ctx.app, ctx.sortField, ctx.sortDirection, (field, direction) => {
        ctx.sortField = field;
        ctx.sortDirection = direction;
        ctx.render();
      }).open();
    };

    const bulkBtn = ctx.createFundToolbarButton(row, "checklist", ctx.tr("bulkEdit"), "ghost");
    bulkBtn.onclick = () => {
      ctx.bulkSelectionMode = !ctx.bulkSelectionMode;
      ctx.selectedAssetIds.clear();
      ctx.render();
    };
  }
}

function renderCategoryFilterButton(
  ctx: MainViewContext,
  parent: HTMLElement,
  value: string,
  active: boolean,
  onClick: () => void,
): void {
  const button = parent.createEl("button", { text: getFilterLabel(ctx, value) });
  button.style.border = "0";
  button.style.borderBottom = active ? "3px solid var(--interactive-accent)" : "3px solid transparent";
  button.style.borderRadius = "0";
  button.style.padding = "3px 2px 7px";
  button.style.cursor = "pointer";
  button.style.fontSize = active ? "20px" : "18px";
  button.style.lineHeight = "1.1";
  button.style.background = "transparent";
  button.style.color = active ? "var(--text-normal)" : "var(--text-muted)";
  button.style.fontWeight = active ? "950" : "850";
  button.style.boxShadow = "none";
  button.onclick = onClick;
}

function renderFilterButton(
  ctx: MainViewContext,
  parent: HTMLElement,
  value: string,
  active: boolean,
  onClick: () => void,
): void {
  const button = parent.createEl("button", { text: getFilterLabel(ctx, value) });
  button.style.border = active
    ? "1px solid var(--interactive-accent)"
    : "1px solid var(--background-modifier-border)";
  button.style.borderRadius = "999px";
  button.style.padding = "7px 16px";
  button.style.cursor = "pointer";
  button.style.fontSize = "14px";
  button.style.lineHeight = "1";
  button.style.background = active ? "var(--interactive-accent)" : "var(--background-primary)";
  button.style.color = active ? "var(--text-on-accent)" : "var(--text-normal)";
  button.style.fontWeight = active ? "900" : "800";
  button.style.boxShadow = active ? "0 8px 18px rgba(0,0,0,0.14)" : "0 4px 12px rgba(0,0,0,0.06)";

  button.onclick = onClick;
}

function getCategoryFilters(ctx: MainViewContext): string[] {
  const categories = new Set<string>();

  ctx.plugin.settings.categories.forEach((category) => categories.add(category.id));
  ctx.plugin.assets.forEach((asset) => {
    if (asset.category) {
      categories.add(asset.category);
    }
  });

  return ["all", ...Array.from(categories)];
}

function getFilterLabel(ctx: MainViewContext, value: string): string {
  const labels: Record<string, string> = {
    all: ctx.tr("all"),
    active: ctx.tr("active"),
    retired: ctx.tr("retired"),
    sold: ctx.tr("sold"),
    appreciated: "已升值",
  };
  const category = ctx.plugin.settings.categories.find((item) => item.id === value);

  return labels[value] ?? category?.name ?? defaultCategoryLabel(ctx.plugin.settings.language, value);
}
