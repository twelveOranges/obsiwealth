import type { AppModel } from "@ui/host/appModel";
import type { FundItem } from "@core/types";

/**
 * Persist a reordering of `funds` inside `plugin.funds[]`.
 *
 * The visible list is a sub-slice of the global `plugin.funds` array (filtered
 * by category). We reorder by:
 *   1. Treating the visible `orderedIds` as the new order for those items.
 *   2. Leaving every non-visible item in its original global position.
 *
 * This way, users can drag items within a category without disturbing items
 * in other categories.
 */
export async function persistFundReorder(
  plugin: AppModel,
  orderedIds: string[],
): Promise<void> {
  const idSet = new Set(orderedIds);
  const remaining = [...orderedIds];

  const next: FundItem[] = [];
  for (const fund of plugin.funds) {
    if (idSet.has(fund.id)) {
      const nextId = remaining.shift();
      if (!nextId) continue;
      const picked = plugin.funds.find((f) => f.id === nextId);
      if (picked) next.push(picked);
    } else {
      next.push(fund);
    }
  }

  plugin.funds = next;
  await plugin.saveFunds();
}

/**
 * Attach "long-press to drag" behaviour to a row that is part of a vertical
 * list. `ownerOrderedIds` is the current visible order of the list; it is
 * treated as the source of truth and will be mutated on drop.
 *
 * Visuals: we keep the DOM untouched while dragging – only a floating ghost
 * follows the pointer, and the drop position is hinted by a horizontal
 * indicator line inserted between real rows.
 */
export interface DragRowOptions {
  row: HTMLElement;
  list: HTMLElement;
  fundId: string;
  ownerOrderedIds: string[];
  longPressMs?: number;
  /** Called after the order changes; should persist + re-render. */
  onReorder: (nextOrderedIds: string[]) => void;
}

const LONG_PRESS_MS_DEFAULT = 250;

export function attachLongPressDrag(opts: DragRowOptions): void {
  const longPressMs = opts.longPressMs ?? LONG_PRESS_MS_DEFAULT;
  const { row, list, fundId, ownerOrderedIds, onReorder } = opts;

  let pressTimer: number | null = null;
  let dragging = false;
  let ghost: HTMLElement | null = null;
  let indicator: HTMLElement | null = null;
  let dropIndex: number | null = null;
  let startX = 0;
  let startY = 0;

  const cleanup = () => {
    if (pressTimer !== null) {
      window.clearTimeout(pressTimer);
      pressTimer = null;
    }
    if (ghost) {
      ghost.remove();
      ghost = null;
    }
    if (indicator) {
      indicator.remove();
      indicator = null;
    }
    row.style.opacity = "";
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
    dragging = false;
    dropIndex = null;
  };

  const beginDrag = (clientX: number, clientY: number) => {
    dragging = true;
    row.style.opacity = "0.35";
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";

    // Floating ghost
    ghost = document.body.createDiv();
    ghost.style.position = "fixed";
    ghost.style.pointerEvents = "none";
    ghost.style.zIndex = "9999";
    ghost.style.background = "var(--background-secondary)";
    ghost.style.border = "1px solid var(--background-modifier-border)";
    ghost.style.borderRadius = "10px";
    ghost.style.padding = "8px 12px";
    ghost.style.boxShadow = "0 8px 24px rgba(0,0,0,0.25)";
    ghost.style.fontSize = "14px";
    ghost.style.fontWeight = "800";
    ghost.style.color = "var(--text-normal)";
    ghost.style.minWidth = "160px";
    ghost.innerText = row.innerText.trim().split("\n")[0] || "拖拽中";
    positionGhost(clientX, clientY);

    // Drop indicator (a thin accent-coloured bar)
    indicator = document.createElement("div");
    indicator.style.height = "3px";
    indicator.style.background = "var(--interactive-accent)";
    indicator.style.borderRadius = "2px";
    indicator.style.margin = "0";
    indicator.style.pointerEvents = "none";

    updateDropTarget(clientY);
  };

  const positionGhost = (clientX: number, clientY: number) => {
    if (!ghost) return;
    ghost.style.left = `${clientX + 12}px`;
    ghost.style.top = `${clientY + 12}px`;
  };

  const rowsFromList = (): HTMLElement[] => {
    const children: HTMLElement[] = [];
    for (let i = 0; i < list.children.length; i++) {
      const el = list.children[i];
      if (el instanceof HTMLElement && el !== indicator) {
        children.push(el);
      }
    }
    return children;
  };

  const updateDropTarget = (clientY: number) => {
    if (!indicator) return;
    const rows = rowsFromList();
    let newIndex = rows.length; // default: drop at end

    for (let i = 0; i < rows.length; i++) {
      const rect = rows[i].getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) {
        newIndex = i;
        break;
      }
    }
    dropIndex = newIndex;

    // Position indicator between rows
    if (newIndex >= rows.length) {
      list.appendChild(indicator);
    } else {
      list.insertBefore(indicator, rows[newIndex]);
    }
  };

  const onMove = (ev: PointerEvent) => {
    if (!dragging) {
      // Not yet dragging: cancel long-press if finger/mouse moved too much.
      const dx = Math.abs(ev.clientX - startX);
      const dy = Math.abs(ev.clientY - startY);
      if (dx > 6 || dy > 6) {
        cleanup();
      }
      return;
    }
    ev.preventDefault();
    positionGhost(ev.clientX, ev.clientY);
    updateDropTarget(ev.clientY);
  };

  const onUp = () => {
    if (!dragging) {
      cleanup();
      return;
    }
    const targetIndex = dropIndex;
    const sourceIndex = ownerOrderedIds.indexOf(fundId);

    cleanup();

    // A real drag just ended – swallow the synthetic `click` that fires
    // on pointerup so the row's own onclick doesn't open a detail modal.
    const swallow = (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      row.removeEventListener("click", swallow, true);
    };
    row.addEventListener("click", swallow, true);
    window.setTimeout(() => row.removeEventListener("click", swallow, true), 50);

    if (sourceIndex < 0 || targetIndex === null) return;

    // Compute the new ordered id list.
    const next = [...ownerOrderedIds];
    const [moved] = next.splice(sourceIndex, 1);
    // Because we removed one before the target position, shift down.
    const insertAt = targetIndex > sourceIndex ? targetIndex - 1 : targetIndex;
    next.splice(insertAt, 0, moved);

    if (next.join("|") !== ownerOrderedIds.join("|")) {
      onReorder(next);
    }
  };

  row.addEventListener("pointerdown", (ev) => {
    // Only main button
    if (ev.button !== 0) return;
    startX = ev.clientX;
    startY = ev.clientY;

    pressTimer = window.setTimeout(() => {
      pressTimer = null;
      beginDrag(ev.clientX, ev.clientY);
    }, longPressMs);

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  });
}
