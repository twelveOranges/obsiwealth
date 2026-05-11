/**
 * Tiny SVG icon factory used by the bottom nav, header buttons and idle
 * watermark overlay. Behaviour is byte-identical to the original
 * `ObsiWealthMainView.createNavIcon` / `getIconPaths`.
 */

/** Build a 24x24 SVG element for the given icon name. */
export function createNavIcon(name: string, size: number = 22): SVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.8");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");

  const paths = getIconPaths(name);
  paths.forEach(({ tag, attrs }) => {
    const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.keys(attrs).forEach((k) => node.setAttribute(k, attrs[k]));
    svg.appendChild(node);
  });
  return svg;
}

/** Return the SVG sub-elements that compose each named icon. */
export function getIconPaths(name: string): Array<{ tag: string; attrs: Record<string, string> }> {
  switch (name) {
    case "home":
      return [
        { tag: "path", attrs: { d: "M3 11.5 12 4l9 7.5" } },
        { tag: "path", attrs: { d: "M5 10.5V20h14V10.5" } },
        { tag: "path", attrs: { d: "M10 20v-5h4v5" } },
      ];
    case "funds":
      // 美元符号圆圈
      return [
        { tag: "circle", attrs: { cx: "12", cy: "12", r: "9" } },
        { tag: "path", attrs: { d: "M12 6.5v11" } },
        { tag: "path", attrs: { d: "M15 9.2c-.6-1.1-1.7-1.7-3-1.7-1.8 0-3 1-3 2.4 0 1.4 1.2 2 3 2.4 1.8.4 3 1 3 2.4 0 1.5-1.2 2.5-3 2.5-1.4 0-2.5-.6-3.1-1.8" } },
      ];
    case "assets":
      // 货物箱子：方盒 + 上盖折痕
      return [
        { tag: "path", attrs: { d: "M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z" } },
        { tag: "path", attrs: { d: "M3 7.5 12 12l9-4.5" } },
        { tag: "path", attrs: { d: "M12 12v9" } },
      ];
    case "chart":
      // 折线图：坐标轴 + 折线
      return [
        { tag: "path", attrs: { d: "M4 4v16h16" } },
        { tag: "path", attrs: { d: "M7 15l3.5-4 3 2.5L17.5 8" } },
        { tag: "circle", attrs: { cx: "7", cy: "15", r: "0.8", fill: "currentColor", stroke: "none" } },
        { tag: "circle", attrs: { cx: "10.5", cy: "11", r: "0.8", fill: "currentColor", stroke: "none" } },
        { tag: "circle", attrs: { cx: "13.5", cy: "13.5", r: "0.8", fill: "currentColor", stroke: "none" } },
        { tag: "circle", attrs: { cx: "17.5", cy: "8", r: "0.8", fill: "currentColor", stroke: "none" } },
      ];
    case "heart":
      return [
        { tag: "path", attrs: { d: "M12 20s-7-4.35-7-10a4 4 0 017-2.65A4 4 0 0119 10c0 5.65-7 10-7 10z" } },
      ];
    case "settings":
      // 8 齿齿轮：外圈带 8 个方齿 + 中心圆（lucide settings 风格）
      return [
        {
          tag: "path",
          attrs: {
            d: "M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 005 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 005 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 5a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
          },
        },
        { tag: "circle", attrs: { cx: "12", cy: "12", r: "3" } },
      ];
    case "eye":
      // 睁眼
      return [
        { tag: "path", attrs: { d: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" } },
        { tag: "circle", attrs: { cx: "12", cy: "12", r: "3" } },
      ];
    case "eyeOff":
      // 闭眼：眼 + 斜线
      return [
        { tag: "path", attrs: { d: "M3 3l18 18" } },
        { tag: "path", attrs: { d: "M10.6 10.6a2 2 0 002.8 2.8" } },
        { tag: "path", attrs: { d: "M9.3 6.2A9.8 9.8 0 0112 6c6 0 9.5 6 9.5 6a17.5 17.5 0 01-3.1 3.8" } },
        { tag: "path", attrs: { d: "M5.6 7.6A17.5 17.5 0 002.5 12S6 18 12 18c1.2 0 2.3-.2 3.3-.5" } },
      ];
    case "columnsMinus":
      return [
        { tag: "rect", attrs: { x: "3", y: "5", width: "7", height: "14", rx: "1.5" } },
        { tag: "rect", attrs: { x: "14", y: "5", width: "7", height: "14", rx: "1.5" } },
        { tag: "path", attrs: { d: "M8 12h8" } },
      ];
    case "columnsPlus":
      return [
        { tag: "rect", attrs: { x: "3", y: "5", width: "5", height: "14", rx: "1.2" } },
        { tag: "rect", attrs: { x: "9.5", y: "5", width: "5", height: "14", rx: "1.2" } },
        { tag: "rect", attrs: { x: "16", y: "5", width: "5", height: "14", rx: "1.2" } },
        { tag: "path", attrs: { d: "M12 9v6M9 12h6" } },
      ];
    case "sortShuffle":
      return [
        { tag: "path", attrs: { d: "M7 4v16" } },
        { tag: "path", attrs: { d: "M4 7l3-3 3 3" } },
        { tag: "path", attrs: { d: "M17 20V4" } },
        { tag: "path", attrs: { d: "M14 17l3 3 3-3" } },
      ];
    case "sortDesc":
      return [
        { tag: "path", attrs: { d: "M5 6h14" } },
        { tag: "path", attrs: { d: "M7 12h10" } },
        { tag: "path", attrs: { d: "M9 18h6" } },
        { tag: "path", attrs: { d: "M19 14l-2 4-2-4" } },
      ];
    case "sortAsc":
      return [
        { tag: "path", attrs: { d: "M9 6h6" } },
        { tag: "path", attrs: { d: "M7 12h10" } },
        { tag: "path", attrs: { d: "M5 18h14" } },
        { tag: "path", attrs: { d: "M15 10l2-4 2 4" } },
      ];
    case "checklist":
      return [
        { tag: "path", attrs: { d: "M4 6.5l2 2 3-4" } },
        { tag: "path", attrs: { d: "M4 13.5l2 2 3-4" } },
        { tag: "path", attrs: { d: "M4 20.5l2 2 3-4" } },
        { tag: "path", attrs: { d: "M12 6h8" } },
        { tag: "path", attrs: { d: "M12 13h8" } },
        { tag: "path", attrs: { d: "M12 20h8" } },
      ];
    case "plus":
      return [
        { tag: "path", attrs: { d: "M12 5v14" } },
        { tag: "path", attrs: { d: "M5 12h14" } },
      ];
    case "pencil":
      return [
        { tag: "path", attrs: { d: "M12 20h9" } },
        { tag: "path", attrs: { d: "M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z" } },
      ];
    case "trash":
      return [
        { tag: "path", attrs: { d: "M3 6h18" } },
        { tag: "path", attrs: { d: "M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" } },
        { tag: "path", attrs: { d: "M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" } },
        { tag: "path", attrs: { d: "M10 11v6" } },
        { tag: "path", attrs: { d: "M14 11v6" } },
      ];
    default:
      return [{ tag: "circle", attrs: { cx: "12", cy: "12", r: "8" } }];
  }
}
