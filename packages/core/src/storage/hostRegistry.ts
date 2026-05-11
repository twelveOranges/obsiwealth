import type { HostContext } from "./hostContext";

/**
 * Ambient singleton access to the current {@link HostContext}.
 *
 * Motivation: threading a `host` argument through every UI helper / modal
 * would require touching dozens of files and constructors. Instead, the host
 * shell (Obsidian plugin, RN app, miniapp, …) calls {@link setHost} once at
 * bootstrap and UI code retrieves it on demand via {@link host}.
 *
 * Tests can call {@link setHost} with a fake implementation.
 */
let currentHost: HostContext | null = null;

export function setHost(next: HostContext): void {
  currentHost = next;
}

/**
 * Returns the current host. Throws if called before {@link setHost}; this
 * almost always indicates a bootstrap ordering bug and is worth surfacing
 * loudly rather than silently returning a no-op stub.
 */
export function host(): HostContext {
  if (!currentHost) {
    throw new Error(
      "[obsiwealth/core] HostContext not initialised – call setHost(...) during bootstrap.",
    );
  }
  return currentHost;
}

/**
 * Convenience shim: equivalent to `host().notifier.notify(msg)` but short
 * enough to drop-in-replace `new Notice(msg)` call sites.
 */
export function notify(message: string): void {
  host().notifier.notify(message);
}
