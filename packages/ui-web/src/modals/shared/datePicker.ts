/**
 * Independent "date picker" control shared by modals that embed a date input
 * into a custom flex row (not inside an Obsidian `Setting`).
 *
 * Provides:
 *  - a one-shot CSS injector that hides the browser's built-in calendar icon
 *    so we can render our own SVG icon on top.
 *  - `createDatePickerField({ value, max, iconSize })` that returns a wrap + input
 *    pair; callers decide their own layout styles on the returned elements.
 *
 * Extracted verbatim from `fundDetailModal` where this was the only caller.
 */

// 仅注入一次：彻底隐藏系统 <input type="date"> 自带的日历图标，
// 改为我们自己在外面用 SVG 画一个；避免系统图标和日期文字重合。
let __obsiwealthDateCssInjected = false;

function ensureObsiwealthDateCss(): void {
  if (__obsiwealthDateCssInjected) return;
  __obsiwealthDateCssInjected = true;
  const style = document.createElement("style");
  style.setAttribute("data-obsiwealth-date-css", "1");
  style.textContent = `
input.obsiwealth-date-input {
  appearance: none !important;
  -webkit-appearance: none !important;
  -moz-appearance: textfield !important;
  background-image: none !important;
  font-variant-numeric: tabular-nums;
}
input.obsiwealth-date-input::-webkit-calendar-picker-indicator {
  display: none !important;
  -webkit-appearance: none !important;
  appearance: none !important;
  opacity: 0 !important;
  width: 0 !important;
  height: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
  pointer-events: none !important;
}
input.obsiwealth-date-input::-webkit-inner-spin-button,
input.obsiwealth-date-input::-webkit-clear-button {
  display: none !important;
  -webkit-appearance: none !important;
}
.obsiwealth-date-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}
.obsiwealth-date-wrap .obsiwealth-date-icon {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  cursor: pointer;
  pointer-events: auto;
}
`;
  document.head.appendChild(style);
}

export interface DatePickerFieldOptions {
  value?: string;
  max?: string;
  iconSize?: number;
}

/**
 * Create a `<div class="obsiwealth-date-wrap"><input type="date"/> <svg.../></div>`
 * tuple. The caller is responsible for layout; this helper only wires up the
 * markup, CSS reset, and the icon's click handler which re-opens the native
 * picker (`input.showPicker()`).
 */
export function createDatePickerField(options?: DatePickerFieldOptions): {
  wrap: HTMLElement;
  input: HTMLInputElement;
} {
  ensureObsiwealthDateCss();
  const wrap = document.createElement("div");
  wrap.className = "obsiwealth-date-wrap";

  const input = document.createElement("input");
  input.type = "date";
  input.classList.add("obsiwealth-date-input");
  if (options?.value) input.value = options.value;
  if (options?.max) input.max = options.max;
  wrap.appendChild(input);

  const iconSize = options?.iconSize ?? 16;
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("width", String(iconSize));
  icon.setAttribute("height", String(iconSize));
  icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", "currentColor");
  icon.setAttribute("stroke-width", "1.8");
  icon.setAttribute("stroke-linecap", "round");
  icon.setAttribute("stroke-linejoin", "round");
  icon.classList.add("obsiwealth-date-icon");
  [
    "M3 6a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2z",
    "M3 10h18",
    "M8 2v4",
    "M16 2v4",
  ].forEach((d) => {
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", d);
    icon.appendChild(p);
  });
  icon.addEventListener("click", (e) => {
    e.stopPropagation();
    const anyInput = input as HTMLInputElement & { showPicker?: () => void };
    try {
      if (typeof anyInput.showPicker === "function") {
        anyInput.showPicker();
        return;
      }
    } catch {
      // fallthrough
    }
    input.focus();
    input.click();
  });
  wrap.appendChild(icon);

  return { wrap, input };
}
