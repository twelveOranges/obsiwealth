import { App, Modal, Setting } from "obsidian";
import type { SortDirection, SortField } from "@core/calc/sortTypes";

export class SortModal extends Modal {
  private field: SortField;
  private direction: SortDirection;

  constructor(
    app: App,
    field: SortField,
    direction: SortDirection,
    private onApply: (field: SortField, direction: SortDirection) => void
  ) {
    super(app);
    this.field = field;
    this.direction = direction;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "排序" });

    new Setting(contentEl)
      .setName("排序依据")
      .addDropdown((dropdown) => {
        dropdown
          .addOption("manual", "手动拖拽顺序")
          .addOption("buyDate", "购买时间")
          .addOption("dailyCost", "日均成本")
          .addOption("status", "物品状态")
          .addOption("serviceTime", "服役时长")
          .addOption("value", "物品价值")
          .setValue(this.field)
          .onChange((value) => {
            this.field = value as SortField;
          });
      });

    new Setting(contentEl)
      .setName("排序方向")
      .addDropdown((dropdown) => {
        dropdown
          .addOption("asc", "正序")
          .addOption("desc", "倒序")
          .setValue(this.direction)
          .onChange((value) => {
            this.direction = value as SortDirection;
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
    apply.onclick = () => {
      this.onApply(this.field, this.direction);
      this.close();
    };
  }
}
