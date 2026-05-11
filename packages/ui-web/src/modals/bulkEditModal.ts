import { App, Modal, Setting } from "obsidian";
import { notify } from "@core";
import { getTodayISODate } from "@core/calc/assetMath";
import { statusLabel, t } from "@core/i18n";
import type { AppModel } from "@ui/host/appModel";
import type { Asset, AssetStatus } from "@core/types";

export class BulkEditModal extends Modal {
  private targetStatus: AssetStatus = "active";

  constructor(app: App, private plugin: AppModel, private assets: Asset[]) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: this.tr("bulkEditStatus") });

    const summary = contentEl.createDiv({ text: `${this.tr("selectedAssets")}: ${this.assets.length}` });
    summary.style.margin = "8px 0 16px";
    summary.style.color = "var(--text-muted)";
    summary.style.fontWeight = "800";

    new Setting(contentEl)
      .setName(this.tr("targetStatus"))
      .addDropdown((dropdown) => {
        (["active", "sold", "retired"] as AssetStatus[]).forEach((status) => {
          dropdown.addOption(status, statusLabel(this.plugin.settings.language, status));
        });

        dropdown
          .setValue(this.targetStatus)
          .onChange((value) => {
            this.targetStatus = value as AssetStatus;
          });
      });

    const actions = contentEl.createDiv();
    actions.style.display = "flex";
    actions.style.justifyContent = "flex-end";
    actions.style.gap = "8px";
    actions.style.marginTop = "18px";

    const cancel = actions.createEl("button", { text: this.tr("cancel") });
    cancel.onclick = () => this.close();

    const apply = actions.createEl("button", { text: this.tr("apply") });
    apply.addClass("mod-cta");
    apply.onclick = async () => this.apply();
  }

  private async apply() {
    if (this.assets.length === 0) {
      notify(this.tr("noAssetsToEdit"));
      return;
    }

    const selectedIds = new Set(this.assets.map((asset) => asset.id));
    this.plugin.assets = this.plugin.assets.map((asset) => {
      if (!selectedIds.has(asset.id)) {
        return asset;
      }

      return this.applyStatus(asset, this.targetStatus);
    });

    await this.plugin.saveAssets();
    this.plugin.refreshViews();
    notify(this.tr("updated"));
    this.close();
  }

  private applyStatus(asset: Asset, status: AssetStatus): Asset {
    const today = getTodayISODate();

    if (status === "active") {
      return {
        ...asset,
        lifecycle: {
          sold: false,
          retired: false,
          sold_date: "",
          sold_price: 0,
          retired_date: "",
        },
      };
    }

    if (status === "retired") {
      return {
        ...asset,
        lifecycle: {
          ...asset.lifecycle,
          sold: false,
          retired: true,
          sold_date: "",
          sold_price: 0,
          retired_date: asset.lifecycle?.retired_date || today,
        },
      };
    }

    return {
      ...asset,
      lifecycle: {
        ...asset.lifecycle,
        sold: true,
        retired: true,
        sold_date: asset.lifecycle?.sold_date || asset.lifecycle?.retired_date || today,
        sold_price: asset.lifecycle?.sold_price ?? 0,
        retired_date: asset.lifecycle?.retired_date || asset.lifecycle?.sold_date || today,
      },
    };
  }

  private tr(key: Parameters<typeof t>[1]) {
    return t(this.plugin.settings.language, key);
  }
}
