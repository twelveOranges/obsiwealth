import { App, Modal } from "obsidian";
import {
  formatLocalDate,
  getAssetEndDateValue,
  getAssetStatus,
  getAssetTotalCost,
  getDailyCost,
  getDailyCostOnDate,
  getNetAssetCost,
  getUsageDuration,
  getUsedDays,
  parseLocalDate,
} from "@core/calc/assetMath";
import { getIconPath } from "../iconResolver";
import { findIcon } from "../icons";
import { defaultCategoryLabel, statusLabel, t } from "@core/i18n";
import type { AppModel } from "@ui/host/appModel";
import type { Asset } from "@core/types";
import { AssetModal } from "./assetModal";
import { formatCurrency as sharedFormatCurrency } from "./shared/currency";
import { createFullWidthDeleteButton, createIconButton } from "./shared/modalButtons";
import {
  createLabelValueCard,
  createSection as createSectionShared,
  createSurfaceCard,
} from "./shared/modalLayout";

export class AssetDetailModal extends Modal {
  constructor(app: App, private plugin: AppModel, private asset: Asset) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.style.position = "relative";

    this.renderEditButton(contentEl);
    this.renderHero(contentEl);
    this.renderChart(contentEl);
    this.renderBasicSection(contentEl);
    this.renderAccessoriesSection(contentEl);
    this.renderLifecycleSection(contentEl);
    this.renderDeleteButton(contentEl);
  }

  private renderEditButton(contentEl: HTMLElement) {
    const button = createIconButton(contentEl, {
      ariaLabel: t(this.plugin.settings.language, "edit"),
      content: "✏️",
      corner: "top-right",
    });

    button.onclick = () => {
      this.close();
      new AssetModal(this.app, this.plugin, this.asset).open();
    };
  }

  private renderHero(contentEl: HTMLElement) {
    const hero = contentEl.createDiv();
    hero.style.display = "flex";
    hero.style.flexDirection = "column";
    hero.style.alignItems = "center";
    hero.style.textAlign = "center";
    hero.style.margin = "8px 0 22px";
    hero.style.padding = "8px 72px 0";

    const imageWrap = hero.createDiv();
    imageWrap.style.width = "140px";
    imageWrap.style.height = "140px";
    imageWrap.style.display = "flex";
    imageWrap.style.alignItems = "center";
    imageWrap.style.justifyContent = "center";
    imageWrap.style.borderRadius = "28px";
    imageWrap.style.background = "transparent";
    imageWrap.style.overflow = "hidden";
    imageWrap.style.marginBottom = "16px";

    const icon = findIcon(this.asset.icon);

    if (!icon) {
      imageWrap.setText("📦");
      imageWrap.style.fontSize = "82px";
    } else {
      const img = imageWrap.createEl("img");
      img.src = getIconPath(icon.id);
      img.alt = icon.name;
      img.style.width = "132px";
      img.style.height = "132px";
      img.style.objectFit = "contain";
    }

    const name = hero.createEl("h2", { text: this.asset.name });
    name.style.margin = "0 0 8px";
    name.style.fontSize = "24px";
    name.style.fontWeight = "800";

    const price = hero.createDiv();
    price.style.display = "flex";
    price.style.alignItems = "center";
    price.style.justifyContent = "center";
    price.style.gap = "10px";
    price.style.fontSize = "28px";
    price.style.fontWeight = "800";
    price.style.color = "var(--text-normal)";
    price.style.marginBottom = "16px";
    this.renderAssetCost(price);

    const metrics = hero.createDiv();
    metrics.style.display = "grid";
    metrics.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
    metrics.style.gap = "10px";
    metrics.style.width = "100%";
    metrics.style.maxWidth = "420px";

    this.renderMetric(metrics, t(this.plugin.settings.language, "dailyCost"), `${this.formatCurrency(getDailyCost(this.asset))} / ${t(this.plugin.settings.language, "perDay")}`);
    this.renderMetric(metrics, t(this.plugin.settings.language, "used"), this.getUsageDurationText());
  }

  private renderAssetCost(parent: HTMLElement) {
    const totalCost = getAssetTotalCost(this.asset);

    if (getAssetStatus(this.asset) !== "sold") {
      parent.createSpan({ text: this.formatCurrency(totalCost) });
      return;
    }

    const original = parent.createSpan({ text: this.formatCurrency(totalCost) });
    original.style.textDecoration = "line-through";
    original.style.opacity = "0.62";

    const net = parent.createSpan({ text: this.formatCurrency(getNetAssetCost(this.asset)) });
    net.style.fontWeight = "850";
  }

  private renderMetric(parent: HTMLElement, label: string, value: string) {
    createLabelValueCard(parent, {
      label,
      value,
      valueFontSize: "16px",
      valueFontWeight: "700",
    });
  }

  private renderChart(contentEl: HTMLElement) {
    const section = this.createSection(contentEl, t(this.plugin.settings.language, "dailyCostTrend"));
    const chart = section.createDiv();
    chart.style.position = "relative";
    chart.style.height = "220px";
    chart.style.borderRadius = "14px";
    chart.style.background = "var(--background-secondary)";
    chart.style.border = "1px solid var(--background-modifier-border)";
    chart.style.padding = "12px";

    const points = this.getChartPoints();

    if (points.length < 2) {
      chart.setText(t(this.plugin.settings.language, "emptyChart"));
      chart.style.display = "flex";
      chart.style.alignItems = "center";
      chart.style.justifyContent = "center";
      chart.style.color = "var(--text-muted)";
      return;
    }

    const width = 620;
    const height = 180;
    const leftPadding = 86;
    const rightPadding = 20;
    const topPadding = 24;
    const bottomPadding = 18;
    const values = points.map((point) => Math.max(point.value, 0.01));
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values, minValue * 1.01);
    const tickValues = this.getLogTickValues(minValue, maxValue);
    const minTick = Math.min(...tickValues);
    const maxTick = Math.max(...tickValues);
    const domainMin = Math.min(minValue, minTick);
    const domainMax = Math.max(maxValue, maxTick);
    const logMin = Math.log10(domainMin);
    const logMax = Math.log10(domainMax);
    const logRange = Math.max(logMax - logMin, 0.0001);
    const plotWidth = width - leftPadding - rightPadding;
    const plotHeight = height - topPadding - bottomPadding;
    const yForValue = (value: number) => {
      const safeValue = Math.max(value, 0.01);
      return topPadding + (1 - (Math.log10(safeValue) - logMin) / logRange) * plotHeight;
    };
    const pointPositions = points.map((point, index) => ({
      point,
      x: leftPadding + (index / (points.length - 1)) * plotWidth,
      y: yForValue(point.value),
    }));
    const polylinePoints = pointPositions.map((position) => `${position.x},${position.y}`).join(" ");

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "180");

    const title = document.createElementNS("http://www.w3.org/2000/svg", "text");
    title.textContent = "日均成本";
    title.setAttribute("x", String(-(topPadding + plotHeight / 2)));
    title.setAttribute("y", "18");
    title.setAttribute("transform", "rotate(-90)");
    title.setAttribute("fill", "var(--text-muted)");
    title.setAttribute("font-size", "17");
    title.setAttribute("font-weight", "800");
    title.setAttribute("text-anchor", "middle");
    title.setAttribute("dominant-baseline", "middle");
    svg.appendChild(title);

    tickValues.forEach((value) => {
      const y = yForValue(value);
      const gridLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      gridLine.setAttribute("x1", String(leftPadding));
      gridLine.setAttribute("y1", String(y));
      gridLine.setAttribute("x2", String(width - rightPadding));
      gridLine.setAttribute("y2", String(y));
      gridLine.setAttribute("stroke", "var(--background-modifier-border)");
      gridLine.setAttribute("stroke-width", "1.2");
      gridLine.setAttribute("stroke-dasharray", "5 5");
      svg.appendChild(gridLine);

      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.textContent = String(value);
      label.setAttribute("x", String(leftPadding - 8));
      label.setAttribute("y", String(y + 4));
      label.setAttribute("fill", "var(--text-muted)");
      label.setAttribute("font-size", "11");
      label.setAttribute("text-anchor", "end");
      svg.appendChild(label);
    });

    const axis = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    axis.setAttribute("points", `${leftPadding},${topPadding} ${leftPadding},${height - bottomPadding} ${width - rightPadding},${height - bottomPadding}`);
    axis.setAttribute("fill", "none");
    axis.setAttribute("stroke", "var(--background-modifier-border)");
    axis.setAttribute("stroke-width", "2");
    svg.appendChild(axis);

    const line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    line.setAttribute("points", polylinePoints);
    line.setAttribute("fill", "none");
    line.setAttribute("stroke", "#60a5fa");
    line.setAttribute("stroke-width", "6");
    line.setAttribute("stroke-linecap", "round");
    line.setAttribute("stroke-linejoin", "round");
    svg.appendChild(line);

    const startLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    startLabel.textContent = this.asset.buy_date;
    startLabel.setAttribute("x", String(leftPadding));
    startLabel.setAttribute("y", String(height - 4));
    startLabel.setAttribute("fill", "var(--text-muted)");
    startLabel.setAttribute("font-size", "11");
    startLabel.setAttribute("text-anchor", "start");
    svg.appendChild(startLabel);

    const endLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    endLabel.textContent = points[points.length - 1].date;
    endLabel.setAttribute("x", String(width - rightPadding));
    endLabel.setAttribute("y", String(height - 4));
    endLabel.setAttribute("fill", "var(--text-muted)");
    endLabel.setAttribute("font-size", "11");
    endLabel.setAttribute("text-anchor", "end");
    svg.appendChild(endLabel);

    const tooltip = chart.createDiv();
    tooltip.style.position = "absolute";
    tooltip.style.display = "none";
    tooltip.style.pointerEvents = "none";
    tooltip.style.padding = "6px 8px";
    tooltip.style.borderRadius = "8px";
    tooltip.style.background = "var(--background-primary)";
    tooltip.style.border = "1px solid var(--background-modifier-border)";
    tooltip.style.boxShadow = "0 8px 18px rgba(0,0,0,0.14)";
    tooltip.style.fontSize = "12px";
    tooltip.style.fontWeight = "600";
    tooltip.style.zIndex = "2";

    const hoverLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    hoverLine.setAttribute("y1", String(topPadding));
    hoverLine.setAttribute("y2", String(height - bottomPadding));
    hoverLine.setAttribute("stroke", "var(--text-muted)");
    hoverLine.setAttribute("stroke-width", "1.2");
    hoverLine.setAttribute("stroke-dasharray", "4 4");
    hoverLine.setAttribute("opacity", "0");
    svg.appendChild(hoverLine);

    const hoverDot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    hoverDot.setAttribute("r", "5");
    hoverDot.setAttribute("fill", "#60a5fa");
    hoverDot.setAttribute("stroke", "var(--background-primary)");
    hoverDot.setAttribute("stroke-width", "2");
    hoverDot.setAttribute("opacity", "0");
    svg.appendChild(hoverDot);

    const hoverArea = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    hoverArea.setAttribute("x", String(leftPadding));
    hoverArea.setAttribute("y", String(topPadding));
    hoverArea.setAttribute("width", String(plotWidth));
    hoverArea.setAttribute("height", String(plotHeight));
    hoverArea.setAttribute("fill", "transparent");
    hoverArea.onmousemove = (event) => {
      const svgRect = svg.getBoundingClientRect();
      const chartRect = chart.getBoundingClientRect();
      const mouseX = ((event.clientX - svgRect.left) / svgRect.width) * width;
      const nearest = pointPositions.reduce((closest, position) => {
        return Math.abs(position.x - mouseX) < Math.abs(closest.x - mouseX) ? position : closest;
      });

      hoverLine.setAttribute("x1", String(nearest.x));
      hoverLine.setAttribute("x2", String(nearest.x));
      hoverLine.setAttribute("opacity", "0.65");
      hoverDot.setAttribute("cx", String(nearest.x));
      hoverDot.setAttribute("cy", String(nearest.y));
      hoverDot.setAttribute("opacity", "1");
      tooltip.innerText = `${nearest.point.label}\n${this.formatCurrency(nearest.point.value)} / ${t(this.plugin.settings.language, "perDay")}`;
      tooltip.style.display = "block";
      tooltip.style.left = `${event.clientX - chartRect.left + 12}px`;
      tooltip.style.top = `${event.clientY - chartRect.top - 12}px`;
    };
    hoverArea.onmouseleave = () => {
      hoverLine.setAttribute("opacity", "0");
      hoverDot.setAttribute("opacity", "0");
      tooltip.style.display = "none";
    };
    svg.appendChild(hoverArea);

    chart.appendChild(svg);
  }

  private renderBasicSection(contentEl: HTMLElement) {
    const section = this.createSection(contentEl, t(this.plugin.settings.language, "assetInfo"));
    section.style.display = "grid";
    section.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
    section.style.gap = "10px";

    this.renderDetailItem(section, t(this.plugin.settings.language, "unitPrice"), this.formatCurrency(getAssetTotalCost(this.asset)));
    this.renderDetailItem(section, t(this.plugin.settings.language, "buyDate"), this.asset.buy_date);
    this.renderDetailItem(section, t(this.plugin.settings.language, "category"), this.getCategoryLabel(this.asset.category));
  }

  private renderAccessoriesSection(contentEl: HTMLElement) {
    const accessories = this.asset.accessories ?? [];

    if (accessories.length === 0) {
      return;
    }

    const section = this.createSection(contentEl, "附加物品");
    section.style.display = "grid";
    section.style.gridTemplateColumns = "repeat(auto-fill, minmax(210px, 1fr))";
    section.style.gap = "10px";

    accessories.forEach((accessory) => {
      const card = createSurfaceCard(section, {
        padding: "10px",
        borderRadius: "14px",
        style: {
          display: "grid",
          gridTemplateColumns: "46px 1fr",
          gap: "10px",
          alignItems: "center",
        },
      });

      const iconWrap = card.createDiv();
      iconWrap.style.width = "46px";
      iconWrap.style.height = "46px";
      iconWrap.style.display = "flex";
      iconWrap.style.alignItems = "center";
      iconWrap.style.justifyContent = "center";
      iconWrap.style.overflow = "hidden";

      const icon = findIcon(accessory.icon);

      if (!icon) {
        iconWrap.setText("📦");
        iconWrap.style.fontSize = "28px";
      } else {
        const img = iconWrap.createEl("img");
        img.src = getIconPath(icon.id);
        img.alt = icon.name;
        img.style.width = "42px";
        img.style.height = "42px";
        img.style.objectFit = "contain";
      }

      const info = card.createDiv();
      info.style.display = "flex";
      info.style.flexDirection = "column";
      info.style.gap = "3px";
      info.style.minWidth = "0";

      const name = info.createDiv({ text: accessory.name });
      name.style.fontSize = "14px";
      name.style.fontWeight = "850";
      name.style.whiteSpace = "nowrap";
      name.style.overflow = "hidden";
      name.style.textOverflow = "ellipsis";

      const price = info.createDiv({ text: this.formatCurrency(accessory.price) });
      price.style.fontSize = "13px";
      price.style.fontWeight = "750";
      price.style.color = accessory.include_total ? "var(--text-normal)" : "var(--text-muted)";

      const date = info.createDiv({ text: accessory.buy_date });
      date.style.fontSize = "12px";
      date.style.color = "var(--text-muted)";
    });
  }

  private renderLifecycleSection(contentEl: HTMLElement) {
    const status = getAssetStatus(this.asset);

    if (status === "active") {
      return;
    }

    const section = this.createSection(contentEl, t(this.plugin.settings.language, "statusInfo"));
    section.style.display = "grid";
    section.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
    section.style.gap = "10px";

    if (status === "retired") {
      this.renderDetailItem(section, t(this.plugin.settings.language, "status"), statusLabel(this.plugin.settings.language, "retired"));
      this.renderDetailItem(section, t(this.plugin.settings.language, "date"), this.asset.lifecycle?.retired_date || t(this.plugin.settings.language, "notFilled"));
      return;
    }

    this.renderDetailItem(section, t(this.plugin.settings.language, "status"), statusLabel(this.plugin.settings.language, "sold"));
    this.renderDetailItem(section, t(this.plugin.settings.language, "soldDate"), this.asset.lifecycle?.sold_date || t(this.plugin.settings.language, "notFilled"));
    this.renderDetailItem(section, t(this.plugin.settings.language, "soldPrice"), this.formatCurrency(this.asset.lifecycle?.sold_price ?? 0));
  }

  private createSection(contentEl: HTMLElement, title: string) {
    return createSectionShared(contentEl, title);
  }

  private renderDetailItem(parent: HTMLElement, label: string, value: string) {
    createLabelValueCard(parent, { label, value });
  }

  private renderDeleteButton(contentEl: HTMLElement) {
    const button = createFullWidthDeleteButton(contentEl, {
      ariaLabel: t(this.plugin.settings.language, "delete"),
      plainText: "🗑️",
      marginTop: 20,
    });

    button.onclick = async () => {
      if (!confirm(t(this.plugin.settings.language, "deleteConfirm", { name: this.asset.name }))) {
        return;
      }

      await this.plugin.deleteAsset(this.asset.id);
      this.close();
    };
  }

  private getUsageDurationText() {
    if (this.plugin.settings.durationDisplayMode === "days") {
      return `${getUsedDays(this.asset)}${t(this.plugin.settings.language, "days")}`;
    }

    const duration = getUsageDuration(this.asset);
    const language = this.plugin.settings.language;
    const parts = [
      duration.years > 0 ? `${duration.years}${t(language, "years")}` : "",
      duration.months > 0 ? `${duration.months}${t(language, "months")}` : "",
      duration.days > 0 ? `${duration.days}${t(language, "days")}` : "",
    ].filter(Boolean);

    return parts.length > 0 ? parts.join("") : `0${t(language, "days")}`;
  }

  private getCategoryLabel(value: string) {
    return this.plugin.settings.categories.find((category) => category.id === value)?.name ?? defaultCategoryLabel(this.plugin.settings.language, value);
  }

  private getChartPoints() {
    const start = parseLocalDate(this.asset.buy_date);
    const end = parseLocalDate(getAssetEndDateValue(this.asset));

    if (!start || !end || start.getTime() > end.getTime()) {
      return [];
    }

    const points: Array<{ date: string; label: string; value: number }> = [];
    const firstDate = formatLocalDate(start);
    points.push({
      date: firstDate,
      label: this.getYearMonthLabel(firstDate),
      value: getDailyCostOnDate(this.asset, firstDate),
    });

    const cursor = new Date(start.getFullYear(), start.getMonth() + 1, 1);

    while (cursor.getTime() < end.getTime()) {
      const date = formatLocalDate(cursor);
      points.push({
        date,
        label: this.getYearMonthLabel(date),
        value: getDailyCostOnDate(this.asset, date),
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    const endDate = formatLocalDate(end);

    if (points[points.length - 1]?.date !== endDate) {
      points.push({
        date: endDate,
        label: this.getYearMonthLabel(endDate),
        value: getDailyCostOnDate(this.asset, endDate),
      });
    }

    return points;
  }

  private getLogTickValues(minValue: number, maxValue: number) {
    const minPower = Math.floor(Math.log10(Math.max(minValue, 0.01)));
    const maxPower = Math.ceil(Math.log10(Math.max(maxValue, 1)));
    const ticks: number[] = [];

    for (let power = minPower; power <= maxPower; power += 1) {
      const value = 10 ** power;

      if (value >= 1) {
        ticks.push(value);
      }
    }

    return ticks.length > 0 ? ticks : [1, 10];
  }

  private getYearMonthLabel(dateValue: string) {
    return dateValue.slice(0, 7);
  }

  private formatCurrency(value: number) {
    return sharedFormatCurrency(this.plugin, value);
  }
}
