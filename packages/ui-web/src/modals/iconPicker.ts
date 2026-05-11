import { App, Modal } from "obsidian";
import {
  ICON_LIBRARY,
  IconDimension,
  IconCategory,
  IconCategoryId,
  getCategory,
} from "../iconLibrary";
import { getIconPath } from "../iconResolver";
import type { IconDefinition } from "@core/types";
import {
  getDefaultCustomIconSize,
  saveCustomImageFromDataUrl,
} from "@core/storage/customImageStore";
import { notify } from "@core";

// Remember the user's last tab selection so opening the picker feels
// continuous across modals (session-only — we deliberately don't persist
// this to settings).
let lastDimension: IconDimension = "2d";
let lastCategoryByDim: Record<IconDimension, IconCategoryId | undefined> = {
  "2d": "digital",
  "3d": "digital",
};

type IconSelectHandler = (icon: IconDefinition) => void;

/**
 * "money"  — fund / liability modals, show money-themed SVGs only
 * "asset"  — asset / accessory modals, show the built-in 3D asset icons
 */
export type IconPickerVariant = "money" | "asset";

export function openIconPicker(
  app: App,
  onSelect: IconSelectHandler,
  variant: IconPickerVariant = "asset",
) {
  const modal = new Modal(app);

  renderIconPicker(modal, app, onSelect, variant);
  modal.open();
}

function renderIconPicker(
  modal: Modal,
  app: App,
  onSelect: IconSelectHandler,
  variant: IconPickerVariant,
) {
  const { contentEl } = modal;
  contentEl.empty();
  contentEl.style.overflow = "visible";
  contentEl.createEl("h3", { text: "选择图标" });

  renderLocalPickerBar(contentEl, app, async (dataUrl) => {
    // Persist the cropped PNG to its own file under `.obsiwealth/icons/`
    // and keep only a short reference string inside the YAML payload. This
    // keeps assets.yaml / funds.yaml human-readable and dedupes identical
    // uploads via content-hashed filenames.
    try {
      const ref = await saveCustomImageFromDataUrl(dataUrl);
      onSelect({ id: ref, name: "自定义图片", src: ref });
    } catch (err) {
      console.error(err);
      notify("保存图片失败，已回退为内联");
      onSelect({ id: dataUrl, name: "自定义图片", src: dataUrl });
    }
    modal.close();
  });

  // Money variant: fund / liability modals only need the money category,
  // and 3D doesn't have a money set yet — so skip the dimension tabs
  // entirely and jump straight into the money grid.
  if (variant === "money") {
    const moneyCat = getCategory("2d", "money");
    if (moneyCat) {
      renderCategoryGrid(modal, contentEl, app, moneyCat, onSelect);
    }
    return;
  }

  renderTwoTierPicker(modal, contentEl, app, onSelect);
}

/**
 * Asset picker with two tab rows:
 *   row 1 — dimension: [ 3D ] [ 2D ]
 *   row 2 — category (depends on dimension): [ 数码 ] [ 家居 ] …
 * Plus a grid that shows the icons of the currently selected category.
 *
 * Selections are cached in module-level state (`lastDimension` /
 * `lastCategoryByDim`) so reopening the picker lands on the user's last
 * choice.
 */
function renderTwoTierPicker(
  modal: Modal,
  contentEl: HTMLElement,
  app: App,
  onSelect: IconSelectHandler,
) {
  // Ensure the remembered dimension is actually still available
  // (defensive — dimensions are static today).
  const availableDims = ICON_LIBRARY.map((d) => d.dimension);
  let currentDim: IconDimension = availableDims.includes(lastDimension)
    ? lastDimension
    : availableDims[0];

  const dimRow = contentEl.createDiv();
  dimRow.style.display = "flex";
  dimRow.style.gap = "6px";
  dimRow.style.margin = "4px 0 10px";
  dimRow.style.padding = "4px";
  dimRow.style.background = "var(--background-secondary)";
  dimRow.style.borderRadius = "8px";
  dimRow.style.width = "fit-content";

  const catRow = contentEl.createDiv();
  catRow.style.display = "flex";
  catRow.style.flexWrap = "wrap";
  catRow.style.gap = "6px";
  catRow.style.margin = "2px 0 12px";

  const gridHost = contentEl.createDiv();
  gridHost.style.maxHeight = "60vh";
  gridHost.style.overflowY = "auto";
  gridHost.style.paddingRight = "4px";

  const renderDimTabs = () => {
    dimRow.empty();
    ICON_LIBRARY.forEach((dim) => {
      const tab = dimRow.createEl("button", { text: dim.name });
      tab.type = "button";
      applyDimTabStyle(tab, dim.dimension === currentDim);
      tab.onclick = () => {
        if (dim.dimension === currentDim) return;
        currentDim = dim.dimension;
        lastDimension = currentDim;
        renderDimTabs();
        renderCatTabsAndGrid();
      };
    });
  };

  const renderCatTabsAndGrid = () => {
    catRow.empty();
    gridHost.empty();

    const dim = ICON_LIBRARY.find((d) => d.dimension === currentDim);
    if (!dim || dim.categories.length === 0) {
      const empty = gridHost.createDiv({ text: "该风格暂无图标" });
      empty.style.padding = "20px";
      empty.style.textAlign = "center";
      empty.style.color = "var(--text-muted)";
      empty.style.fontSize = "12px";
      return;
    }

    // Pick the last-used category if valid; otherwise fall back to first.
    const remembered = lastCategoryByDim[currentDim];
    let currentCat: IconCategory =
      dim.categories.find((c) => c.id === remembered) ?? dim.categories[0];

    const renderGrid = () => {
      gridHost.empty();
      renderCategoryGrid(modal, gridHost, app, currentCat, onSelect);
    };

    dim.categories.forEach((cat) => {
      const chip = catRow.createEl("button", { text: cat.name });
      chip.type = "button";
      applyCatChipStyle(chip, cat.id === currentCat.id);
      chip.onclick = () => {
        if (cat.id === currentCat.id) return;
        currentCat = cat;
        lastCategoryByDim[currentDim] = cat.id;
        // Restyle all chips.
        Array.from(catRow.children).forEach((node, idx) => {
          applyCatChipStyle(
            node as HTMLButtonElement,
            dim.categories[idx].id === currentCat.id,
          );
        });
        renderGrid();
      };
    });

    lastCategoryByDim[currentDim] = currentCat.id;
    renderGrid();
  };

  renderDimTabs();
  renderCatTabsAndGrid();
}

function renderCategoryGrid(
  modal: Modal,
  host: HTMLElement,
  app: App,
  category: IconCategory,
  onSelect: IconSelectHandler,
) {
  const grid = host.createDiv("icon-grid");
  applyGridStyle(grid);
  category.icons.forEach((icon) => {
    grid.appendChild(createIconItem(modal, app, icon, onSelect));
  });
}

function applyDimTabStyle(el: HTMLButtonElement, active: boolean) {
  el.style.padding = "6px 18px";
  el.style.borderRadius = "6px";
  el.style.border = "0";
  el.style.background = active
    ? "var(--interactive-accent)"
    : "transparent";
  el.style.color = active
    ? "var(--text-on-accent)"
    : "var(--text-normal)";
  el.style.fontWeight = "800";
  el.style.fontSize = "13px";
  el.style.cursor = "pointer";
  el.style.transition = "background 0.12s ease";
}

function applyCatChipStyle(el: HTMLButtonElement, active: boolean) {
  el.style.padding = "5px 12px";
  el.style.borderRadius = "999px";
  el.style.border = active
    ? "1px solid var(--interactive-accent)"
    : "1px solid var(--background-modifier-border)";
  el.style.background = active
    ? "var(--interactive-accent-hover, rgba(56, 139, 253, 0.12))"
    : "transparent";
  el.style.color = active
    ? "var(--interactive-accent)"
    : "var(--text-muted)";
  el.style.fontSize = "12px";
  el.style.fontWeight = active ? "800" : "600";
  el.style.cursor = "pointer";
  el.style.transition = "background 0.12s ease, color 0.12s ease";
}

function renderLocalPickerBar(
  parent: HTMLElement,
  app: App,
  onPicked: (dataUrl: string) => void,
) {
  const bar = parent.createDiv();
  bar.style.display = "flex";
  bar.style.alignItems = "center";
  bar.style.gap = "8px";
  bar.style.margin = "4px 0 12px";

  // 扁平风格按钮：直角矩形 + 内联 SVG 相机 + 仅一个"本地"文案
  const button = bar.createEl("button");
  button.type = "button";
  button.style.display = "inline-flex";
  button.style.alignItems = "center";
  button.style.gap = "6px";
  button.style.padding = "6px 14px";
  button.style.borderRadius = "0";
  button.style.border = "1px solid var(--background-modifier-border)";
  button.style.background = "var(--background-secondary)";
  button.style.color = "var(--text-normal)";
  button.style.fontSize = "13px";
  button.style.fontWeight = "800";
  button.style.cursor = "pointer";

  // 扁平 SVG 相机图标：纯线条，无填充阴影
  button.insertAdjacentHTML(
    "beforeend",
    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M3 8h4l2-3h6l2 3h4v11H3z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>`,
  );
  button.appendChild(document.createTextNode("本地"));

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.style.display = "none";
  bar.appendChild(fileInput);

  button.onclick = () => fileInput.click();

  fileInput.onchange = () => {
    const file = fileInput.files && fileInput.files[0];
    fileInput.value = "";
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const src = typeof reader.result === "string" ? reader.result : "";
      if (!src) {
        return;
      }
      openSquareCropper(app, src, onPicked);
    };
    reader.readAsDataURL(file);
  };
}

/**
 * Open a modal that lets the user pan/zoom the input image inside a square
 * viewport, then outputs the cropped PNG as a dataURL.
 */
function openSquareCropper(
  app: App,
  imageSrc: string,
  onConfirm: (dataUrl: string) => void,
) {
  const modal = new Modal(app);
  const { contentEl } = modal;
  contentEl.empty();
  contentEl.createEl("h3", { text: "裁剪图片（正方形）" });

  const wrap = contentEl.createDiv();
  wrap.style.display = "flex";
  wrap.style.flexDirection = "column";
  wrap.style.alignItems = "center";
  wrap.style.gap = "12px";

  // Square viewport — fixed size, image centred/scaled inside.
  const viewportSize = 320;
  const viewport = wrap.createDiv();
  viewport.style.position = "relative";
  viewport.style.width = `${viewportSize}px`;
  viewport.style.height = `${viewportSize}px`;
  viewport.style.overflow = "hidden";
  viewport.style.background = "repeating-conic-gradient(#e5e7eb 0 25%, #f9fafb 0 50%) 50% / 20px 20px";
  viewport.style.border = "2px solid var(--interactive-accent)";
  viewport.style.borderRadius = "6px";
  viewport.style.cursor = "grab";
  viewport.style.userSelect = "none";
  viewport.style.touchAction = "none";

  const img = document.createElement("img");
  img.src = imageSrc;
  img.alt = "preview";
  img.draggable = false;
  img.style.position = "absolute";
  img.style.left = "0";
  img.style.top = "0";
  img.style.pointerEvents = "none";
  img.style.userSelect = "none";
  viewport.appendChild(img);

  // Explicit square crop frame overlay (always visible, no rounded corners).
  const frame = viewport.createDiv();
  frame.style.position = "absolute";
  frame.style.inset = "0";
  frame.style.border = "2px dashed rgba(255,255,255,0.9)";
  frame.style.borderRadius = "0";
  frame.style.boxShadow = "0 0 0 9999px rgba(0,0,0,0.35)";
  frame.style.pointerEvents = "none";

  // --- state ---------------------------------------------------------------
  const state = {
    naturalW: 0,
    naturalH: 0,
    minScale: 1,
    scale: 1,
    x: 0,
    y: 0,
  };

  const clampPosition = () => {
    const w = state.naturalW * state.scale;
    const h = state.naturalH * state.scale;
    const minX = Math.min(0, viewportSize - w);
    const maxX = 0;
    const minY = Math.min(0, viewportSize - h);
    const maxY = 0;
    // 当缩放后尺寸 < viewport 时，把图像粘在 (0,0)
    state.x = w <= viewportSize ? (viewportSize - w) / 2 : Math.min(maxX, Math.max(minX, state.x));
    state.y = h <= viewportSize ? (viewportSize - h) / 2 : Math.min(maxY, Math.max(minY, state.y));
  };

  const apply = () => {
    img.style.width = `${state.naturalW * state.scale}px`;
    img.style.height = `${state.naturalH * state.scale}px`;
    img.style.transform = `translate(${state.x}px, ${state.y}px)`;
  };

  img.onload = () => {
    state.naturalW = img.naturalWidth || 1;
    state.naturalH = img.naturalHeight || 1;
    // 初始按 "cover" 填满正方形视口
    state.minScale = Math.max(viewportSize / state.naturalW, viewportSize / state.naturalH);
    state.scale = state.minScale;
    state.x = (viewportSize - state.naturalW * state.scale) / 2;
    state.y = (viewportSize - state.naturalH * state.scale) / 2;
    apply();
  };

  // --- drag to pan ---------------------------------------------------------
  let dragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragOriginX = 0;
  let dragOriginY = 0;

  viewport.onpointerdown = (event) => {
    dragging = true;
    viewport.setPointerCapture(event.pointerId);
    viewport.style.cursor = "grabbing";
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    dragOriginX = state.x;
    dragOriginY = state.y;
  };

  viewport.onpointermove = (event) => {
    if (!dragging) return;
    state.x = dragOriginX + (event.clientX - dragStartX);
    state.y = dragOriginY + (event.clientY - dragStartY);
    clampPosition();
    apply();
  };

  const endDrag = (event: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    viewport.releasePointerCapture(event.pointerId);
    viewport.style.cursor = "grab";
  };
  viewport.onpointerup = endDrag;
  viewport.onpointercancel = endDrag;

  // --- wheel to zoom -------------------------------------------------------
  viewport.addEventListener(
    "wheel",
    (event: WheelEvent) => {
      event.preventDefault();
      const delta = -event.deltaY;
      const factor = delta > 0 ? 1.08 : 1 / 1.08;
      const nextScale = Math.min(state.minScale * 6, Math.max(state.minScale, state.scale * factor));
      if (nextScale === state.scale) return;

      // 以鼠标点为中心缩放
      const rect = viewport.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      const ratio = nextScale / state.scale;
      state.x = mouseX - (mouseX - state.x) * ratio;
      state.y = mouseY - (mouseY - state.y) * ratio;
      state.scale = nextScale;
      clampPosition();
      apply();
    },
    { passive: false },
  );

  // --- zoom slider ---------------------------------------------------------
  const sliderRow = wrap.createDiv();
  sliderRow.style.display = "flex";
  sliderRow.style.alignItems = "center";
  sliderRow.style.gap = "10px";
  sliderRow.style.width = `${viewportSize}px`;

  const sliderLabel = sliderRow.createSpan({ text: "缩放" });
  sliderLabel.style.fontSize = "12px";
  sliderLabel.style.color = "var(--text-muted)";

  const slider = sliderRow.createEl("input");
  slider.type = "range";
  slider.min = "1";
  slider.max = "6";
  slider.step = "0.01";
  slider.value = "1";
  slider.style.flex = "1";

  slider.oninput = () => {
    const ratio = parseFloat(slider.value);
    const nextScale = state.minScale * ratio;
    // 以视口中心缩放
    const centerX = viewportSize / 2;
    const centerY = viewportSize / 2;
    const k = nextScale / state.scale;
    state.x = centerX - (centerX - state.x) * k;
    state.y = centerY - (centerY - state.y) * k;
    state.scale = nextScale;
    clampPosition();
    apply();
  };

  // --- output size (compression) row --------------------------------------
  // PNG 是无损格式，不支持质量参数，所以"压缩"这里实际上是降分辨率。
  // 用户越往左拖尺寸越小、体积越小，但依旧保留 alpha 通道，在暗色主题下透明。
  const SIZE_STEPS = [96, 128, 192, 256, 384, 512];
  // Pick the step closest to the user-configured default (settings →
  // "自定义图片默认尺寸"). Falls back to 256 when unset / non-matching.
  const DEFAULT_STEP_INDEX = (() => {
    const preferred = getDefaultCustomIconSize();
    let bestIdx = 3;
    let bestDelta = Number.POSITIVE_INFINITY;
    for (let i = 0; i < SIZE_STEPS.length; i++) {
      const delta = Math.abs(SIZE_STEPS[i] - preferred);
      if (delta < bestDelta) {
        bestDelta = delta;
        bestIdx = i;
      }
    }
    return bestIdx;
  })();

  const compressRow = wrap.createDiv();
  compressRow.style.display = "flex";
  compressRow.style.alignItems = "center";
  compressRow.style.gap = "10px";
  compressRow.style.width = `${viewportSize}px`;

  const compressLabel = compressRow.createSpan({ text: "输出尺寸" });
  compressLabel.style.fontSize = "12px";
  compressLabel.style.color = "var(--text-muted)";

  const sizeSlider = compressRow.createEl("input");
  sizeSlider.type = "range";
  sizeSlider.min = "0";
  sizeSlider.max = String(SIZE_STEPS.length - 1);
  sizeSlider.step = "1";
  sizeSlider.value = String(DEFAULT_STEP_INDEX);
  sizeSlider.style.flex = "1";

  const sizeValue = compressRow.createSpan({
    text: `${SIZE_STEPS[DEFAULT_STEP_INDEX]}px`,
  });
  sizeValue.style.fontSize = "12px";
  sizeValue.style.color = "var(--text-muted)";
  sizeValue.style.minWidth = "52px";
  sizeValue.style.textAlign = "right";

  // File-size readout: estimates the PNG byte-length for the currently
  // selected output resolution so the user can see the trade-off live.
  // We actually re-render the crop at each step (debounced) — slider steps
  // are small and PNG encoding a <= 512px square is cheap.
  const fileSizeRow = wrap.createDiv();
  fileSizeRow.style.display = "flex";
  fileSizeRow.style.justifyContent = "center";
  fileSizeRow.style.width = `${viewportSize}px`;
  fileSizeRow.style.fontSize = "11px";
  fileSizeRow.style.color = "var(--text-muted)";
  fileSizeRow.style.marginTop = "-4px";
  const fileSizeLabel = fileSizeRow.createSpan({ text: "预计大小：—" });

  let sizePreviewTimer: number | null = null;
  const updateFileSizePreview = () => {
    if (!state.naturalW || !state.naturalH) {
      fileSizeLabel.setText("预计大小：—");
      return;
    }
    if (sizePreviewTimer !== null) {
      window.clearTimeout(sizePreviewTimer);
    }
    sizePreviewTimer = window.setTimeout(() => {
      const idx = parseInt(sizeSlider.value, 10);
      const outSize = SIZE_STEPS[Math.max(0, Math.min(SIZE_STEPS.length - 1, idx))];
      const preview = renderCroppedSquare(img, state, viewportSize, outSize);
      if (!preview) {
        fileSizeLabel.setText("预计大小：—");
        return;
      }
      fileSizeLabel.setText(`预计大小：${formatByteSize(estimateDataUrlBytes(preview))}`);
    }, 40);
  };

  sizeSlider.oninput = () => {
    const idx = parseInt(sizeSlider.value, 10);
    sizeValue.setText(`${SIZE_STEPS[idx]}px`);
    updateFileSizePreview();
  };

  // Also refresh the estimate whenever the crop changes (pan / zoom both
  // alter how much detail survives into the output, which in turn changes
  // PNG size quite a bit).
  const refreshSizeOnCropChange = () => updateFileSizePreview();
  viewport.addEventListener("pointerup", refreshSizeOnCropChange);
  slider.addEventListener("input", refreshSizeOnCropChange);

  const prevOnLoad = img.onload;
  img.onload = function (ev) {
    if (typeof prevOnLoad === "function") prevOnLoad.call(img, ev);
    updateFileSizePreview();
  };

  const compressHint = wrap.createDiv();
  compressHint.setText("输出 PNG（保留透明），尺寸越小体积越小");
  compressHint.style.fontSize = "11px";
  compressHint.style.color = "var(--text-muted)";
  compressHint.style.width = `${viewportSize}px`;
  compressHint.style.textAlign = "center";

  // --- action buttons ------------------------------------------------------
  const actions = wrap.createDiv();
  actions.style.display = "flex";
  actions.style.justifyContent = "flex-end";
  actions.style.gap = "10px";
  actions.style.width = `${viewportSize}px`;

  const cancelBtn = actions.createEl("button", { text: "取消" });
  cancelBtn.type = "button";
  cancelBtn.style.padding = "8px 16px";
  cancelBtn.style.borderRadius = "999px";
  cancelBtn.style.border = "1px solid var(--background-modifier-border)";
  cancelBtn.style.background = "var(--background-secondary)";
  cancelBtn.style.cursor = "pointer";
  cancelBtn.onclick = () => modal.close();

  const okBtn = actions.createEl("button", { text: "确定" });
  okBtn.type = "button";
  okBtn.style.padding = "8px 18px";
  okBtn.style.borderRadius = "999px";
  okBtn.style.border = "0";
  okBtn.style.background = "var(--interactive-accent)";
  okBtn.style.color = "var(--text-on-accent)";
  okBtn.style.fontWeight = "800";
  okBtn.style.cursor = "pointer";
  okBtn.onclick = () => {
    const idx = parseInt(sizeSlider.value, 10);
    const outputSize = SIZE_STEPS[Math.max(0, Math.min(SIZE_STEPS.length - 1, idx))];
    const dataUrl = renderCroppedSquare(img, state, viewportSize, outputSize);
    if (dataUrl) {
      onConfirm(dataUrl);
    }
    modal.close();
  };

  modal.open();
}

function renderCroppedSquare(
  img: HTMLImageElement,
  state: { naturalW: number; naturalH: number; scale: number; x: number; y: number },
  viewportSize: number,
  outputSize: number = 256,
): string {
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return "";
  }

  // 保持透明底（不填充）——用户在暗色主题下贴图才不会出现白色方块。
  // canvas 默认就是透明的，所以这里只需要做基础平滑设置。
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // viewport 坐标系：图像左上角在 (state.x, state.y)，实际尺寸 naturalW*scale × naturalH*scale
  // 裁剪窗口：viewport 的 (0,0) 到 (viewportSize, viewportSize)
  // 映射回原图：sx = (0 - state.x) / scale, sw = viewportSize / scale
  const sx = (0 - state.x) / state.scale;
  const sy = (0 - state.y) / state.scale;
  const sSize = viewportSize / state.scale;

  try {
    ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, outputSize, outputSize);
  } catch {
    return "";
  }

  // 输出 PNG —— 保留 alpha 通道，暗色主题下透明。
  // 体积通过输出分辨率控制（PNG 是无损格式，没有 quality 参数）。
  try {
    return canvas.toDataURL("image/png");
  } catch {
    return "";
  }
}

/**
 * Estimate the decoded byte length of a base64 data URL without materialising
 * the bytes. Used by the crop modal to show a live file-size readout.
 */
function estimateDataUrlBytes(dataUrl: string): number {
  const commaIdx = dataUrl.indexOf(",");
  if (commaIdx < 0) return 0;
  const b64 = dataUrl.slice(commaIdx + 1);
  // base64 -> bytes: len * 3/4 minus padding
  let padding = 0;
  if (b64.endsWith("==")) padding = 2;
  else if (b64.endsWith("=")) padding = 1;
  return Math.max(0, Math.floor((b64.length * 3) / 4) - padding);
}

function formatByteSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function createIconItem(
  modal: Modal,
  app: App,
  icon: IconDefinition,
  onSelect: IconSelectHandler,
) {
  const item = document.createElement("button");
  item.type = "button";
  item.className = "icon-item";
  item.title = icon.name;
  applyItemStyle(item);

  const img = document.createElement("img");
  img.src = getIconPath(icon.id);
  img.alt = icon.name;
  applyImageStyle(img);

  item.appendChild(img);
  item.onclick = () => {
    onSelect(icon);
    modal.close();
  };

  return item;
}

function applyGridStyle(el: HTMLElement) {
  el.style.display = "grid";
  el.style.gridTemplateColumns = "repeat(auto-fill, minmax(56px, 1fr))";
  el.style.gap = "8px";
  el.style.overflow = "visible";
}

function applyItemStyle(el: HTMLElement) {
  el.style.display = "flex";
  el.style.alignItems = "center";
  el.style.justifyContent = "center";
  el.style.width = "56px";
  el.style.height = "56px";
  el.style.padding = "2px";
  el.style.border = "1px solid transparent";
  el.style.borderRadius = "10px";
  el.style.background = "transparent";
  el.style.cursor = "pointer";
  el.style.transition = "transform 0.12s ease, background 0.12s ease, box-shadow 0.12s ease";
  el.style.position = "relative";

  el.onmouseenter = () => {
    el.style.transform = "scale(1.45)";
    el.style.zIndex = "10";
    el.style.background = "var(--background-secondary)";
    el.style.boxShadow = "0 6px 18px rgba(0,0,0,0.22)";
  };

  el.onmouseleave = () => {
    el.style.transform = "scale(1)";
    el.style.zIndex = "";
    el.style.background = "transparent";
    el.style.boxShadow = "none";
  };
}

function applyImageStyle(el: HTMLImageElement) {
  el.style.width = "52px";
  el.style.height = "52px";
  el.style.maxWidth = "52px";
  el.style.maxHeight = "52px";
  el.style.objectFit = "contain";
}