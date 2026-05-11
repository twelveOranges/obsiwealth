/**
 * Minimal key-value / blob storage abstraction used by the core layer.
 *
 * It models just the four operations we currently need against a hierarchical
 * string-keyed blob store (file path → serialized JSON). Concrete platforms
 * supply their own implementation:
 *
 *   - Obsidian: wraps `app.vault.adapter`.
 *   - React-Native / Capacitor: wraps the filesystem plugin.
 *   - WeChat miniapp: wraps `wx.getFileSystemManager()`.
 *   - Tests: in-memory map.
 *
 * Paths are opaque strings whose shape the store itself defines; the core
 * passes them through unchanged from {@link ./paths}.
 */
export interface KVStore {
  exists(path: string): Promise<boolean>;
  read(path: string): Promise<string>;
  /** Read raw bytes (binary assets such as user PNG icons). */
  readBinary(path: string): Promise<ArrayBuffer>;
  write(path: string, data: string): Promise<void>;
  /**
   * Write raw bytes (used for binary assets such as user-uploaded PNG icons).
   * Implementations should create missing parent directories as needed.
   */
  writeBinary(path: string, data: ArrayBuffer): Promise<void>;
  /** Create a directory (and any missing parents). No-op if it already exists. */
  mkdir(path: string): Promise<void>;
  /** List direct children of a directory. */
  list(path: string): Promise<{ files: string[]; folders: string[] }>;
  /** Remove a file. Missing path is a no-op. */
  remove(path: string): Promise<void>;
}
