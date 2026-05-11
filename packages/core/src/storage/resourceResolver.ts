/**
 * Platform-neutral bridge for turning a storage path into a URL that can be
 * fed directly into `<img src="...">`, `<link href="...">` etc.
 *
 * - Obsidian: `app.vault.adapter.getResourcePath(path)`.
 * - Web / RN: may prefix a static asset host, or return a `blob:` URL.
 * - WeChat miniapp: may return a `wxfile://` URL.
 *
 * The path must resolve to an asset that already exists in the underlying
 * {@link KVStore}; implementations do not need to perform an existence check
 * (the caller is expected to have verified it or to gracefully tolerate a
 * broken URL).
 */
export interface ResourceResolver {
  /**
   * Turn a storage-relative path into a URL that the host's HTML rendering
   * layer can consume.
   */
  resolveUrl(path: string): string;
}
