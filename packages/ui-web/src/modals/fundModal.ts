import { App, Modal, Setting } from "obsidian";
import { notify } from "@core";
import { getTodayISODate } from "@core/calc/assetMath";
import type { AppModel } from "@ui/host/appModel";
import type { FundCategoryId, FundHistoryPoint, FundItem } from "@core/types";
import {
  COMMON_BANKS,
  COMMON_CREDIT_CARD_ISSUERS,
  COMMON_INVESTMENTS,
  COMMON_LIABILITIES,
  COMMON_SOCIAL_SECURITY,
  COMMON_VIRTUAL_ACCOUNTS,
  DEFAULT_FUND_CATEGORY_ID,
  FUND_CATEGORIES,
} from "@core/types";
import { addDateField, addDropdownField, addNumberField, addTextField } from "./shared/formFields";
import { createPillButton } from "./shared/modalButtons";
import {
  renderFundBankDropdown,
  type FundBankDropdownHandle,
} from "./shared/fundBankDropdown";
import { upsertHistoryPoint } from "./shared/historyPoint";
import { findIcon } from "../icons";
import { getIconPath } from "../iconResolver";
import { openIconPicker } from "./iconPicker";
import {
  BANK_ICON,
  CASH_BANKNOTE_ICON,
  CLAIM_DEFAULT_ICON,
  CREDIT_CARD_ICON,
  CUSTOM_ASSET_DEFAULT_ICON,
  INVESTMENT_DEFAULT_ICON,
  INVESTMENT_FUND_ICON,
  INVESTMENT_STOCK_ICON,
  LIABILITY_BORROW_ICON,
  LIABILITY_DEFAULT_ICON,
  LIABILITY_LOAN_ICON,
  SOCIAL_SECURITY_DEFAULT_ICON,
  SOCIAL_SECURITY_HOUSING_FUND_ICON,
  SOCIAL_SECURITY_MEDICAL_ICON,
  VIRTUAL_ACCOUNT_DEFAULT_ICON,
} from "../iconLibrary";
import { resolveBankIconDataUrl } from "../fund/bankLogoByName";

/**
 * Set of icon ids that this modal can auto-assign as a "system default":
 *   - the per-category fallbacks from getDefaultIconForCategory()
 *   - the per-sub-option overrides from getIconForSubOption()
 *
 * Used by `iconLooksLikeSystemDefault` to decide whether changing a dropdown
 * is allowed to automatically update an existing fund's icon.
 */
const AUTO_DEFAULT_ICON_IDS = new Set<string>([
  CASH_BANKNOTE_ICON,
  CREDIT_CARD_ICON,
  BANK_ICON,
  VIRTUAL_ACCOUNT_DEFAULT_ICON,
  INVESTMENT_DEFAULT_ICON,
  INVESTMENT_STOCK_ICON,
  INVESTMENT_FUND_ICON,
  LIABILITY_DEFAULT_ICON,
  LIABILITY_LOAN_ICON,
  LIABILITY_BORROW_ICON,
  CLAIM_DEFAULT_ICON,
  SOCIAL_SECURITY_DEFAULT_ICON,
  SOCIAL_SECURITY_HOUSING_FUND_ICON,
  SOCIAL_SECURITY_MEDICAL_ICON,
  CUSTOM_ASSET_DEFAULT_ICON,
]);

type FundDraft = {
  id: string;
  name: string;
  amount: number;
  date: string;
  category: FundCategoryId;
  history: FundHistoryPoint[];
  bank: string;
  card_number: string;
  remark: string;
  city: string;
  icon: string;
};

export type FundModalDefaults = {
  category?: FundCategoryId;
  bank?: string;
  card_number?: string;
  name?: string;
};

export class FundModal extends Modal {
  private readonly state: FundDraft;
  private readonly defaults: FundModalDefaults;
  private readonly onBack?: () => void;
  private dropdownHandle?: FundBankDropdownHandle;
  /**
   * True when `state.icon` was filled automatically by us (cash banknote,
   * credit-card stock SVG, or a bank logo). A manual selection via the
   * icon picker flips this to false so subsequent auto defaults won't
   * overwrite the user's choice.
   */
  private iconIsAutoDefault = false;
  /**
   * Stable handle to the "图标" Setting row's controlEl, so dropdown
   * pickers can refresh the preview thumbnail without re-querying the DOM
   * (which would fail if the previous preview node had already been removed).
   */
  private iconSettingControlEl?: HTMLElement;
  /** "选择图标 / 更换图标" 按钮的引用。下拉联动后从“选择”变为“更换”。 */
  private iconSettingButton?: { setButtonText: (text: string) => unknown };

  constructor(
    app: App,
    private plugin: AppModel,
    private fund?: FundItem,
    defaults: FundModalDefaults | FundCategoryId = DEFAULT_FUND_CATEGORY_ID,
    onBack?: () => void,
  ) {
    super(app);
    this.defaults = typeof defaults === "string" ? { category: defaults } : (defaults ?? {});
    this.onBack = onBack;
    this.state = fund
      ? {
        id: fund.id,
        name: fund.name,
        amount: fund.amount,
        date: fund.date,
        category: fund.category ?? DEFAULT_FUND_CATEGORY_ID,
        history: [...(fund.history ?? [{ id: crypto.randomUUID(), amount: fund.amount, date: fund.date }])],
        bank: fund.bank ?? "",
        card_number: fund.card_number ?? "",
        remark: fund.remark ?? "",
        city: fund.city ?? "",
        icon: fund.icon ?? "",
      }
      : {
        id: crypto.randomUUID(),
        name: this.defaults.name ?? "",
        amount: 0,
        date: getTodayISODate(),
        category: this.defaults.category ?? DEFAULT_FUND_CATEGORY_ID,
        history: [],
        bank: this.defaults.bank ?? "",
        card_number: this.defaults.card_number ?? "",
        remark: "",
        city: "",
        icon: "",
      };
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    const isCard = this.state.category === "debit_card" || this.state.category === "credit_card";
    const isCash = this.state.category === "cash";
    const isVirtual = this.state.category === "virtual_account";
    const isLiability = this.state.category === "liability";
    const isInvestment = this.state.category === "investment";
    const isClaim = this.state.category === "claim";
    const isSocialSecurity = this.state.category === "social_security";
    const isCustomAsset = this.state.category === "custom_asset";
    // 隐藏“分类”下拉的分类集（分类已由入口确定）
    const isCategoryPreset = isCard || isCash || isVirtual || isLiability || isInvestment
      || isClaim || isSocialSecurity || isCustomAsset;

    contentEl.createEl("h2", {
      text: this.fund
        ? "编辑资金"
        : isCard
          ? (this.state.category === "debit_card" ? "新增借记卡" : "新增信用卡")
          : isCash
            ? "新增现金"
            : isVirtual
              ? "新增虚拟账户"
              : isLiability
                ? "新增负债"
                : isInvestment
                  ? "新增投资账户"
                  : isClaim
                    ? "新增债权"
                    : isSocialSecurity
                      ? "新增五险一金"
                      : isCustomAsset
                        ? "新增自定义资产"
                        : "新增资金",
    });

    // 新增现金：默认名字就叫“现金”；跳过“分类”选择，只保留余额 / 备注 / 日期
    if (isCash && !this.state.name) {
      this.state.name = "现金";
    }

    // 默认图标：根据分类预填，仅在“新增”且用户未选过图标时生效。
    // 后续“子选项”变动（applyOptionName / applyBankName）会在
    // iconIsAutoDefault 为 true 时进一步覆盖为更贴切的子类图标。
    if (!this.fund && !this.state.icon) {
      const fallback = this.getDefaultIconForCategory();
      if (fallback) {
        this.state.icon = fallback;
        this.iconIsAutoDefault = true;
      }
    }

    // 编辑模式：若当前 icon 仍为系统预设的默认图标（例如首次创建时自动
    // 指派的那些），或干脆为空（早期数据未保存图标），都认为用户从未亲手
    // 选过图标——后续下拉子选项变动时允许联动的默认图标跳动。这使“从贷款
    // 改为借入”之类的编辑也能同步更新图标。
    if (this.fund && this.iconLooksLikeSystemDefault(this.state.icon)) {
      this.iconIsAutoDefault = true;
    }

    if (isCard) {
      const cardOptions = this.state.category === "credit_card"
        ? COMMON_CREDIT_CARD_ISSUERS
        : COMMON_BANKS;
      this.dropdownHandle = renderFundBankDropdown(contentEl, {
        app: this.app,
        plugin: this.plugin,
        label: this.state.category === "credit_card" ? "发卡机构" : "银行",
        placeholder: this.state.category === "credit_card" ? "请选择发卡机构" : "请选择银行",
        customPromptTitle: this.state.category === "credit_card"
          ? "请输入发卡机构名称"
          : "请输入银行名称",
        options: cardOptions,
        initialValue: this.state.bank,
        onPick: (bank) => this.applyBankName(bank),
      });

      // 初次渲染：若已有 bank（编辑现有卡，或从 defaults 传进来），且 icon 仍是
      // 自动默认（含编辑模式下从未被手动改过的情况），尝试用机构 logo 覆盖。
      if (this.state.bank && this.iconIsAutoDefault) {
        this.maybeApplyBankIcon(this.state.bank);
      }

      addTextField(contentEl, {
        name: "卡号",
        placeholder: "可只填末四位",
        value: this.state.card_number,
        onChange: (value) => {
          this.state.card_number = value.trim();
        },
      });
    } else if (isVirtual) {
      // 虚拟账户：下拉选择，逻辑同银行卡
      this.dropdownHandle = renderFundBankDropdown(contentEl, {
        app: this.app,
        plugin: this.plugin,
        label: "账户",
        placeholder: "请选择账户",
        customPromptTitle: "请输入账户名称",
        options: COMMON_VIRTUAL_ACCOUNTS,
        initialValue: this.state.bank,
        onPick: (picked) => this.applyOptionName(picked, COMMON_VIRTUAL_ACCOUNTS),
      });
    } else if (isLiability) {
      // 负债：下拉选择，逻辑同虚拟账户
      this.dropdownHandle = renderFundBankDropdown(contentEl, {
        app: this.app,
        plugin: this.plugin,
        label: "负债",
        placeholder: "请选择负债",
        customPromptTitle: "请输入负债名称",
        options: COMMON_LIABILITIES,
        initialValue: this.state.bank,
        onPick: (picked) => this.applyOptionName(picked, COMMON_LIABILITIES),
      });
    } else if (isInvestment) {
      // 投资账户：下拉选择（股票 / 基金 / 其他），逻辑同银行卡
      this.dropdownHandle = renderFundBankDropdown(contentEl, {
        app: this.app,
        plugin: this.plugin,
        label: "投资类型",
        placeholder: "请选择投资类型",
        customPromptTitle: "请输入投资类型名称",
        options: COMMON_INVESTMENTS,
        initialValue: this.state.bank,
        onPick: (picked) => this.applyOptionName(picked, COMMON_INVESTMENTS),
      });
    } else if (isClaim) {
      // 债权：只需要名称 / 金额 / 备注（“应收”在下面名称里填）
      addTextField(contentEl, {
        name: "名称",
        value: this.state.name,
        onChange: (value) => {
          this.state.name = value;
        },
      });
    } else if (isSocialSecurity) {
      // 五险一金：下拉选择子项（住房公积金 / 医疗保险 / …）
      this.dropdownHandle = renderFundBankDropdown(contentEl, {
        app: this.app,
        plugin: this.plugin,
        label: "项目",
        placeholder: "请选择项目",
        customPromptTitle: "请输入项目名称",
        options: COMMON_SOCIAL_SECURITY,
        initialValue: this.state.bank,
        onPick: (picked) => this.applyOptionName(picked, COMMON_SOCIAL_SECURITY),
      });
      // 参保城市
      addTextField(contentEl, {
        name: "城市",
        value: this.state.city,
        onChange: (value) => {
          this.state.city = value.trim();
        },
      });
    } else if (isCustomAsset) {
      // 自定义资产：只需名称 / 金额 / 备注
      addTextField(contentEl, {
        name: "名称",
        value: this.state.name,
        onChange: (value) => {
          this.state.name = value;
        },
      });
    } else if (isCash) {
      // 现金：不显示名称 / 分类选择
    } else {
      addTextField(contentEl, {
        name: "名称",
        value: this.state.name,
        onChange: (value) => {
          this.state.name = value;
        },
      });

      if (!isCategoryPreset) {
        addDropdownField(contentEl, {
          name: "分类",
          value: this.state.category,
          options: FUND_CATEGORIES.map((category) => ({
            value: category.id,
            label: category.examples ? `${category.name} · ${category.examples}` : category.name,
          })),
          onChange: (value) => {
            this.state.category = value as FundCategoryId;
          },
        });
      }
    }

    this.renderIconSetting(contentEl);

    addNumberField(contentEl, {
      name: this.state.category === "credit_card" || this.state.category === "liability" ? "欠款金额" : "余额",
      value: this.state.amount,
      onChange: (value) => {
        this.state.amount = value;
      },
    });

    if (isCard || isCash || isVirtual || isLiability || isInvestment
      || isClaim || isSocialSecurity || isCustomAsset) {
      // 卡类 / 现金 / 虚拟账户 / 负债 / 投资 / 债权 / 五险一金 / 自定义资产：
      // 用“备注”替代分类（分类已由入口确定）
      addTextField(contentEl, {
        name: "备注",
        placeholder: "可选",
        value: this.state.remark,
        onChange: (value) => {
          this.state.remark = value;
        },
      });
    }
    addDateField(contentEl, {
      name: "日期",
      value: this.state.date,
      max: "today",
      onChange: (value) => {
        this.state.date = value;
      },
    });

    const hint = contentEl.createDiv({ text: "保存时会把本次金额记录到历史，用于资金趋势图。" });
    hint.style.margin = "10px 0 0";
    hint.style.color = "var(--text-muted)";
    hint.style.fontSize = "13px";
    hint.style.fontWeight = "800";

    // 底部按钮行：返回（仅新增时且提供了 onBack）+ 保存
    const actionRow = new Setting(contentEl);
    actionRow.settingEl.style.borderTop = "none";
    actionRow.infoEl.remove();
    actionRow.controlEl.style.display = "flex";
    actionRow.controlEl.style.gap = "10px";
    actionRow.controlEl.style.justifyContent = "flex-end";

    if (!this.fund && this.onBack) {
      const backButton = createPillButton(actionRow.controlEl, {
        text: "返回",
        variant: "ghost",
        padding: "8px 18px",
      });
      backButton.onclick = () => this.goBack();
    }

    const saveButton = createPillButton(actionRow.controlEl, {
      text: "保存",
      variant: "primary",
      padding: "8px 22px",
    });
    saveButton.onclick = () => this.save();
  }

  onClose() {
    this.dropdownHandle?.teardown();
    this.dropdownHandle = undefined;
    super.onClose?.();
  }

  /**
   * Close the current modal and invoke `onBack` — caller decides what to
   * re-open (typically the FundCategoryPickerModal).
   */
  private goBack() {
    const back = this.onBack;
    this.close();
    back?.();
  }

  /**
   * Bank-card flavour: default name is `${bank}储蓄卡/信用卡`, but only
   * overwrite when the user hasn't typed a custom name (empty, or still the
   * previously-auto-generated `*卡` name).
   *
   * 信用卡的发卡机构可能是"蚂蚁花呗 / 京东白条"这种非银行，此时 name
   * 直接用机构名本身，不拼"信用卡"后缀。
   */
  private applyBankName(bank: string) {
    this.state.bank = bank;
    const isCreditCardLikeInstitution = this.state.category === "credit_card"
      && (bank === "蚂蚁花呗" || bank === "京东白条" || bank === "花呗" || bank === "白条");
    const suffix = this.state.category === "debit_card" ? "储蓄卡" : "信用卡";
    if (!this.state.name || this.looksLikeAutoName(this.state.name)) {
      this.state.name = isCreditCardLikeInstitution ? bank : `${bank}${suffix}`;
    }
    // 选中银行后，若当前 icon 还是“自动默认”（包括编辑模式下从未被
    // 手动改过的），尝试用该机构的 logo 覆盖。
    if (this.iconIsAutoDefault) {
      void this.maybeApplyBankIcon(bank);
    }
  }

  /**
   * 也供编辑场景使用：仅当 icon 未被用户手动改过时写入。
   * 读失败 / 无 SVG 时保持原有默认 icon。
   */
  private async maybeApplyBankIcon(bank: string): Promise<void> {
    const dataUrl = await resolveBankIconDataUrl(this.plugin, bank);
    if (!dataUrl) return;
    // 异步读完再检查一次：用户可能中途手动换过图标，不要覆盖
    if (!this.iconIsAutoDefault) return;
    this.state.icon = dataUrl;
    this.renderSelectedIconPreview();
    this.iconSettingButton?.setButtonText("更换图标");
  }

  /**
   * 集合了所有"由本插件主动赋默认值时用到的"图标 id 与 logo 前缀。
   * 编辑现有资金时，若 icon 命中其中之一，则视作"用户从未亲手选过图标"，
   * 后续下拉子选项变动可以自动联动更新默认图标。
   *
   * 不在此集合中的 icon（例如用户从图标选择器挑的"小猪存钱罐"、本地裁剪
   * 上传的 `obsiwealth:icons/xxx.png`）一律视作"用户的明确选择"，
   * 联动逻辑不会去覆盖它们。
   */
  private iconLooksLikeSystemDefault(icon: string): boolean {
    if (!icon) return true;
    // bank logo 是在 applyBankName 异步写入的 SVG dataURL，前缀稳定。
    if (icon.startsWith("data:image/svg+xml")) return true;
    return AUTO_DEFAULT_ICON_IDS.has(icon);
  }

  /**
   * Per-category default icon used when the user hasn't explicitly picked
   * one yet. `applyOptionName` further refines this once the user picks a
   * sub-option (e.g. 股票 → 金色"股"字 SVG).
   */
  private getDefaultIconForCategory(): string | null {
    switch (this.state.category) {
      case "cash":
        return CASH_BANKNOTE_ICON;
      case "debit_card":
        return CREDIT_CARD_ICON;
      case "credit_card":
        // 信用卡默认用“银行”图标（机构选中后会被 logo 进一步覆盖）。
        return BANK_ICON;
      case "virtual_account":
        return VIRTUAL_ACCOUNT_DEFAULT_ICON;
      case "investment":
        return INVESTMENT_DEFAULT_ICON;
      case "liability":
        return LIABILITY_DEFAULT_ICON;
      case "claim":
        return CLAIM_DEFAULT_ICON;
      case "social_security":
        return SOCIAL_SECURITY_DEFAULT_ICON;
      case "custom_asset":
        return CUSTOM_ASSET_DEFAULT_ICON;
      default:
        return null;
    }
  }

  /** Per-sub-option icon override. Falls back to null if none. */
  private getIconForSubOption(picked: string): string | null {
    if (this.state.category === "investment") {
      if (picked === "股票") return INVESTMENT_STOCK_ICON;
      if (picked === "基金") return INVESTMENT_FUND_ICON;
      return INVESTMENT_DEFAULT_ICON;
    }
    if (this.state.category === "liability") {
      if (picked === "贷款") return LIABILITY_LOAN_ICON;
      if (picked === "借入") return LIABILITY_BORROW_ICON;
      return LIABILITY_DEFAULT_ICON;
    }
    if (this.state.category === "social_security") {
      if (picked === "住房公积金") return SOCIAL_SECURITY_HOUSING_FUND_ICON;
      if (picked === "医疗保险") return SOCIAL_SECURITY_MEDICAL_ICON;
      return SOCIAL_SECURITY_DEFAULT_ICON;
    }
    return null;
  }

  /**
   * Virtual-account / liability flavour: default name follows the picked item
   * verbatim unless the user has already typed something unrelated.
   */
  private applyOptionName(picked: string, options: readonly string[]) {
    this.state.bank = picked;
    if (
      !this.state.name
      || this.state.name === "现金"
      || this.looksLikeAutoName(this.state.name)
      || options.indexOf(this.state.name) >= 0
    ) {
      this.state.name = picked;
    }
    // 子选项联动默认图标：仅在“未手动选过图标”时覆盖。连同刷新预览
    // 与「选择图标 / 更换图标」按钮文案，保证“图标那一行”能即时反映当前选择。
    if (this.iconIsAutoDefault) {
      const next = this.getIconForSubOption(picked);
      if (next) {
        this.state.icon = next;
        this.renderSelectedIconPreview();
        this.iconSettingButton?.setButtonText("更换图标");
      }
    }
  }

  // 判断 name 是否是"银行+储蓄卡/信用卡"自动生成名，若是则允许换行覆盖
  private looksLikeAutoName(name: string): boolean {
    return /储蓄卡$|信用卡$/.test(name);
  }

  private renderIconSetting(contentEl: HTMLElement) {
    const iconSetting = new Setting(contentEl)
      .setName("图标")
      .addButton((button) => {
        this.iconSettingButton = button as unknown as { setButtonText: (text: string) => unknown };
        button.setButtonText(this.state.icon ? "更换图标" : "选择图标");
        button.onClick(() => {
          openIconPicker(this.app, (icon) => {
            this.state.icon = icon.id;
            this.iconIsAutoDefault = false;
            button.setButtonText("更换图标");
            this.renderSelectedIconPreview();
          }, "money");
        });
      });
    // 隐藏 description 位置的小字
    iconSetting.settingEl.querySelector(".setting-item-description")?.remove();

    if (this.state.icon) {
      iconSetting.addExtraButton((button) => {
        button.setIcon("cross");
        button.setTooltip("清除自定义图标");
        button.onClick(() => {
          this.state.icon = "";
          this.onOpen();
        });
      });
    }

    // 缓存稳定引用，供下拉联动、银行 logo 异步写入、子选项联动等重架预览。
    this.iconSettingControlEl = iconSetting.controlEl;
    this.renderSelectedIconPreview();
  }

  private renderSelectedIconPreview(controlEl?: HTMLElement) {
    const host = controlEl ?? this.iconSettingControlEl;
    if (!host) return;

    host.find(".obsiwealth-selected-icon")?.remove();

    const preview = host.createDiv("obsiwealth-selected-icon");
    preview.style.display = "flex";
    preview.style.alignItems = "center";
    preview.style.justifyContent = "center";
    preview.style.width = "36px";
    preview.style.height = "36px";
    preview.style.borderRadius = "8px";
    preview.style.background = "var(--background-modifier-hover)";
    preview.style.overflow = "hidden";
    preview.style.marginRight = "8px";
    preview.style.order = "-1";

    const icon = findIcon(this.state.icon);

    if (!icon) {
      preview.setText("🏦");
      return;
    }

    const img = preview.createEl("img");
    img.src = getIconPath(icon.id);
    img.alt = icon.name;
    img.style.width = "32px";
    img.style.height = "32px";
    img.style.objectFit = "contain";
  }

  private async save() {
    const isCard = this.state.category === "debit_card" || this.state.category === "credit_card";
    const isCash = this.state.category === "cash";
    const isVirtual = this.state.category === "virtual_account";
    const isLiability = this.state.category === "liability";
    const isInvestment = this.state.category === "investment";
    const isSocialSecurity = this.state.category === "social_security";

    if (isCard && !this.state.bank) {
      notify("请选择银行");
      return;
    }

    if (isVirtual && !this.state.bank) {
      notify("请选择账户");
      return;
    }

    if (isLiability && !this.state.bank) {
      notify("请选择负债");
      return;
    }

    if (isInvestment && !this.state.bank) {
      notify("请选择投资类型");
      return;
    }

    if (isSocialSecurity && !this.state.bank) {
      notify("请选择项目");
      return;
    }

    const name = (this.state.name || "").trim()
      || (isCard ? `${this.state.bank}${this.state.category === "debit_card" ? "储蓄卡" : "信用卡"}` : "")
      || (isVirtual ? this.state.bank : "")
      || (isLiability ? this.state.bank : "")
      || (isInvestment ? this.state.bank : "")
      || (isSocialSecurity ? this.state.bank : "")
      || (isCash ? "现金" : "");

    if (!name) {
      notify("请输入资金名称");
      return;
    }

    const history = upsertHistoryPoint(this.state.history, this.state.amount, this.state.date);
    const latest = history.length > 0 ? history.reduce((a, b) => (a.date.localeCompare(b.date) >= 0 ? a : b)) : undefined;

    const item: FundItem = {
      id: this.state.id,
      name,
      // 当前余额始终按历史中最新日期的记录
      amount: latest ? latest.amount : this.state.amount,
      date: latest ? latest.date : this.state.date,
      category: this.state.category,
      history,
    };

    if (this.state.bank) {
      item.bank = this.state.bank;
    }
    if (this.state.card_number) {
      item.card_number = this.state.card_number;
    }
    if (this.state.remark && this.state.remark.trim()) {
      item.remark = this.state.remark.trim();
    }
    if (this.state.city && this.state.city.trim()) {
      item.city = this.state.city.trim();
    }
    if (this.state.icon) {
      item.icon = this.state.icon;
    }

    if (this.fund) {
      await this.plugin.updateFund(item);
      notify("已更新资金");
    } else {
      await this.plugin.addFund(item);
      notify("已添加资金");
    }

    this.close();
  }
}
