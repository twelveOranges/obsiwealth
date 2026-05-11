import type { AppModel } from "@ui/host/appModel";

/** Events we consider "user activity" and that reset the idle countdown. */
const ACTIVITY_EVENTS: Array<keyof HTMLElementEventMap> = [
  "mousemove",
  "mousedown",
  "keydown",
  "wheel",
  "scroll",
  "touchstart",
  "touchmove",
];

export type IdlePageKey = "home" | "funds" | "assets" | "assetStats" | "wishlist";

export interface IdleWatermarkContext {
  plugin: AppModel;
  /** The view container; used as the click surface and activity source. */
  host: HTMLElement;
  /** Page key used to pick which watermark symbol to draw. */
  getCurrentPage: () => IdlePageKey;
  /** Builds the SVG icon the overlay draws. Delegated because the registry lives in mainView. */
  createNavIcon: (name: string, size?: number) => SVGElement;
}

/**
 * Idle watermark controller.
 *
 * Owns:
 *  - the idle countdown timer
 *  - the host + document + visibility listeners
 *  - the overlay element itself
 *
 * Lifecycle: `setup()` starts the timer, `teardown()` tears everything down.
 * Calling `setup()` while already active cleanly restarts (used on every render).
 */
export class IdleWatermarkController {
  private timer: number | null = null;
  private overlayEl: HTMLElement | null = null;
  private hostActivityHandler: ((event: Event) => void) | null = null;
  private documentActivityHandler: ((event: Event) => void) | null = null;
  private visibilityHandler: (() => void) | null = null;

  constructor(private readonly ctx: IdleWatermarkContext) {}

  /** (Re)arm the watermark according to current plugin settings. */
  setup(): void {
    this.teardown();

    const settings = this.ctx.plugin.settings;
    if (!settings.idleWatermarkEnabled) {
      return;
    }

    this.ctx.host.style.position = "relative";

    const timeoutMs = Math.max(5, settings.idleWatermarkTimeoutSec) * 1000;

    const scheduleIdle = () => {
      if (this.timer !== null) {
        window.clearTimeout(this.timer);
      }
      this.timer = window.setTimeout(() => {
        this.show();
      }, timeoutMs);
    };

    // 水印未显示时：任何交互（含鼠标移动/滚轮/滚动）都重置倒计时，避免正在操作时误锁屏。
    // 水印已显示时：只有点击会关闭（关闭逻辑在 overlay click 里），这里直接忽略。
    const handleActivity = () => {
      if (this.overlayEl) {
        return;
      }
      scheduleIdle();
    };

    this.hostActivityHandler = handleActivity;
    ACTIVITY_EVENTS.forEach((evt) => {
      this.ctx.host.addEventListener(evt, handleActivity, { passive: true });
    });

    // 同时监听 document，Obsidian 的 Modal 浮在 body 上，用户在 Modal 内操作
    // 不会冒泡到 view 的 host，这里全局监听可确保 Modal 交互也刷新倒计时。
    this.documentActivityHandler = handleActivity;
    ACTIVITY_EVENTS.forEach((evt) => {
      document.addEventListener(evt, handleActivity, { passive: true });
    });

    this.visibilityHandler = () => {
      if (document.hidden) {
        this.show();
      } else if (!this.overlayEl) {
        scheduleIdle();
      }
    };
    document.addEventListener("visibilitychange", this.visibilityHandler);

    scheduleIdle();
  }

  /** Release timers, listeners and any currently-shown overlay. */
  teardown(): void {
    if (this.timer !== null) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.hostActivityHandler) {
      const host = this.ctx.host;
      const handler = this.hostActivityHandler as EventListener;
      ACTIVITY_EVENTS.forEach((evt) => {
        host.removeEventListener(evt, handler);
      });
      this.hostActivityHandler = null;
    }
    if (this.documentActivityHandler) {
      const handler = this.documentActivityHandler as EventListener;
      ACTIVITY_EVENTS.forEach((evt) => {
        document.removeEventListener(evt, handler);
      });
      this.documentActivityHandler = null;
    }
    if (this.visibilityHandler) {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
      this.visibilityHandler = null;
    }
    this.hide();
  }

  /** Obsidian 的所有 Modal 都会在 body 下挂 .modal-container 节点。 */
  private isAnyModalOpen(): boolean {
    return !!document.body.querySelector(".modal-container");
  }

  private show(): void {
    if (this.overlayEl) {
      return;
    }

    // 有弹窗打开时不锁定，等弹窗关闭后再重新排队
    if (this.isAnyModalOpen()) {
      if (this.timer !== null) {
        window.clearTimeout(this.timer);
      }
      const timeoutMs = Math.max(5, this.ctx.plugin.settings.idleWatermarkTimeoutSec) * 1000;
      this.timer = window.setTimeout(() => {
        this.show();
      }, timeoutMs);
      return;
    }

    const host = this.ctx.host;
    const overlay = host.createDiv();
    overlay.style.position = "absolute";
    overlay.style.inset = "0";
    overlay.style.zIndex = "50";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.background = "var(--background-primary)";
    overlay.style.cursor = "pointer";
    overlay.style.userSelect = "none";

    // 仅 click 关闭；鼠标移动/滚轮/滚动不关闭
    overlay.addEventListener("click", () => {
      this.hide();
      if (this.timer !== null) {
        window.clearTimeout(this.timer);
      }
      const timeoutMs = Math.max(5, this.ctx.plugin.settings.idleWatermarkTimeoutSec) * 1000;
      this.timer = window.setTimeout(() => {
        this.show();
      }, timeoutMs);
    });
    // 阻止滚动 / 鼠标移动穿透触发 activity 事件
    overlay.addEventListener("wheel", (e) => e.stopPropagation(), { passive: true });
    overlay.addEventListener("mousemove", (e) => e.stopPropagation());

    this.renderWatermarkSymbol(overlay);

    this.overlayEl = overlay;
  }

  private renderWatermarkSymbol(overlay: HTMLElement): void {
    const page = this.ctx.getCurrentPage();

    // 根据当前页面决定水印内容，图标与底部导航按钮一一对应
    if (page === "home") {
      // 主页：ObsiWealth 字母（缩小尺寸避免横向溢出）
      const wm = overlay.createDiv({ text: "ObsiWealth" });
      wm.style.fontSize = "min(9vw, 14vh)";
      wm.style.fontWeight = "950";
      wm.style.color = "var(--text-muted)";
      wm.style.opacity = "0.14";
      wm.style.lineHeight = "1";
      wm.style.letterSpacing = "-0.03em";
      wm.style.pointerEvents = "none";
      wm.style.fontFamily = "Georgia, 'Times New Roman', serif";
      wm.style.whiteSpace = "nowrap";
      wm.style.maxWidth = "92vw";
      return;
    }

    if (page === "wishlist") {
      this.renderWatermarkSvg(overlay, "heart");
      return;
    }
    if (page === "assets") {
      this.renderWatermarkSvg(overlay, "assets");
      return;
    }
    if (page === "assetStats") {
      this.renderWatermarkSvg(overlay, "chart");
      return;
    }
    // 资金：美元圆圈（对应导航 funds）
    this.renderWatermarkSvg(overlay, "funds");
  }

  private renderWatermarkSvg(overlay: HTMLElement, iconName: string): void {
    const wrap = overlay.createDiv();
    wrap.style.width = "min(60vw, 60vh)";
    wrap.style.height = "min(60vw, 60vh)";
    wrap.style.opacity = "0.16";
    wrap.style.color = "var(--text-muted)";
    wrap.style.pointerEvents = "none";
    wrap.style.display = "flex";
    wrap.style.alignItems = "center";
    wrap.style.justifyContent = "center";
    const svg = this.ctx.createNavIcon(iconName, 600);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("stroke-width", "1.2");
    wrap.appendChild(svg);
  }

  private hide(): void {
    if (this.overlayEl) {
      this.overlayEl.remove();
      this.overlayEl = null;
    }
  }
}
