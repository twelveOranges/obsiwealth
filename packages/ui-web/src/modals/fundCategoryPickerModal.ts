import { App, Modal } from "obsidian";
import { FUND_CATEGORIES } from "@core/types";
import type { FundCategoryId } from "@core/types";

export class FundCategoryPickerModal extends Modal {
  constructor(app: App, private onPick: (categoryId: FundCategoryId) => void) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    const title = contentEl.createEl("h2", { text: "选择资产类型" });
    title.style.margin = "0 0 16px";
    title.style.fontSize = "22px";
    title.style.fontWeight = "900";

    const grid = contentEl.createDiv();
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
    grid.style.gap = "12px";

    FUND_CATEGORIES.forEach((category) => {
      const item = grid.createDiv();
      item.style.padding = "14px 16px";
      item.style.borderRadius = "16px";
      item.style.border = "1px solid var(--background-modifier-border)";
      item.style.background = "var(--background-secondary)";
      item.style.cursor = "pointer";
      item.style.transition = "transform 0.12s, box-shadow 0.12s";

      const header = item.createDiv();
      header.style.display = "flex";
      header.style.alignItems = "center";
      header.style.justifyContent = "space-between";
      header.style.gap = "10px";

      const name = header.createSpan({ text: category.name });
      name.style.fontSize = "17px";
      name.style.fontWeight = "900";
      name.style.color = "var(--text-normal)";

      const tag = header.createSpan({ text: category.type === "liability" ? "负债" : "资产" });
      tag.style.fontSize = "11px";
      tag.style.fontWeight = "900";
      tag.style.padding = "2px 8px";
      tag.style.borderRadius = "999px";
      tag.style.background = category.type === "liability" ? "#fee2e2" : "#dcfce7";
      tag.style.color = category.type === "liability" ? "#dc2626" : "#16a34a";

      if (category.examples) {
        const examples = item.createDiv({ text: category.examples });
        examples.style.marginTop = "8px";
        examples.style.fontSize = "12px";
        examples.style.fontWeight = "700";
        examples.style.color = "var(--text-muted)";
        examples.style.overflow = "hidden";
        examples.style.textOverflow = "ellipsis";
        examples.style.whiteSpace = "nowrap";
      }

      item.onmouseenter = () => {
        item.style.transform = "translateY(-2px)";
        item.style.boxShadow = "0 10px 24px rgba(0,0,0,0.12)";
      };
      item.onmouseleave = () => {
        item.style.transform = "";
        item.style.boxShadow = "";
      };
      item.onclick = () => {
        this.close();
        this.onPick(category.id);
      };
    });
  }
}
