import type { MainViewContext } from "../view/viewContext";

/**
 * Asset vs liability composite bar card on the Funds page.
 *
 * Extracted 1:1 from `ObsiWealthMainView.renderFundNetAssetBarCard`.
 */
export function renderFundNetAssetBarCard(ctx: MainViewContext, parent: HTMLElement): void {
  const card = ctx.createFundStatsCard(parent, "资金负债对比");

  const asset = ctx.getFundAssetTotal();
  const liability = ctx.getFundLiabilityTotal();
  const netAsset = asset - liability;
  const total = asset + liability;

  if (total <= 0) {
    ctx.renderEmptyChart(card);
    return;
  }

  // 顶部标签：左边"资产 + 数字" 右边"负债 + 数字"
  const topRow = card.createDiv();
  topRow.style.display = "flex";
  topRow.style.alignItems = "baseline";
  topRow.style.justifyContent = "space-between";
  topRow.style.gap = "10px";
  topRow.style.marginBottom = "10px";
  topRow.style.flexWrap = "wrap";

  const assetLabel = topRow.createDiv();
  assetLabel.style.display = "flex";
  assetLabel.style.alignItems = "baseline";
  assetLabel.style.gap = "6px";

  const assetName = assetLabel.createSpan({ text: "资金" });
  assetName.style.fontSize = "14px";
  assetName.style.fontWeight = "900";
  assetName.style.color = "var(--text-muted)";

  const assetValue = assetLabel.createSpan();
  assetValue.style.fontSize = "20px";
  assetValue.style.fontWeight = "950";
  assetValue.style.color = "#3b82f6";
  assetValue.style.display = "inline-flex";
  ctx.renderSlotNumber(assetValue.createSpan(), ctx.displayCurrency(asset));

  const liabilityLabel = topRow.createDiv();
  liabilityLabel.style.display = "flex";
  liabilityLabel.style.alignItems = "baseline";
  liabilityLabel.style.gap = "6px";

  const liabilityName = liabilityLabel.createSpan({ text: "负债" });
  liabilityName.style.fontSize = "14px";
  liabilityName.style.fontWeight = "900";
  liabilityName.style.color = "var(--text-muted)";

  const liabilityValue = liabilityLabel.createSpan();
  liabilityValue.style.fontSize = "20px";
  liabilityValue.style.fontWeight = "950";
  liabilityValue.style.color = "#ef4444";
  liabilityValue.style.display = "inline-flex";
  ctx.renderSlotNumber(liabilityValue.createSpan(), ctx.displayCurrency(liability));

  // 拼接柱
  const bar = card.createDiv();
  bar.style.display = "flex";
  bar.style.width = "100%";
  bar.style.height = "32px";
  bar.style.borderRadius = "999px";
  bar.style.overflow = "hidden";
  bar.style.border = "1px solid var(--background-modifier-border)";
  bar.style.background = "var(--background-primary)";

  const assetSeg = bar.createDiv();
  assetSeg.style.flex = `${asset}`;
  assetSeg.style.background = "linear-gradient(90deg, #60a5fa, #3b82f6)";

  const liabilitySeg = bar.createDiv();
  liabilitySeg.style.flex = `${liability}`;
  liabilitySeg.style.background = "linear-gradient(90deg, #f87171, #ef4444)";

  // 右下角：净资金 + 资金负债率，两行小字左对齐
  const footer = card.createDiv();
  footer.style.display = "flex";
  footer.style.justifyContent = "flex-end";
  footer.style.marginTop = "12px";

  const footerInner = footer.createDiv();
  footerInner.style.display = "flex";
  footerInner.style.flexDirection = "column";
  footerInner.style.alignItems = "flex-start";
  footerInner.style.gap = "2px";
  footerInner.style.textAlign = "left";

  const net = footerInner.createDiv();
  net.style.display = "flex";
  net.style.alignItems = "baseline";
  net.style.gap = "4px";

  const netName = net.createSpan({ text: "净资金" });
  netName.style.fontSize = "14px";
  netName.style.fontWeight = "800";
  netName.style.color = "var(--text-muted)";

  const netValue = net.createSpan();
  netValue.style.fontSize = "17px";
  netValue.style.fontWeight = "900";
  netValue.style.color = netAsset < 0 ? "#ef4444" : "var(--text-normal)";
  netValue.style.display = "inline-flex";
  ctx.renderSlotNumber(netValue.createSpan(), ctx.displayCurrency(netAsset));

  const ratioText = asset > 0 ? `${((liability / asset) * 100).toFixed(1)}%` : "—";
  const ratio = footerInner.createDiv();
  ratio.style.display = "flex";
  ratio.style.alignItems = "baseline";
  ratio.style.gap = "4px";

  const ratioName = ratio.createSpan({ text: "资金负债率" });
  ratioName.style.fontSize = "14px";
  ratioName.style.fontWeight = "800";
  ratioName.style.color = "var(--text-muted)";

  const ratioValue = ratio.createSpan();
  ratioValue.style.fontSize = "17px";
  ratioValue.style.fontWeight = "900";
  ratioValue.style.color = "var(--text-normal)";
  ratioValue.style.display = "inline-flex";
  ctx.renderSlotNumber(ratioValue.createSpan(), ratioText);
}
