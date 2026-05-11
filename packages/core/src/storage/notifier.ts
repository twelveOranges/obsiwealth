/**
 * Platform-neutral "show a transient message to the user" hook.
 *
 * Obsidian wraps `new Notice(...)`. RN can call a Toast library. WeChat's
 * miniapp uses `wx.showToast`. The core never imports any of these directly.
 */
export interface Notifier {
  notify(message: string): void;
}

/** No-op notifier, useful for tests or headless contexts. */
export const SILENT_NOTIFIER: Notifier = {
  notify() {
    /* intentionally blank */
  },
};
