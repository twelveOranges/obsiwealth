/**
 * Minimal, dependency-free USTAR (POSIX.1-1988) tar encoder / decoder.
 *
 * We intentionally cover only what's needed to roundtrip the `.obsiwealth/`
 * directory: regular files (typeflag `0`) and directories (typeflag `5`).
 * No compression, no long-name extensions, no symlinks — our paths are
 * short and the feature set stays tiny enough to audit at a glance.
 *
 * Record layout (512 bytes, big-endian textual fields):
 *
 *   offset  size  field
 *    0      100   name
 *    100      8   mode         ("0000644\0")
 *    108      8   uid
 *    116      8   gid
 *    124     12   size         (octal, NUL-terminated)
 *    136     12   mtime        (octal seconds since epoch)
 *    148      8   checksum     (six octal digits + NUL + space)
 *    156      1   typeflag     ('0' file, '5' dir)
 *    157    100   linkname
 *    257      6   magic        ("ustar\0")
 *    263      2   version      ("00")
 *    265     32   uname
 *    297     32   gname
 *    329      8   devmajor
 *    337      8   devminor
 *    345    155   prefix
 *    500     12   pad
 *
 * The archive ends with two all-zero 512-byte blocks.
 */

const BLOCK = 512;

export interface TarEntry {
  /** Path inside the archive, forward-slash separated. */
  name: string;
  /** `file` (regular) or `dir` (directory marker, no body). */
  type: "file" | "dir";
  /** File body for `file` entries; ignored for `dir`. */
  data?: Uint8Array;
}

// ---------------------------------------------------------------------------
// Encoder
// ---------------------------------------------------------------------------

export function tarEncode(entries: TarEntry[]): Uint8Array {
  // Sum up total byte length up front so we can allocate once.
  let total = 0;
  for (const entry of entries) {
    total += BLOCK; // header
    if (entry.type === "file" && entry.data) {
      total += roundUpToBlock(entry.data.byteLength);
    }
  }
  total += BLOCK * 2; // two trailing zero blocks

  const out = new Uint8Array(total);
  let cursor = 0;
  const now = Math.floor(Date.now() / 1000);

  for (const entry of entries) {
    writeHeader(out, cursor, entry, now);
    cursor += BLOCK;
    if (entry.type === "file" && entry.data && entry.data.byteLength > 0) {
      out.set(entry.data, cursor);
      cursor += roundUpToBlock(entry.data.byteLength);
    }
  }
  // trailing zero blocks are already zero-initialised
  return out;
}

function writeHeader(out: Uint8Array, offset: number, entry: TarEntry, mtime: number): void {
  const name = normaliseName(entry.name, entry.type);
  if (encodeUtf8(name).byteLength > 100) {
    // USTAR splits into (prefix, name) when > 100 bytes. Our paths are tiny
    // (`.obsiwealth/icons/<hash>.png`) so this branch is defensive only.
    throw new Error(`tar: path too long for USTAR basic header: ${name}`);
  }

  writeString(out, offset + 0, name, 100);
  writeOctal(out, offset + 100, entry.type === "dir" ? 0o755 : 0o644, 8);
  writeOctal(out, offset + 108, 0, 8); // uid
  writeOctal(out, offset + 116, 0, 8); // gid
  writeOctal(out, offset + 124, entry.type === "file" ? entry.data?.byteLength ?? 0 : 0, 12);
  writeOctal(out, offset + 136, mtime, 12);

  // Checksum field is first filled with spaces while computing, then replaced.
  for (let i = 0; i < 8; i++) out[offset + 148 + i] = 0x20;

  out[offset + 156] = entry.type === "dir" ? 0x35 /* '5' */ : 0x30 /* '0' */;

  writeString(out, offset + 257, "ustar", 6);
  writeString(out, offset + 263, "00", 2);

  let sum = 0;
  for (let i = 0; i < BLOCK; i++) sum += out[offset + i];
  // Format: 6 octal digits, NUL, space — as per POSIX.1-1988.
  const chksum = sum.toString(8).padStart(6, "0");
  for (let i = 0; i < 6; i++) out[offset + 148 + i] = chksum.charCodeAt(i);
  out[offset + 148 + 6] = 0;
  out[offset + 148 + 7] = 0x20;
}

function normaliseName(name: string, type: "file" | "dir"): string {
  let clean = name.replace(/\\/g, "/").replace(/^\/+/, "");
  if (type === "dir" && !clean.endsWith("/")) clean += "/";
  return clean;
}

function writeString(out: Uint8Array, offset: number, value: string, field: number): void {
  const bytes = encodeUtf8(value);
  const limit = Math.min(bytes.byteLength, field);
  for (let i = 0; i < limit; i++) out[offset + i] = bytes[i];
  // remainder stays zero — USTAR expects NUL padding
}

function writeOctal(out: Uint8Array, offset: number, value: number, field: number): void {
  // USTAR convention: N-1 octal digits, zero-padded, then NUL.
  const str = Math.floor(value).toString(8).padStart(field - 1, "0");
  for (let i = 0; i < field - 1; i++) out[offset + i] = str.charCodeAt(i);
  out[offset + field - 1] = 0;
}

function roundUpToBlock(bytes: number): number {
  return Math.ceil(bytes / BLOCK) * BLOCK;
}

// ---------------------------------------------------------------------------
// Decoder
// ---------------------------------------------------------------------------

export function tarDecode(buffer: ArrayBuffer): TarEntry[] {
  const bytes = new Uint8Array(buffer);
  const out: TarEntry[] = [];

  let cursor = 0;
  while (cursor + BLOCK <= bytes.byteLength) {
    // An all-zero header marks the end of archive.
    if (isZeroBlock(bytes, cursor)) break;

    const name = readString(bytes, cursor + 0, 100);
    const prefix = readString(bytes, cursor + 345, 155);
    const size = readOctal(bytes, cursor + 124, 12);
    const typeflag = bytes[cursor + 156];

    const fullName = prefix ? `${prefix}/${name}` : name;
    cursor += BLOCK;

    if (typeflag === 0x35 /* '5' */) {
      out.push({ name: fullName.replace(/\/+$/, ""), type: "dir" });
    } else if (typeflag === 0x30 /* '0' */ || typeflag === 0 /* legacy: 0x00 */) {
      const data = bytes.slice(cursor, cursor + size);
      out.push({ name: fullName, type: "file", data });
    }
    // Other typeflags (symlinks, long names, …) are skipped but we still
    // advance the cursor by the reported body size so we don't desync.

    cursor += roundUpToBlock(size);
  }

  return out;
}

function isZeroBlock(bytes: Uint8Array, offset: number): boolean {
  for (let i = 0; i < BLOCK; i++) {
    if (bytes[offset + i] !== 0) return false;
  }
  return true;
}

function readString(bytes: Uint8Array, offset: number, field: number): string {
  let end = offset;
  const limit = offset + field;
  while (end < limit && bytes[end] !== 0) end++;
  return decodeUtf8(bytes.subarray(offset, end));
}

function readOctal(bytes: Uint8Array, offset: number, field: number): number {
  const str = readString(bytes, offset, field).trim();
  if (!str) return 0;
  const n = parseInt(str, 8);
  return Number.isFinite(n) ? n : 0;
}

// ---------------------------------------------------------------------------
// UTF-8 helpers (avoid pulling in TextEncoder types for the core package)
// ---------------------------------------------------------------------------

function encodeUtf8(value: string): Uint8Array {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const TE: any = (globalThis as any).TextEncoder;
  if (TE) return new TE().encode(value);
  // Fallback: naive ASCII-only (our paths stay inside `.obsiwealth/…`).
  const out = new Uint8Array(value.length);
  for (let i = 0; i < value.length; i++) out[i] = value.charCodeAt(i) & 0xff;
  return out;
}

function decodeUtf8(bytes: Uint8Array): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const TD: any = (globalThis as any).TextDecoder;
  if (TD) return new TD("utf-8").decode(bytes);
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += String.fromCharCode(bytes[i]);
  return out;
}
