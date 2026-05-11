import { Setting } from "obsidian";
import { getTodayISODate } from "@core/calc/assetMath";

/**
 * Shared Obsidian-`Setting` builders for modal forms.
 *
 * Each function:
 *  - creates a `new Setting(containerEl)` with the requested name/desc
 *  - wires the relevant input kind (text / number / date / toggle / dropdown)
 *  - returns the underlying `Setting` so the caller can chain additional
 *    customisation (extra buttons, class names, etc.)
 *
 * API deliberately mirrors the hand-written patterns previously duplicated
 * across assetModal / assetDetailModal / fundModal / fundDetailModal /
 * accessoryModal, so the refactor can be a 1:1 swap with zero behaviour change.
 */

// ---------------------------------------------------------------------------
// Text field (plain string input)
// ---------------------------------------------------------------------------

export interface TextFieldOptions {
  name: string;
  desc?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}

export function addTextField(containerEl: HTMLElement, options: TextFieldOptions): Setting {
  const setting = new Setting(containerEl).setName(options.name);
  if (options.desc !== undefined) setting.setDesc(options.desc);
  setting.addText((text) => {
    if (options.placeholder !== undefined) text.setPlaceholder(options.placeholder);
    text.setValue(options.value);
    text.onChange(options.onChange);
  });
  return setting;
}

// ---------------------------------------------------------------------------
// Number field (text input with type="number")
// ---------------------------------------------------------------------------

export interface NumberFieldOptions {
  name: string;
  desc?: string;
  placeholder?: string;
  value: number;
  /** Minimum numeric value exposed via input.min; leave undefined to skip. */
  min?: number | string;
  max?: number | string;
  onChange: (value: number) => void;
}

export function addNumberField(containerEl: HTMLElement, options: NumberFieldOptions): Setting {
  const setting = new Setting(containerEl).setName(options.name);
  if (options.desc !== undefined) setting.setDesc(options.desc);
  setting.addText((text) => {
    text.inputEl.type = "number";
    if (options.min !== undefined) text.inputEl.min = String(options.min);
    if (options.max !== undefined) text.inputEl.max = String(options.max);
    if (options.placeholder !== undefined) text.setPlaceholder(options.placeholder);
    // Match legacy behaviour: render 0 as empty string (so the placeholder shows)
    text.setValue(options.value ? String(options.value) : "");
    text.onChange((raw) => {
      options.onChange(Number(raw || 0));
    });
  });
  return setting;
}

// ---------------------------------------------------------------------------
// Date field (text input with type="date") — Setting-wrapped
// ---------------------------------------------------------------------------

export interface DateFieldOptions {
  name: string;
  desc?: string;
  value: string;
  /**
   * Max selectable date (inclusive). Pass `"today"` to clamp to today's ISO
   * date, or an explicit ISO string. Also enforces runtime clamp-on-input.
   * Default: `"today"` (matches every existing caller).
   */
  max?: string | "today";
  /** Min selectable date (inclusive). */
  min?: string;
  onChange: (value: string) => void;
}

export function addDateField(containerEl: HTMLElement, options: DateFieldOptions): Setting {
  const setting = new Setting(containerEl).setName(options.name);
  if (options.desc !== undefined) setting.setDesc(options.desc);
  setting.addText((text) => {
    const today = getTodayISODate();
    const maxValue = options.max === undefined ? today : options.max === "today" ? today : options.max;
    text.inputEl.type = "date";
    if (maxValue) text.inputEl.max = maxValue;
    if (options.min !== undefined) text.inputEl.min = options.min;
    text.setValue(options.value || today);
    text.onChange((raw) => {
      const clamped = maxValue && raw > maxValue ? maxValue : raw;
      if (clamped !== raw) text.setValue(clamped);
      options.onChange(clamped);
    });
  });
  return setting;
}

// ---------------------------------------------------------------------------
// Toggle field
// ---------------------------------------------------------------------------

export interface ToggleFieldOptions {
  name: string;
  desc?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export function addToggleField(containerEl: HTMLElement, options: ToggleFieldOptions): Setting {
  const setting = new Setting(containerEl).setName(options.name);
  if (options.desc !== undefined) setting.setDesc(options.desc);
  setting.addToggle((toggle) => {
    toggle.setValue(options.value);
    toggle.onChange(options.onChange);
  });
  return setting;
}

// ---------------------------------------------------------------------------
// Dropdown field
// ---------------------------------------------------------------------------

export interface DropdownOption {
  value: string;
  label: string;
}

export interface DropdownFieldOptions {
  name: string;
  desc?: string;
  value: string;
  options: readonly DropdownOption[];
  onChange: (value: string) => void;
}

export function addDropdownField(containerEl: HTMLElement, options: DropdownFieldOptions): Setting {
  const setting = new Setting(containerEl).setName(options.name);
  if (options.desc !== undefined) setting.setDesc(options.desc);
  setting.addDropdown((dropdown) => {
    options.options.forEach((opt) => dropdown.addOption(opt.value, opt.label));
    dropdown.setValue(options.value);
    dropdown.onChange(options.onChange);
  });
  return setting;
}
