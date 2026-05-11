import { App, Modal, Setting } from "obsidian";
import { notify } from "@core";
import { createAssetFormState, formStateToAsset, getTodayISODate } from "@core/calc/assetMath";
import { findIcon } from "../icons";
import { getIconPath } from "../iconResolver";
import { openIconPicker } from "./iconPicker";
import { t } from "@core/i18n";
import type { AppModel } from "@ui/host/appModel";
import type { Asset, AssetAccessory, AssetCategory, AssetFormState, AssetStatus } from "@core/types";
import { AccessoryModal } from "./accessoryModal";
import {
  addDateField,
  addDropdownField,
  addNumberField,
  addTextField,
  addToggleField,
} from "./shared/formFields";

export class AssetModal extends Modal {
  private readonly state: AssetFormState;

  constructor(app: App, private plugin: AppModel, private asset?: Asset) {
    super(app);
    this.state = createAssetFormState(asset);

    if (!this.plugin.settings.categories.some((category) => category.id === this.state.category)) {
      this.state.category = this.plugin.settings.categories[0]?.id ?? "other";
    }
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: this.tr(this.asset ? "editAsset" : "addAsset") });

    this.renderIconSetting(contentEl);
    this.renderNameSetting(contentEl);
    this.renderPriceSetting(contentEl);
    this.renderBuyDateSetting(contentEl);
    this.renderAccessoriesSection(contentEl);
    this.renderCategorySetting(contentEl);
    this.renderStatusSetting(contentEl);
    this.renderRetiredSettings(contentEl);
    this.renderSoldSettings(contentEl);
    this.renderSaveButton(contentEl);
  }

  private renderIconSetting(contentEl: HTMLElement) {
    const iconSetting = new Setting(contentEl)
      .setName(this.tr("icon"))
      .setDesc(this.getIconDescription())
      .addButton((button) => {
        button.setButtonText(this.tr("chooseIcon"));
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
    return `${this.tr("current")}: ${icon?.name ?? (this.state.icon || this.tr("notFilled"))}`;
  }

  private renderNameSetting(contentEl: HTMLElement) {
    addTextField(contentEl, {
      name: this.tr("name"),
      value: this.state.name,
      onChange: (value) => {
        this.state.name = value;
      },
    });
  }

  private renderPriceSetting(contentEl: HTMLElement) {
    addNumberField(contentEl, {
      name: this.tr("price"),
      value: this.state.price,
      onChange: (value) => {
        this.state.price = value;
      },
    });
  }

  private renderBuyDateSetting(contentEl: HTMLElement) {
    addDateField(contentEl, {
      name: this.tr("buyDate"),
      value: this.state.buy_date,
      max: "today",
      onChange: (value) => {
        this.state.buy_date = value;
      },
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
    price.style.color = accessory.include_total ? "var(--text-normal)" : "var(--text-muted)";

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
    }, this.state.buy_date || getTodayISODate()).open();
  }

  private deleteAccessory(id: string) {
    const accessory = this.state.accessories.find((item) => item.id === id);
    const accessoryName = accessory?.name ? `「${accessory.name}」` : "该附加物品";

    if (!confirm(`确认删除${accessoryName}吗？`)) {
      return;
    }

    this.state.accessories = this.state.accessories.filter((item) => item.id !== id);
    this.onOpen();
  }

  private renderCategorySetting(contentEl: HTMLElement) {
    const selectedCategory = this.plugin.settings.categories.some((category) => category.id === this.state.category)
      ? this.state.category
      : this.plugin.settings.categories[0]?.id ?? "other";

    addDropdownField(contentEl, {
      name: this.tr("category"),
      value: selectedCategory,
      options: this.plugin.settings.categories.map((category) => ({ value: category.id, label: category.name })),
      onChange: (value) => {
        this.state.category = value as AssetCategory;
      },
    });
  }

  private renderStatusSetting(contentEl: HTMLElement) {
    addDropdownField(contentEl, {
      name: this.tr("status"),
      value: this.getSelectedStatus() === "active" ? "active" : "retired",
      options: [
        { value: "active", label: this.tr("active") },
        { value: "retired", label: this.tr("retired") },
      ],
      onChange: (value) => {
        this.setSelectedStatus(value as "active" | "retired");
        this.onOpen();
      },
    });
  }

  private renderSoldSettings(contentEl: HTMLElement) {
    if (!this.state.retired) {
      return;
    }

    addToggleField(contentEl, {
      name: this.tr("sold"),
      value: this.state.sold,
      onChange: (value) => {
        this.state.sold = value;

        if (value && !this.state.sold_date) {
          this.state.sold_date = this.state.retired_date || getTodayISODate();
        }

        if (!value) {
          this.state.sold_date = "";
          this.state.sold_price = 0;
        }

        this.onOpen();
      },
    });

    if (!this.state.sold) {
      return;
    }

    addDateField(contentEl, {
      name: this.tr("soldDate"),
      value: this.state.sold_date,
      max: "today",
      min: this.state.buy_date,
      onChange: (value) => {
        this.state.sold_date = value;
      },
    });

    addNumberField(contentEl, {
      name: this.tr("soldPrice"),
      value: this.state.sold_price,
      min: 0,
      onChange: (value) => {
        this.state.sold_price = value;
      },
    });
  }

  private renderRetiredSettings(contentEl: HTMLElement) {
    if (!this.state.retired) {
      return;
    }

    addDateField(contentEl, {
      name: this.tr("retiredDate"),
      value: this.state.retired_date,
      max: "today",
      min: this.state.buy_date,
      onChange: (value) => {
        this.state.retired_date = value;
      },
    });
  }

  private getSelectedStatus(): AssetStatus {
    if (this.state.sold) return "sold";
    if (this.state.retired) return "retired";
    return "active";
  }

  private setSelectedStatus(status: "active" | "retired") {
    this.state.retired = status === "retired";

    if (status === "active") {
      this.state.sold = false;
      this.state.sold_date = "";
      this.state.sold_price = 0;
      this.state.retired_date = "";
      return;
    }

    if (!this.state.retired_date) {
      this.state.retired_date = getTodayISODate();
    }
  }

  private renderSaveButton(contentEl: HTMLElement) {
    new Setting(contentEl).addButton((button) => {
      button.setButtonText(this.tr("save"));
      button.setCta();
      button.onClick(() => this.save());
    });
  }

  private async save() {
    if (!this.state.name.trim()) {
      notify(this.tr("inputAssetName"));
      return;
    }

    if (this.state.sold) {
      this.state.retired = true;

      if (!this.state.retired_date) {
        this.state.retired_date = this.state.sold_date || getTodayISODate();
      }
    }

    if (this.state.sold && !this.state.sold_date) {
      notify(this.tr("selectSoldDate"));
      return;
    }

    if (this.state.sold && this.state.sold_price <= 0) {
      notify(this.tr("inputSoldPrice"));
      return;
    }

    if (this.state.sold && this.state.sold_date < this.state.buy_date) {
      notify(this.tr("soldDateBeforeBuyDate"));
      return;
    }

    if (this.state.retired && !this.state.retired_date) {
      notify(this.tr("selectRetiredDate"));
      return;
    }

    if (this.state.retired && this.state.retired_date < this.state.buy_date) {
      notify(this.tr("retiredDateBeforeBuyDate"));
      return;
    }

    if (this.asset) {
      await this.plugin.updateAsset(formStateToAsset(this.state, this.asset.id));
      notify(this.tr("assetUpdated"));
    } else {
      await this.plugin.addAsset(formStateToAsset(this.state));
      notify(this.tr("assetAdded"));
    }

    this.close();
  }

  private tr(key: Parameters<typeof t>[1]) {
    return t(this.plugin.settings.language, key);
  }
}
