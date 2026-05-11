import { App, PluginSettingTab, Setting } from "obsidian";
import { notify } from "@core";
import type ObsiWealthPlugin from "../main";
import { CURRENCY_OPTIONS, LANGUAGE_OPTIONS, CUSTOM_ICON_SIZE_STEPS } from "@core/types";
import type {
  AssetStatus,
  CategoryOption,
  CurrencyCode,
  DecimalPreference,
  DefaultCardColumns,
  DurationDisplayMode,
  LanguageCode,
  ThemeMode,
} from "@core/types";
import type { SortDirection, SortField } from "@core/calc/sortTypes";
import { renderBackupSection } from "./backup";

// ---- static option tables used by the settings UI ----

const STATUS_COLOR_PRESETS = [
  { color: "#60a5fa" },
  { color: "#a3a3a3" },
  { color: "#4ade80" },
  { color: "#ef4444" },
  { color: "#f59e0b" },
  { color: "#a78bfa" },
  { color: "#f472b6" },
  { color: "#22d3ee" },
];

const STATUS_LABELS: Record<AssetStatus, string> = {
  active: "服役中",
  retired: "已退役",
  sold: "已卖出",
};

export const SORT_FIELD_LABELS: Record<SortField, string> = {
  manual: "手动拖拽顺序",
  buyDate: "购买时间",
  dailyCost: "日均成本",
  status: "物品状态",
  serviceTime: "服役时长",
  value: "物品价值",
};

export const SORT_DIRECTION_LABELS: Record<SortDirection, string> = {
  asc: "正序",
  desc: "倒序",
};

export class ObsiWealthSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: ObsiWealthPlugin) {
    super(app, plugin);
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "ObsiWealth 设置" });

    // ---------- 通用 ----------
    this.renderGroupHeader(containerEl, "通用");

    containerEl.createEl("h3", { text: "货币" });
    this.renderCurrencySetting(containerEl);

    containerEl.createEl("h3", { text: "显示偏好" });
    this.renderCommonDisplayPreferences(containerEl);

    containerEl.createEl("h3", { text: "语言" });
    this.renderLanguageSetting(containerEl);

    containerEl.createEl("h3", { text: "主题颜色" });
    this.renderThemeModeSetting(containerEl);

    containerEl.createEl("h3", { text: "密码与安全" });
    this.renderPasswordSettings(containerEl);

    containerEl.createEl("h3", { text: "闲置水印" });
    this.renderIdleWatermarkSettings(containerEl);

    // ---------- 资金 ----------
    this.renderGroupHeader(containerEl, "资金");

    const fundNote = containerEl.createEl("p", {
      text: "暂无资金专属的独立设置，资金分类和排序由资金页工具栏控制。",
    });
    fundNote.style.color = "var(--text-muted)";
    fundNote.style.fontSize = "13px";
    fundNote.style.margin = "8px 0 16px";

    // ---------- 资产 ----------
    this.renderGroupHeader(containerEl, "资产");

    containerEl.createEl("h3", { text: "资产显示偏好" });
    this.renderAssetDisplayPreferences(containerEl);

    containerEl.createEl("h3", { text: "分类管理" });
    this.renderCategoryManager(containerEl);

    containerEl.createEl("h3", { text: "状态颜色" });
    this.renderStatusColorSettings(containerEl);

    // ---------- 其他 ----------
    this.renderGroupHeader(containerEl, "其他");

    containerEl.createEl("h3", { text: "图表" });
    this.renderChartSettings(containerEl);

    containerEl.createEl("h3", { text: "图片" });
    this.renderImageSettings(containerEl);

    containerEl.createEl("h3", { text: "数据备份" });
    renderBackupSection(containerEl, this.plugin);
  }

  /** Render a large "group" banner that visually separates top-level sections. */
  private renderGroupHeader(containerEl: HTMLElement, title: string) {
    const banner = containerEl.createDiv();
    banner.style.margin = "22px 0 10px";
    banner.style.padding = "10px 14px";
    banner.style.borderRadius = "10px";
    banner.style.background = "var(--background-secondary)";
    banner.style.borderLeft = "4px solid var(--interactive-accent)";
    banner.style.display = "flex";
    banner.style.alignItems = "center";
    banner.style.gap = "10px";

    const text = banner.createSpan({ text: title });
    text.style.fontSize = "18px";
    text.style.fontWeight = "900";
    text.style.color = "var(--text-normal)";
    text.style.letterSpacing = "0.02em";
  }

  // --------------- individual setting blocks ---------------

  private renderCurrencySetting(containerEl: HTMLElement) {
    new Setting(containerEl)
      .setName("金钱符号 + 货币单位")
      .setDesc("选择资产金额展示时使用的货币符号和单位")
      .addDropdown((dropdown) => {
        CURRENCY_OPTIONS.forEach((option) => {
          dropdown.addOption(option.code, `${option.symbol} ${option.code} · ${option.name}`);
        });

        dropdown
          .setValue(this.plugin.settings.currencyCode)
          .onChange(async (value) => {
            const selected =
              CURRENCY_OPTIONS.find((option) => option.code === (value as CurrencyCode)) ??
              CURRENCY_OPTIONS[0];
            await this.plugin.updateSettings({
              ...this.plugin.settings,
              currencyCode: selected.code,
              currencySymbol: selected.symbol,
            });
          });
      });
  }

  private renderCommonDisplayPreferences(containerEl: HTMLElement) {
    new Setting(containerEl)
      .setName("小数点偏好")
      .setDesc("控制金额展示的小数位数")
      .addDropdown((dropdown) => {
        dropdown
          .addOption("0", "不保留")
          .addOption("1", "保留 1 位")
          .addOption("2", "保留 2 位")
          .setValue(String(this.plugin.settings.decimalPlaces))
          .onChange(async (value) => {
            await this.plugin.updateSettings({
              ...this.plugin.settings,
              decimalPlaces: Number(value) as DecimalPreference,
            });
          });
      });

    new Setting(containerEl)
      .setName("使用千分位分隔符")
      .setDesc("开启后金额会显示为 1,234 这样的格式")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.useThousandsSeparator)
          .onChange(async (value) => {
            await this.plugin.updateSettings({
              ...this.plugin.settings,
              useThousandsSeparator: value,
            });
          });
      });

    new Setting(containerEl)
      .setName("默认卡片列数")
      .setDesc("打开主页时默认显示的卡片列数")
      .addDropdown((dropdown) => {
        dropdown
          .addOption("1", "1 列")
          .addOption("2", "2 列")
          .addOption("3", "3 列")
          .addOption("4", "4 列")
          .setValue(String(this.plugin.settings.defaultCardColumns))
          .onChange(async (value) => {
            await this.plugin.updateSettings({
              ...this.plugin.settings,
              defaultCardColumns: Number(value) as DefaultCardColumns,
            });
          });
      });
  }

  private renderAssetDisplayPreferences(containerEl: HTMLElement) {
    new Setting(containerEl)
      .setName("时长显示")
      .setDesc("选择已使用时长显示成日期格式或总天数")
      .addDropdown((dropdown) => {
        dropdown
          .addOption("date", "日期")
          .addOption("days", "天数")
          .setValue(this.plugin.settings.durationDisplayMode)
          .onChange(async (value) => {
            await this.plugin.updateSettings({
              ...this.plugin.settings,
              durationDisplayMode: value as DurationDisplayMode,
            });
          });
      });

    new Setting(containerEl)
      .setName("默认排序方式")
      .setDesc("打开主页时默认使用的排序依据")
      .addDropdown((dropdown) => {
        (Object.keys(SORT_FIELD_LABELS) as SortField[]).forEach((field) => {
          dropdown.addOption(field, SORT_FIELD_LABELS[field]);
        });

        dropdown
          .setValue(this.plugin.settings.defaultSortField)
          .onChange(async (value) => {
            await this.plugin.updateSettings({
              ...this.plugin.settings,
              defaultSortField: value as SortField,
            });
          });
      });

    new Setting(containerEl)
      .setName("默认排序方向")
      .setDesc("打开主页时默认使用正序或倒序")
      .addDropdown((dropdown) => {
        (Object.keys(SORT_DIRECTION_LABELS) as SortDirection[]).forEach((direction) => {
          dropdown.addOption(direction, SORT_DIRECTION_LABELS[direction]);
        });

        dropdown
          .setValue(this.plugin.settings.defaultSortDirection)
          .onChange(async (value) => {
            await this.plugin.updateSettings({
              ...this.plugin.settings,
              defaultSortDirection: value as SortDirection,
            });
          });
      });
  }

  private renderDisplayPreferences(containerEl: HTMLElement) {
    this.renderCommonDisplayPreferences(containerEl);
    this.renderAssetDisplayPreferences(containerEl);
  }

  private renderLanguageSetting(containerEl: HTMLElement) {
    new Setting(containerEl)
      .setName("界面语言")
      .setDesc("选择常用语言偏好")
      .addDropdown((dropdown) => {
        LANGUAGE_OPTIONS.forEach((option) => {
          dropdown.addOption(option.code, option.name);
        });

        dropdown
          .setValue(this.plugin.settings.language)
          .onChange(async (value) => {
            await this.plugin.updateSettings({
              ...this.plugin.settings,
              language: value as LanguageCode,
            });
          });
      });
  }

  private renderPasswordSettings(containerEl: HTMLElement) {
    new Setting(containerEl)
      .setName("进入页面需要密码")
      .setDesc("开启后保存密码偏好，后续可用于进入页面前验证")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.passwordEnabled)
          .onChange(async (value) => {
            await this.plugin.updateSettings({
              ...this.plugin.settings,
              passwordEnabled: value,
            });
            this.display();
          });
      });

    if (this.plugin.settings.passwordEnabled) {
      new Setting(containerEl)
        .setName("页面密码")
        .setDesc("用于进入 ObsiWealth 页面时验证")
        .addText((text) => {
          text.inputEl.type = "password";
          text.setPlaceholder("请输入密码");
          text.setValue(this.plugin.settings.password);
          text.onChange(async (value) => {
            await this.plugin.updateSettings({
              ...this.plugin.settings,
              password: value,
            });
          });
        });
    }
  }

  private renderThemeModeSetting(containerEl: HTMLElement) {
    new Setting(containerEl)
      .setName("主题模式")
      .setDesc("选择黑色、白色或跟随系统")
      .addDropdown((dropdown) => {
        dropdown
          .addOption("system", "跟随系统")
          .addOption("light", "白色")
          .addOption("dark", "黑色")
          .setValue(this.plugin.settings.themeMode)
          .onChange(async (value) => {
            await this.plugin.updateSettings({
              ...this.plugin.settings,
              themeMode: value as ThemeMode,
            });
          });
      });
  }

  private renderIdleWatermarkSettings(containerEl: HTMLElement) {
    new Setting(containerEl)
      .setName("启用闲置水印")
      .setDesc(
        "一段时间无操作后遮挡页面内容，显示与当前页面对应的水印（主页字母 / 资金美元 / 资产物品 / 心愿爱心）。显示后需单击任意位置关闭",
      )
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.idleWatermarkEnabled)
          .onChange(async (value) => {
            await this.plugin.updateSettings({
              ...this.plugin.settings,
              idleWatermarkEnabled: value,
            });
            this.display();
          });
      });

    if (this.plugin.settings.idleWatermarkEnabled) {
      new Setting(containerEl)
        .setName("触发时间（秒）")
        .setDesc("无操作多少秒后显示水印，范围 5 - 3600")
        .addText((text) => {
          text.inputEl.type = "number";
          text.inputEl.min = "5";
          text.inputEl.max = "3600";
          text.setValue(String(this.plugin.settings.idleWatermarkTimeoutSec));
          text.onChange(async (value) => {
            const num = Math.max(5, Math.min(3600, Number(value) || 5));
            await this.plugin.updateSettings({
              ...this.plugin.settings,
              idleWatermarkTimeoutSec: num,
            });
          });
        });
    }
  }

  private renderChartSettings(containerEl: HTMLElement) {
    new Setting(containerEl)
      .setName("折线图显示数据点")
      .setDesc("关闭后，资金/资产趋势折线图上不再显示圆点标记")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.showChartDots)
          .onChange(async (value) => {
            await this.plugin.updateSettings({
              ...this.plugin.settings,
              showChartDots: value,
            });
          });
      });
  }

  private renderImageSettings(containerEl: HTMLElement) {
    new Setting(containerEl)
      .setName("自定义图片默认尺寸")
      .setDesc("上传本地图片后，裁剪器输出分辨率的默认档位；越大越清晰，文件也越大")
      .addDropdown((dropdown) => {
        CUSTOM_ICON_SIZE_STEPS.forEach((px) => {
          dropdown.addOption(String(px), `${px} px`);
        });
        dropdown
          .setValue(String(this.plugin.settings.customIconDefaultSize))
          .onChange(async (value) => {
            const next = Number(value);
            if (!Number.isFinite(next) || next <= 0) return;
            await this.plugin.updateSettings({
              ...this.plugin.settings,
              customIconDefaultSize: next,
            });
          });
      });
  }

  private renderStatusColorSettings(containerEl: HTMLElement) {
    (["active", "retired", "sold"] as AssetStatus[]).forEach((status) => {
      const setting = new Setting(containerEl)
        .setName(STATUS_LABELS[status])
        .addText((text) => {
          text.inputEl.type = "color";
          text.setValue(this.plugin.settings.statusColors[status]);
          text.onChange(async (value) => {
            await this.updateStatusColor(status, value);
          });
        })
        .addText((text) => {
          text.setPlaceholder("#60a5fa");
          text.setValue(this.plugin.settings.statusColors[status]);
          text.onChange(async (value) => {
            if (/^#[0-9a-fA-F]{6}$/.test(value)) {
              await this.updateStatusColor(status, value);
              this.display();
            }
          });
        });

      this.renderStatusColorDropdown(setting.controlEl, status);
    });
  }

  // --------------- helpers for status color dropdown / category manager ---------------

  private renderStatusColorDropdown(parent: HTMLElement, status: AssetStatus) {
    const wrapper = parent.createDiv();
    wrapper.style.position = "relative";

    const button = wrapper.createEl("button");
    button.type = "button";
    button.style.display = "inline-flex";
    button.style.alignItems = "center";
    button.style.gap = "8px";
    button.style.minWidth = "120px";
    button.style.height = "32px";
    button.style.padding = "0 10px";
    button.style.borderRadius = "8px";
    button.style.border = "1px solid var(--background-modifier-border)";
    button.style.background = "var(--background-primary)";
    button.style.cursor = "pointer";

    const selectedSwatch = button.createSpan();
    selectedSwatch.style.width = "16px";
    selectedSwatch.style.height = "16px";
    selectedSwatch.style.borderRadius = "4px";
    selectedSwatch.style.background = this.plugin.settings.statusColors[status];
    selectedSwatch.style.boxShadow = "0 0 0 1px rgba(0,0,0,0.18)";
    selectedSwatch.style.flexShrink = "0";

    const selectedText = button.createSpan({ text: this.plugin.settings.statusColors[status] });
    selectedText.style.fontSize = "12px";
    selectedText.style.fontWeight = "800";

    const arrow = button.createSpan({ text: "⌄" });
    arrow.style.marginLeft = "auto";
    arrow.style.color = "var(--text-muted)";

    const menu = wrapper.createDiv();
    menu.style.position = "absolute";
    menu.style.right = "0";
    menu.style.top = "36px";
    menu.style.display = "none";
    menu.style.flexDirection = "column";
    menu.style.gap = "4px";
    menu.style.minWidth = "140px";
    menu.style.padding = "6px";
    menu.style.borderRadius = "10px";
    menu.style.background = "var(--background-primary)";
    menu.style.border = "1px solid var(--background-modifier-border)";
    menu.style.boxShadow = "0 12px 28px rgba(0,0,0,0.18)";
    menu.style.zIndex = "50";

    STATUS_COLOR_PRESETS.forEach((preset) => {
      const option = menu.createEl("button");
      option.type = "button";
      option.style.display = "flex";
      option.style.alignItems = "center";
      option.style.gap = "8px";
      option.style.width = "100%";
      option.style.padding = "6px 8px";
      option.style.border = "0";
      option.style.borderRadius = "8px";
      option.style.background =
        preset.color.toLowerCase() === this.plugin.settings.statusColors[status].toLowerCase()
          ? "var(--background-secondary)"
          : "transparent";
      option.style.cursor = "pointer";

      const swatch = option.createSpan();
      swatch.style.width = "16px";
      swatch.style.height = "16px";
      swatch.style.borderRadius = "4px";
      swatch.style.background = preset.color;
      swatch.style.boxShadow = "0 0 0 1px rgba(0,0,0,0.18)";
      swatch.style.flexShrink = "0";

      const code = option.createSpan({ text: preset.color });
      code.style.fontSize = "12px";
      code.style.fontWeight = "800";

      option.onclick = async () => {
        await this.updateStatusColor(status, preset.color);
        this.display();
      };
    });

    button.onclick = () => {
      menu.style.display = menu.style.display === "none" ? "flex" : "none";
    };
  }

  private renderCategoryManager(containerEl: HTMLElement) {
    this.plugin.settings.categories.forEach((category) => {
      new Setting(containerEl)
        .setName(category.name)
        .addText((text) => {
          text.setValue(category.name);
          text.onChange(async (value) => {
            await this.updateCategory(category.id, value);
          });
        })
        .addButton((button) => {
          button.setButtonText("删除");
          button.onClick(async () => {
            await this.deleteCategory(category.id);
          });
        });
    });

    let pendingCategoryName = "";

    new Setting(containerEl)
      .setName("新增分类")
      .setDesc("输入分类名称后添加")
      .addText((text) => {
        text.setPlaceholder("例如：运动");
        text.onChange((value) => {
          pendingCategoryName = value;
        });
      })
      .addButton((button) => {
        button.setButtonText("添加");
        button.onClick(async () => {
          const name = pendingCategoryName.trim();

          if (!name) {
            notify("请输入分类名称");
            return;
          }

          await this.addCategory(name);
        });
      });
  }

  private async addCategory(name: string) {
    const id = this.createCategoryId(name);
    const exists = this.plugin.settings.categories.some(
      (category) => category.id === id || category.name === name,
    );

    if (exists) {
      notify("分类已存在");
      return;
    }

    await this.plugin.updateSettings({
      ...this.plugin.settings,
      categories: [...this.plugin.settings.categories, { id, name }],
    });
    this.display();
  }

  private async updateCategory(id: string, name: string) {
    const nextName = name.trim();
    if (!nextName) return;

    await this.plugin.updateSettings({
      ...this.plugin.settings,
      categories: this.plugin.settings.categories.map((category): CategoryOption =>
        category.id === id ? { ...category, name: nextName } : category,
      ),
    });
  }

  private async deleteCategory(id: string) {
    if (this.plugin.settings.categories.length <= 1) {
      notify("至少保留一个分类");
      return;
    }

    await this.plugin.updateSettings({
      ...this.plugin.settings,
      categories: this.plugin.settings.categories.filter((category) => category.id !== id),
    });
    this.display();
  }

  private createCategoryId(name: string) {
    return (
      name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9\u4e00-\u9fa5_-]/g, "") || crypto.randomUUID()
    );
  }

  private async updateStatusColor(status: AssetStatus, color: string) {
    await this.plugin.updateSettings({
      ...this.plugin.settings,
      statusColors: {
        ...this.plugin.settings.statusColors,
        [status]: color,
      },
    });
  }
}
