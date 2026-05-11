import { App, Modal, Setting } from "obsidian";
import { notify } from "@core";
import { getTodayISODate } from "@core/calc/assetMath";
import { getIconPath } from "../iconResolver";
import { findIcon } from "../icons";
import type { AssetAccessory } from "@core/types";
import { openIconPicker } from "./iconPicker";
import {
  addDateField,
  addNumberField,
  addTextField,
  addToggleField,
} from "./shared/formFields";

type AccessoryDraft = AssetAccessory;

export class AccessoryModal extends Modal {
  private readonly state: AccessoryDraft;

  constructor(
    app: App,
    accessory: AssetAccessory | undefined,
    private onSave: (accessory: AssetAccessory) => void,
    defaultBuyDate: string = getTodayISODate()
  ) {
    super(app);
    this.state = accessory
      ? { ...accessory }
      : {
        id: crypto.randomUUID(),
        icon: "",
        name: "",
        price: 0,
        buy_date: defaultBuyDate,
        include_total: true,
      };
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "附加物品" });

    this.renderIconSetting(contentEl);
    this.renderNameSetting(contentEl);
    this.renderPriceSetting(contentEl);
    this.renderBuyDateSetting(contentEl);
    this.renderIncludeTotalSetting(contentEl);
    this.renderActions(contentEl);
  }

  private renderIconSetting(contentEl: HTMLElement) {
    const iconSetting = new Setting(contentEl)
      .setName("图标")
      .setDesc(this.getIconDescription())
      .addButton((button) => {
        button.setButtonText("选择图标");
        button.onClick(() => {
          openIconPicker(this.app, (icon) => {
            this.state.icon = icon.id;
            iconSetting.setDesc(this.getIconDescription());
            this.renderSelectedIconPreview(iconSetting.controlEl);
          });
        });
      });

    this.renderSelectedIconPreview(iconSetting.controlEl);
  }

  private renderSelectedIconPreview(controlEl: HTMLElement) {
    controlEl.find(".obsiwealth-selected-icon")?.remove();

    const preview = controlEl.createDiv("obsiwealth-selected-icon");
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
      preview.setText("📦");
      return;
    }

    const img = preview.createEl("img");
    img.src = getIconPath(icon.id);
    img.alt = icon.name;
    img.style.width = "32px";
    img.style.height = "32px";
    img.style.objectFit = "contain";
  }

  private getIconDescription() {
    const icon = findIcon(this.state.icon);
    return `当前: ${icon?.name ?? (this.state.icon || "未填写")}`;
  }

  private renderNameSetting(contentEl: HTMLElement) {
    addTextField(contentEl, {
      name: "名称",
      value: this.state.name,
      onChange: (value) => {
        this.state.name = value;
      },
    });
  }

  private renderPriceSetting(contentEl: HTMLElement) {
    addNumberField(contentEl, {
      name: "金额",
      value: this.state.price,
      min: 0,
      onChange: (value) => {
        this.state.price = value;
      },
    });
  }

  private renderBuyDateSetting(contentEl: HTMLElement) {
    addDateField(contentEl, {
      name: "购买时间",
      value: this.state.buy_date,
      max: "today",
      onChange: (value) => {
        this.state.buy_date = value;
      },
    });
  }

  private renderIncludeTotalSetting(contentEl: HTMLElement) {
    addToggleField(contentEl, {
      name: "计入总价",
      desc: "开启后会计入资产总价、总资产和日均成本",
      value: this.state.include_total,
      onChange: (value) => {
        this.state.include_total = value;
      },
    });
  }

  private renderActions(contentEl: HTMLElement) {
    new Setting(contentEl)
      .addButton((button) => {
        button.setButtonText("保存");
        button.setCta();
        button.onClick(() => this.save());
      });
  }

  private save() {
    if (!this.state.name.trim()) {
      notify("请输入附加物品名称");
      return;
    }

    if (this.state.price < 0) {
      notify("金额不能小于 0");
      return;
    }

    this.onSave({ ...this.state, name: this.state.name.trim() });
    this.close();
  }
}
