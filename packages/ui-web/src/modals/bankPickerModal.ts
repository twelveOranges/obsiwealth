import { App, Modal } from "obsidian";
import { notify } from "@core";
import { applyLogoBoxStyle, renderBankLogoByName } from "../fund/bankLogoByName";
import type { AppModel } from "@ui/host/appModel";
import { COMMON_BANKS } from "@core/types";
import { openPromptModal } from "./promptModal";

export class BankPickerModal extends Modal {
  private selected: string = "";
  private triggerEl!: HTMLDivElement;
  private triggerLabelEl!: HTMLDivElement;
  private triggerLogoEl!: HTMLDivElement;
  private menuEl!: HTMLDivElement;
  private menuOpen = false;
  private outsideHandler?: (e: MouseEvent) => void;

  constructor(
    app: App,
    private title: string,
    private onPick: (bank: string) => void,
    private plugin?: AppModel,
  ) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    const titleEl = contentEl.createEl("h2", { text: this.title });
    titleEl.style.margin = "0 0 16px";
    titleEl.style.fontSize = "22px";
    titleEl.style.fontWeight = "900";

    const hint = contentEl.createDiv({ text: "请选择银行" });
    hint.style.fontSize = "13px";
    hint.style.fontWeight = "800";
    hint.style.color = "var(--text-muted)";
    hint.style.margin = "0 0 8px";

    const wrap = contentEl.createDiv();
    wrap.style.position = "relative";
    wrap.style.width = "100%";

    // 触发器（仿下拉框外观）
    const trigger = wrap.createDiv();
    this.triggerEl = trigger;
    trigger.style.display = "flex";
    trigger.style.alignItems = "center";
    trigger.style.gap = "10px";
    trigger.style.padding = "10px 14px";
    trigger.style.borderRadius = "12px";
    trigger.style.border = "1px solid var(--background-modifier-border)";
    trigger.style.background = "var(--background-primary)";
    trigger.style.cursor = "pointer";
    trigger.style.userSelect = "none";
    trigger.style.minHeight = "48px";

    this.triggerLogoEl = trigger.createDiv();
    this.applyLogoBoxStyle(this.triggerLogoEl, 28);

    this.triggerLabelEl = trigger.createDiv({ text: "请选择银行" });
    this.triggerLabelEl.style.flex = "1 1 auto";
    this.triggerLabelEl.style.fontSize = "15px";
    this.triggerLabelEl.style.fontWeight = "800";
    this.triggerLabelEl.style.color = "var(--text-muted)";
    this.triggerLabelEl.style.overflow = "hidden";
    this.triggerLabelEl.style.textOverflow = "ellipsis";
    this.triggerLabelEl.style.whiteSpace = "nowrap";

    const caret = trigger.createDiv({ text: "▾" });
    caret.style.fontSize = "14px";
    caret.style.color = "var(--text-muted)";
    caret.style.flexShrink = "0";

    trigger.onclick = (e) => {
      e.stopPropagation();
      this.toggleMenu();
    };

    // 下拉菜单
    const menu = wrap.createDiv();
    this.menuEl = menu;
    menu.style.position = "absolute";
    menu.style.top = "calc(100% + 6px)";
    menu.style.left = "0";
    menu.style.right = "0";
    menu.style.maxHeight = "340px";
    menu.style.overflowY = "auto";
    menu.style.borderRadius = "12px";
    menu.style.border = "1px solid var(--background-modifier-border)";
    menu.style.background = "var(--background-primary)";
    menu.style.boxShadow = "0 12px 28px rgba(0,0,0,0.18)";
    menu.style.zIndex = "20";
    menu.style.display = "none";
    menu.style.padding = "6px";

    COMMON_BANKS.forEach((bank) => {
      const option = menu.createDiv();
      option.style.display = "flex";
      option.style.alignItems = "center";
      option.style.gap = "10px";
      option.style.padding = "8px 10px";
      option.style.borderRadius = "8px";
      option.style.cursor = "pointer";
      option.style.transition = "background 0.12s";

      const logoBox = option.createDiv();
      this.applyLogoBoxStyle(logoBox, 24);
      if (bank !== "其他") {
        this.renderLogoInto(logoBox, bank, 22);
      } else {
        logoBox.innerText = "•";
        logoBox.style.color = "var(--text-muted)";
        logoBox.style.fontSize = "16px";
        logoBox.style.fontWeight = "900";
      }

      const nameEl = option.createDiv({ text: bank });
      nameEl.style.fontSize = "15px";
      nameEl.style.fontWeight = "800";
      nameEl.style.color = "var(--text-normal)";
      nameEl.style.flex = "1 1 auto";

      option.onmouseenter = () => {
        option.style.background = "var(--background-modifier-hover)";
      };
      option.onmouseleave = () => {
        option.style.background = "";
      };
      option.onclick = (e) => {
        e.stopPropagation();
        this.selectBank(bank);
      };
    });

    // 确认 / 取消按钮
    const actions = contentEl.createDiv();
    actions.style.display = "flex";
    actions.style.justifyContent = "flex-end";
    actions.style.gap = "10px";
    actions.style.marginTop = "18px";

    const cancel = actions.createEl("button", { text: "取消" });
    cancel.style.padding = "8px 18px";
    cancel.style.borderRadius = "999px";
    cancel.style.border = "1px solid var(--background-modifier-border)";
    cancel.style.background = "var(--background-secondary)";
    cancel.style.color = "var(--text-normal)";
    cancel.style.fontSize = "14px";
    cancel.style.fontWeight = "900";
    cancel.style.cursor = "pointer";
    cancel.onclick = () => this.close();

    const confirm = actions.createEl("button", { text: "确定" });
    confirm.style.padding = "8px 20px";
    confirm.style.borderRadius = "999px";
    confirm.style.border = "1px solid var(--interactive-accent)";
    confirm.style.background = "var(--interactive-accent)";
    confirm.style.color = "var(--text-on-accent)";
    confirm.style.fontSize = "14px";
    confirm.style.fontWeight = "900";
    confirm.style.cursor = "pointer";
    confirm.onclick = () => this.commit();

    // 点击其它位置关闭下拉
    this.outsideHandler = (e: MouseEvent) => {
      if (!this.menuOpen) return;
      const target = e.target as Node;
      if (!this.triggerEl.contains(target) && !this.menuEl.contains(target)) {
        this.closeMenu();
      }
    };
    document.addEventListener("click", this.outsideHandler);
  }

  onClose() {
    if (this.outsideHandler) {
      document.removeEventListener("click", this.outsideHandler);
    }
    super.onClose?.();
  }

  private toggleMenu() {
    if (this.menuOpen) this.closeMenu();
    else this.openMenu();
  }

  private openMenu() {
    this.menuEl.style.display = "block";
    this.menuOpen = true;
  }

  private closeMenu() {
    this.menuEl.style.display = "none";
    this.menuOpen = false;
  }

  private async selectBank(bank: string) {
    if (bank === "其他") {
      // 先关闭下拉菜单，避免遮挡输入弹窗
      this.closeMenu();
      const custom = await openPromptModal(this.app, {
        title: "请输入银行名称",
        placeholder: "请输入银行名称",
        type: "text",
      });
      if (custom === null) return;
      const trimmed = (custom || "").trim();
      if (!trimmed) {
        notify("名称不能为空");
        return;
      }
      this.selected = trimmed;
      this.updateTrigger(trimmed);
      return;
    }
    this.selected = bank;
    this.updateTrigger(bank);
    this.closeMenu();
  }

  private updateTrigger(bank: string) {
    this.triggerLabelEl.innerText = bank;
    this.triggerLabelEl.style.color = "var(--text-normal)";
    this.triggerLogoEl.empty();
    this.renderLogoInto(this.triggerLogoEl, bank, 26);
  }

  private commit() {
    if (!this.selected) {
      return;
    }
    const bank = this.selected;
    this.close();
    this.onPick(bank);
  }

  private applyLogoBoxStyle(el: HTMLElement, size: number) {
    applyLogoBoxStyle(el, size, 6);
  }

  private renderLogoInto(container: HTMLElement, bank: string, size: number) {
    if (!this.plugin) {
      container.empty();
      container.innerText = bank.charAt(0);
      container.style.fontSize = `${Math.floor(size * 0.6)}px`;
      container.style.fontWeight = "900";
      container.style.color = "var(--text-muted)";
      return;
    }
    renderBankLogoByName(this.plugin, container, bank, size);
  }
}
