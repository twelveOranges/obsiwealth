/**
 * Minimal YAML codec tailored to this project's "JSON shape" data:
 * objects / arrays / strings / numbers / booleans / null.
 *
 * We intentionally avoid a full YAML implementation (js-yaml is ~80KB gz)
 * because:
 *   1. All persisted data comes from plain JS objects that round-trip
 *      through `JSON.stringify` today — no Dates / Regex / functions /
 *      anchors / multi-doc / tags to worry about.
 *   2. The primary reason to switch from JSON is *readability for humans
 *      editing the file*, so we want full control over the indentation
 *      and quoting style anyway.
 *
 * Public surface: {@link yamlStringify} and {@link yamlParse}.
 * Everything else is implementation detail.
 */

type JsonLike =
  | string
  | number
  | boolean
  | null
  | undefined
  | JsonLike[]
  | { [key: string]: JsonLike };

// ---------------------------------------------------------------------------
// stringify
// ---------------------------------------------------------------------------

export function yamlStringify(value: unknown): string {
  const root = normalise(value);
  const lines: string[] = [];
  emit(root, 0, lines);
  return lines.join("\n") + "\n";
}

/** Drop `undefined` the same way JSON.stringify does — never emit it. */
function normalise(value: unknown): JsonLike {
  if (value === undefined || value === null) return null;
  if (Array.isArray(value)) {
    return value.map((item) => (item === undefined ? null : normalise(item))) as JsonLike;
  }
  if (typeof value === "object") {
    const out: { [key: string]: JsonLike } = {};
    for (const [k, v] of objectEntries(value as { [k: string]: unknown })) {
      if (v === undefined) continue;
      out[k] = normalise(v);
    }
    return out;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  return value as JsonLike;
}

function emit(value: JsonLike, indent: number, out: string[]): void {
  const pad = "  ".repeat(indent);

  if (isScalar(value)) {
    out.push(scalarToken(value));
    return;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      out.push("[]");
      return;
    }
    for (const item of value) {
      if (isScalar(item)) {
        out.push(`${pad}- ${scalarToken(item)}`);
      } else if (Array.isArray(item)) {
        if (item.length === 0) {
          out.push(`${pad}- []`);
        } else {
          out.push(`${pad}-`);
          emit(item, indent + 1, out);
        }
      } else {
        emitObjectItem(item as { [k: string]: JsonLike }, indent, out);
      }
    }
    return;
  }

  // Plain object
  const entries = objectEntries(value as { [k: string]: JsonLike });
  if (entries.length === 0) {
    out.push("{}");
    return;
  }
  for (const [k, v] of entries) {
    emitMappingEntry(k, v, indent, out);
  }
}

function emitMappingEntry(
  key: string,
  value: JsonLike,
  indent: number,
  out: string[],
): void {
  const pad = "  ".repeat(indent);
  const keyTok = encodeKey(key);

  if (isScalar(value)) {
    out.push(`${pad}${keyTok}: ${scalarToken(value)}`);
  } else if (Array.isArray(value)) {
    if (value.length === 0) {
      out.push(`${pad}${keyTok}: []`);
    } else {
      out.push(`${pad}${keyTok}:`);
      emit(value, indent + 1, out);
    }
  } else {
    if (Object.keys(value as object).length === 0) {
      out.push(`${pad}${keyTok}: {}`);
    } else {
      out.push(`${pad}${keyTok}:`);
      emit(value, indent + 1, out);
    }
  }
}

/** Sequence item that is itself an object: emit first key inline with the dash. */
function emitObjectItem(obj: { [k: string]: JsonLike }, indent: number, out: string[]): void {
  const pad = "  ".repeat(indent);
  const entries = objectEntries(obj);
  if (entries.length === 0) {
    out.push(`${pad}- {}`);
    return;
  }

  const [firstKey, firstValue] = entries[0];
  const keyTok = encodeKey(firstKey);

  if (isScalar(firstValue)) {
    out.push(`${pad}- ${keyTok}: ${scalarToken(firstValue)}`);
  } else if (Array.isArray(firstValue)) {
    if (firstValue.length === 0) {
      out.push(`${pad}- ${keyTok}: []`);
    } else {
      out.push(`${pad}- ${keyTok}:`);
      emit(firstValue, indent + 2, out);
    }
  } else {
    if (Object.keys(firstValue as object).length === 0) {
      out.push(`${pad}- ${keyTok}: {}`);
    } else {
      out.push(`${pad}- ${keyTok}:`);
      emit(firstValue, indent + 2, out);
    }
  }

  // Remaining keys align with the first key (one level deeper than the dash).
  for (let i = 1; i < entries.length; i++) {
    const [k, v] = entries[i];
    emitMappingEntry(k, v, indent + 1, out);
  }
}

function isScalar(v: JsonLike): boolean {
  return (
    v === null
    || typeof v === "string"
    || typeof v === "number"
    || typeof v === "boolean"
  );
}

function scalarToken(v: JsonLike): string {
  if (v === null) return "null";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return String(v);
  return encodeString(v as string);
}

/**
 * Encode a string as a YAML scalar. Prefer bare strings when unambiguous,
 * otherwise fall back to double-quoted with JS-compatible escapes so
 * {@link yamlParse} can reverse them.
 */
function encodeString(s: string): string {
  if (s === "") return `""`;

  const lower = s.toLowerCase();
  if (lower === "true" || lower === "false" || lower === "null" || lower === "~"
      || lower === "yes" || lower === "no" || lower === "on" || lower === "off") {
    return quote(s);
  }
  // Numeric-looking → quote so it survives as a string.
  if (/^-?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) {
    return quote(s);
  }
  if (/^\s|\s$/.test(s)) return quote(s);
  if (/[\n\t"\\]/.test(s)) return quote(s);
  if (/^[-?:,[\]{}&*!|>'"%@`#]/.test(s)) return quote(s);
  // `: ` or ` #` inside a bare scalar would be parsed as separator / comment.
  if (/: /.test(s) || / #/.test(s)) return quote(s);
  return s;
}

function quote(s: string): string {
  let out = `"`;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const code = s.charCodeAt(i);
    if (ch === "\\") out += "\\\\";
    else if (ch === '"') out += '\\"';
    else if (ch === "\n") out += "\\n";
    else if (ch === "\r") out += "\\r";
    else if (ch === "\t") out += "\\t";
    else if (code < 0x20) out += `\\u${padHex4(code.toString(16))}`;
    else out += ch;
  }
  return out + `"`;
}

function encodeKey(k: string): string {
  if (/^[A-Za-z_][A-Za-z0-9_-]*$/.test(k) || /^\d+$/.test(k)) {
    const lower = k.toLowerCase();
    if (lower === "true" || lower === "false" || lower === "null"
        || lower === "yes" || lower === "no") {
      return quote(k);
    }
    return k;
  }
  return quote(k);
}

// ---------------------------------------------------------------------------
// parse
// ---------------------------------------------------------------------------

export function yamlParse(source: string): unknown {
  if (source == null) return null;
  const text = source.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const rawLines = text.split("\n");

  const lines: Array<{ indent: number; content: string }> = [];
  for (const raw of rawLines) {
    const stripped = stripComment(raw);
    if (!stripped.trim()) continue;
    const indent = raw.length - raw.replace(/^ +/, "").length;
    lines.push({ indent, content: stripped.slice(indent) });
  }

  if (lines.length === 0) return null;

  const state: ParseState = { lines, i: 0 };
  return parseNode(state, lines[0].indent);
}

interface ParseState {
  lines: Array<{ indent: number; content: string }>;
  i: number;
}

function parseNode(state: ParseState, indent: number): unknown {
  const line = state.lines[state.i];
  if (!line || line.indent < indent) return null;

  if (line.content.startsWith("- ") || line.content === "-") {
    return parseSequence(state, indent);
  }
  return parseMappingOrScalar(state, indent);
}

function parseSequence(state: ParseState, indent: number): unknown[] {
  const out: unknown[] = [];
  while (state.i < state.lines.length) {
    const line = state.lines[state.i];
    if (line.indent !== indent) break;
    if (!line.content.startsWith("-")) break;

    const afterDash = line.content === "-" ? "" : line.content.slice(2);

    if (afterDash === "") {
      state.i++;
      if (state.i < state.lines.length && state.lines[state.i].indent > indent) {
        out.push(parseNode(state, state.lines[state.i].indent));
      } else {
        out.push(null);
      }
      continue;
    }

    const colon = findKeyColon(afterDash);
    if (colon >= 0) {
      state.i++;
      const firstKey = decodeKey(afterDash.slice(0, colon));
      const rest = afterDash.slice(colon + 1).replace(/^ +/, "");
      const obj: { [k: string]: unknown } = {};
      if (rest === "") {
        if (state.i < state.lines.length && state.lines[state.i].indent > indent) {
          obj[firstKey] = parseNode(state, state.lines[state.i].indent);
        } else {
          obj[firstKey] = null;
        }
      } else {
        obj[firstKey] = parseScalar(rest);
      }
      const childIndent = indent + 2;
      while (state.i < state.lines.length) {
        const cur = state.lines[state.i];
        if (cur.indent !== childIndent) break;
        if (cur.content.startsWith("- ") || cur.content === "-") break;
        parseMappingEntry(state, childIndent, obj);
      }
      out.push(obj);
      continue;
    }

    state.i++;
    out.push(parseScalar(afterDash));
  }
  return out;
}

function parseMappingOrScalar(state: ParseState, indent: number): unknown {
  const first = state.lines[state.i];
  if (findKeyColon(first.content) < 0) {
    state.i++;
    return parseScalar(first.content);
  }
  const obj: { [k: string]: unknown } = {};
  while (state.i < state.lines.length) {
    const cur = state.lines[state.i];
    if (cur.indent !== indent) break;
    if (cur.content.startsWith("- ") || cur.content === "-") break;
    parseMappingEntry(state, indent, obj);
  }
  return obj;
}

function parseMappingEntry(
  state: ParseState,
  indent: number,
  obj: { [k: string]: unknown },
): void {
  const line = state.lines[state.i];
  const colon = findKeyColon(line.content);
  if (colon < 0) {
    state.i++;
    return;
  }
  const key = decodeKey(line.content.slice(0, colon));
  const rest = line.content.slice(colon + 1).replace(/^ +/, "");
  state.i++;

  if (rest === "") {
    if (state.i < state.lines.length && state.lines[state.i].indent > indent) {
      obj[key] = parseNode(state, state.lines[state.i].indent);
    } else {
      obj[key] = null;
    }
  } else {
    obj[key] = parseScalar(rest);
  }
}

/**
 * Locate the `:` that separates a mapping key from its value. Honour
 * double/single quoted keys so a `:` inside the key isn't treated as
 * the separator.
 */
function findKeyColon(s: string): number {
  let i = 0;
  if (s[0] === '"') {
    i = 1;
    while (i < s.length) {
      if (s[i] === "\\") { i += 2; continue; }
      if (s[i] === '"') { i += 1; break; }
      i += 1;
    }
  } else if (s[0] === "'") {
    i = 1;
    while (i < s.length) {
      if (s[i] === "'" && s[i + 1] === "'") { i += 2; continue; }
      if (s[i] === "'") { i += 1; break; }
      i += 1;
    }
  }
  for (; i < s.length; i++) {
    if (s[i] === ":") {
      if (i === s.length - 1 || s[i + 1] === " ") return i;
    }
  }
  return -1;
}

function decodeKey(raw: string): string {
  const k = raw.trim();
  if (k.length >= 2 && k.startsWith('"') && k.endsWith('"')) {
    return decodeDoubleQuoted(k.slice(1, -1));
  }
  if (k.length >= 2 && k.startsWith("'") && k.endsWith("'")) {
    return k.slice(1, -1).replace(/''/g, "'");
  }
  return k;
}

function parseScalar(raw: string): unknown {
  const s = trimEnd(raw);
  if (s === "" || s === "~" || s === "null" || s === "Null" || s === "NULL") return null;
  if (s === "true" || s === "True" || s === "TRUE") return true;
  if (s === "false" || s === "False" || s === "FALSE") return false;
  if (s === "[]") return [];
  if (s === "{}") return {};
  if (s.length >= 2 && s.startsWith('"') && s.endsWith('"')) {
    return decodeDoubleQuoted(s.slice(1, -1));
  }
  if (s.length >= 2 && s.startsWith("'") && s.endsWith("'")) {
    return s.slice(1, -1).replace(/''/g, "'");
  }
  if (/^-?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) {
    const n = Number(s);
    if (Number.isFinite(n)) return n;
  }
  return s;
}

function decodeDoubleQuoted(s: string): string {
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch !== "\\") {
      out += ch;
      continue;
    }
    const next = s[i + 1];
    i += 1;
    switch (next) {
      case "n": out += "\n"; break;
      case "r": out += "\r"; break;
      case "t": out += "\t"; break;
      case '"': out += '"'; break;
      case "\\": out += "\\"; break;
      case "/": out += "/"; break;
      case "b": out += "\b"; break;
      case "f": out += "\f"; break;
      case "u": {
        const hex = s.slice(i + 1, i + 5);
        if (/^[0-9a-fA-F]{4}$/.test(hex)) {
          out += String.fromCharCode(parseInt(hex, 16));
          i += 4;
        } else {
          out += "u";
        }
        break;
      }
      default:
        out += next ?? "";
    }
  }
  return out;
}

/**
 * Strip a `# comment` that is outside any quoted string on a YAML line.
 * Single-pass scan so it behaves well on URLs / file paths.
 */
function stripComment(line: string): string {
  let inDouble = false;
  let inSingle = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inDouble) {
      if (ch === "\\") { i += 1; continue; }
      if (ch === '"') inDouble = false;
      continue;
    }
    if (inSingle) {
      if (ch === "'" && line[i + 1] === "'") { i += 1; continue; }
      if (ch === "'") inSingle = false;
      continue;
    }
    if (ch === '"') { inDouble = true; continue; }
    if (ch === "'") { inSingle = true; continue; }
    if (ch === "#" && (i === 0 || line[i - 1] === " " || line[i - 1] === "\t")) {
      return line.slice(0, i).replace(/\s+$/, "");
    }
  }
  return line;
}

// ---------------------------------------------------------------------------
// ES2015-compatible polyfills for a handful of newer APIs. The plugin's
// tsconfig targets an older lib; these helpers keep us lint-clean without
// widening the global target.
// ---------------------------------------------------------------------------

function objectEntries<V>(obj: { [k: string]: V }): Array<[string, V]> {
  const out: Array<[string, V]> = [];
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      out.push([key, obj[key]]);
    }
  }
  return out;
}

function padHex4(hex: string): string {
  return hex.length >= 4 ? hex : ("0000" + hex).slice(-4);
}

function trimEnd(s: string): string {
  return s.replace(/\s+$/, "");
}
