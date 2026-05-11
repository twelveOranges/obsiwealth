/**
 * Slot-machine style number renderer.
 *
 * Extracted verbatim from `ObsiWealthMainView.renderSlotNumber`. Each numeric
 * character in `value` is displayed as a reel that animates from 0 to the
 * target digit; non-numeric characters render statically inline.
 *
 * In addition, the fractional portion of the number (the last `.` plus its
 * trailing run of digits) is rendered at `0.7em` so only the decimals shrink
 * while the integer portion keeps its full size.
 *
 * Pass `shrinkDecimals = false` to opt out of the decimal-shrinking, e.g. on
 * dense cards where the user wants every digit at the same size.
 */
export function renderSlotNumber(
  parent: HTMLElement,
  value: string,
  shrinkDecimals: boolean = true,
): void {
  parent.style.display = "inline-flex";
  parent.style.alignItems = "baseline";
  // 老虎机数字串作为一个不可分割的原子单元，永远不换行。配合外层卡片的
  // ResponsiveZoomController（给虚拟画布设 minWidth 再 zoom 等比缩放），
  // 这里 nowrap 也不会溢出用户视野 —— zoom 会把整段数字一起缩小。
  parent.style.flexWrap = "nowrap";
  parent.style.whiteSpace = "nowrap";
  parent.style.gap = "1px";
  parent.style.fontVariantNumeric = "tabular-nums";

  // 当整个 page 被 ResponsiveZoomController 施加 zoom < 1 缩放时，浏览器
  // 会把被 zoom 的子树作为一个光栅层，每一帧 transform 过渡都要重新做位图
  // 重采样 —— 对于包含大量 slot reel 的页面会明显卡顿。此时直接一次性把
  // 数字定位到目标值、跳过动画，视觉上少了"滚动"但换来顺滑的滚动和交互。
  const skipAnimation = isInsideZoomedRegion(parent);

  const { decimalStart, decimalEnd } = shrinkDecimals
    ? findDecimalRange(value)
    : { decimalStart: value.length, decimalEnd: value.length };

  Array.from(value).forEach((char, index) => {
    const isDecimalPart = index >= decimalStart && index < decimalEnd;
    const scale = isDecimalPart ? 0.7 : 1;

    if (!/\d/.test(char)) {
      const staticChar = parent.createSpan({ text: char });
      staticChar.style.display = "inline-block";
      staticChar.style.opacity = "0.92";
      if (isDecimalPart) {
        staticChar.style.fontSize = `${scale}em`;
      }
      return;
    }

    const digit = Number(char);
    const slot = parent.createSpan();
    slot.style.display = "inline-block";
    slot.style.height = "1.05em";
    slot.style.overflow = "hidden";
    slot.style.verticalAlign = "bottom";
    if (isDecimalPart) {
      slot.style.fontSize = `${scale}em`;
    }

    const reel = slot.createSpan();
    reel.style.display = "flex";
    reel.style.flexDirection = "column";

    if (skipAnimation) {
      // 无动画路径：reel 直接定位到目标数字，不设 transition。
      reel.style.transform = `translateY(-${digit * 1.05}em)`;
    } else {
      reel.style.transform = "translateY(0)";
      reel.style.transition = `transform ${650 + index * 35}ms cubic-bezier(0.2, 0.8, 0.2, 1)`;
    }

    for (let i = 0; i <= 9; i += 1) {
      const number = reel.createSpan({ text: String(i) });
      number.style.height = "1.05em";
      number.style.lineHeight = "1.05em";
    }

    if (!skipAnimation) {
      requestAnimationFrame(() => {
        reel.style.transform = `translateY(-${digit * 1.05}em)`;
      });
    }
  });
}

/**
 * Walk up from `el` and return true if any ancestor has a CSS `zoom` value
 * below 1. Used to detect when the slot-machine animation would be rendered
 * inside a ResponsiveZoomController-scaled region and should be skipped.
 *
 * We read the inline `style.zoom` rather than `getComputedStyle` because the
 * controller writes directly to `style.zoom` and parsing a numeric string is
 * much cheaper than a computed-style lookup per slotNumber call.
 */
function isInsideZoomedRegion(el: HTMLElement): boolean {
  let node: HTMLElement | null = el;
  while (node) {
    const raw = (node.style as unknown as Record<string, string>).zoom;
    if (raw) {
      const z = Number(raw);
      if (Number.isFinite(z) && z > 0 && z < 0.999) {
        return true;
      }
    }
    node = node.parentElement;
  }
  return false;
}

/**
 * Locate the fractional part of a formatted number string.
 *
 * Returns the half-open range `[decimalStart, decimalEnd)` covering the last
 * `.` in the string plus the immediately following run of digits. If no such
 * run exists, returns an empty range so the caller leaves every character at
 * full size.
 */
function findDecimalRange(value: string): { decimalStart: number; decimalEnd: number } {
  const dotIndex = value.lastIndexOf(".");

  if (dotIndex < 0 || dotIndex >= value.length - 1 || !/\d/.test(value[dotIndex + 1] ?? "")) {
    return { decimalStart: value.length, decimalEnd: value.length };
  }

  let end = dotIndex + 1;
  while (end < value.length && /\d/.test(value[end] ?? "")) {
    end += 1;
  }

  return { decimalStart: dotIndex, decimalEnd: end };
}
