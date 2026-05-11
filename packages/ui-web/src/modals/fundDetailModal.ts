import { App, Modal } from "obsidian";
import { host, notify } from "@core";
import { getTodayISODate } from "@core/calc/assetMath";
import type { AppModel } from "@ui/host/appModel";
import type { FundHistoryPoint, FundItem } from "@core/types";
import { FUND_CATEGORIES } from "@core/types";
import { FundModal } from "./fundModal";
import { openPromptModal } from "./promptModal";
import { formatCurrency as sharedFormatCurrency } from "./shared/currency";
import { createDatePickerField } from "./shared/datePicker";
import { getLatestHistoryPoint, upsertHistoryPoint } from "./shared/historyPoint";
import {
  createCircleAddButton,
  createFullWidthDeleteButton,
  createIconButton,
  createPillButton,
} from "./shared/modalButtons";
import {
  createSectionHeaderWithCount,
  createSurfaceCard,
} from "./shared/modalLayout";
import {
  getPluginAssetDir,
  normalizeSvgContent,
} from "../fund/fundLogo";

export class FundDetailModal extends Modal {
  private fundRef: FundItem;

  constructor(app: App, private plugin: AppModel, fund: FundItem) {
    super(app);
    this.fundRef = fund;
  }

  onOpen() {
    this.refresh();
  }

  private refresh() {
    const latest = this.plugin.funds.find((item) => item.id === this.fundRef.id);
    if (latest) {
      this.fundRef = latest;
    }
    // 保底：把 amount / date 同步为 history 里的最新记录，避免历史写入异常导致显示错乱
    const latestPoint = this.getLatestHistoryPoint(this.fundRef.history ?? []);
    if (latestPoint) {
      this.fundRef = {
        ...this.fundRef,
        amount: latestPoint.amount,
        date: latestPoint.date,
      };
    }

    const { contentEl } = this;
    contentEl.empty();
    contentEl.style.position = "relative";

    this.renderEditButton(contentEl);
    this.renderHero(contentEl);
    this.renderBalanceBar(contentEl);
    this.renderHistorySection(contentEl);
    this.renderDeleteButton(contentEl);
  }

  private renderEditButton(contentEl: HTMLElement) {
    const button = createIconButton(contentEl, {
      ariaLabel: "编辑",
      content: this.createSvgIcon("pencil", 18),
      corner: "top-right",
    });
    button.onclick = () => {
      this.close();
      new FundModal(this.app, this.plugin, this.fundRef).open();
    };
  }

  private renderHero(contentEl: HTMLElement) {
    const hero = contentEl.createDiv();
    hero.style.display = "grid";
    hero.style.gridTemplateColumns = "64px 1fr";
    hero.style.alignItems = "center";
    hero.style.gap = "14px";
    hero.style.margin = "6px 40px 18px 0";

    const logo = hero.createDiv();
    logo.style.width = "64px";
    logo.style.height = "64px";
    logo.style.display = "flex";
    logo.style.alignItems = "center";
    logo.style.justifyContent = "center";
    logo.style.borderRadius = "14px";
    logo.style.background = "var(--background-secondary)";
    logo.style.border = "1px solid var(--background-modifier-border)";
    logo.style.fontSize = "26px";
    logo.style.fontWeight = "900";
    logo.style.color = "var(--text-muted)";
    logo.style.overflow = "hidden";
    this.renderLogoInto(logo, 48);

    const info = hero.createDiv();
    info.style.display = "flex";
    info.style.flexDirection = "column";
    info.style.gap = "4px";
    info.style.minWidth = "0";

    const primary = info.createEl("h2", { text: this.getPrimaryLabel() });
    primary.style.margin = "0";
    primary.style.fontSize = "22px";
    primary.style.fontWeight = "900";
    primary.style.color = "var(--text-normal)";
    primary.style.overflow = "hidden";
    primary.style.textOverflow = "ellipsis";
    primary.style.whiteSpace = "nowrap";

    const secondary = info.createDiv({ text: this.getSecondaryLabel() });
    secondary.style.fontSize = "13px";
    secondary.style.fontWeight = "700";
    secondary.style.color = "var(--text-muted)";
    secondary.style.overflow = "hidden";
    secondary.style.textOverflow = "ellipsis";
    secondary.style.whiteSpace = "nowrap";
  }

  private renderBalanceBar(contentEl: HTMLElement) {
    const bar = createSurfaceCard(contentEl, {
      padding: "14px 16px",
      borderRadius: "14px",
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "14px",
        marginBottom: "16px",
      },
    });

    const left = bar.createDiv();
    left.style.display = "flex";
    left.style.flexDirection = "column";
    left.style.gap = "4px";
    left.style.minWidth = "0";

    const label = left.createDiv({ text: "当前余额" });
    label.style.fontSize = "12px";
    label.style.fontWeight = "800";
    label.style.color = "var(--text-muted)";

    const valueEl = left.createDiv({ text: this.formatCurrencyWithSign(this.fundRef.amount) });
    valueEl.style.fontSize = "26px";
    valueEl.style.fontWeight = "950";
    valueEl.style.lineHeight = "1.1";
    valueEl.style.color = this.getCategory().type === "liability" ? "#ef4444" : "var(--text-normal)";

    const button = createPillButton(bar, {
      text: "更新余额",
      variant: "primary",
      padding: "9px 16px",
    });
    button.style.fontSize = "14px";
    button.onclick = () => this.promptUpdateBalance();
  }

  private async promptUpdateBalance() {
    const input = await openPromptModal(this.app, {
      title: "更新余额",
      placeholder: "请输入余额",
      defaultValue: String(this.fundRef.amount ?? 0),
      type: "number",
    });

    if (input === null) {
      return;
    }

    const trimmed = input.trim();

    if (!trimmed) {
      notify("请输入有效金额");
      return;
    }

    const amount = Number(trimmed);

    if (!Number.isFinite(amount)) {
      notify("请输入有效金额");
      return;
    }

    const date = getTodayISODate();
    const history = this.upsertHistoryPoint(this.fundRef.history ?? [], amount, date);
    const latest = this.getLatestHistoryPoint(history);
    const updated: FundItem = {
      ...this.fundRef,
      amount: latest ? latest.amount : amount,
      date: latest ? latest.date : date,
      history,
    };

    await this.plugin.updateFund(updated);
    this.fundRef = updated;
    notify("已更新余额");
    this.refresh();
  }

  private renderHistorySection(contentEl: HTMLElement) {
    // 标题栏：左侧"操作记录"，右侧"+"按钮
    const historyCountPreview = (this.fundRef.history ?? []).length;
    const header = createSectionHeaderWithCount(contentEl, {
      title: "操作记录",
      count: `${historyCountPreview} 条`,
    });

    const addBtn = createCircleAddButton(header, {
      ariaLabel: "新增记录",
    });
    addBtn.onclick = () => this.promptAddHistoryPoint();

    // 历史按日期降序
    const history = [...(this.fundRef.history ?? [])].sort((a, b) => b.date.localeCompare(a.date));

    if (history.length === 0) {
      const empty = contentEl.createDiv({ text: "暂无操作记录" });
      empty.style.padding = "12px 2px";
      empty.style.color = "var(--text-muted)";
      empty.style.fontSize = "13px";
      empty.style.fontWeight = "700";
      return;
    }

    const list = contentEl.createDiv();
    list.style.display = "flex";
    list.style.flexDirection = "column";

    // 计算所有金额格式化后的最大字符数，用于让每行金额以相同列宽右对齐，实现小数点对齐
    let amountColChars = 0;
    history.forEach((point) => {
      const formatted = this.formatCurrency(point.amount);
      if (formatted.length > amountColChars) amountColChars = formatted.length;
    });

    history.forEach((point, index) => {
      this.renderHistoryRow(list, point, index === history.length - 1, amountColChars);
    });
  }

  private async promptAddHistoryPoint() {
    // 新增记录：日期和金额在同一个弹窗里一起填
    const result = await this.openAddHistoryPointModal();
    if (!result) return;
    const { date, amount } = result;

    const history = this.upsertHistoryPoint(this.fundRef.history ?? [], amount, date);
    const latest = this.getLatestHistoryPoint(history);
    const updated: FundItem = {
      ...this.fundRef,
      amount: latest ? latest.amount : amount,
      date: latest ? latest.date : date,
      history,
    };
    await this.plugin.updateFund(updated);
    this.fundRef = updated;
    notify("已新增记录");
    this.refresh();
  }

  // 新增操作记录弹窗：日期 + 金额同一个页面
  private openAddHistoryPointModal(): Promise<{ date: string; amount: number } | null> {
    return new Promise((resolve) => {
      const modal = new Modal(this.app);
      let settled = false;

      modal.onOpen = () => {
        const { contentEl } = modal;
        contentEl.empty();

        const title = contentEl.createEl("h3", { text: "新增操作记录" });
        title.style.margin = "0 0 14px";
        title.style.fontSize = "16px";
        title.style.fontWeight = "900";

        // 日期
        const dateRow = contentEl.createDiv();
        dateRow.style.display = "flex";
        dateRow.style.alignItems = "center";
        dateRow.style.gap = "10px";
        dateRow.style.marginBottom = "12px";

        const dateLabel = dateRow.createDiv({ text: "日期" });
        dateLabel.style.fontSize = "13px";
        dateLabel.style.fontWeight = "800";
        dateLabel.style.color = "var(--text-muted)";
        dateLabel.style.width = "48px";
        dateLabel.style.flexShrink = "0";

        const dateField = createDatePickerField({
          value: getTodayISODate(),
          max: getTodayISODate(),
          iconSize: 16,
        });
        const dateInput = dateField.input;
        dateField.wrap.style.flex = "1 1 auto";
        dateField.wrap.style.display = "flex";
        dateInput.style.flex = "1 1 auto";
        dateInput.style.width = "100%";
        dateInput.style.padding = "8px 12px";
        dateInput.style.paddingRight = "32px";
        dateInput.style.fontSize = "14px";
        dateInput.style.borderRadius = "10px";
        dateInput.style.border = "1px solid var(--background-modifier-border)";
        dateInput.style.background = "var(--background-primary)";
        dateInput.style.color = "var(--text-normal)";
        dateInput.style.boxSizing = "border-box";
        dateRow.appendChild(dateField.wrap);

        // 金额
        const amountRow = contentEl.createDiv();
        amountRow.style.display = "flex";
        amountRow.style.alignItems = "center";
        amountRow.style.gap = "10px";
        amountRow.style.marginBottom = "4px";

        const amountLabel = amountRow.createDiv({ text: "金额" });
        amountLabel.style.fontSize = "13px";
        amountLabel.style.fontWeight = "800";
        amountLabel.style.color = "var(--text-muted)";
        amountLabel.style.width = "48px";
        amountLabel.style.flexShrink = "0";

        const amountInput = amountRow.createEl("input");
        amountInput.type = "number";
        amountInput.placeholder = "请输入余额";
        amountInput.value = String(this.fundRef.amount ?? 0);
        amountInput.style.flex = "1 1 auto";
        amountInput.style.padding = "8px 12px";
        amountInput.style.fontSize = "14px";
        amountInput.style.borderRadius = "10px";
        amountInput.style.border = "1px solid var(--background-modifier-border)";
        amountInput.style.background = "var(--background-primary)";
        amountInput.style.color = "var(--text-normal)";
        amountInput.style.boxSizing = "border-box";

        // 底部按钮
        const btnRow = contentEl.createDiv();
        btnRow.style.display = "flex";
        btnRow.style.justifyContent = "flex-end";
        btnRow.style.gap = "10px";
        btnRow.style.marginTop = "16px";

        const cancelBtn = createPillButton(btnRow, {
          text: "取消",
          variant: "ghost",
        });

        const confirmBtn = createPillButton(btnRow, {
          text: "确定",
          variant: "primary",
        });

        const submit = () => {
          const date = (dateInput.value || "").trim();
          if (!date) {
            notify("请选择日期");
            return;
          }
          const amount = Number((amountInput.value || "").trim());
          if (!Number.isFinite(amount)) {
            notify("请输入有效金额");
            return;
          }
          settled = true;
          resolve({ date, amount });
          modal.close();
        };

        cancelBtn.onclick = () => {
          settled = true;
          resolve(null);
          modal.close();
        };
        confirmBtn.onclick = submit;

        const handleKey = (e: KeyboardEvent) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            settled = true;
            resolve(null);
            modal.close();
          }
        };
        dateInput.addEventListener("keydown", handleKey);
        amountInput.addEventListener("keydown", handleKey);

        setTimeout(() => amountInput.focus(), 30);
      };

      modal.onClose = () => {
        if (!settled) {
          resolve(null);
        }
        modal.contentEl.empty();
      };

      modal.open();
    });
  }

  private renderHistoryRow(parent: HTMLElement, point: FundHistoryPoint, isLast: boolean, amountColChars = 0) {
    const row = parent.createDiv();
    row.style.padding = "10px 2px";
    if (!isLast) {
      row.style.borderBottom = "1px solid var(--background-modifier-border)";
    }

    // 行布局：[标签][金额]  <spacer>  [年][月][日]
    // - 标签 + 金额紧贴（让"调整余额为 xxx 元"视觉更紧凑）
    // - 年/月/日相邻，不插空格；用两位数字 + tabular-nums 保证跨行按列对齐
    const summary = row.createDiv();
    summary.style.display = "flex";
    summary.style.alignItems = "center";
    summary.style.cursor = "pointer";
    summary.style.gap = "0";

    const labelEl = summary.createDiv({ text: "调整余额为" });
    labelEl.style.fontSize = "13px";
    labelEl.style.fontWeight = "800";
    labelEl.style.color = "var(--text-normal)";
    labelEl.style.whiteSpace = "nowrap";
    labelEl.style.marginRight = "6px";

    const amountEl = summary.createDiv({ text: this.formatCurrency(point.amount) });
    amountEl.style.fontSize = "13px";
    amountEl.style.fontWeight = "800";
    amountEl.style.color = "var(--text-normal)";
    amountEl.style.fontVariantNumeric = "tabular-nums";
    amountEl.style.whiteSpace = "nowrap";
    // 小数点对齐：字段右对齐 + tabular-nums 等宽数字 + 按最长串占位
    amountEl.style.display = "inline-block";
    amountEl.style.textAlign = "right";
    if (amountColChars > 0) {
      amountEl.style.minWidth = `${amountColChars}ch`;
    }

    const spacer = summary.createDiv();
    spacer.style.flex = "1 1 auto";

    const { year, month, day } = this.splitDateParts(point.date);
    const dateWrap = summary.createDiv();
    dateWrap.style.display = "flex";
    dateWrap.style.alignItems = "center";
    dateWrap.style.gap = "0";
    dateWrap.style.whiteSpace = "nowrap";
    dateWrap.style.fontVariantNumeric = "tabular-nums";

    const yearEl = dateWrap.createDiv({ text: `${year}年` });
    const monthEl = dateWrap.createDiv({ text: `${month}月` });
    const dayEl = dateWrap.createDiv({ text: `${day}日` });
    [yearEl, monthEl, dayEl].forEach((el) => {
      el.style.fontSize = "12px";
      el.style.fontWeight = "700";
      el.style.color = "var(--text-muted)";
      el.style.whiteSpace = "nowrap";
      el.style.fontVariantNumeric = "tabular-nums";
    });

    const editor = row.createDiv();
    editor.style.display = "none";
    editor.style.marginTop = "10px";
    editor.style.gap = "6px";
    editor.style.alignItems = "center";
    editor.style.flexWrap = "nowrap";

    const amountInput = editor.createEl("input");
    amountInput.type = "number";
    amountInput.value = String(point.amount);
    // 余额框窄一半（原 150px → 75px）
    amountInput.style.flex = "0 0 75px";
    amountInput.style.width = "75px";
    amountInput.style.minWidth = "0";
    amountInput.style.padding = "6px 8px";
    amountInput.style.borderRadius = "8px";
    amountInput.style.border = "1px solid var(--background-modifier-border)";
    amountInput.style.background = "var(--background-primary)";
    amountInput.style.color = "var(--text-normal)";
    amountInput.style.fontSize = "13px";
    amountInput.style.boxSizing = "border-box";

    const dateField = createDatePickerField({
      value: point.date,
      max: getTodayISODate(),
      iconSize: 14,
    });
    const dateInput = dateField.input;
    dateField.wrap.style.flex = "1 1 auto";
    dateField.wrap.style.minWidth = "0";
    dateField.wrap.style.display = "flex";
    dateInput.style.flex = "1 1 auto";
    dateInput.style.width = "100%";
    dateInput.style.minWidth = "0";
    dateInput.style.padding = "6px 10px";
    dateInput.style.paddingRight = "28px";
    dateInput.style.borderRadius = "8px";
    dateInput.style.border = "1px solid var(--background-modifier-border)";
    dateInput.style.background = "var(--background-primary)";
    dateInput.style.color = "var(--text-normal)";
    dateInput.style.fontSize = "13px";
    dateInput.style.boxSizing = "border-box";
    editor.appendChild(dateField.wrap);

    // 三个动作按钮改为纯图标：去掉边框、背景、文字；一行展示
    const actionBtnStyle = (btn: HTMLButtonElement, color: string) => {
      btn.style.padding = "4px";
      btn.style.border = "none";
      btn.style.background = "transparent";
      btn.style.color = color;
      btn.style.cursor = "pointer";
      btn.style.display = "inline-flex";
      btn.style.alignItems = "center";
      btn.style.justifyContent = "center";
      btn.style.flexShrink = "0";
      btn.style.lineHeight = "0";
      btn.style.borderRadius = "6px";
      btn.style.boxShadow = "none";
    };

    const saveBtn = editor.createEl("button");
    saveBtn.ariaLabel = "保存";
    actionBtnStyle(saveBtn, "var(--interactive-accent)");
    saveBtn.appendChild(this.createSvgIcon("check", 16));

    const cancelBtn = editor.createEl("button");
    cancelBtn.ariaLabel = "取消";
    actionBtnStyle(cancelBtn, "var(--text-muted)");
    cancelBtn.appendChild(this.createSvgIcon("close", 16));

    const deleteBtn = editor.createEl("button");
    deleteBtn.ariaLabel = "删除";
    actionBtnStyle(deleteBtn, "#ef4444");
    deleteBtn.appendChild(this.createSvgIcon("trash", 16));

    summary.onclick = () => {
      editor.style.display = editor.style.display === "none" ? "flex" : "none";
    };

    saveBtn.onclick = async (event) => {
      event.stopPropagation();
      const nextAmount = Number(amountInput.value);

      if (!Number.isFinite(nextAmount)) {
        notify("请输入有效金额");
        return;
      }

      const nextDate = dateInput.value || point.date;
      await this.updateHistoryPoint(point, nextAmount, nextDate);
    };

    cancelBtn.onclick = (event) => {
      event.stopPropagation();
      // 还原输入值并折叠 editor
      amountInput.value = String(point.amount);
      dateInput.value = point.date;
      editor.style.display = "none";
    };

    deleteBtn.onclick = async (event) => {
      event.stopPropagation();
      if (!confirm("确定删除这条操作记录？")) {
        return;
      }
      await this.deleteHistoryPoint(point);
    };
  }

  private async updateHistoryPoint(original: FundHistoryPoint, amount: number, date: string) {
    const history = (this.fundRef.history ?? []).map((point) =>
      point.id === original.id ? { ...point, amount, date } : point
    ).sort((a, b) => a.date.localeCompare(b.date));

    const latest = this.getLatestHistoryPoint(history);
    const updated: FundItem = {
      ...this.fundRef,
      history,
      amount: latest ? latest.amount : this.fundRef.amount,
      date: latest ? latest.date : this.fundRef.date,
    };

    await this.plugin.updateFund(updated);
    this.fundRef = updated;
    notify("已更新记录");
    this.refresh();
  }

  private async deleteHistoryPoint(original: FundHistoryPoint) {
    const history = (this.fundRef.history ?? []).filter((point) => point.id !== original.id);
    const latest = this.getLatestHistoryPoint(history);

    const updated: FundItem = {
      ...this.fundRef,
      history,
      amount: latest ? latest.amount : this.fundRef.amount,
      date: latest ? latest.date : this.fundRef.date,
    };

    await this.plugin.updateFund(updated);
    this.fundRef = updated;
    notify("已删除记录");
    this.refresh();
  }

  private getLatestHistoryPoint(history: FundHistoryPoint[]): FundHistoryPoint | undefined {
    return getLatestHistoryPoint(history);
  }

  private upsertHistoryPoint(history: FundHistoryPoint[], amount: number, date: string) {
    return upsertHistoryPoint(history, amount, date);
  }

  private renderDeleteButton(contentEl: HTMLElement) {
    const button = createFullWidthDeleteButton(contentEl, {
      ariaLabel: "删除",
      icon: this.createSvgIcon("trash", 18),
      text: "删除此账户",
    });

    button.onclick = async () => {
      if (!confirm(`确定删除"${this.getPrimaryLabel()}"？`)) {
        return;
      }

      await this.plugin.deleteFund(this.fundRef.id);
      notify("已删除");
      this.close();
    };
  }

  private getPrimaryLabel() {
    if (this.fundRef.bank) {
      const tail = this.getCardTail(this.fundRef.card_number);
      return tail ? `${this.fundRef.bank}（${tail}）` : this.fundRef.bank;
    }
    return this.fundRef.name || this.getCategory().name;
  }

  private getSecondaryLabel() {
    // 五险一金：城市优先；若同时有备注则拼为「城市（备注）」，方便一眼区分
    // 同名条目（例如多个城市的医保 / 公积金）。
    if (this.fundRef.category === "social_security" && this.fundRef.city && this.fundRef.city.trim()) {
      const city = this.fundRef.city.trim();
      const remark = this.fundRef.remark?.trim();
      return remark ? `${city}（${remark}）` : city;
    }

    if (this.fundRef.remark && this.fundRef.remark.trim()) {
      return this.fundRef.remark.trim();
    }

    if (this.fundRef.bank) {
      const category = this.getCategory();
      const defaultName = `${this.fundRef.bank}${category.id === "debit_card" ? "储蓄卡" : "信用卡"}`;

      if (this.fundRef.name && this.fundRef.name !== defaultName) {
        return this.fundRef.name;
      }

      return category.name;
    }

    return this.getCategory().name;
  }

  private getLogoPlaceholder() {
    if (this.fundRef.bank) {
      return this.fundRef.bank.charAt(0);
    }

    const map: Record<string, string> = {
      cash: "💵",
      virtual_account: "◉",
      investment: "📈",
      claim: "↩",
      liability: "⚠",
      social_security: "🛡",
      custom_asset: "★",
    };

    return map[this.getCategory().id] ?? "•";
  }

  private getLogoKey(): string | null {
    const bankKeyMap: Record<string, string> = {
      "工商银行": "icbc",
      "建设银行": "ccb",
      "农业银行": "abc",
      "中国银行": "boc",
      "招商银行": "cmb",
      "交通银行": "bocom",
      "邮政银行": "psbc",
      "邮储银行": "psbc",
      "中信银行": "citic_bank",
      "众安银行": "zhongan_bank",
      "北京银行": "bob",
      "汇丰银行": "hsbc",
      "河南农村信用社": "henan_rcc",
      "支付宝": "alipay",
      "微信": "wechat",
      "蚂蚁花呗": "huabei",
      "花呗": "huabei",
      "京东白条": "jd_baitiao",
      "白条": "jd_baitiao",
    };
    if (this.fundRef.bank) {
      if (bankKeyMap[this.fundRef.bank]) return bankKeyMap[this.fundRef.bank];
      for (const zh of Object.keys(bankKeyMap)) {
        if (this.fundRef.bank.includes(zh)) return bankKeyMap[zh];
      }
    }
    const source = this.fundRef.name ?? "";
    for (const zh of Object.keys(bankKeyMap)) {
      if (source.includes(zh)) return bankKeyMap[zh];
    }
    return null;
  }

  private getPluginAssetDir(): string {
    return getPluginAssetDir(this.plugin);
  }

  private normalizeSvg(text: string, size: number): string {
    return normalizeSvgContent(text, size);
  }

  private renderLogoInto(container: HTMLElement, size: number) {
    container.empty();
    const key = this.getLogoKey();
    const fallback = () => {
      container.empty();
      // 对 cash / liability 等分类，优先渲染内嵌矢量图标（更清晰、可随尺寸缩放）
      if (this.renderCategoryIconInto(container, this.getCategory().id, size)) {
        return;
      }
      container.innerText = this.getLogoPlaceholder();
    };

    if (!key) {
      fallback();
      return;
    }

    const store = host().store;
    const resources = host().resources;
    const svgPath = `${this.getPluginAssetDir()}/assets/logo/${key}.svg`;
    const pngPath = `${this.getPluginAssetDir()}/assets/logo/${key}.png`;

    fallback();

    (async () => {
      try {
        if (await store.exists(svgPath)) {
          const text = await store.read(svgPath);
          if (!container.isConnected) return;
          container.empty();
          container.innerHTML = this.normalizeSvg(text, size);
          return;
        }
        if (await store.exists(pngPath)) {
          if (!container.isConnected) return;
          container.empty();
          const img = container.createEl("img");
          img.src = resources.resolveUrl(pngPath);
          img.alt = key;
          img.style.width = `${size}px`;
          img.style.height = `${size}px`;
          img.style.objectFit = "contain";
        }
      } catch {
        // keep fallback
      }
    })();
  }

  // 为特定分类渲染内嵌矢量图标；成功返回 true
  private renderCategoryIconInto(container: HTMLElement, categoryId: string, size: number): boolean {
    if (categoryId !== "cash") return false;

    // lucide banknote 图标：纸币外框 + 内部圆 + 两角点缀
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", String(size));
    svg.setAttribute("height", String(size));
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "#16a34a");
    svg.setAttribute("stroke-width", "1.6");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");

    const paths = [
      "M3 7h18v10H3z",
      "M12 9.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z",
      "M6 10v4",
      "M18 10v4",
    ];
    paths.forEach((d) => {
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("d", d);
      svg.appendChild(p);
    });

    container.appendChild(svg);
    return true;
  }

  private getCardTail(cardNumber?: string) {
    if (!cardNumber) {
      return "";
    }

    const digits = cardNumber.replace(/\D/g, "");

    if (!digits) {
      return cardNumber.trim();
    }

    return digits.slice(-4);
  }

  private getCategory() {
    return FUND_CATEGORIES.find((c) => c.id === this.fundRef.category) ?? FUND_CATEGORIES[0];
  }

  private formatCurrency(value: number) {
    return sharedFormatCurrency(this.plugin, value);
  }

  private formatCurrencyWithSign(value: number) {
    const formatted = this.formatCurrency(value);
    if (this.getCategory().type === "liability" && value > 0) {
      return `-${formatted}`;
    }
    return formatted;
  }

  // 拆分 ISO 日期为年/月/日，便于对齐显示（月/日统一补零为两位，保证跨行按列对齐）
  private splitDateParts(dateStr: string): { year: string; month: string; day: string } {
    if (!dateStr) return { year: "—", month: "—", day: "—" };
    const parts = dateStr.split("-");
    if (parts.length !== 3) return { year: dateStr, month: "", day: "" };
    const pad2 = (s: string) => {
      const n = Number(s);
      if (!Number.isFinite(n)) return s;
      return n < 10 ? `0${n}` : String(n);
    };
    return {
      year: parts[0],
      month: pad2(parts[1]),
      day: pad2(parts[2]),
    };
  }

  // 统一的线性 SVG 图标（lucide 风格），与其他页面保持一致
  private createSvgIcon(name: "pencil" | "trash" | "check" | "close", size = 18): SVGElement {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", String(size));
    svg.setAttribute("height", String(size));
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.8");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");

    const ds: string[] = (() => {
      switch (name) {
        case "pencil":
          return [
            "M12 20h9",
            "M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z",
          ];
        case "trash":
          return [
            "M3 6h18",
            "M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2",
            "M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6",
            "M10 11v6",
            "M14 11v6",
          ];
        case "check":
          return ["M5 12l5 5L20 7"];
        case "close":
          return ["M6 6l12 12", "M18 6l-12 12"];
      }
    })();

    ds.forEach((d) => {
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("d", d);
      svg.appendChild(p);
    });
    return svg;
  }
}
