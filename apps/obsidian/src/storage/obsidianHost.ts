import type { App } from "obsidian";
import { Modal, Notice } from "obsidian";
import type {
  HostContext,
  KVStore,
  ModalHandle,
  ModalHost,
  ModalRenderFn,
  Notifier,
  ResourceResolver,
} from "@core";

/**
 * Obsidian-backed {@link KVStore} implementation.
 *
 * Thin adapter around `app.vault.adapter` – every method delegates 1:1.
 */
export class ObsidianKVStore implements KVStore {
  constructor(private readonly app: App) {}

  exists(path: string): Promise<boolean> {
    return this.app.vault.adapter.exists(path);
  }

  read(path: string): Promise<string> {
    return this.app.vault.adapter.read(path);
  }

  readBinary(path: string): Promise<ArrayBuffer> {
    return this.app.vault.adapter.readBinary(path);
  }

  write(path: string, data: string): Promise<void> {
    return this.app.vault.adapter.write(path, data);
  }

  writeBinary(path: string, data: ArrayBuffer): Promise<void> {
    return this.app.vault.adapter.writeBinary(path, data);
  }

  mkdir(path: string): Promise<void> {
    return this.app.vault.adapter.mkdir(path);
  }

  async list(path: string): Promise<{ files: string[]; folders: string[] }> {
    const exists = await this.app.vault.adapter.exists(path);
    if (!exists) return { files: [], folders: [] };
    // `adapter.list` is typed loosely in Obsidian; normalise it here.
    const res = (await (this.app.vault.adapter as unknown as {
      list(p: string): Promise<{ files: string[]; folders: string[] }>;
    }).list(path)) ?? { files: [], folders: [] };
    return { files: res.files ?? [], folders: res.folders ?? [] };
  }

  async remove(path: string): Promise<void> {
    try {
      if (await this.app.vault.adapter.exists(path)) {
        await this.app.vault.adapter.remove(path);
      }
    } catch {
      // swallow — caller only cares that the file is gone
    }
  }
}

/** Surfaces core-layer messages through Obsidian's toast-like `Notice`. */
export const OBSIDIAN_NOTIFIER: Notifier = {
  notify(message) {
    new Notice(message);
  },
};

/**
 * Obsidian-backed {@link ResourceResolver}.
 *
 * Delegates to `vault.adapter.getResourcePath`, which returns an `app://…`
 * URL usable inside the plugin's webview.
 */
export class ObsidianResourceResolver implements ResourceResolver {
  constructor(private readonly app: App) {}

  resolveUrl(path: string): string {
    return (this.app.vault.adapter as unknown as {
      getResourcePath(p: string): string;
    }).getResourcePath(path);
  }
}

/**
 * Obsidian-backed {@link ModalHost}.
 *
 * Each `openModal` call wraps a lightweight anonymous `Modal` subclass so
 * that callers don't have to know about the Obsidian UI framework. Existing
 * `class X extends Modal` dialogs are unaffected and will be migrated to the
 * generic host in a future pass.
 */
export class ObsidianModalHost implements ModalHost {
  constructor(private readonly app: App) {}

  openModal(render: ModalRenderFn): ModalHandle {
    const app = this.app;
    let modal: Modal;

    class AdHocModal extends Modal {
      constructor() {
        super(app);
      }
      onOpen(): void {
        this.contentEl.empty();
        // fire-and-forget – the render fn may be async but we don't await
        void render(this.contentEl, { close: () => this.close() });
      }
      onClose(): void {
        this.contentEl.empty();
      }
    }

    modal = new AdHocModal();
    modal.open();

    return { close: () => modal.close() };
  }
}

/** Build the full {@link HostContext} for the Obsidian plugin host. */
export function createObsidianHost(app: App): HostContext {
  return {
    store: new ObsidianKVStore(app),
    notifier: OBSIDIAN_NOTIFIER,
    resources: new ObsidianResourceResolver(app),
    modals: new ObsidianModalHost(app),
  };
}
