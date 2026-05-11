import { App, Modal } from "obsidian";

export type PromptOptions = {
  title: string;
  placeholder?: string;
  defaultValue?: string;
  type?: "text" | "number" | "date";
  /** 仅对 type=date 生效：最大日期（YYYY-MM-DD），默认无上限 */
  maxDate?: string;
};

export class PromptModal extends Modal {
  private input!: HTMLInputElement;
  private settled = false;

  constructor(
    app: App,
    private options: PromptOptions,
    private resolve: (value: string | null) => void
  ) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    const title = contentEl.createEl("h3", { text: this.options.title });
    title.style.margin = "0 0 14px";
    title.style.fontSize = "16px";
    title.style.fontWeight = "900";

    const input = contentEl.createEl("input");
    input.type = this.options.type ?? "text";
    input.placeholder = this.options.placeholder ?? "";
    input.value = this.options.defaultValue ?? "";
    if (this.options.type === "date" && this.options.maxDate) {
      input.max = this.options.maxDate;
    }
    input.style.width = "100%";
    input.style.padding = "9px 12px";
    input.style.fontSize = "15px";
    input.style.borderRadius = "10px";
    input.style.border = "1px solid var(--background-modifier-border)";
    input.style.background = "var(--background-primary)";
    input.style.color = "var(--text-normal)";
    input.style.boxSizing = "border-box";
    this.input = input;

    const buttons = contentEl.createDiv();
    buttons.style.display = "flex";
    buttons.style.justifyContent = "flex-end";
    buttons.style.gap = "10px";
    buttons.style.marginTop = "16px";

    const cancelBtn = buttons.createEl("button", { text: "取消" });
    cancelBtn.style.padding = "7px 16px";
    cancelBtn.style.borderRadius = "999px";
    cancelBtn.style.cursor = "pointer";

    const confirmBtn = buttons.createEl("button", { text: "确定" });
    confirmBtn.style.padding = "7px 16px";
    confirmBtn.style.borderRadius = "999px";
    confirmBtn.style.background = "var(--interactive-accent)";
    confirmBtn.style.color = "var(--text-on-accent)";
    confirmBtn.style.border = "1px solid var(--interactive-accent)";
    confirmBtn.style.fontWeight = "900";
    confirmBtn.style.cursor = "pointer";

    cancelBtn.onclick = () => {
      this.settled = true;
      this.resolve(null);
      this.close();
    };

    confirmBtn.onclick = () => {
      this.settled = true;
      this.resolve(this.input.value);
      this.close();
    };

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        this.settled = true;
        this.resolve(this.input.value);
        this.close();
      } else if (event.key === "Escape") {
        event.preventDefault();
        this.settled = true;
        this.resolve(null);
        this.close();
      }
    });

    setTimeout(() => {
      input.focus();
      input.select();
    }, 20);
  }

  onClose() {
    if (!this.settled) {
      this.resolve(null);
    }
    this.contentEl.empty();
  }
}

export function openPromptModal(app: App, options: PromptOptions): Promise<string | null> {
  return new Promise((resolve) => {
    new PromptModal(app, options, resolve).open();
  });
}
