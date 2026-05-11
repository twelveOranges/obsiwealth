/**
 * Platform-neutral "show a modal dialog" primitive.
 *
 * The caller provides a render function that receives an already-mounted
 * container element and a `close()` callback. The host is responsible for:
 *   - creating / styling the surrounding chrome (backdrop, animations…)
 *   - removing the container from the DOM when `close()` is invoked
 *
 * Obsidian host: wraps `new Modal(app)`; `onOpen` runs `render(contentEl, () => close())`.
 * Web host: injects a `<dialog>` with a backdrop; `close()` dismisses it.
 * RN host: mounts a full-screen modal component.
 * WeChat miniapp: navigates to a dedicated modal page.
 *
 * NOTE: today's Obsidian-native modals (`class X extends Modal`) are *not*
 * migrated to this interface yet. New cross-platform dialogs should start
 * here; existing ones will be rewritten incrementally.
 */
export interface ModalHandle {
  /** Dismiss the modal programmatically. Idempotent. */
  close(): void;
}

export interface ModalRenderFn {
  (container: HTMLElement, handle: ModalHandle): void | Promise<void>;
}

export interface ModalHost {
  /** Open a new modal, rendering its contents via `render`. */
  openModal(render: ModalRenderFn): ModalHandle;
}
