/**
 * Host-agnostic bundle of platform services that UI code needs.
 *
 * A single instance is built once (usually at plugin/app boot) and threaded
 * through the view layer. This keeps UI code free from
 * `import { ... } from "obsidian"` or equivalent RN / miniapp imports.
 *
 * Extend this interface (and the concrete implementation in
 * `apps/<platform>/`) when a new platform capability is needed.
 */
import type { KVStore } from "./kvStore";
import type { Notifier } from "./notifier";
import type { ResourceResolver } from "./resourceResolver";
import type { ModalHost } from "../ui/modalHost";

export interface HostContext {
  store: KVStore;
  notifier: Notifier;
  resources: ResourceResolver;
  modals: ModalHost;
}
