import { notify } from "@core";
import { DEFAULT_FUND_CATEGORY_ID, FUND_CATEGORIES } from "@core/types";
import type { FundCategory, FundItem } from "@core/types";
import type { MainViewContext } from "../view/viewContext";
import { renderStatsLineChart } from "../charts/lineChart";
import { renderFundNetAssetBarCard } from "../charts/barChart";
import { renderFundPieCard } from "../charts/donutChart";
import {
  getAvailableFundYears,
  getFundAssetTotal,
  getFundEffectiveAmount,
  getFundLiabilityTotal,
  getFundMonthlySeries,
} from "@core/calc/fundStats";
import { getFundCategory } from "@core/calc/fundCategory";
import { attachLongPressDrag, persistFundReorder } from "../fund/fundReorder";
import { renderStatsGranularityToggle, applyFundStatsPillStyle, mountFundStatsHeaderExtra } from "../view/viewStyles";
import {
  getFundPrimaryLabel,
  getFundSecondaryLabel,
  renderFundLogoInto,
} from "../fund/fundLogo";
import { FundCategoryPickerModal } from "../modals/fundCategoryPickerModal";
import { FundDetailModal } from "../modals/fundDetailModal";
import { FundModal } from "../modals/fundModal";

/** Sort mode for the funds list; shared with viewContext. */
export type FundSortMode = "grouped" | "desc" | "asc";

/**
 * Render the Funds page (net asset hero + left/right two-column layout).
 *
 * Extracted verbatim from `ObsiWealthMainView.renderFundsPage` without any
 * behavioural change. Internal `this.xxx` references became `ctx.xxx` and
 * pure helpers are imported from their dedicated modules.
 */
export function renderFundsPage(ctx: MainViewContext, el: HTMLElement): void {
  // 主容器改为 flex 纵向 + 禁止自身滚动，由内部子列自己滚
  el.style.overflow = "hidden";
  el.style.paddingBottom = "0";
  el.style.display = "flex";
  el.style.flexDirection = "column";
  el.style.minHeight = "0";

  const assetTotal = getFundAssetTotal(ctx.plugin);
  const liabilityTotal = getFundLiabilityTotal(ctx.plugin);
  const netAsset = assetTotal - liabilityTotal;
  renderFundNetSummaryCard(ctx, el, { netAsset, assetTotal, liabilityTotal });

  // 下方两栏：左=账户列表 右=图表，两列独立滚动
  const columns = el.createDiv();
  columns.style.display = "grid";
  columns.style.gridTemplateColumns = "minmax(0, 1fr) 1px minmax(0, 1fr)";
  columns.style.gap = "18px";
  columns.style.alignItems = "stretch";
  columns.style.flex = "1 1 auto";
  columns.style.minHeight = "0";
  columns.style.overflow = "hidden";
  columns.style.paddingBottom = "80px";

  const leftCol = columns.createDiv();
  leftCol.style.minWidth = "0";
  leftCol.style.minHeight = "0";
  leftCol.style.overflowY = "auto";
  leftCol.style.overflowX = "hidden";
  leftCol.style.paddingRight = "4px";
  (leftCol.style as CSSStyleDeclaration & { overscrollBehavior?: string }).overscrollBehavior = "contain";

  const divider = columns.createDiv();
  divider.style.alignSelf = "stretch";
  divider.style.width = "0";
  divider.style.borderLeft = "1px dashed var(--background-modifier-border)";

  const rightCol = columns.createDiv();
  rightCol.style.minWidth = "0";
  rightCol.style.minHeight = "0";
  rightCol.style.overflowY = "auto";
  rightCol.style.overflowX = "hidden";
  rightCol.style.paddingRight = "4px";
  (rightCol.style as CSSStyleDeclaration & { overscrollBehavior?: string }).overscrollBehavior = "contain";

  // 左列：工具栏 + 列表
  renderFundSortToolbar(ctx, leftCol);

  const sectionWrap = leftCol.createDiv();
  sectionWrap.style.display = "grid";
  sectionWrap.style.gridTemplateColumns = "1fr";
  sectionWrap.style.gap = "10px";

  if (ctx.fundSortMode === "grouped") {
    FUND_CATEGORIES.forEach((category) => renderFundCategorySection(ctx, sectionWrap, category));
  } else {
    renderFundFlatList(ctx, sectionWrap);
  }

  // 右列：图表 tab + 图表内容
  renderFundStatsInline(ctx, rightCol);
}

function renderFundStatsInline(ctx: MainViewContext, parent: HTMLElement): void {
  renderFundStatsTabs(ctx, parent);

  const tab = ctx.fundStatsTab;
  const heroTitle = tab === "asset" ? "资金" : tab === "liability" ? "负债" : "净资金";

  const statsGrid = parent.createDiv();
  statsGrid.style.display = "grid";
  statsGrid.style.gridTemplateColumns = "minmax(0, 1fr)";
  statsGrid.style.gap = "0";
  statsGrid.style.marginTop = "12px";
  statsGrid.style.alignItems = "stretch";

  const addDivider = () => {
    const div = statsGrid.createDiv();
    div.style.borderTop = "1px dashed var(--background-modifier-border)";
    div.style.margin = "6px 2px";
  };

  if (tab === "netAsset") {
    const trendCard = ctx.createFundStatsCard(statsGrid, `${heroTitle}趋势`);
    renderFundTrendWithRangePicker(ctx, trendCard, tab);

    addDivider();
    renderFundNetAssetBarCard(ctx, statsGrid);
    return;
  }

  const heroValue = tab === "asset" ? getFundAssetTotal(ctx.plugin) : getFundLiabilityTotal(ctx.plugin);

  const trendCard = ctx.createFundStatsCard(statsGrid, `${heroTitle}趋势`);
  renderFundTrendWithRangePicker(ctx, trendCard, tab);

  addDivider();
  renderFundPieCard(ctx, statsGrid, tab, heroTitle, heroValue);

  addDivider();
  renderFundRankingCard(ctx, statsGrid, tab, heroTitle);
}

function renderFundTrendWithRangePicker(
  ctx: MainViewContext,
  body: HTMLElement,
  tab: "asset" | "liability" | "netAsset",
): void {
  const years = getAvailableFundYears(ctx.plugin, tab);
  const select = document.createElement("select");
  applyFundStatsPillStyle(select);
  // Remove the browser's built-in <select> arrow so the range picker is
  // visually identical to the sibling "汇总 / 详细" pill button (flat, no
  // chevron). The dropdown still opens on click – we just hide the arrow.
  select.style.appearance = "none";
  (select.style as CSSStyleDeclaration & { webkitAppearance?: string }).webkitAppearance = "none";
  (select.style as CSSStyleDeclaration & { mozAppearance?: string }).mozAppearance = "none";
  // Keep horizontal padding symmetric now that the arrow is gone.
  select.style.paddingRight = "10px";
  select.style.backgroundImage = "none";
  select.style.textAlignLast = "center";

  const addOption = (value: string, label: string) => {
    const opt = document.createElement("option");
    opt.textContent = label;
    opt.value = value;
    select.appendChild(opt);
    return opt;
  };
  addOption("recent", "最近");
  addOption("all", "全部");
  // Most recent year first so the dropdown reads naturally.
  [...years].reverse().forEach((year) => addOption(year, `${year}年`));

  // Keep an option that has disappeared (e.g. the user selected 2023, then
  // all 2023 history was deleted) from crashing the <select> – fall back to
  // "recent" when the current range is no longer valid.
  const valid = ctx.fundTrendRange === "recent"
    || ctx.fundTrendRange === "all"
    || years.indexOf(ctx.fundTrendRange) !== -1;
  if (!valid) {
    ctx.fundTrendRange = "recent";
  }
  select.value = ctx.fundTrendRange;

  select.onchange = () => {
    ctx.fundTrendRange = select.value;
    ctx.render();
  };

  // Mount the range picker into the card header (to the left of the
  // collapse chevron) so all three pickers share the same size & position.
  // Fall back to the old in-body placement if the body isn't a fund stats
  // card (shouldn't happen in practice).
  if (!mountFundStatsHeaderExtra(body, select)) {
    const picker = body.createDiv();
    picker.style.display = "flex";
    picker.style.justifyContent = "flex-end";
    picker.style.alignItems = "center";
    picker.style.gap = "8px";
    picker.style.marginBottom = "6px";
    picker.style.paddingRight = "2px";
    picker.appendChild(select);
  }

  const chartHost = body.createDiv();
  renderStatsLineChart(ctx, chartHost, getFundMonthlySeries(ctx.plugin, tab, ctx.fundTrendRange));
}

function renderFundNetSummaryCard(
  ctx: MainViewContext,
  parent: HTMLElement,
  totals: { netAsset: number; assetTotal: number; liabilityTotal: number },
): void {
  const card = parent.createDiv();
  card.style.padding = "22px 24px";
  card.style.marginBottom = "18px";
  card.style.borderRadius = "24px";
  card.style.background = "linear-gradient(145deg, var(--background-secondary), var(--background-primary))";
  card.style.border = "1px solid var(--background-modifier-border)";
  card.style.boxShadow = "0 16px 38px rgba(0,0,0,0.14)";
  card.style.width = "100%";
  card.style.boxSizing = "border-box";
  card.style.flex = "0 0 auto";
  card.style.display = "flex";
  card.style.alignItems = "center";
  card.style.gap = "24px";

  // --- Segment 1: 净资金 ------------------------------------------------
  const netSeg = card.createDiv();
  netSeg.style.display = "flex";
  netSeg.style.flexDirection = "column";
  netSeg.style.alignItems = "flex-start";
  netSeg.style.gap = "4px";
  netSeg.style.flex = "1 1 0";
  netSeg.style.minWidth = "0";

  const netLabel = netSeg.createDiv({ text: "净资金" });
  netLabel.style.fontSize = "16px";
  netLabel.style.fontWeight = "800";
  netLabel.style.color = "var(--text-muted)";
  netLabel.style.letterSpacing = "0.04em";

  const netValue = netSeg.createDiv();
  netValue.style.fontSize = "38px";
  netValue.style.fontWeight = "950";
  netValue.style.lineHeight = "1.05";
  netValue.style.color = "var(--text-normal)";
  netValue.style.display = "flex";
  netValue.style.alignItems = "baseline";
  ctx.renderSlotNumber(netValue.createSpan(), ctx.displayCurrency(totals.netAsset));

  // --- Segment 2: N 个资金账户 -----------------------------------------
  const accountsSeg = card.createDiv();
  accountsSeg.style.flex = "1 1 0";
  accountsSeg.style.display = "flex";
  accountsSeg.style.flexDirection = "column";
  accountsSeg.style.alignItems = "center";
  accountsSeg.style.justifyContent = "center";
  accountsSeg.style.gap = "2px";
  accountsSeg.style.color = "var(--text-muted)";
  accountsSeg.style.fontWeight = "800";
  accountsSeg.style.minWidth = "0";

  if (ctx.plugin.funds.length <= 0) {
    const empty = accountsSeg.createDiv({ text: "暂无资金账户" });
    empty.style.fontSize = "16px";
  } else {
    const count = accountsSeg.createDiv();
    count.style.fontSize = "30px";
    count.style.fontWeight = "950";
    count.style.lineHeight = "1.05";
    count.style.color = "var(--text-normal)";
    count.style.display = "flex";
    count.style.justifyContent = "center";
    ctx.renderSlotNumber(count.createSpan(), String(ctx.plugin.funds.length));

    const label = accountsSeg.createDiv({ text: "个资金账户" });
    label.style.fontSize = "15px";
    label.style.fontWeight = "700";
    label.style.letterSpacing = "0.04em";
  }

  // --- Segment 3: 资金 | 负债 (dashed divider only here) ---------------
  const rightSeg = card.createDiv();
  rightSeg.style.display = "grid";
  rightSeg.style.gridTemplateColumns = "1fr 1px 1fr";
  rightSeg.style.alignItems = "center";
  rightSeg.style.gap = "16px";
  rightSeg.style.flex = "1 1 0";
  rightSeg.style.minWidth = "0";

  renderFundInlineMetric(ctx, rightSeg, "资金", ctx.displayCurrency(totals.assetTotal), false);

  const divider = rightSeg.createDiv();
  divider.style.alignSelf = "stretch";
  divider.style.width = "0";
  divider.style.borderLeft = "2px dashed var(--background-modifier-border)";
  divider.style.margin = "6px 0";

  renderFundInlineMetric(ctx, rightSeg, "负债", ctx.displayCurrency(totals.liabilityTotal), true);
}

function renderFundInlineMetric(
  ctx: MainViewContext,
  parent: HTMLElement,
  label: string,
  value: string,
  liability: boolean,
): void {
  const wrap = parent.createDiv();
  wrap.style.display = "flex";
  wrap.style.flexDirection = "column";
  wrap.style.alignItems = "center";
  wrap.style.gap = "4px";
  wrap.style.minWidth = "0";

  const labelEl = wrap.createDiv({ text: label });
  labelEl.style.fontSize = "16px";
  labelEl.style.fontWeight = "800";
  labelEl.style.color = "var(--text-muted)";
  labelEl.style.letterSpacing = "0.04em";

  const valueEl = wrap.createDiv();
  valueEl.style.fontSize = "26px";
  valueEl.style.fontWeight = "950";
  valueEl.style.lineHeight = "1.1";
  valueEl.style.color = liability ? "#ef4444" : "var(--text-normal)";
  valueEl.style.display = "flex";
  valueEl.style.justifyContent = "center";
  valueEl.style.maxWidth = "100%";
  valueEl.style.overflow = "hidden";
  valueEl.style.textOverflow = "ellipsis";
  valueEl.style.whiteSpace = "nowrap";
  ctx.renderSlotNumber(valueEl.createSpan(), value);
}

function renderFundSortToolbar(ctx: MainViewContext, el: HTMLElement): void {
  const bar = el.createDiv();
  bar.style.display = "flex";
  bar.style.justifyContent = "flex-end";
  bar.style.alignItems = "center";
  bar.style.gap = "8px";
  bar.style.marginBottom = "10px";
  bar.style.padding = "6px 4px";
  bar.style.background = "var(--background-primary)";
  bar.style.position = "sticky";
  bar.style.top = "0";
  bar.style.zIndex = "3";

  if (ctx.fundBulkMode) {
    const count = ctx.selectedFundIds.size;

    const deleteBtn = bar.createEl("button", { text: `删除所选${count > 0 ? `（${count}）` : ""}` });
    deleteBtn.title = "删除所选资金账户";
    deleteBtn.disabled = count === 0;
    ctx.applyToolbarBtnStyle(deleteBtn, "danger", count === 0);
    deleteBtn.onclick = () => handleBulkDelete(ctx);

    const cancelBtn = bar.createEl("button", { text: "取消" });
    cancelBtn.title = "退出批量选择";
    ctx.applyToolbarBtnStyle(cancelBtn, "ghost");
    cancelBtn.onclick = () => {
      ctx.fundBulkMode = false;
      ctx.selectedFundIds.clear();
      ctx.render();
    };

    return;
  }

  const sortMap: Record<FundSortMode, { icon: string; tip: string }> = {
    grouped: { icon: "sortShuffle", tip: "分类排列（点击切换为降序）" },
    desc: { icon: "sortDesc", tip: "降序（点击切换为升序）" },
    asc: { icon: "sortAsc", tip: "升序（点击恢复分类）" },
  };
  const current = sortMap[ctx.fundSortMode];
  const sortButton = ctx.createFundToolbarButton(bar, current.icon, current.tip, "ghost");
  sortButton.onclick = () => {
    const order: FundSortMode[] = ["grouped", "desc", "asc"];
    const next = order[(order.indexOf(ctx.fundSortMode) + 1) % order.length];
    ctx.fundSortMode = next;
    ctx.render();
  };

  const bulkButton = ctx.createFundToolbarButton(bar, "checklist", "批量选择删除", "ghost");
  bulkButton.onclick = () => {
    ctx.fundBulkMode = true;
    ctx.selectedFundIds.clear();
    ctx.render();
  };

  const addButton = ctx.createFundToolbarButton(bar, "plus", "添加资金", "accent");
  addButton.onclick = () => startAddFundFlow(ctx);
}

async function handleBulkDelete(ctx: MainViewContext): Promise<void> {
  const ids = Array.from(ctx.selectedFundIds);
  if (ids.length === 0) {
    return;
  }

  if (!confirm(`确定删除选中的 ${ids.length} 个资金账户？`)) {
    return;
  }

  for (const id of ids) {
    await ctx.plugin.deleteFund(id);
  }

  ctx.selectedFundIds.clear();
  ctx.fundBulkMode = false;
  notify(`已删除 ${ids.length} 个账户`);
  ctx.render();
}

function renderFundFlatList(ctx: MainViewContext, parent: HTMLElement): void {
  const signed = (fund: FundItem) => {
    const isLiab = getFundCategory(fund).type === "liability";
    const amt = getFundEffectiveAmount(fund);
    return isLiab ? -amt : amt;
  };
  // Use liability-weight as a tie-breaker so that a 0-valued liability is
  // always treated as "smaller" than a 0-valued asset (desc → the liability
  // row shows up *after* the asset row; asc → liability comes first). Without
  // this, -0 === 0 in JS and the two mix in an unstable order.
  const liabilityRank = (fund: FundItem) =>
    getFundCategory(fund).type === "liability" ? 1 : 0;
  const funds = [...ctx.plugin.funds].sort((a, b) => {
    const va = signed(a);
    const vb = signed(b);
    if (va !== vb) {
      return ctx.fundSortMode === "asc" ? va - vb : vb - va;
    }
    // Equal magnitude (including 0 vs 0): liability is considered smaller.
    const la = liabilityRank(a);
    const lb = liabilityRank(b);
    if (la !== lb) {
      return ctx.fundSortMode === "asc" ? lb - la : la - lb;
    }
    return 0;
  });

  if (funds.length === 0) {
    return;
  }

  const container = parent.createDiv();
  renderFundCompactList(ctx, container, funds);
}

function renderFundCategorySection(
  ctx: MainViewContext,
  parent: HTMLElement,
  category: FundCategory,
): void {
  const funds = ctx.plugin.funds.filter((fund) => getFundCategory(fund).id === category.id);

  if (funds.length === 0) {
    return;
  }

  const total = funds.reduce((sum, fund) => sum + getFundEffectiveAmount(fund), 0);
  const section = parent.createDiv();
  section.style.padding = "4px 2px 10px";

  const header = section.createDiv();
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.justifyContent = "space-between";
  header.style.gap = "10px";
  header.style.marginBottom = "4px";
  header.style.padding = "0 4px";

  const title = header.createDiv({ text: category.name });
  title.style.fontSize = "12px";
  title.style.fontWeight = "700";
  title.style.color = "var(--text-muted)";
  title.style.letterSpacing = "0.02em";

  const totalEl = header.createDiv();
  totalEl.style.fontSize = "12px";
  totalEl.style.fontWeight = "700";
  totalEl.style.color = "var(--text-muted)";
  totalEl.style.whiteSpace = "nowrap";
  totalEl.style.display = "inline-flex";
  ctx.renderSlotNumber(totalEl.createSpan(), ctx.displayCurrency(total));

  renderFundCompactList(ctx, section, funds, true);
}

function renderFundCompactList(
  ctx: MainViewContext,
  section: HTMLElement,
  funds: FundItem[],
  draggable = false,
): void {
  const list = section.createDiv();
  list.style.display = "flex";
  list.style.flexDirection = "column";
  list.style.gap = "2px";

  funds.forEach((fund) => {
    const row = list.createDiv();
    const bulk = ctx.fundBulkMode;
    const selected = bulk && ctx.selectedFundIds.has(fund.id);

    row.style.display = "grid";
    row.style.gridTemplateColumns = bulk ? "28px 52px 1fr auto" : "52px 1fr auto";
    row.style.alignItems = "center";
    row.style.gap = "14px";
    row.style.padding = "12px 8px";
    row.style.borderRadius = "10px";
    row.style.cursor = "pointer";
    row.style.transition = "background 0.12s";
    row.style.background = selected ? "var(--background-modifier-hover)" : "";

    if (bulk) {
      const checkbox = row.createDiv();
      checkbox.style.width = "20px";
      checkbox.style.height = "20px";
      checkbox.style.borderRadius = "6px";
      checkbox.style.border = selected ? "0" : "2px solid var(--background-modifier-border)";
      checkbox.style.background = selected ? "var(--interactive-accent)" : "var(--background-primary)";
      checkbox.style.color = "var(--text-on-accent)";
      checkbox.style.display = "flex";
      checkbox.style.alignItems = "center";
      checkbox.style.justifyContent = "center";
      checkbox.style.fontSize = "14px";
      checkbox.style.fontWeight = "900";
      checkbox.style.lineHeight = "1";
      checkbox.innerText = selected ? "✓" : "";
    }

    const logo = row.createDiv();
    logo.style.width = "44px";
    logo.style.height = "44px";
    logo.style.display = "flex";
    logo.style.alignItems = "center";
    logo.style.justifyContent = "center";
    logo.style.borderRadius = "10px";
    logo.style.background = "transparent";
    logo.style.border = "0";
    logo.style.fontSize = "20px";
    logo.style.fontWeight = "900";
    logo.style.color = "var(--text-muted)";
    logo.style.overflow = "hidden";
    renderFundLogoInto(ctx.bankLogoLoader, logo, fund, 40);

    const info = row.createDiv();
    info.style.display = "flex";
    info.style.flexDirection = "column";
    info.style.gap = "3px";
    info.style.minWidth = "0";

    const primary = info.createDiv({ text: getFundPrimaryLabel(fund) });
    primary.style.fontSize = "19px";
    primary.style.fontWeight = "900";
    primary.style.color = "var(--text-normal)";
    primary.style.overflow = "hidden";
    primary.style.textOverflow = "ellipsis";
    primary.style.whiteSpace = "nowrap";

    const secondaryText = getFundSecondaryLabel(fund);
    if (secondaryText) {
      const secondary = info.createDiv({ text: secondaryText });
      secondary.style.fontSize = "13px";
      secondary.style.fontWeight = "400";
      secondary.style.color = "var(--text-faint)";
      secondary.style.overflow = "hidden";
      secondary.style.textOverflow = "ellipsis";
      secondary.style.whiteSpace = "nowrap";
    }

    // 行尾：余额（加粗显示；负债加负号并红色）
    const balance = row.createDiv();
    balance.style.fontSize = "20px";
    balance.style.fontWeight = "900";
    const isLiab = getFundCategory(fund).type === "liability";
    balance.style.color = isLiab ? "#ef4444" : "var(--text-normal)";
    balance.style.whiteSpace = "nowrap";
    balance.style.display = "inline-flex";
    balance.style.alignItems = "baseline";
    balance.style.paddingLeft = "8px";
    const effectiveAmount = getFundEffectiveAmount(fund);
    const amountStr = ctx.displayCurrency(effectiveAmount);
    const shown = isLiab && !ctx.hideMoney && effectiveAmount > 0 ? `-${amountStr}` : amountStr;
    ctx.renderSlotNumber(balance.createSpan(), shown);

    row.onmouseenter = () => {
      if (!selected) {
        row.style.background = "var(--background-modifier-hover)";
      }
    };
    row.onmouseleave = () => {
      row.style.background = selected ? "var(--background-modifier-hover)" : "";
    };
    row.onclick = () => {
      if (ctx.fundBulkMode) {
        if (ctx.selectedFundIds.has(fund.id)) {
          ctx.selectedFundIds.delete(fund.id);
        } else {
          ctx.selectedFundIds.add(fund.id);
        }
        ctx.render();
        return;
      }
      new FundDetailModal(ctx.app, ctx.plugin, fund).open();
    };

    if (draggable && !bulk) {
      row.style.touchAction = "none";
      attachLongPressDrag({
        row,
        list,
        fundId: fund.id,
        ownerOrderedIds: funds.map((f) => f.id),
        onReorder: async (nextIds) => {
          await persistFundReorder(ctx.plugin, nextIds);
          ctx.render();
        },
      });
    }
  });
}

/**
 * Floating "add fund" circular button. Currently not wired from the funds
 * page (we use the toolbar "+" button), but kept for future use.
 */
export function renderGlobalAddFundButton(ctx: MainViewContext, el: HTMLElement): void {
  const wrap = el.createDiv();
  wrap.style.display = "flex";
  wrap.style.justifyContent = "center";
  wrap.style.marginTop = "22px";

  const button = wrap.createDiv({ text: "+" });
  button.title = "添加资金";
  button.style.width = "72px";
  button.style.height = "72px";
  button.style.display = "flex";
  button.style.alignItems = "center";
  button.style.justifyContent = "center";
  button.style.borderRadius = "999px";
  button.style.border = "1px dashed var(--background-modifier-border)";
  button.style.background = "var(--background-primary)";
  button.style.color = "var(--text-muted)";
  button.style.fontSize = "42px";
  button.style.fontWeight = "850";
  button.style.cursor = "pointer";
  button.style.boxShadow = "0 6px 18px rgba(0,0,0,0.1)";
  button.style.transition = "transform 0.12s, box-shadow 0.12s, color 0.12s";

  button.onmouseenter = () => {
    button.style.transform = "translateY(-2px) scale(1.03)";
    button.style.boxShadow = "0 12px 28px rgba(0,0,0,0.16)";
    button.style.color = "var(--text-normal)";
  };
  button.onmouseleave = () => {
    button.style.transform = "";
    button.style.boxShadow = "0 6px 18px rgba(0,0,0,0.1)";
    button.style.color = "var(--text-muted)";
  };

  button.onclick = () => startAddFundFlow(ctx);
}

function startAddFundFlow(ctx: MainViewContext): void {
  const reopenPicker = () => startAddFundFlow(ctx);
  new FundCategoryPickerModal(ctx.app, (categoryId) => {
    // 所有分类统一走 FundModal，携带 onBack 回调以便返回到选择卡片
    new FundModal(ctx.app, ctx.plugin, undefined, { category: categoryId }, reopenPicker).open();
  }).open();
}

/**
 * Legacy grid-style fund card. Not currently referenced by renderFundsPage
 * (which uses the compact list), but retained for parity with the previous
 * view implementation.
 */
export function renderFundCard(ctx: MainViewContext, grid: HTMLElement, fund: FundItem): void {
  const category = getFundCategory(fund);
  const card = grid.createDiv();
  ctx.applyCardStyle(card);
  card.style.alignItems = "stretch";
  card.style.flexDirection = "column";
  card.style.justifyContent = "center";
  card.style.gap = "10px";
  card.onclick = () => new FundDetailModal(ctx.app, ctx.plugin, fund).open();

  renderFundActions(ctx, card, fund);

  const categoryLabel = card.createDiv({ text: category.name });
  categoryLabel.style.alignSelf = "flex-start";
  categoryLabel.style.padding = "4px 9px";
  categoryLabel.style.borderRadius = "999px";
  categoryLabel.style.background = "var(--background-secondary)";
  categoryLabel.style.border = "1px solid var(--background-modifier-border)";
  categoryLabel.style.fontSize = "12px";
  categoryLabel.style.fontWeight = "900";
  categoryLabel.style.color = category.type === "liability" ? "#ef4444" : "var(--text-muted)";

  const name = card.createDiv({ text: fund.name });
  name.style.fontSize = "21px";
  name.style.fontWeight = "850";
  name.style.color = "var(--text-normal)";

  const amount = card.createDiv({ text: ctx.displayCurrency(getFundEffectiveAmount(fund)) });
  amount.style.fontSize = "34px";
  amount.style.fontWeight = "950";
  amount.style.lineHeight = "1.05";
  amount.style.color = category.type === "liability" ? "#ef4444" : "var(--text-normal)";

  const date = card.createDiv({ text: fund.date });
  date.style.fontSize = "13px";
  date.style.fontWeight = "800";
  date.style.color = "var(--text-muted)";
}

function renderFundActions(ctx: MainViewContext, card: HTMLElement, fund: FundItem): void {
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
    new FundModal(ctx.app, ctx.plugin, fund).open();
  });

  ctx.createActionButton(actions, "⌫", ctx.tr("delete"), async () => {
    if (confirm(ctx.tr("deleteConfirm", { name: fund.name }))) {
      await ctx.plugin.deleteFund(fund.id);
    }
  }, true);
}

/**
 * Dashed "+" add-fund card for the grid view. Retained for parity.
 */
export function renderAddFundCard(
  ctx: MainViewContext,
  grid: HTMLElement,
  categoryId: string = DEFAULT_FUND_CATEGORY_ID,
): void {
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
  card.title = "添加资金";
  card.innerText = "+";
  card.onclick = () => {
    const reopenPicker = () => startAddFundFlow(ctx);
    new FundModal(ctx.app, ctx.plugin, undefined, categoryId, reopenPicker).open();
  };
}

/**
 * Inline "current value" row. Retained for parity with the previous view
 * implementation; unused by the current funds page.
 */
export function renderFundInlineCurrentValue(
  ctx: MainViewContext,
  parent: HTMLElement,
  label: string,
  value: number,
): void {
  const line = parent.createDiv();
  line.style.display = "flex";
  line.style.alignItems = "baseline";
  line.style.gap = "10px";
  line.style.margin = "-4px 0 14px";
  line.style.flexWrap = "wrap";

  const labelEl = line.createDiv({ text: label });
  labelEl.style.fontSize = "18px";
  labelEl.style.fontWeight = "900";
  labelEl.style.color = "var(--text-muted)";

  const valueEl = line.createDiv();
  valueEl.style.fontSize = "26px";
  valueEl.style.fontWeight = "950";
  valueEl.style.lineHeight = "1.05";
  valueEl.style.color = label === "负债" ? "#ef4444" : "var(--text-normal)";
  valueEl.style.display = "flex";
  ctx.renderSlotNumber(valueEl.createSpan(), ctx.displayCurrency(value));
}

function renderFundStatsTabs(ctx: MainViewContext, parent: HTMLElement): void {
  const tabs = parent.createDiv();
  tabs.style.display = "grid";
  tabs.style.gridTemplateColumns = "1fr 1px 1fr 1px 1fr";
  tabs.style.alignItems = "center";
  tabs.style.gap = "0";
  tabs.style.marginTop = "4px";
  tabs.style.padding = "8px 0";
  tabs.style.background = "var(--background-primary)";
  tabs.style.border = "0";
  tabs.style.position = "sticky";
  tabs.style.top = "0";
  tabs.style.zIndex = "3";

  const items: Array<{ key: "asset" | "liability" | "netAsset"; label: string }> = [
    { key: "asset", label: ctx.tr("fundAssetChart") },
    { key: "liability", label: ctx.tr("fundLiabilityChart") },
    { key: "netAsset", label: ctx.tr("netAssetChart") },
  ];

  items.forEach((item, index) => {
    if (index > 0) {
      const divider = tabs.createDiv();
      divider.style.alignSelf = "stretch";
      divider.style.borderLeft = "1px solid var(--background-modifier-border)";
      divider.style.height = "20px";
      divider.style.margin = "auto 0";
    }

    const active = ctx.fundStatsTab === item.key;
    const button = tabs.createEl("button", { text: item.label });
    button.style.padding = "12px 4px";
    button.style.border = "0";
    button.style.borderRadius = "0";
    button.style.cursor = "pointer";
    button.style.fontSize = "20px";
    button.style.fontWeight = active ? "950" : "900";
    button.style.background = "transparent";
    button.style.color = active ? "var(--interactive-accent)" : "var(--text-muted)";
    button.style.boxShadow = "none";
    button.style.transition = "color 0.15s, font-weight 0.15s";
    button.style.textAlign = "center";
    button.onclick = () => {
      ctx.fundStatsTab = item.key;
      ctx.render();
    };
  });
}

function renderFundRankingCard(
  ctx: MainViewContext,
  parent: HTMLElement,
  tab: "asset" | "liability" | "netAsset",
  label: string,
): void {
  const card = ctx.createFundStatsCard(parent, `${label}排行榜`);
  if (tab !== "netAsset") {
    renderStatsGranularityToggle(ctx, card);
  }
  // 用 ctx.getFundRanking（已经在 mainView 里 bind 了 labelOf）——与环状图同源，
  // 排序一致 → palette 颜色自然对齐；名称也是"中国银行 / 支付宝 / 现金"这种详细标签。
  const items = ctx.getFundRanking(
    tab,
    tab === "netAsset" ? "category" : ctx.statsGranularity,
  );

  if (items.length === 0) {
    ctx.renderEmptyChart(card);
    return;
  }

  const maxValue = Math.max(...items.map((item) => item.value), 1);
  // 占整体的百分比（与环状图的分母一致），和条形的 maxValue 归一化宽度是两回事
  const totalValue = items.reduce((sum, item) => sum + item.value, 0);
  const wrap = card.createDiv();
  wrap.style.display = "flex";
  wrap.style.flexDirection = "column";
  wrap.style.gap = "14px";

  items.forEach((item, index) => {
    const row = wrap.createDiv();
    row.style.display = "grid";
    row.style.gridTemplateColumns = "32px 1fr";
    row.style.alignItems = "center";
    row.style.gap = "12px";

    const rank = row.createDiv();
    rank.style.fontSize = "18px";
    rank.style.fontWeight = "950";
    rank.style.color = index < 3 ? "var(--text-normal)" : "var(--text-muted)";
    rank.style.textAlign = "center";
    rank.style.display = "flex";
    rank.style.justifyContent = "center";
    ctx.renderSlotNumber(rank.createSpan(), String(index + 1));

    const content = row.createDiv();
    content.style.display = "flex";
    content.style.flexDirection = "column";
    content.style.gap = "6px";

    // 顶部：名称 + 紧跟着百分比（中间一点空隙）
    const header = content.createDiv();
    header.style.display = "flex";
    header.style.justifyContent = "flex-start";
    header.style.alignItems = "baseline";
    header.style.gap = "10px";

    const nameEl = header.createSpan({ text: item.name });
    nameEl.style.fontSize = "15px";
    nameEl.style.fontWeight = "900";
    nameEl.style.color = "var(--text-normal)";
    nameEl.style.overflow = "hidden";
    nameEl.style.textOverflow = "ellipsis";
    nameEl.style.whiteSpace = "nowrap";
    nameEl.style.flexShrink = "1";
    nameEl.style.minWidth = "0";

    const percent = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
    const percentEl = header.createSpan({ text: `${percent.toFixed(1)}%` });
    percentEl.style.fontSize = "13px";
    percentEl.style.fontWeight = "800";
    percentEl.style.color = "var(--text-muted)";
    percentEl.style.whiteSpace = "nowrap";
    percentEl.style.flexShrink = "0";

    // 中间：条形图
    const track = content.createDiv();
    track.style.height = "14px";
    track.style.borderRadius = "999px";
    track.style.background = "var(--background-modifier-border)";
    track.style.overflow = "hidden";

    const bar = track.createDiv();
    bar.style.width = `${Math.max(4, (item.value / maxValue) * 100)}%`;
    bar.style.height = "100%";
    bar.style.borderRadius = "999px";
    bar.style.background = item.color;
    bar.style.boxShadow = "0 6px 14px rgba(0,0,0,0.14)";

    // 下方：金额（右对齐）
    const footer = content.createDiv();
    footer.style.display = "flex";
    footer.style.justifyContent = "flex-end";

    const amountEl = footer.createSpan();
    amountEl.style.fontSize = "16px";
    amountEl.style.fontWeight = "950";
    amountEl.style.color = tab === "liability" ? "#ef4444" : "var(--text-normal)";
    amountEl.style.whiteSpace = "nowrap";
    amountEl.style.display = "inline-flex";
    ctx.renderSlotNumber(amountEl.createSpan(), ctx.displayCurrency(item.value));
  });
}
