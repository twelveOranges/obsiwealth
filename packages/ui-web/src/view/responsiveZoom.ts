/**
 * Responsive page-level zoom controller — "virtual canvas" variant.
 *
 * The design goal (explicit user request):
 *   "Treat the page as if it always had at least the baseline width. When
 *    the real pane is narrower, visually shrink the whole thing — spacing,
 *    positions, font sizes, icons — all by the same factor."
 *
 * Implementation:
 *   1. Force `target.style.minWidth = baseline` so the content always lays
 *      itself out at the baseline width, regardless of the real pane size.
 *      This is what guarantees absolute-positioned badges, grid layouts,
 *      gap-based spacing, etc. stay geometrically correct — they think the
 *      pane is `baseline` wide.
 *   2. Apply `zoom = host.clientWidth / baseline` (clamped to ≤ 1 and
 *      ≥ minZoom) so the user *sees* a shrunk pane that fits the actual
 *      available space.
 *
 * When the pane is wider than the baseline, zoom stays at 1 and minWidth is
 * already below the real width — nothing visually changes versus before.
 *
 * The baseline is resolved lazily through `getBaseline()` so the controller
 * can re-evaluate it every frame (it depends on `ctx.cols` etc.).
 */
export class ResponsiveZoomController {
  private observer?: ResizeObserver;
  private scheduled = false;

  constructor(
    private readonly host: HTMLElement,
    private readonly target: HTMLElement,
    private readonly getBaseline: () => number,
    private readonly minZoom: number = 0.4,
  ) {}

  setup(): void {
    this.teardown();
    // 同步立刻执行一次 apply，让 minWidth/zoom 在任何 slotNumber 动画的 rAF
    // 之前就写完。如果用 rAF 延迟，ResizeObserver 的初始回调（observe 后异
    // 步发出）可能在 transition 播放的中途再触发一次 apply，写入的 style
    // 会让子树重新合成从而打断进行中的 transition —— 用户观感就是"前 80%
    // 丝滑，然后突然卡住、直接跳到终点"。
    this.apply();
    this.observer = new ResizeObserver(() => this.schedule());
    this.observer.observe(this.host);
  }

  teardown(): void {
    this.observer?.disconnect();
    this.observer = undefined;
    // Best-effort cleanup: reset styles we own so the target is clean when
    // the view tears down / rebuilds.
    const style = this.target.style as unknown as Record<string, string>;
    style.zoom = "";
    this.target.style.minWidth = "";
  }

  /** rAF-coalesced to avoid thrashing under rapid resize events. */
  private schedule(): void {
    if (this.scheduled) return;
    this.scheduled = true;
    requestAnimationFrame(() => {
      this.scheduled = false;
      this.apply();
    });
  }

  private apply(): void {
    const hostWidth = this.host.clientWidth;
    if (hostWidth <= 0) return;

    const baseline = Math.max(1, Math.round(this.getBaseline()));
    const style = this.target.style as unknown as Record<string, string>;

    // Force the page to always lay out at `baseline` wide. When the real
    // pane is wider, `minWidth` is simply below actual width and has no
    // effect. When the pane is narrower, this is what keeps the DOM
    // rendering as if it had more room.
    //
    // IMPORTANT: only write when the value truly changed. Otherwise
    // ResizeObserver's initial callback (fired asynchronously after
    // `observe()`) would re-assign the same minWidth/zoom during a running
    // slot-number transition and cause the compositor to re-rasterise the
    // sub-tree, snapping in-flight transitions to their target values.
    const nextMinWidth = `${baseline}px`;
    if (this.target.style.minWidth !== nextMinWidth) {
      this.target.style.minWidth = nextMinWidth;
    }

    let zoom = hostWidth / baseline;
    zoom = Math.max(this.minZoom, Math.min(1, zoom));
    const rounded = Math.round(zoom * 1000) / 1000;
    const nextZoom = String(rounded);
    if (style.zoom !== nextZoom) {
      style.zoom = nextZoom;
    }
  }
}
