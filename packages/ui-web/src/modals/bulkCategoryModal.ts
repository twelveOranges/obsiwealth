import { App, Modal, Setting } from "obsidian";
import { notify } from "@core";
import type { AppModel } from "@ui/host/appModel";

export class BulkCategoryModal extends Modal {
  private categoryId: string;

  constructor(
    app: App,
    private plugin: AppModel,
    private selectedIds: string[],
    private onDone: () => void
  ) {
    super(app);
    this.categoryId = plugin.settings.categories[0]?.id ?? "other";
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "批量修改分类" });

    const summary = contentEl.createDiv({ text: `已选资产: ${this.selectedIds.length}` });
    summary.style.margin = "8px 0 16px";
    summary.style.color = "var(--text-muted)";
    summary.style.fontWeight = "800";

    new Setting(contentEl)
      .setName("目标分类")
      .addDropdown((dropdown) => {
        this.plugin.settings.categories.forEach((category) => {
          dropdown.addOption(category.id, category.name);
        });

        dropdown
          .setValue(this.categoryId)
          .onChange((value) => {
            this.categoryId = value;
          });
      });

    const actions = contentEl.createDiv();
    actions.style.display = "flex";
    actions.style.justifyContent = "flex-end";
    actions.style.gap = "8px";
    actions.style.marginTop = "18px";

    const cancel = actions.createEl("button", { text: "取消" });
    cancel.onclick = () => this.close();

    const apply = actions.createEl("button", { text: "应用" });
    apply.addClass("mod-cta");
    apply.onclick = async () => this.apply();
  }

  private async apply() {
    if (this.selectedIds.length === 0) {
      notify("没有可修改的资产");
      return;
    }

    const selected = new Set(this.selectedIds);
    this.plugin.assets = this.plugin.assets.map((asset) => (
      selected.has(asset.id) ? { ...asset, category: this.categoryId } : asset
    ));
    await this.plugin.saveAssets();
    this.plugin.refreshViews();
    this.onDone();
    notify("已更新");
    this.close();
  }
}
