import { Setting } from "obsidian";
import { notify } from "@core";
import { host } from "@core/storage/hostRegistry";
import { DATA_DIR } from "@core/storage/paths";
import { tarDecode, tarEncode, type TarEntry } from "@core/storage/tar";
import type ObsiWealthPlugin from "../main";

/**
 * Renders the "数据备份" (data backup) section inside the settings tab.
 *
 * The entire `.obsiwealth/` directory (YAML data files + user-uploaded PNG
 * icons under `icons/`) is packaged as a single uncompressed `.tar` archive
 * so the user can back up and restore in one shot. Per-collection exports
 * were dropped on purpose — the directory is small and the one-file
 * workflow is what actually gets used.
 */
export function renderBackupSection(containerEl: HTMLElement, plugin: ObsiWealthPlugin): void {
  const desc = containerEl.createEl("p", {
    text: "将整个 .obsiwealth 目录（资金 / 资产 / 心愿 / 设置 / 图片）打包为 tar 备份；导入会用 tar 内容完全替换当前目录，请谨慎操作",
  });
  desc.style.fontSize = "13px";
  desc.style.color = "var(--text-muted)";
  desc.style.margin = "4px 0 12px";

  const setting = new Setting(containerEl)
    .setName("全部数据")
    .setDesc("导出 / 导入 .obsiwealth 目录的 tar 备份包");

  setting.addButton((button) => {
    button.setButtonText("导出");
    button.onClick(() => exportBackup(plugin));
  });

  setting.addButton((button) => {
    button.setButtonText("导入");
    button.onClick(() => importBackup(plugin));
  });
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

async function exportBackup(plugin: ObsiWealthPlugin): Promise<void> {
  try {
    // Make sure every in-memory change is on disk before packing.
    await Promise.all([plugin.saveFunds(), plugin.saveAssets(), plugin.saveWishlist()]);

    const entries = await collectEntries(DATA_DIR);
    if (entries.length === 0) {
      notify("未找到可备份的数据");
      return;
    }

    const buffer = tarEncode(entries);
    const fileName = buildBackupFileName();
    triggerDownload(fileName, buffer);
    notify(`已导出：${fileName}`);
  } catch (err) {
    console.error(err);
    notify("导出失败");
  }
}

/** Recursively walk a vault directory and emit tar entries in stable order. */
async function collectEntries(root: string): Promise<TarEntry[]> {
  const store = host().store;
  const entries: TarEntry[] = [];

  const walk = async (dir: string): Promise<void> => {
    const { files, folders } = await store.list(dir);
    // Normalise paths to forward-slash, strip the leading `.obsiwealth/` so
    // the archive extracts as its own directory regardless of where the
    // user un-tars it.
    const filesSorted = [...files].sort();
    const foldersSorted = [...folders].sort();

    // Emit a directory marker for `dir` itself (skip the absolute root — it
    // becomes the implicit archive root).
    if (dir !== root) {
      entries.push({ name: toArchivePath(dir, root, "dir"), type: "dir" });
    }

    for (const file of filesSorted) {
      const buf = await store.readBinary(file);
      entries.push({
        name: toArchivePath(file, root, "file"),
        type: "file",
        data: new Uint8Array(buf),
      });
    }

    for (const sub of foldersSorted) {
      await walk(sub);
    }
  };

  await walk(root);
  return entries;
}

function toArchivePath(vaultPath: string, root: string, type: "file" | "dir"): string {
  const rel = vaultPath.startsWith(`${root}/`)
    ? vaultPath.slice(root.length + 1)
    : vaultPath === root
      ? ""
      : vaultPath;
  const base = `obsiwealth/${rel}`.replace(/\\/g, "/").replace(/\/+$/, "");
  return type === "dir" ? `${base}/` : base;
}

function buildBackupFileName(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
  return `obsiwealth-backup-${stamp}.tar`;
}

function triggerDownload(fileName: string, bytes: Uint8Array): void {
  // Wrap into a fresh ArrayBuffer so Blob doesn't keep a reference to our
  // larger parent buffer (also side-steps a TS typing quirk where Uint8Array
  // isn't assignable to BlobPart in some lib configs).
  const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const blob = new Blob([ab], { type: "application/x-tar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

async function importBackup(plugin: ObsiWealthPlugin): Promise<void> {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".tar,application/x-tar,application/octet-stream";
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const entries = tarDecode(buffer);
      const payload = stripArchiveRoot(entries);
      if (payload.length === 0) {
        notify("导入失败：tar 包内容为空");
        return;
      }
      if (!confirm("确定用该 tar 包完全替换当前 .obsiwealth 目录？此操作不可撤销")) {
        return;
      }
      await applyBackup(plugin, payload);
      notify(`已导入 ${payload.filter((e) => e.type === "file").length} 个文件`);
    } catch (err) {
      console.error(err);
      notify("导入失败：无法解析 tar 包");
    }
  };
  input.click();
}

/**
 * Drop the leading `obsiwealth/` segment that `exportBackup` added so the
 * on-disk paths line up with {@link DATA_DIR}. Also tolerates archives that
 * were produced without the wrapper directory.
 */
function stripArchiveRoot(entries: TarEntry[]): TarEntry[] {
  const stripped: TarEntry[] = [];
  for (const entry of entries) {
    const name = entry.name.replace(/^\.?\/+/, "");
    const withoutRoot = name.replace(/^obsiwealth\//, "");
    if (!withoutRoot || withoutRoot === "/") continue;
    stripped.push({ ...entry, name: withoutRoot });
  }
  return stripped;
}

async function applyBackup(plugin: ObsiWealthPlugin, entries: TarEntry[]): Promise<void> {
  const store = host().store;

  // 1. Wipe the target directory so the restore is a strict mirror.
  await wipeDirectory(DATA_DIR);

  // 2. Recreate directory structure first so writeBinary can succeed on hosts
  //    that don't auto-create parents for binary writes.
  await store.mkdir(DATA_DIR);
  const dirs = new Set<string>();
  for (const entry of entries) {
    if (entry.type === "dir") dirs.add(entry.name.replace(/\/+$/, ""));
    const parent = parentOf(entry.name);
    if (parent) dirs.add(parent);
  }
  // Sort so parents are created before children.
  const orderedDirs = [...dirs].filter(Boolean).sort((a, b) => a.length - b.length);
  for (const dir of orderedDirs) {
    await store.mkdir(`${DATA_DIR}/${dir}`);
  }

  // 3. Write every file from the tar.
  for (const entry of entries) {
    if (entry.type !== "file" || !entry.data) continue;
    const target = `${DATA_DIR}/${entry.name}`;
    if (isTextPath(entry.name)) {
      await store.write(target, bytesToUtf8(entry.data));
    } else {
      await store.writeBinary(target, toFreshArrayBuffer(entry.data));
    }
  }

  // 4. Reload repositories and refresh the UI.
  await plugin.loadFunds();
  await plugin.loadAssets();
  await plugin.loadWishlist();
  await plugin.loadSettings();
  plugin.refreshViews();
}

async function wipeDirectory(dir: string): Promise<void> {
  const store = host().store;
  if (!(await store.exists(dir))) return;
  const { files, folders } = await store.list(dir);
  for (const file of files) {
    await store.remove(file);
  }
  for (const sub of folders) {
    await wipeDirectory(sub);
    // list() returned the folder; there's no generic rmdir in our KVStore
    // interface, and leaving the empty shell behind is harmless — the
    // import will re-create / reuse it.
  }
}

function parentOf(path: string): string | null {
  const idx = path.lastIndexOf("/");
  return idx <= 0 ? null : path.slice(0, idx);
}

function isTextPath(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.endsWith(".yaml") || lower.endsWith(".yml") || lower.endsWith(".json") || lower.endsWith(".md") || lower.endsWith(".txt");
}

function bytesToUtf8(bytes: Uint8Array): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const TD: any = (globalThis as any).TextDecoder;
  if (TD) return new TD("utf-8").decode(bytes);
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += String.fromCharCode(bytes[i]);
  return out;
}

function toFreshArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}
