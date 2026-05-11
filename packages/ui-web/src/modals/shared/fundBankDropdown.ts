import { App, Setting } from "obsidian";
import { notify } from "@core";
import { applyLogoBoxStyle, renderBankLogoByName } from "../../fund/bankLogoByName";
import type { AppModel } from "@ui/host/appModel";
import { openPromptModal } from "../promptModal";

/**
 * Shared custom dropdown used by fundModal for picking a bank / virtual
 * account / liability from a predefined list, with a final "其他" entry that
 * opens a prompt for a free-form name.
 *
 * Previously duplicated inside fundModal as `renderBankDropdown` +
 * `renderOptionDropdown` (and their paired pickX/applyX/open/close helpers).
 * This module merges the two into a single, parameterised factory:
 *   - the visual structure (trigger + logo + label + caret + popup menu) is
 *     identical between the two originals;
 *   - callers plug in the list of options, the prompt title, and an
 *     `onPick(name)` callback that knows how to synchronise the picked value
 *     into the caller's state (including the per-category name-defaulting
 *     behaviour — `${bank}储蓄卡` for bank cards, raw name for accounts).
 *
 * The dropdown manages its own menu open/close state, own outside-click
 * handler, and returns a `teardown()` the caller must invoke on modal close
 * so the `document` click listener is removed.
 */

export interface FundBankDropdownOptions {
  app: App;
  plugin: AppModel;
  /** Left-hand setting name (e.g. "银行" / "账户" / "负债"). */
  label: string;
  /** Placeholder shown on the trigger when no value is picked yet. */
  placeholder: string;
  /** Title/placeholder of the prompt modal opened when "其他" is chosen. */
  customPromptTitle: string;
  /** Candidate list. Final "其他" entry triggers the custom prompt. */
  options: readonly string[];
  /** Current value (when re-rendering an edited fund). */
  initialValue: string;
  /**
   * Called with the final resolved name once the user picks any entry or
   * enters a custom name via the prompt. Caller owns mutation of state +
   * whatever name-defaulting logic it needs.
   */
  onPick: (name: string) => void;
}

export interface FundBankDropdownHandle {
  /** Remove the outside-click listener. Call from `onClose`. */
  teardown(): void;
}

export function renderFundBankDropdown(
  contentEl: HTMLElement,
  options: FundBankDropdownOptions,
): FundBankDropdownHandle {
  const { app, plugin } = options;

  const setting = new Setting(contentEl).setName(options.label);
  setting.controlEl.empty();
  setting.controlEl.style.flex = "1 1 auto";

  const wrap = setting.controlEl.createDiv();
  wrap.style.position = "relative";
  wrap.style.width = "100%";
  wrap.style.maxWidth = "320px";
  wrap.style.marginLeft = "auto";

  // ---- trigger ---------------------------------------------------------
  const trigger = wrap.createDiv();
  trigger.style.display = "flex";
  trigger.style.alignItems = "center";
  trigger.style.gap = "10px";
  trigger.style.padding = "8px 12px";
  trigger.style.borderRadius = "10px";
  trigger.style.border = "1px solid var(--background-modifier-border)";
  trigger.style.background = "var(--background-primary)";
  trigger.style.cursor = "pointer";
  trigger.style.userSelect = "none";
  trigger.style.minHeight = "40px";

  const triggerLogo = trigger.createDiv();
  applyLogoBoxStyle(triggerLogo, 24, 5);

  const triggerLabel = trigger.createDiv({ text: options.initialValue || options.placeholder });
  triggerLabel.style.flex = "1 1 auto";
  triggerLabel.style.fontSize = "14px";
  triggerLabel.style.fontWeight = "800";
  triggerLabel.style.color = options.initialValue ? "var(--text-normal)" : "var(--text-muted)";
  triggerLabel.style.overflow = "hidden";
  triggerLabel.style.textOverflow = "ellipsis";
  triggerLabel.style.whiteSpace = "nowrap";

  const caret = trigger.createDiv({ text: "▾" });
  caret.style.fontSize = "13px";
  caret.style.color = "var(--text-muted)";
  caret.style.flexShrink = "0";

  if (options.initialValue) {
    renderBankLogoByName(plugin, triggerLogo, options.initialValue, 22);
  }

  // ---- menu ------------------------------------------------------------
  const menu = wrap.createDiv();
  menu.style.position = "absolute";
  menu.style.top = "calc(100% + 6px)";
  menu.style.left = "0";
  menu.style.right = "0";
  menu.style.maxHeight = "300px";
  menu.style.overflowY = "auto";
  menu.style.borderRadius = "10px";
  menu.style.border = "1px solid var(--background-modifier-border)";
  menu.style.background = "var(--background-primary)";
  menu.style.boxShadow = "0 12px 28px rgba(0,0,0,0.18)";
  menu.style.zIndex = "20";
  menu.style.display = "none";
  menu.style.padding = "6px";

  let menuOpen = false;
  const openMenu = () => {
    menu.style.display = "block";
    menuOpen = true;
  };
  const closeMenu = () => {
    menu.style.display = "none";
    menuOpen = false;
  };

  trigger.onclick = (e) => {
    e.stopPropagation();
    if (menuOpen) closeMenu();
    else openMenu();
  };

  const updateTriggerDisplay = (name: string) => {
    triggerLabel.innerText = name;
    triggerLabel.style.color = "var(--text-normal)";
    triggerLogo.empty();
    renderBankLogoByName(plugin, triggerLogo, name, 22);
  };

  const handlePick = async (value: string) => {
    if (value === "其他") {
      // 先关闭下拉，避免遮挡输入弹窗
      closeMenu();
      const custom = await openPromptModal(app, {
        title: options.customPromptTitle,
        placeholder: options.customPromptTitle,
        type: "text",
      });
      if (custom === null) return; // 用户取消
      const trimmed = (custom || "").trim();
      if (!trimmed) {
        notify("名称不能为空");
        return;
      }
      options.onPick(trimmed);
      updateTriggerDisplay(trimmed);
      return;
    }
    options.onPick(value);
    updateTriggerDisplay(value);
    closeMenu();
  };

  options.options.forEach((opt) => {
    const row = menu.createDiv();
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.gap = "10px";
    row.style.padding = "7px 10px";
    row.style.borderRadius = "8px";
    row.style.cursor = "pointer";
    row.style.transition = "background 0.12s";

    const optLogo = row.createDiv();
    applyLogoBoxStyle(optLogo, 22, 5);
    if (opt !== "其他") {
      renderBankLogoByName(plugin, optLogo, opt, 20);
    } else {
      optLogo.innerText = "•";
      optLogo.style.color = "var(--text-muted)";
      optLogo.style.fontSize = "15px";
      optLogo.style.fontWeight = "900";
    }

    const nameEl = row.createDiv({ text: opt });
    nameEl.style.fontSize = "14px";
    nameEl.style.fontWeight = "800";
    nameEl.style.color = "var(--text-normal)";
    nameEl.style.flex = "1 1 auto";

    row.onmouseenter = () => {
      row.style.background = "var(--background-modifier-hover)";
    };
    row.onmouseleave = () => {
      row.style.background = "";
    };
    row.onclick = (e) => {
      e.stopPropagation();
      void handlePick(opt);
    };
  });

  // ---- outside click closes menu --------------------------------------
  const outsideHandler = (e: MouseEvent) => {
    if (!menuOpen) return;
    const target = e.target as Node;
    if (!trigger.contains(target) && !menu.contains(target)) {
      closeMenu();
    }
  };
  document.addEventListener("click", outsideHandler);

  return {
    teardown() {
      document.removeEventListener("click", outsideHandler);
    },
  };
}
