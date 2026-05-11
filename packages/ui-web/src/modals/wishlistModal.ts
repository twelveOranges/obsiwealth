import { App, Modal, Setting } from "obsidian";
import { notify } from "@core";
import { getTodayISODate } from "@core/calc/assetMath";
import { getIconPath } from "../iconResolver";
import { findIcon } from "../icons";
import type { AppModel } from "@ui/host/appModel";
import type { AssetAccessory, WishlistItem, WishlistPrice } from "@core/types";
import { AccessoryModal } from "./accessoryModal";
import { openIconPicker } from "./iconPicker";

type WishlistDraft = {
  id: string;
  icon: string;
  name: string;
  priceHistory: WishlistPrice[];
  accessories: AssetAccessory[];
};

export class WishlistModal extends Modal {
  private readonly state: WishlistDraft;

  constructor(app: App, private plugin: AppModel, private item?: WishlistItem) {
    super(app);
    this.state = item
      ? {
        id: item.id,
        icon: item.icon,
        name: item.name,
        priceHistory: [...item.priceHistory],
        accessories: [...(item.accessories ?? [])],
      }
      : {
        id: crypto.randomUUID(),
        icon: "",
        name: "",
        priceHistory: [{ id: crypto.randomUUID(), price: 0, date: getTodayISODate() }],
        accessories: [],
      };
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: this.item ? "编辑心愿" : "新增心愿" });

    this.renderIconSetting(contentEl);
    this.renderNameSetting(contentEl);
    this.renderPricesSection(contentEl);
    this.renderAccessoriesSection(contentEl);
    this.renderSaveButton(contentEl);
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
      preview.setText("♡");
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
    new Setting(contentEl)
      .setName("名称")
      .addText((text) => {
        text.setValue(this.state.name);
        text.onChange((value) => {
          this.state.name = value;
        });
      });
  }

  private renderPricesSection(contentEl: HTMLElement) {
    const title = contentEl.createEl("h3", { text: "价格记录" });
    title.style.margin = "18px 0 10px";

    this.state.priceHistory.forEach((price) => {
      const setting = new Setting(contentEl).setName("价格");

      setting.addText((text) => {
        text.inputEl.type = "number";
        text.inputEl.min = "0";
        text.setValue(String(price.price || ""));
        text.onChange((value) => {
          price.price = Number(value || 0);
        });
      });

      setting.addText((text) => {
        const today = getTodayISODate();
        text.inputEl.type = "date";
        text.inputEl.max = today;
        text.setValue(price.date || today);
        text.onChange((value) => {
          price.date = value > today ? today : value;
          text.setValue(price.date);
        });
      });

      setting.addButton((button) => {
        button.setButtonText("删除");
        button.onClick(() => {
          if (this.state.priceHistory.length <= 1) {
            notify("至少保留一条价格");
            return;
          }

          this.state.priceHistory = this.state.priceHistory.filter((item) => item.id !== price.id);
          this.onOpen();
        });
      });
    });

    new Setting(contentEl).addButton((button) => {
      button.setButtonText("添加价格");
      button.onClick(() => {
        this.state.priceHistory.push({ id: crypto.randomUUID(), price: 0, date: getTodayISODate() });
        this.onOpen();
      });
    });
  }

  private renderAccessoriesSection(contentEl: HTMLElement) {
    const title = contentEl.createEl("h3", { text: "附加物品" });
    title.style.margin = "18px 0 10px";

    const grid = contentEl.createDiv();
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(auto-fill, minmax(210px, 1fr))";
    grid.style.gap = "10px";

    this.state.accessories.forEach((accessory) => this.renderAccessoryCard(grid, accessory));
    this.renderAddAccessoryCard(grid);
  }

  private renderAccessoryCard(parent: HTMLElement, accessory: AssetAccessory) {
    const card = parent.createDiv();
    card.style.display = "grid";
    card.style.gridTemplateColumns = "46px 1fr auto";
    card.style.gap = "10px";
    card.style.alignItems = "center";
    card.style.padding = "10px";
    card.style.borderRadius = "14px";
    card.style.background = "var(--background-secondary)";
    card.style.border = "1px solid var(--background-modifier-border)";

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

    const price = info.createDiv({ text: `${this.plugin.settings.currencySymbol} ${accessory.price}` });
    price.style.fontSize = "13px";
    price.style.fontWeight = "750";

    const date = info.createDiv({ text: accessory.buy_date });
    date.style.fontSize = "12px";
    date.style.color = "var(--text-muted)";

    const actions = card.createDiv();
    actions.style.display = "flex";
    actions.style.flexDirection = "column";
    actions.style.gap = "6px";

    this.createAccessoryActionButton(actions, "✎", "修改", () => this.editAccessory(accessory));
    this.createAccessoryActionButton(actions, "⌫", "删除", () => this.deleteAccessory(accessory.id), true);
  }

  private renderAddAccessoryCard(parent: HTMLElement) {
    const card = parent.createDiv({ text: "+" });
    card.title = "添加附加物品";
    card.style.minHeight = "68px";
    card.style.display = "flex";
    card.style.alignItems = "center";
    card.style.justifyContent = "center";
    card.style.borderRadius = "14px";
    card.style.border = "1px dashed var(--background-modifier-border)";
    card.style.background = "var(--background-primary)";
    card.style.color = "var(--text-muted)";
    card.style.fontSize = "34px";
    card.style.fontWeight = "850";
    card.style.cursor = "pointer";
    card.onclick = () => this.editAccessory();
  }

  private createAccessoryActionButton(parent: HTMLElement, text: string, title: string, onClick: () => void, danger = false) {
    const button = parent.createEl("button", { text });
    button.type = "button";
    button.title = title;
    button.style.width = "28px";
    button.style.height = "28px";
    button.style.padding = "0";
    button.style.borderRadius = "999px";
    button.style.border = "1px solid var(--background-modifier-border)";
    button.style.background = danger ? "#fee2e2" : "var(--background-primary)";
    button.style.color = danger ? "#dc2626" : "var(--text-normal)";
    button.style.cursor = "pointer";
    button.onclick = onClick;
  }

  private editAccessory(accessory?: AssetAccessory) {
    new AccessoryModal(this.app, accessory, (nextAccessory) => {
      const index = this.state.accessories.findIndex((item) => item.id === nextAccessory.id);

      if (index === -1) {
        this.state.accessories.push(nextAccessory);
      } else {
        this.state.accessories[index] = nextAccessory;
      }

      this.onOpen();
    }).open();
  }

  private deleteAccessory(id: string) {
    this.state.accessories = this.state.accessories.filter((item) => item.id !== id);
    this.onOpen();
  }

  private renderSaveButton(contentEl: HTMLElement) {
    new Setting(contentEl).addButton((button) => {
      button.setButtonText("保存");
      button.setCta();
      button.onClick(() => this.save());
    });
  }

  private async save() {
    const name = this.state.name.trim();

    if (!name) {
      notify("请输入心愿名称");
      return;
    }

    const priceHistory = this.state.priceHistory
      .filter((price) => price.date && price.price >= 0)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (priceHistory.length === 0) {
      notify("请至少填写一条价格");
      return;
    }

    const nextItem: WishlistItem = {
      id: this.state.id,
      icon: this.state.icon,
      name,
      priceHistory,
      accessories: this.state.accessories,
    };

    if (this.item) {
      await this.plugin.updateWishlistItem(nextItem);
      notify("已更新心愿");
    } else {
      await this.plugin.addWishlistItem(nextItem);
      notify("已添加心愿");
    }

    this.close();
  }
}
