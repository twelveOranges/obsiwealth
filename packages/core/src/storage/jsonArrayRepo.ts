import type { KVStore } from "./kvStore";
import type { Notifier } from "./notifier";
import { yamlParse, yamlStringify } from "./yaml";

/**
 * Generic array repository backed by a {@link KVStore}.
 *
 * Responsibilities:
 * - Lazy load a YAML array file into memory (`items`).
 * - Persist it back as YAML, auto-creating the parent directory.
 * - Standard CRUD helpers with identity based on a user-provided `getId`.
 * - Optional `onLoad` hook (e.g. data-self-heal for fund history) that may
 *   request an immediate save when it mutates the items.
 *
 * The class name stays `JsonArrayRepository` for historical reasons
 * (changing it would touch many call sites); the on-disk format is YAML.
 *
 * Kept intentionally tiny: UI refresh is *not* this module's concern.
 * Callers wire `afterChange` to their own refresh pipeline.
 */
export interface JsonArrayRepositoryOptions<T> {
  store: KVStore;
  /** Storage-relative path to the data file (YAML). */
  path: string;
  /** Identity accessor used by update/delete. */
  getId: (item: T) => string;
  /** Human-readable name used in fallback notices. */
  label: string;
  /** Optional: platform-specific way to surface error toasts. */
  notifier?: Notifier;
  /**
   * Optional post-load hook. Return a possibly mutated array plus a flag
   * indicating whether the file on disk should be rewritten.
   */
  onLoad?: (items: T[]) => { items: T[]; mutated: boolean };
  /** Called after every successful save (add/update/delete/replaceAll). */
  afterChange?: () => void | Promise<void>;
}

export class JsonArrayRepository<T> {
  items: T[] = [];

  constructor(private readonly options: JsonArrayRepositoryOptions<T>) {}

  private get store(): KVStore {
    return this.options.store;
  }

  async load(): Promise<void> {
    try {
      if (!(await this.store.exists(this.options.path))) {
        this.items = [];
        return;
      }

      const data = await this.store.read(this.options.path);
      const raw = decodeArray<T>(data);

      if (this.options.onLoad) {
        const { items, mutated } = this.options.onLoad(raw);
        this.items = items;
        if (mutated) {
          // best-effort save; if it fails we retain in-memory value and try again later.
          try {
            await this.save();
          } catch {
            /* ignored on purpose: next save will retry */
          }
        }
      } else {
        this.items = raw;
      }
    } catch {
      this.items = [];
      this.options.notifier?.notify(`${this.options.label}读取失败，已使用空列表`);
    }
  }

  async save(): Promise<void> {
    const dir = parentDir(this.options.path);
    if (dir && !(await this.store.exists(dir))) {
      await this.store.mkdir(dir);
    }

    await this.store.write(this.options.path, yamlStringify(this.items));
  }

  private async saveAndNotify(): Promise<void> {
    await this.save();
    if (this.options.afterChange) {
      await this.options.afterChange();
    }
  }

  async add(item: T): Promise<void> {
    this.items.push(item);
    await this.saveAndNotify();
  }

  async update(item: T): Promise<void> {
    const id = this.options.getId(item);
    const index = this.items.findIndex((current) => this.options.getId(current) === id);

    if (index === -1) {
      this.items.push(item);
    } else {
      this.items[index] = item;
    }

    await this.saveAndNotify();
  }

  async remove(id: string): Promise<void> {
    this.items = this.items.filter((item) => this.options.getId(item) !== id);
    await this.saveAndNotify();
  }

  async replaceAll(items: T[]): Promise<void> {
    this.items = items;
    await this.saveAndNotify();
  }
}

/**
 * Decode a YAML array from the raw file contents. Returns `[]` on empty /
 * non-array payloads so callers get a predictable empty state.
 */
function decodeArray<T>(source: string): T[] {
  const trimmed = (source ?? "").trim();
  if (trimmed === "") return [];
  const parsed = yamlParse(trimmed);
  return Array.isArray(parsed) ? (parsed as T[]) : [];
}

/** Extract the parent directory of a forward-slash path. Returns "" if none. */
function parentDir(p: string): string {
  const idx = p.lastIndexOf("/");
  return idx <= 0 ? "" : p.slice(0, idx);
}
