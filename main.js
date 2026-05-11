var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// apps/obsidian/src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => ObsiWealthPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian18 = require("obsidian");

// packages/core/src/storage/paths.ts
var PLUGIN_ID = "obsiwealth";
var PLUGIN_DIR = `.obsidian/plugins/${PLUGIN_ID}`;
var DATA_DIR = ".obsiwealth";
var ICONS_DIR = `${DATA_DIR}/icons`;
var DATA_PATH = `${DATA_DIR}/assets.yaml`;
var WISHLIST_PATH = `${DATA_DIR}/wishlist.yaml`;
var FUNDS_PATH = `${DATA_DIR}/funds.yaml`;
var SETTINGS_PATH = `${DATA_DIR}/settings.yaml`;
var VIEW_TYPE = "obsiwealth-main";

// packages/core/src/storage/yaml.ts
function yamlStringify(value) {
  const root = normalise(value);
  const lines = [];
  emit(root, 0, lines);
  return lines.join("\n") + "\n";
}
function normalise(value) {
  if (value === void 0 || value === null) return null;
  if (Array.isArray(value)) {
    return value.map((item) => item === void 0 ? null : normalise(item));
  }
  if (typeof value === "object") {
    const out = {};
    for (const [k, v] of objectEntries(value)) {
      if (v === void 0) continue;
      out[k] = normalise(v);
    }
    return out;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  return value;
}
function emit(value, indent, out) {
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
        emitObjectItem(item, indent, out);
      }
    }
    return;
  }
  const entries = objectEntries(value);
  if (entries.length === 0) {
    out.push("{}");
    return;
  }
  for (const [k, v] of entries) {
    emitMappingEntry(k, v, indent, out);
  }
}
function emitMappingEntry(key, value, indent, out) {
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
    if (Object.keys(value).length === 0) {
      out.push(`${pad}${keyTok}: {}`);
    } else {
      out.push(`${pad}${keyTok}:`);
      emit(value, indent + 1, out);
    }
  }
}
function emitObjectItem(obj, indent, out) {
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
    if (Object.keys(firstValue).length === 0) {
      out.push(`${pad}- ${keyTok}: {}`);
    } else {
      out.push(`${pad}- ${keyTok}:`);
      emit(firstValue, indent + 2, out);
    }
  }
  for (let i = 1; i < entries.length; i++) {
    const [k, v] = entries[i];
    emitMappingEntry(k, v, indent + 1, out);
  }
}
function isScalar(v) {
  return v === null || typeof v === "string" || typeof v === "number" || typeof v === "boolean";
}
function scalarToken(v) {
  if (v === null) return "null";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return String(v);
  return encodeString(v);
}
function encodeString(s) {
  if (s === "") return `""`;
  const lower = s.toLowerCase();
  if (lower === "true" || lower === "false" || lower === "null" || lower === "~" || lower === "yes" || lower === "no" || lower === "on" || lower === "off") {
    return quote(s);
  }
  if (/^-?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) {
    return quote(s);
  }
  if (/^\s|\s$/.test(s)) return quote(s);
  if (/[\n\t"\\]/.test(s)) return quote(s);
  if (/^[-?:,[\]{}&*!|>'"%@`#]/.test(s)) return quote(s);
  if (/: /.test(s) || / #/.test(s)) return quote(s);
  return s;
}
function quote(s) {
  let out = `"`;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const code = s.charCodeAt(i);
    if (ch === "\\") out += "\\\\";
    else if (ch === '"') out += '\\"';
    else if (ch === "\n") out += "\\n";
    else if (ch === "\r") out += "\\r";
    else if (ch === "	") out += "\\t";
    else if (code < 32) out += `\\u${padHex4(code.toString(16))}`;
    else out += ch;
  }
  return out + `"`;
}
function encodeKey(k) {
  if (/^[A-Za-z_][A-Za-z0-9_-]*$/.test(k) || /^\d+$/.test(k)) {
    const lower = k.toLowerCase();
    if (lower === "true" || lower === "false" || lower === "null" || lower === "yes" || lower === "no") {
      return quote(k);
    }
    return k;
  }
  return quote(k);
}
function yamlParse(source) {
  if (source == null) return null;
  const text = source.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const rawLines = text.split("\n");
  const lines = [];
  for (const raw of rawLines) {
    const stripped = stripComment(raw);
    if (!stripped.trim()) continue;
    const indent = raw.length - raw.replace(/^ +/, "").length;
    lines.push({ indent, content: stripped.slice(indent) });
  }
  if (lines.length === 0) return null;
  const state = { lines, i: 0 };
  return parseNode(state, lines[0].indent);
}
function parseNode(state, indent) {
  const line = state.lines[state.i];
  if (!line || line.indent < indent) return null;
  if (line.content.startsWith("- ") || line.content === "-") {
    return parseSequence(state, indent);
  }
  return parseMappingOrScalar(state, indent);
}
function parseSequence(state, indent) {
  const out = [];
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
      const obj = {};
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
function parseMappingOrScalar(state, indent) {
  const first = state.lines[state.i];
  if (findKeyColon(first.content) < 0) {
    state.i++;
    return parseScalar(first.content);
  }
  const obj = {};
  while (state.i < state.lines.length) {
    const cur = state.lines[state.i];
    if (cur.indent !== indent) break;
    if (cur.content.startsWith("- ") || cur.content === "-") break;
    parseMappingEntry(state, indent, obj);
  }
  return obj;
}
function parseMappingEntry(state, indent, obj) {
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
function findKeyColon(s) {
  let i = 0;
  if (s[0] === '"') {
    i = 1;
    while (i < s.length) {
      if (s[i] === "\\") {
        i += 2;
        continue;
      }
      if (s[i] === '"') {
        i += 1;
        break;
      }
      i += 1;
    }
  } else if (s[0] === "'") {
    i = 1;
    while (i < s.length) {
      if (s[i] === "'" && s[i + 1] === "'") {
        i += 2;
        continue;
      }
      if (s[i] === "'") {
        i += 1;
        break;
      }
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
function decodeKey(raw) {
  const k = raw.trim();
  if (k.length >= 2 && k.startsWith('"') && k.endsWith('"')) {
    return decodeDoubleQuoted(k.slice(1, -1));
  }
  if (k.length >= 2 && k.startsWith("'") && k.endsWith("'")) {
    return k.slice(1, -1).replace(/''/g, "'");
  }
  return k;
}
function parseScalar(raw) {
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
function decodeDoubleQuoted(s) {
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
      case "n":
        out += "\n";
        break;
      case "r":
        out += "\r";
        break;
      case "t":
        out += "	";
        break;
      case '"':
        out += '"';
        break;
      case "\\":
        out += "\\";
        break;
      case "/":
        out += "/";
        break;
      case "b":
        out += "\b";
        break;
      case "f":
        out += "\f";
        break;
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
function stripComment(line) {
  let inDouble = false;
  let inSingle = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inDouble) {
      if (ch === "\\") {
        i += 1;
        continue;
      }
      if (ch === '"') inDouble = false;
      continue;
    }
    if (inSingle) {
      if (ch === "'" && line[i + 1] === "'") {
        i += 1;
        continue;
      }
      if (ch === "'") inSingle = false;
      continue;
    }
    if (ch === '"') {
      inDouble = true;
      continue;
    }
    if (ch === "'") {
      inSingle = true;
      continue;
    }
    if (ch === "#" && (i === 0 || line[i - 1] === " " || line[i - 1] === "	")) {
      return line.slice(0, i).replace(/\s+$/, "");
    }
  }
  return line;
}
function objectEntries(obj) {
  const out = [];
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      out.push([key, obj[key]]);
    }
  }
  return out;
}
function padHex4(hex) {
  return hex.length >= 4 ? hex : ("0000" + hex).slice(-4);
}
function trimEnd(s) {
  return s.replace(/\s+$/, "");
}

// apps/obsidian/src/mainView.ts
var import_obsidian14 = require("obsidian");

// packages/ui-web/src/components/slotNumber.ts
function renderSlotNumber(parent, value, shrinkDecimals = true) {
  parent.style.display = "inline-flex";
  parent.style.alignItems = "baseline";
  parent.style.flexWrap = "nowrap";
  parent.style.whiteSpace = "nowrap";
  parent.style.gap = "1px";
  parent.style.fontVariantNumeric = "tabular-nums";
  const skipAnimation = isInsideZoomedRegion(parent);
  const { decimalStart, decimalEnd } = shrinkDecimals ? findDecimalRange(value) : { decimalStart: value.length, decimalEnd: value.length };
  Array.from(value).forEach((char, index) => {
    const isDecimalPart = index >= decimalStart && index < decimalEnd;
    const scale = isDecimalPart ? 0.7 : 1;
    if (!/\d/.test(char)) {
      const staticChar = parent.createSpan({ text: char });
      staticChar.style.display = "inline-block";
      staticChar.style.opacity = "0.92";
      if (isDecimalPart) {
        staticChar.style.fontSize = `${scale}em`;
      }
      return;
    }
    const digit = Number(char);
    const slot = parent.createSpan();
    slot.style.display = "inline-block";
    slot.style.height = "1.05em";
    slot.style.overflow = "hidden";
    slot.style.verticalAlign = "bottom";
    if (isDecimalPart) {
      slot.style.fontSize = `${scale}em`;
    }
    const reel = slot.createSpan();
    reel.style.display = "flex";
    reel.style.flexDirection = "column";
    if (skipAnimation) {
      reel.style.transform = `translateY(-${digit * 1.05}em)`;
    } else {
      reel.style.transform = "translateY(0)";
      reel.style.transition = `transform ${650 + index * 35}ms cubic-bezier(0.2, 0.8, 0.2, 1)`;
    }
    for (let i = 0; i <= 9; i += 1) {
      const number = reel.createSpan({ text: String(i) });
      number.style.height = "1.05em";
      number.style.lineHeight = "1.05em";
    }
    if (!skipAnimation) {
      requestAnimationFrame(() => {
        reel.style.transform = `translateY(-${digit * 1.05}em)`;
      });
    }
  });
}
function isInsideZoomedRegion(el) {
  let node = el;
  while (node) {
    const raw = node.style.zoom;
    if (raw) {
      const z = Number(raw);
      if (Number.isFinite(z) && z > 0 && z < 0.999) {
        return true;
      }
    }
    node = node.parentElement;
  }
  return false;
}
function findDecimalRange(value) {
  const dotIndex = value.lastIndexOf(".");
  if (dotIndex < 0 || dotIndex >= value.length - 1 || !/\d/.test(value[dotIndex + 1] ?? "")) {
    return { decimalStart: value.length, decimalEnd: value.length };
  }
  let end = dotIndex + 1;
  while (end < value.length && /\d/.test(value[end] ?? "")) {
    end += 1;
  }
  return { decimalStart: dotIndex, decimalEnd: end };
}

// packages/core/src/storage/hostRegistry.ts
var currentHost = null;
function setHost(next) {
  currentHost = next;
}
function host() {
  if (!currentHost) {
    throw new Error(
      "[obsiwealth/core] HostContext not initialised \u2013 call setHost(...) during bootstrap."
    );
  }
  return currentHost;
}
function notify(message) {
  host().notifier.notify(message);
}

// packages/core/src/types/index.ts
var CUSTOM_ICON_SIZE_STEPS = [96, 128, 192, 256, 384, 512];
var CURRENCY_OPTIONS = [
  { code: "CNY", symbol: "\xA5", name: "\u4EBA\u6C11\u5E01" },
  { code: "USD", symbol: "$", name: "\u7F8E\u5143" },
  { code: "EUR", symbol: "\u20AC", name: "\u6B27\u5143" },
  { code: "JPY", symbol: "\xA5", name: "\u65E5\u5143" },
  { code: "GBP", symbol: "\xA3", name: "\u82F1\u9551" },
  { code: "HKD", symbol: "HK$", name: "\u6E2F\u5E01" },
  { code: "TWD", symbol: "NT$", name: "\u65B0\u53F0\u5E01" }
];
var LANGUAGE_OPTIONS = [
  { code: "zh-CN", name: "\u7B80\u4F53\u4E2D\u6587" },
  { code: "en-US", name: "English" },
  { code: "ja-JP", name: "\u65E5\u672C\u8A9E" },
  { code: "ko-KR", name: "\uD55C\uAD6D\uC5B4" },
  { code: "fr-FR", name: "Fran\xE7ais" },
  { code: "de-DE", name: "Deutsch" },
  { code: "es-ES", name: "Espa\xF1ol" }
];
var DEFAULT_CATEGORIES = [
  { id: "tech", name: "\u6570\u7801" },
  { id: "clothes", name: "\u670D\u9970" },
  { id: "home", name: "\u5BB6\u5C45" },
  { id: "other", name: "\u5176\u4ED6" }
];
var DEFAULT_SETTINGS = {
  currencyCode: "CNY",
  currencySymbol: "\xA5",
  statusColors: {
    active: "#60a5fa",
    retired: "#a3a3a3",
    sold: "#4ade80"
  },
  decimalPlaces: 2,
  useThousandsSeparator: false,
  durationDisplayMode: "date",
  defaultCardColumns: 3,
  defaultSortField: "manual",
  defaultSortDirection: "asc",
  categories: DEFAULT_CATEGORIES,
  language: "zh-CN",
  passwordEnabled: false,
  password: "",
  themeMode: "system",
  idleWatermarkEnabled: false,
  idleWatermarkTimeoutSec: 5,
  showChartDots: true,
  customIconDefaultSize: 256
};
var FUND_CATEGORIES = [
  { id: "cash", name: "\u73B0\u91D1", type: "asset", examples: "" },
  { id: "debit_card", name: "\u501F\u8BB0\u5361", type: "asset", examples: "" },
  { id: "credit_card", name: "\u4FE1\u7528\u5361", type: "liability", examples: "\u4FE1\u7528\u5361/\u8682\u8681\u82B1\u5457/\u4EAC\u4E1C\u767D\u6761" },
  { id: "virtual_account", name: "\u865A\u62DF\u8D26\u6237", type: "asset", examples: "\u5FAE\u4FE1/\u652F\u4ED8\u5B9D" },
  { id: "investment", name: "\u6295\u8D44\u8D26\u6237", type: "asset", examples: "\u80A1\u7968/\u57FA\u91D1/P2P" },
  { id: "liability", name: "\u8D1F\u503A", type: "liability", examples: "\u8D37\u6B3E/\u501F\u5165" },
  { id: "claim", name: "\u503A\u6743", type: "asset", examples: "\u5E94\u6536/\u501F\u51FA" },
  { id: "social_security", name: "\u4E94\u9669\u4E00\u91D1", type: "asset", examples: "\u793E\u4FDD/\u516C\u79EF\u91D1" },
  { id: "custom_asset", name: "\u81EA\u5B9A\u4E49\u8D44\u4EA7", type: "asset", examples: "" }
];
var DEFAULT_FUND_CATEGORY_ID = "custom_asset";
var COMMON_BANKS = [
  "\u5DE5\u5546\u94F6\u884C",
  "\u5EFA\u8BBE\u94F6\u884C",
  "\u519C\u4E1A\u94F6\u884C",
  "\u4E2D\u56FD\u94F6\u884C",
  "\u62DB\u5546\u94F6\u884C",
  "\u4EA4\u901A\u94F6\u884C",
  "\u90AE\u50A8\u94F6\u884C",
  "\u6D66\u53D1\u94F6\u884C",
  "\u4E2D\u4FE1\u94F6\u884C",
  "\u6C11\u751F\u94F6\u884C",
  "\u5149\u5927\u94F6\u884C",
  "\u5174\u4E1A\u94F6\u884C",
  "\u5E73\u5B89\u94F6\u884C",
  "\u534E\u590F\u94F6\u884C",
  "\u5E7F\u53D1\u94F6\u884C",
  "\u5317\u4EAC\u94F6\u884C",
  "\u5B81\u6CE2\u94F6\u884C",
  "\u6CB3\u5357\u519C\u6751\u4FE1\u7528\u793E",
  "\u5176\u4ED6"
];
var COMMON_VIRTUAL_ACCOUNTS = [
  "\u652F\u4ED8\u5B9D",
  "\u5FAE\u4FE1",
  "\u5176\u4ED6"
];
var COMMON_LIABILITIES = [
  "\u8D37\u6B3E",
  "\u501F\u5165",
  "\u5176\u4ED6"
];
var COMMON_CREDIT_CARD_ISSUERS = [
  ...COMMON_BANKS.filter((b) => b !== "\u5176\u4ED6"),
  "\u8682\u8681\u82B1\u5457",
  "\u4EAC\u4E1C\u767D\u6761",
  "\u5176\u4ED6"
];
var COMMON_INVESTMENTS = [
  "\u80A1\u7968",
  "\u57FA\u91D1",
  "\u5176\u4ED6"
];
var COMMON_SOCIAL_SECURITY = [
  "\u4F4F\u623F\u516C\u79EF\u91D1",
  "\u533B\u7597\u4FDD\u9669",
  "\u517B\u8001\u4FDD\u9669",
  "\u5931\u4E1A\u4FDD\u9669",
  "\u5DE5\u4F24\u4FDD\u9669",
  "\u751F\u80B2\u4FDD\u9669",
  "\u5176\u4ED6"
];

// packages/core/src/calc/fundCategory.ts
function getFundCategory(fund) {
  return FUND_CATEGORIES.find((category) => category.id === fund.category) ?? FUND_CATEGORIES.find((category) => category.id === DEFAULT_FUND_CATEGORY_ID) ?? FUND_CATEGORIES[0];
}

// packages/core/src/storage/customImageStore.ts
var CUSTOM_IMAGE_SCHEME = "obsiwealth:";
var CUSTOM_IMAGE_RE = /^obsiwealth:(.+)$/;
function isCustomImageRef(value) {
  if (!value) return false;
  return CUSTOM_IMAGE_RE.test(value);
}
function isInlinePngDataUrl(value) {
  if (!value) return false;
  return value.startsWith("data:image/png;base64,") || value.startsWith("data:image/jpeg;base64,");
}
function customImageRefToVaultPath(value) {
  const body = customImageRefBody(value);
  if (body === null) return null;
  return `${DATA_DIR}/${body}`;
}
function customImageRefBody(value) {
  const match = CUSTOM_IMAGE_RE.exec(value);
  if (!match) return null;
  const raw = match[1];
  const prefix = `${DATA_DIR}/`;
  return raw.startsWith(prefix) ? raw.slice(prefix.length) : raw;
}
function bodyToCustomImageRef(body) {
  const prefix = `${DATA_DIR}/`;
  const clean = body.startsWith(prefix) ? body.slice(prefix.length) : body;
  return `${CUSTOM_IMAGE_SCHEME}${clean}`;
}
var DEFAULT_CUSTOM_ICON_SIZE = 256;
function setDefaultCustomIconSize(px) {
  if (Number.isFinite(px) && px > 0) {
    DEFAULT_CUSTOM_ICON_SIZE = Math.round(px);
  }
}
function getDefaultCustomIconSize() {
  return DEFAULT_CUSTOM_ICON_SIZE;
}
async function saveCustomImageFromDataUrl(dataUrl) {
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) {
    throw new Error("saveCustomImageFromDataUrl: not a base64 data URL");
  }
  const { bytes, extension } = parsed;
  const hash = await shortContentHash(bytes);
  const body = `icons/${hash}.${extension}`;
  const vaultPath = `${DATA_DIR}/${body}`;
  const store = host().store;
  await store.mkdir(ICONS_DIR);
  const exists = await store.exists(vaultPath);
  if (!exists) {
    await store.writeBinary(vaultPath, bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  }
  return bodyToCustomImageRef(body);
}
var OBJECT_URL_CACHE = /* @__PURE__ */ new Map();
async function preloadCustomImage(ref) {
  const vaultPath = customImageRefToVaultPath(ref);
  if (!vaultPath) return;
  if (OBJECT_URL_CACHE.has(vaultPath)) return;
  try {
    const store = host().store;
    if (!await store.exists(vaultPath)) return;
    const buf = await store.readBinary(vaultPath);
    const mime = guessMimeFromExtension(vaultPath);
    const blob = new Blob([buf], { type: mime });
    const url = URL.createObjectURL(blob);
    OBJECT_URL_CACHE.set(vaultPath, url);
  } catch (err) {
    console.warn("[obsiwealth] preloadCustomImage failed", ref, err);
  }
}
async function preloadCustomImagesFromItems(groups) {
  const refs = /* @__PURE__ */ new Set();
  for (const group of groups) {
    for (const item of group) {
      if (item.icon && isCustomImageRef(item.icon)) refs.add(item.icon);
      const accs = item.accessories;
      if (Array.isArray(accs)) {
        for (const acc of accs) {
          if (acc.icon && isCustomImageRef(acc.icon)) refs.add(acc.icon);
        }
      }
    }
  }
  await Promise.all(Array.from(refs).map((r) => preloadCustomImage(r)));
}
function resolveCustomImageUrl(ref) {
  const vaultPath = customImageRefToVaultPath(ref);
  if (!vaultPath) return "";
  const cached = OBJECT_URL_CACHE.get(vaultPath);
  if (cached) return cached;
  return host().resources.resolveUrl(vaultPath);
}
function collectCustomImageRefs(groups) {
  const refs = /* @__PURE__ */ new Set();
  for (const group of groups) {
    for (const item of group) {
      if (item.icon && isCustomImageRef(item.icon)) {
        const body = customImageRefBody(item.icon);
        if (body) refs.add(bodyToCustomImageRef(body));
      }
      const accs = item.accessories;
      if (Array.isArray(accs)) {
        for (const acc of accs) {
          if (acc.icon && isCustomImageRef(acc.icon)) {
            const body = customImageRefBody(acc.icon);
            if (body) refs.add(bodyToCustomImageRef(body));
          }
        }
      }
    }
  }
  return refs;
}
async function pruneOrphanCustomImages(refsInUse) {
  const store = host().store;
  let removed = 0;
  const keepPaths = /* @__PURE__ */ new Set();
  for (const ref of refsInUse) {
    const p = customImageRefToVaultPath(ref);
    if (p) keepPaths.add(p);
  }
  try {
    if (!await store.exists(ICONS_DIR)) return 0;
    const { files } = await store.list(ICONS_DIR);
    for (const filePath of files) {
      if (!isIconFilePath(filePath)) continue;
      if (keepPaths.has(filePath)) continue;
      try {
        await store.remove(filePath);
        const cached = OBJECT_URL_CACHE.get(filePath);
        if (cached) {
          try {
            URL.revokeObjectURL(cached);
          } catch {
          }
          OBJECT_URL_CACHE.delete(filePath);
        }
        removed++;
      } catch (err) {
        console.warn("[obsiwealth] failed to prune orphan icon", filePath, err);
      }
    }
  } catch (err) {
    console.warn("[obsiwealth] pruneOrphanCustomImages failed", err);
  }
  return removed;
}
function isIconFilePath(p) {
  const lower = p.toLowerCase();
  return lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg");
}
function parseDataUrl(dataUrl) {
  const match = /^data:image\/(png|jpeg|jpg);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const extension = match[1].startsWith("png") ? "png" : "jpg";
  try {
    const binary = atob(match[2]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return { bytes, extension };
  } catch {
    return null;
  }
}
function guessMimeFromExtension(path) {
  const lower = path.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "image/png";
}
async function shortContentHash(bytes) {
  try {
    const subtle = globalThis.crypto?.subtle;
    if (subtle) {
      const digest = await subtle.digest("SHA-1", bytes);
      const hex = arrayBufferToHex(digest);
      return hex.slice(0, 16);
    }
  } catch {
  }
  return fnv1aHex(bytes);
}
function arrayBufferToHex(buf) {
  const bytes = new Uint8Array(buf);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}
function fnv1aHex(bytes) {
  let hHi = 3421674724;
  let hLo = 2216829733;
  for (let i = 0; i < bytes.length; i++) {
    hLo ^= bytes[i];
    const mLoLo = (hLo & 65535) * 435;
    const mLoHi = (hLo >>> 16) * 435;
    const mHiLo = (hHi & 65535) * 435 + (hLo & 65535) * 256;
    let lo = mLoLo + ((mLoHi & 65535) << 16) >>> 0;
    let carry = Math.floor((mLoLo + mLoHi * 65536) / 4294967296);
    let hi = mHiLo + carry + (mLoHi >>> 16 & 65535) >>> 0;
    hHi = hi;
    hLo = lo;
  }
  return hHi.toString(16).padStart(8, "0") + hLo.toString(16).padStart(8, "0");
}

// assets/icons/flat/digital/phone.svg
var phone_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#0369a1" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<rect x="18" y="6" width="28" height="52" rx="4" fill="#e0f2fe" stroke="#0369a1"/>\n  <rect x="22" y="12" width="20" height="32" rx="1" fill="#bae6fd" stroke="#0369a1"/>\n  <circle cx="32" cy="52" r="2.5" fill="#0369a1" stroke="none"/>\n</svg>\n';

// assets/icons/flat/digital/tablet.svg
var tablet_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#0369a1" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<rect x="10" y="6" width="44" height="52" rx="4" fill="#e0f2fe" stroke="#0369a1"/>\n  <rect x="14" y="12" width="36" height="38" rx="1" fill="#bae6fd" stroke="#0369a1"/>\n  <circle cx="32" cy="54" r="2" fill="#0369a1" stroke="none"/>\n</svg>\n';

// assets/icons/flat/digital/laptop.svg
var laptop_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#3730a3" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<rect x="10" y="14" width="44" height="28" rx="2" fill="#e0e7ff" stroke="#3730a3"/>\n  <rect x="14" y="18" width="36" height="20" rx="1" fill="#c7d2fe" stroke="#3730a3"/>\n  <path d="M6 46 H58 L54 52 H10 Z" fill="#e0e7ff" stroke="#3730a3"/>\n</svg>\n';

// assets/icons/flat/digital/monitor.svg
var monitor_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#1e3a8a" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<rect x="6" y="10" width="52" height="34" rx="2" fill="#e0e7ff" stroke="#1e3a8a"/>\n  <rect x="10" y="14" width="44" height="26" rx="1" fill="#c7d2fe" stroke="#1e3a8a"/>\n  <path d="M24 48 H40 L42 56 H22 Z" fill="#c7d2fe" stroke="#1e3a8a"/>\n  <path d="M18 58 H46" stroke="#1e3a8a"/>\n</svg>\n';

// assets/icons/flat/digital/tv.svg
var tv_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#1e3a8a" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<rect x="6" y="12" width="52" height="34" rx="3" fill="#e0e7ff" stroke="#1e3a8a"/>\n  <rect x="10" y="16" width="44" height="26" rx="1" fill="#c7d2fe" stroke="#1e3a8a"/>\n  <path d="M22 54 H42" stroke="#1e3a8a"/>\n  <path d="M28 46 L26 54 M36 46 L38 54" stroke="#1e3a8a"/>\n</svg>\n';

// assets/icons/flat/digital/keyboard.svg
var keyboard_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#475569" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<rect x="4" y="20" width="56" height="24" rx="3" fill="#f1f5f9" stroke="#475569"/>\n  <rect x="10" y="26" width="5" height="5" rx="1" fill="#cbd5e1" stroke="none"/>\n  <rect x="19" y="26" width="5" height="5" rx="1" fill="#cbd5e1" stroke="none"/>\n  <rect x="28" y="26" width="5" height="5" rx="1" fill="#cbd5e1" stroke="none"/>\n  <rect x="37" y="26" width="5" height="5" rx="1" fill="#cbd5e1" stroke="none"/>\n  <rect x="46" y="26" width="8" height="5" rx="1" fill="#cbd5e1" stroke="none"/>\n  <rect x="10" y="35" width="44" height="5" rx="1" fill="#cbd5e1" stroke="none"/>\n</svg>\n';

// assets/icons/flat/digital/mouse.svg
var mouse_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#475569" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<rect x="20" y="10" width="24" height="44" rx="12" fill="#f1f5f9" stroke="#475569"/>\n  <path d="M32 14 V28" stroke="#475569"/>\n  <rect x="30" y="16" width="4" height="8" rx="2" fill="#cbd5e1" stroke="#475569"/>\n</svg>\n';

// assets/icons/flat/digital/headphones.svg
var headphones_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#7c3aed" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<path d="M10 34 V30 a22 22 0 0 1 44 0 V34" fill="none" stroke="#7c3aed"/>\n  <rect x="6" y="32" width="10" height="18" rx="3" fill="#ddd6fe" stroke="#7c3aed"/>\n  <rect x="48" y="32" width="10" height="18" rx="3" fill="#ddd6fe" stroke="#7c3aed"/>\n</svg>\n';

// assets/icons/flat/digital/earbuds.svg
var earbuds_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#a21caf" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<path d="M18 12 q-6 8 -2 18 q2 6 8 4 q4 -2 3 -8 q-1 -6 -3 -12 q-2 -4 -6 -2 Z"\n    fill="#fae8ff" stroke="#a21caf"/>\n  <path d="M46 12 q6 8 2 18 q-2 6 -8 4 q-4 -2 -3 -8 q1 -6 3 -12 q2 -4 6 -2 Z"\n    fill="#fae8ff" stroke="#a21caf"/>\n  <circle cx="20" cy="40" r="3" fill="#a21caf" stroke="none"/>\n  <circle cx="44" cy="40" r="3" fill="#a21caf" stroke="none"/>\n</svg>\n';

// assets/icons/flat/digital/watch.svg
var watch_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#6b21a8" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<rect x="18" y="20" width="28" height="24" rx="4" fill="#f3e8ff" stroke="#6b21a8"/>\n  <path d="M24 20 L26 10 H38 L40 20" fill="#ddd6fe" stroke="#6b21a8"/>\n  <path d="M24 44 L26 54 H38 L40 44" fill="#ddd6fe" stroke="#6b21a8"/>\n  <circle cx="32" cy="32" r="6" fill="none" stroke="#6b21a8"/>\n  <path d="M32 28 V32 L35 34" stroke="#6b21a8"/>\n</svg>\n';

// assets/icons/flat/digital/camera.svg
var camera_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#1e40af" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<rect x="6" y="18" width="52" height="32" rx="3" fill="#e0e7ff" stroke="#1e40af"/>\n  <path d="M22 18 L26 12 H38 L42 18" fill="#c7d2fe" stroke="#1e40af"/>\n  <circle cx="32" cy="34" r="10" fill="#f8fafc" stroke="#1e40af"/>\n  <circle cx="32" cy="34" r="5" fill="#c7d2fe" stroke="#1e40af"/>\n  <circle cx="50" cy="24" r="1.5" fill="#1e40af" stroke="none"/>\n</svg>\n';

// assets/icons/flat/digital/lens.svg
var lens_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#111827" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<rect x="10" y="16" width="44" height="32" rx="4" fill="#1f2937" stroke="#111827"/>\n  <circle cx="32" cy="32" r="12" fill="#334155" stroke="#0f172a"/>\n  <circle cx="32" cy="32" r="7" fill="#111827" stroke="#334155"/>\n  <circle cx="28" cy="28" r="2" fill="#94a3b8" stroke="none"/>\n  <path d="M14 22 H50 M14 42 H50" stroke="#64748b"/>\n</svg>\n';

// assets/icons/flat/digital/game-controller.svg
var game_controller_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#b45309" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<path d="M12 24 q-6 0 -6 8 v10 q0 8 8 8 q4 0 6 -4 l4 -6 h16 l4 6 q2 4 6 4 q8 0 8 -8 V32 q0 -8 -6 -8 H12 Z"\n    fill="#fef3c7" stroke="#b45309"/>\n  <circle cx="18" cy="34" r="3" fill="#b45309" stroke="none"/>\n  <path d="M14 34 H22 M18 30 V38" stroke="#fef3c7" stroke-width="1.5"/>\n  <circle cx="42" cy="32" r="2" fill="#b45309" stroke="none"/>\n  <circle cx="48" cy="36" r="2" fill="#b45309" stroke="none"/>\n</svg>\n';

// assets/icons/flat/digital/power-bank.svg
var power_bank_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#15803d" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<rect x="14" y="8" width="36" height="48" rx="4" fill="#dcfce7" stroke="#15803d"/>\n  <rect x="26" y="4" width="12" height="6" rx="1" fill="#86efac" stroke="#15803d"/>\n  <rect x="20" y="18" width="24" height="8" rx="1" fill="#86efac" stroke="#15803d"/>\n  <path d="M32 32 L28 42 H34 L30 50" stroke="#15803d" stroke-width="2"/>\n</svg>\n';

// assets/icons/flat/digital/router.svg
var router_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#a16207" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<rect x="8" y="32" width="48" height="18" rx="2" fill="#fef3c7" stroke="#a16207"/>\n  <circle cx="18" cy="41" r="2" fill="#a16207" stroke="none"/>\n  <circle cx="26" cy="41" r="2" fill="#a16207" stroke="none"/>\n  <path d="M32 30 V18 M24 20 q8 -10 16 0 M20 14 q12 -14 24 0" stroke="#a16207"/>\n</svg>\n';

// assets/icons/flat/digital/printer.svg
var printer_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#475569" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<rect x="14" y="10" width="36" height="14" rx="2" fill="#f1f5f9" stroke="#475569"/>\n  <rect x="6" y="22" width="52" height="24" rx="3" fill="#e2e8f0" stroke="#475569"/>\n  <rect x="14" y="38" width="36" height="16" rx="2" fill="#f8fafc" stroke="#475569"/>\n  <path d="M20 44 H44 M20 49 H40" stroke="#475569" stroke-width="1.5"/>\n  <circle cx="50" cy="30" r="1.5" fill="#22c55e" stroke="none"/>\n</svg>\n';

// assets/icons/flat/appliance/sofa.svg
var sofa_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#991b1b" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<path d="M8 30 q0 -10 10 -10 h28 q10 0 10 10 v8" fill="#fee2e2" stroke="#991b1b"/>\n  <rect x="6" y="30" width="52" height="18" rx="4" fill="#fecaca" stroke="#991b1b"/>\n  <rect x="8" y="48" width="6" height="8" fill="#991b1b" stroke="none"/>\n  <rect x="50" y="48" width="6" height="8" fill="#991b1b" stroke="none"/>\n</svg>\n';

// assets/icons/flat/appliance/bed.svg
var bed_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#92400e" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<path d="M6 46 V28 q0 -4 4 -4 h44 q4 0 4 4 V46" fill="#fef3c7" stroke="#92400e"/>\n  <rect x="12" y="28" width="16" height="10" rx="2" fill="#fde68a" stroke="#92400e"/>\n  <rect x="36" y="28" width="16" height="10" rx="2" fill="#fde68a" stroke="#92400e"/>\n  <path d="M4 46 H60 V54 H4 Z" fill="#92400e" stroke="#78350f"/>\n</svg>\n';

// assets/icons/flat/appliance/chair.svg
var chair_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#854d0e" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<path d="M18 8 V36 H46 V8" fill="#fef3c7" stroke="#854d0e"/>\n  <rect x="14" y="36" width="36" height="8" rx="2" fill="#fde68a" stroke="#854d0e"/>\n  <path d="M18 44 V58 M46 44 V58" stroke="#854d0e"/>\n</svg>\n';

// assets/icons/flat/appliance/lamp.svg
var lamp_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#a16207" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<path d="M20 8 H44 L38 26 H26 Z" fill="#fef3c7" stroke="#a16207"/>\n  <path d="M32 26 V48" stroke="#a16207"/>\n  <path d="M18 48 H46 L42 56 H22 Z" fill="#78350f" stroke="#451a03"/>\n</svg>\n';

// assets/icons/flat/appliance/fridge.svg
var fridge_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#0c4a6e" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<rect x="16" y="4" width="32" height="54" rx="2" fill="#e0f2fe" stroke="#0c4a6e"/>\n  <path d="M16 24 H48" stroke="#0c4a6e"/>\n  <rect x="20" y="10" width="4" height="8" fill="#0c4a6e" stroke="none"/>\n  <rect x="20" y="30" width="4" height="10" fill="#0c4a6e" stroke="none"/>\n</svg>\n';

// assets/icons/flat/appliance/washing-machine.svg
var washing_machine_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#1e293b" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<rect x="10" y="6" width="44" height="52" rx="3" fill="#f1f5f9" stroke="#1e293b"/>\n  <circle cx="32" cy="36" r="14" fill="#e0f2fe" stroke="#1e293b"/>\n  <circle cx="32" cy="36" r="9" fill="#bae6fd" stroke="#1e293b"/>\n  <circle cx="18" cy="14" r="1.5" fill="#1e293b" stroke="none"/>\n  <circle cx="24" cy="14" r="1.5" fill="#1e293b" stroke="none"/>\n  <rect x="38" y="12" width="10" height="4" rx="1" fill="#94a3b8" stroke="none"/>\n</svg>\n';

// assets/icons/flat/appliance/air-conditioner.svg
var air_conditioner_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#0369a1" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<rect x="6" y="14" width="52" height="20" rx="4" fill="#e0f2fe" stroke="#0369a1"/>\n  <path d="M10 22 H54 M10 26 H54" stroke="#0369a1" stroke-width="1.5"/>\n  <path d="M20 40 q2 6 -2 12 M32 40 q2 6 -2 12 M44 40 q2 6 -2 12" stroke="#0369a1"/>\n</svg>\n';

// assets/icons/flat/appliance/pot.svg
var pot_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#1e293b" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<path d="M10 24 H54 V44 q0 8 -8 8 H18 q-8 0 -8 -8 Z" fill="#e2e8f0" stroke="#1e293b"/>\n  <path d="M6 22 H14 M50 22 H58" stroke="#1e293b" stroke-width="3"/>\n  <path d="M18 18 q2 -6 4 0 M28 18 q2 -6 4 0 M38 18 q2 -6 4 0" stroke="#64748b"/>\n</svg>\n';

// assets/icons/flat/appliance/coffee.svg
var coffee_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#7c2d12" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<path d="M14 22 H44 V44 q0 6 -6 6 H20 q-6 0 -6 -6 Z" fill="#fef3c7" stroke="#7c2d12"/>\n  <path d="M44 28 H50 q4 0 4 6 q0 6 -4 6 H44" fill="#fef3c7" stroke="#7c2d12"/>\n  <path d="M20 10 q2 -4 0 -8 M28 10 q2 -4 0 -8 M36 10 q2 -4 0 -8" stroke="#7c2d12"/>\n</svg>\n';

// assets/icons/flat/transport/car.svg
var car_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#1d4ed8" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<path d="M6 38 L12 24 q2 -4 6 -4 h28 q4 0 6 4 l6 14 V46 H6 Z"\n    fill="#dbeafe" stroke="#1d4ed8"/>\n  <rect x="16" y="26" width="14" height="10" rx="1" fill="#bfdbfe" stroke="#1d4ed8"/>\n  <rect x="34" y="26" width="14" height="10" rx="1" fill="#bfdbfe" stroke="#1d4ed8"/>\n  <circle cx="18" cy="46" r="5" fill="#1e293b" stroke="#0f172a"/>\n  <circle cx="46" cy="46" r="5" fill="#1e293b" stroke="#0f172a"/>\n</svg>\n';

// assets/icons/flat/transport/motorbike.svg
var motorbike_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#dc2626" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<circle cx="14" cy="44" r="10" fill="#f1f5f9" stroke="#dc2626"/>\n  <circle cx="50" cy="44" r="10" fill="#f1f5f9" stroke="#dc2626"/>\n  <path d="M14 44 L28 24 H42 L50 44" fill="#fecaca" stroke="#dc2626"/>\n  <path d="M40 20 H52" stroke="#dc2626" stroke-width="3"/>\n</svg>\n';

// assets/icons/flat/transport/bike.svg
var bike_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#0f766e" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<circle cx="14" cy="46" r="10" fill="none" stroke="#0f766e"/>\n  <circle cx="50" cy="46" r="10" fill="none" stroke="#0f766e"/>\n  <path d="M14 46 L26 26 L44 26 L50 46 M26 26 L42 46" stroke="#0f766e"/>\n  <path d="M24 22 H30 M40 22 H48" stroke="#0f766e"/>\n</svg>\n';

// assets/icons/flat/transport/scooter.svg
var scooter_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#b91c1c" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<circle cx="12" cy="50" r="6" fill="none" stroke="#b91c1c"/>\n  <circle cx="52" cy="50" r="6" fill="none" stroke="#b91c1c"/>\n  <path d="M12 50 L26 50 L44 20 L50 20 L50 50" stroke="#b91c1c"/>\n  <path d="M44 14 H54" stroke="#b91c1c" stroke-width="3"/>\n</svg>\n';

// assets/icons/flat/transport/plane.svg
var plane_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#1d4ed8" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<path d="M4 34 L28 30 L20 10 L28 8 L40 28 L58 26 L60 34 L40 38 L32 56 L26 56 L28 38 L4 40 Z"\n    fill="#dbeafe" stroke="#1d4ed8"/>\n</svg>\n';

// assets/icons/flat/hobby/guitar.svg
var guitar_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#9a3412" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<path d="M20 32 q-14 4 -14 16 q0 10 10 10 q12 0 16 -12 l6 -14" fill="#fed7aa" stroke="#9a3412"/>\n  <path d="M32 30 L50 6 L58 10 L52 18 L46 26 Z" fill="#fde68a" stroke="#9a3412"/>\n  <circle cx="18" cy="46" r="3" fill="#9a3412" stroke="none"/>\n</svg>\n';

// assets/icons/flat/hobby/palette.svg
var palette_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#78350f" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<path d="M32 8 q24 0 24 20 q0 10 -10 10 h-6 q-4 0 -4 4 q0 4 2 6 q2 4 -4 6 q-26 0 -26 -24 q0 -22 24 -22 Z"\n    fill="#fef3c7" stroke="#78350f"/>\n  <circle cx="18" cy="26" r="3" fill="#dc2626" stroke="none"/>\n  <circle cx="26" cy="18" r="3" fill="#f59e0b" stroke="none"/>\n  <circle cx="38" cy="16" r="3" fill="#16a34a" stroke="none"/>\n  <circle cx="46" cy="24" r="3" fill="#2563eb" stroke="none"/>\n</svg>\n';

// assets/icons/flat/hobby/ball.svg
var ball_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#b45309" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<circle cx="32" cy="32" r="22" fill="#fef3c7" stroke="#b45309"/>\n  <path d="M32 10 V54 M10 32 H54" stroke="#b45309"/>\n  <path d="M14 20 q18 24 36 0 M14 44 q18 -24 36 0" stroke="#b45309"/>\n</svg>\n';

// assets/icons/flat/hobby/basketball.svg
var basketball_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#9a3412" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<circle cx="32" cy="32" r="22" fill="#fb923c" stroke="#9a3412"/>\n  <path d="M32 10 V54 M10 32 H54 M16 16 Q32 32 16 48 M48 16 Q32 32 48 48" stroke="#9a3412"/>\n</svg>\n';

// assets/icons/flat/hobby/book.svg
var book_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#334155" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<path d="M8 10 H28 q4 0 4 4 v40 q0 -4 -4 -4 H8 Z" fill="#fee2e2" stroke="#991b1b"/>\n  <path d="M56 10 H36 q-4 0 -4 4 v40 q0 -4 4 -4 H56 Z" fill="#dbeafe" stroke="#1e3a8a"/>\n  <path d="M12 18 H24 M12 24 H22 M40 18 H52 M40 24 H50" stroke="#64748b" stroke-width="1.5"/>\n</svg>\n';

// assets/icons/flat/hobby/toy.svg
var toy_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#991b1b" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<circle cx="32" cy="22" r="12" fill="#fecaca" stroke="#991b1b"/>\n  <circle cx="28" cy="20" r="1.5" fill="#991b1b" stroke="none"/>\n  <circle cx="36" cy="20" r="1.5" fill="#991b1b" stroke="none"/>\n  <path d="M28 26 q4 3 8 0" stroke="#991b1b"/>\n  <path d="M20 34 q0 -4 12 -4 q12 0 12 4 v18 q0 4 -4 4 H24 q-4 0 -4 -4 Z"\n    fill="#fecaca" stroke="#991b1b"/>\n</svg>\n';

// assets/icons/flat/hobby/dice.svg
var dice_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#78350f" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<rect x="10" y="10" width="44" height="44" rx="6" fill="#fef3c7" stroke="#78350f"/>\n  <circle cx="20" cy="20" r="2.5" fill="#78350f" stroke="none"/>\n  <circle cx="44" cy="20" r="2.5" fill="#78350f" stroke="none"/>\n  <circle cx="32" cy="32" r="2.5" fill="#78350f" stroke="none"/>\n  <circle cx="20" cy="44" r="2.5" fill="#78350f" stroke="none"/>\n  <circle cx="44" cy="44" r="2.5" fill="#78350f" stroke="none"/>\n</svg>\n';

// assets/icons/flat/clothing/shirt.svg
var shirt_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#3730a3" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<path d="M10 18 L22 8 q4 8 10 8 q6 0 10 -8 L54 18 L48 28 L42 24 V56 H22 V24 L16 28 Z"\n    fill="#e0e7ff" stroke="#3730a3"/>\n</svg>\n';

// assets/icons/flat/clothing/shoe.svg
var shoe_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#854d0e" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<path d="M6 44 q0 -16 14 -16 L34 28 q6 0 10 6 l12 6 q6 2 4 8 q-2 4 -8 4 H10 q-4 0 -4 -4 Z"\n    fill="#fde68a" stroke="#854d0e"/>\n  <path d="M18 34 L22 40 M26 32 L30 38 M34 32 L38 38" stroke="#854d0e"/>\n</svg>\n';

// assets/icons/flat/clothing/bag.svg
var bag_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#7c2d12" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<path d="M22 20 q0 -10 10 -10 q10 0 10 10" fill="none" stroke="#7c2d12"/>\n  <path d="M10 20 H54 L50 56 H14 Z" fill="#fed7aa" stroke="#7c2d12"/>\n</svg>\n';

// assets/icons/flat/clothing/backpack.svg
var backpack_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#14532d" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<path d="M20 10 q0 -4 12 -4 q12 0 12 4 V18" fill="none" stroke="#14532d"/>\n  <rect x="14" y="18" width="36" height="40" rx="6" fill="#bbf7d0" stroke="#14532d"/>\n  <rect x="22" y="30" width="20" height="14" rx="2" fill="#86efac" stroke="#14532d"/>\n</svg>\n';

// assets/icons/flat/clothing/hat.svg
var hat_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#0f172a" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<path d="M12 38 q0 -26 20 -26 q20 0 20 26" fill="#1f2937" stroke="#0f172a"/>\n  <rect x="6" y="38" width="52" height="6" rx="2" fill="#111827" stroke="#0f172a"/>\n</svg>\n';

// assets/icons/flat/misc/toolbox.svg
var toolbox_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#7f1d1d" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<path d="M22 16 q0 -6 10 -6 q10 0 10 6" fill="none" stroke="#7f1d1d"/>\n  <rect x="8" y="16" width="48" height="34" rx="3" fill="#fecaca" stroke="#7f1d1d"/>\n  <path d="M8 28 H56" stroke="#7f1d1d"/>\n  <rect x="26" y="20" width="12" height="4" rx="1" fill="#7f1d1d" stroke="none"/>\n</svg>\n';

// assets/icons/flat/misc/key.svg
var key_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#a16207" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<circle cx="18" cy="32" r="10" fill="none" stroke="#a16207"/>\n  <circle cx="18" cy="32" r="3" fill="#a16207" stroke="none"/>\n  <path d="M28 32 H56 M50 32 V40 M44 32 V38" stroke="#a16207"/>\n</svg>\n';

// assets/icons/flat/misc/gift.svg
var gift_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#991b1b" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<rect x="6" y="24" width="52" height="30" rx="2" fill="#fecaca" stroke="#991b1b"/>\n  <path d="M32 24 V54" stroke="#991b1b"/>\n  <path d="M6 24 H58" stroke="#991b1b"/>\n  <path d="M32 24 q-8 -12 -16 -4 q-2 4 2 8 q8 4 14 -4" fill="#fee2e2" stroke="#991b1b"/>\n  <path d="M32 24 q8 -12 16 -4 q2 4 -2 8 q-8 4 -14 -4" fill="#fee2e2" stroke="#991b1b"/>\n</svg>\n';

// assets/icons/flat/misc/star.svg
var star_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#a16207" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<path d="M32 6 L39 24 L58 26 L44 39 L48 58 L32 48 L16 58 L20 39 L6 26 L25 24 Z"\n    fill="#fde68a" stroke="#a16207"/>\n</svg>\n';

// assets/icons/flat/misc/trophy.svg
var trophy_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#a16207" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<path d="M18 8 H46 V26 q0 10 -14 10 q-14 0 -14 -10 Z" fill="#fde68a" stroke="#a16207"/>\n  <path d="M18 14 H8 q0 10 10 12 M46 14 H56 q0 10 -10 12" fill="none" stroke="#a16207"/>\n  <rect x="26" y="36" width="12" height="8" fill="#fbbf24" stroke="#a16207"/>\n  <rect x="20" y="44" width="24" height="6" rx="1" fill="#a16207" stroke="none"/>\n</svg>\n';

// assets/icons/flat/misc/box.svg
var box_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#78350f" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<path d="M6 18 L32 6 L58 18 V46 L32 58 L6 46 Z" fill="#fde68a" stroke="#78350f"/>\n  <path d="M6 18 L32 30 L58 18 M32 30 V58" stroke="#78350f"/>\n</svg>\n';

// assets/icons/flat/misc/heart.svg
var heart_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#b91c1c" stroke-width="2.5"\n  stroke-linecap="round" stroke-linejoin="round">\n<path d="M32 54 Q4 36 12 18 Q20 6 32 18 Q44 6 52 18 Q60 36 32 54 Z"\n    fill="#fecaca" stroke="#b91c1c"/>\n</svg>\n';

// assets/icons/flat/money/banknote.svg
var banknote_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#16a34a" stroke-width="3"\n  stroke-linecap="round" stroke-linejoin="round">\n<rect x="6" y="16" width="52" height="32" rx="3" fill="#d1fae5" stroke="#16a34a"/>\n  <circle cx="32" cy="32" r="7" fill="#ffffff" stroke="#16a34a"/>\n  <text x="32" y="35" text-anchor="middle" font-family="Arial, sans-serif"\n    font-size="9" font-weight="900" fill="#16a34a" stroke="none">$</text>\n  <circle cx="14" cy="32" r="2" fill="#16a34a" stroke="none"/>\n  <circle cx="50" cy="32" r="2" fill="#16a34a" stroke="none"/>\n</svg>\n';

// assets/icons/flat/money/yen-banknote.svg
var yen_banknote_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#dc2626" stroke-width="3"\n  stroke-linecap="round" stroke-linejoin="round">\n<rect x="6" y="16" width="52" height="32" rx="3" fill="#fee2e2" stroke="#dc2626"/>\n  <circle cx="32" cy="32" r="7" fill="#ffffff" stroke="#dc2626"/>\n  <text x="32" y="35" text-anchor="middle" font-family="Arial, sans-serif"\n    font-size="9" font-weight="900" fill="#dc2626" stroke="none">\xA5</text>\n  <circle cx="14" cy="32" r="2" fill="#dc2626" stroke="none"/>\n  <circle cx="50" cy="32" r="2" fill="#dc2626" stroke="none"/>\n</svg>\n';

// assets/icons/flat/money/coin.svg
var coin_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#d97706" stroke-width="3"\n  stroke-linecap="round" stroke-linejoin="round">\n<circle cx="32" cy="32" r="22" fill="#fde68a" stroke="#d97706"/>\n  <circle cx="32" cy="32" r="16" fill="none" stroke="#d97706"/>\n  <text x="32" y="38" text-anchor="middle" font-family="Arial, sans-serif"\n    font-size="18" font-weight="900" fill="#d97706" stroke="none">\xA5</text>\n</svg>\n';

// assets/icons/flat/money/coin-stack.svg
var coin_stack_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#d97706" stroke-width="3"\n  stroke-linecap="round" stroke-linejoin="round">\n<ellipse cx="32" cy="20" rx="16" ry="5" fill="#fde68a" stroke="#d97706"/>\n  <path d="M16 20 V28" stroke="#d97706"/>\n  <path d="M48 20 V28" stroke="#d97706"/>\n  <ellipse cx="32" cy="28" rx="16" ry="5" fill="#fde68a" stroke="#d97706"/>\n  <path d="M16 28 V38" stroke="#d97706"/>\n  <path d="M48 28 V38" stroke="#d97706"/>\n  <ellipse cx="32" cy="38" rx="16" ry="5" fill="#fde68a" stroke="#d97706"/>\n  <path d="M16 38 V48" stroke="#d97706"/>\n  <path d="M48 38 V48" stroke="#d97706"/>\n  <ellipse cx="32" cy="48" rx="16" ry="5" fill="#fcd34d" stroke="#d97706"/>\n</svg>\n';

// assets/icons/flat/money/money-bag.svg
var money_bag_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#92400e" stroke-width="3"\n  stroke-linecap="round" stroke-linejoin="round">\n<path d="M20 14 h24 l-4 8 h-16 z" fill="#fde68a" stroke="#92400e"/>\n  <path d="M16 22 q16 4 32 0 q8 12 2 24 q-8 10 -18 10 q-10 0 -18 -10 q-6 -12 2 -24 z"\n    fill="#fbbf24" stroke="#92400e"/>\n  <text x="32" y="42" text-anchor="middle" font-family="Arial, sans-serif"\n    font-size="14" font-weight="900" fill="#92400e" stroke="none">$</text>\n</svg>\n';

// assets/icons/flat/money/wallet.svg
var wallet_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#92400e" stroke-width="3"\n  stroke-linecap="round" stroke-linejoin="round">\n<rect x="8" y="16" width="48" height="34" rx="4" fill="#fde68a" stroke="#92400e"/>\n  <path d="M8 24 h48" stroke="#92400e"/>\n  <rect x="36" y="30" width="18" height="10" rx="2" fill="#fbbf24" stroke="#92400e"/>\n  <circle cx="46" cy="35" r="1.8" fill="#92400e" stroke="none"/>\n</svg>\n';

// assets/icons/flat/money/credit-card.svg
var credit_card_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#1e40af" stroke-width="3"\n  stroke-linecap="round" stroke-linejoin="round">\n<rect x="6" y="14" width="52" height="36" rx="4" fill="#60a5fa" stroke="#1e40af"/>\n  <rect x="6" y="22" width="52" height="7" fill="#1e40af" stroke="none"/>\n  <rect x="12" y="36" width="10" height="5" rx="1" fill="#fde68a" stroke="#1e40af"/>\n  <rect x="26" y="42" width="24" height="3" fill="#1e40af" stroke="none"/>\n</svg>\n';

// assets/icons/flat/money/bank.svg
var bank_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#0f172a" stroke-width="3"\n  stroke-linecap="round" stroke-linejoin="round">\n<path d="M8 24 L32 10 L56 24 H8 Z" fill="#cbd5e1" stroke="#0f172a"/>\n  <path d="M10 24 V50" stroke="#0f172a"/>\n  <path d="M54 24 V50" stroke="#0f172a"/>\n  <path d="M18 28 V46" stroke="#0f172a"/>\n  <path d="M26 28 V46" stroke="#0f172a"/>\n  <path d="M38 28 V46" stroke="#0f172a"/>\n  <path d="M46 28 V46" stroke="#0f172a"/>\n  <path d="M6 52 H58" stroke="#0f172a"/>\n</svg>\n';

// assets/icons/flat/money/safe.svg
var safe_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#334155" stroke-width="3"\n  stroke-linecap="round" stroke-linejoin="round">\n<rect x="8" y="12" width="48" height="40" rx="3" fill="#94a3b8" stroke="#334155"/>\n  <rect x="14" y="18" width="30" height="28" rx="2" fill="#cbd5e1" stroke="#334155"/>\n  <circle cx="29" cy="32" r="6" fill="#ffffff" stroke="#334155"/>\n  <path d="M29 26 V38 M23 32 H35" stroke="#334155"/>\n  <path d="M50 24 V30" stroke="#334155"/>\n  <path d="M50 34 V40" stroke="#334155"/>\n  <path d="M12 52 V56 M20 52 V56 M44 52 V56 M52 52 V56" stroke="#334155"/>\n</svg>\n';

// assets/icons/flat/money/piggy-bank.svg
var piggy_bank_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#be185d" stroke-width="3"\n  stroke-linecap="round" stroke-linejoin="round">\n<path d="M12 34 q0 -14 18 -14 q6 0 10 3 l8 -4 l-2 8 q6 7 6 14 q0 4 -2 7 h-4 v4 h-6 v-4 h-12 v4 h-6 v-4 q-8 -4 -10 -12 z"\n    fill="#f9a8d4" stroke="#be185d"/>\n  <circle cx="42" cy="32" r="2" fill="#be185d" stroke="none"/>\n  <rect x="22" y="22" width="10" height="3" rx="1" fill="#be185d" stroke="none"/>\n  <path d="M8 34 h6" stroke="#be185d"/>\n</svg>\n';

// assets/icons/flat/money/chart-up.svg
var chart_up_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#16a34a" stroke-width="3"\n  stroke-linecap="round" stroke-linejoin="round">\n<path d="M8 52 V12" stroke="#16a34a"/>\n  <path d="M8 52 H58" stroke="#16a34a"/>\n  <path d="M14 44 L26 32 L36 38 L54 18" fill="none" stroke="#16a34a"/>\n  <path d="M46 18 H54 V26" stroke="#16a34a"/>\n  <circle cx="14" cy="44" r="2.5" fill="#16a34a" stroke="none"/>\n  <circle cx="26" cy="32" r="2.5" fill="#16a34a" stroke="none"/>\n  <circle cx="36" cy="38" r="2.5" fill="#16a34a" stroke="none"/>\n  <circle cx="54" cy="18" r="2.5" fill="#16a34a" stroke="none"/>\n</svg>\n';

// assets/icons/flat/money/chart-down.svg
var chart_down_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#dc2626" stroke-width="3"\n  stroke-linecap="round" stroke-linejoin="round">\n<path d="M8 52 V12" stroke="#dc2626"/>\n  <path d="M8 52 H58" stroke="#dc2626"/>\n  <path d="M14 18 L26 30 L36 22 L54 46" fill="none" stroke="#dc2626"/>\n  <path d="M46 46 H54 V38" stroke="#dc2626"/>\n</svg>\n';

// assets/icons/flat/money/receipt.svg
var receipt_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#334155" stroke-width="3"\n  stroke-linecap="round" stroke-linejoin="round">\n<path d="M14 10 H50 V54 L44 50 L38 54 L32 50 L26 54 L20 50 L14 54 Z"\n    fill="#ffffff" stroke="#334155"/>\n  <path d="M20 20 H44" stroke="#334155"/>\n  <path d="M20 28 H44" stroke="#334155"/>\n  <path d="M20 36 H36" stroke="#334155"/>\n</svg>\n';

// assets/icons/flat/money/hand-coin.svg
var hand_coin_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#9a3412" stroke-width="3"\n  stroke-linecap="round" stroke-linejoin="round">\n<circle cx="40" cy="24" r="12" fill="#fde68a" stroke="#d97706"/>\n  <text x="40" y="29" text-anchor="middle" font-family="Arial, sans-serif"\n    font-size="12" font-weight="900" fill="#d97706" stroke="none">$</text>\n  <path d="M8 52 q8 -14 24 -14 q12 0 20 6 l-4 6 q-8 -4 -16 -2 q-8 2 -16 10 z"\n    fill="#fdba74" stroke="#9a3412"/>\n</svg>\n';

// assets/icons/flat/money/dollar.svg
var dollar_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#15803d" stroke-width="3"\n  stroke-linecap="round" stroke-linejoin="round">\n<circle cx="32" cy="32" r="22" fill="#dcfce7" stroke="#15803d"/>\n  <text x="32" y="41" text-anchor="middle" font-family="Arial, sans-serif"\n    font-size="28" font-weight="900" fill="#15803d" stroke="none">$</text>\n</svg>\n';

// assets/icons/flat/money/yen.svg
var yen_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#b91c1c" stroke-width="3"\n  stroke-linecap="round" stroke-linejoin="round">\n<circle cx="32" cy="32" r="22" fill="#fee2e2" stroke="#b91c1c"/>\n  <text x="32" y="41" text-anchor="middle" font-family="Arial, sans-serif"\n    font-size="28" font-weight="900" fill="#b91c1c" stroke="none">\xA5</text>\n</svg>\n';

// assets/icons/flat/money/house.svg
var house_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#92400e" stroke-width="3"\n  stroke-linecap="round" stroke-linejoin="round">\n  <path d="M8 30 L32 10 L56 30" fill="#fde68a" stroke="#92400e"/>\n  <path d="M14 28 V52 H50 V28" fill="#fef3c7" stroke="#92400e"/>\n  <rect x="26" y="36" width="12" height="16" rx="1" fill="#fbbf24" stroke="#92400e"/>\n  <rect x="18" y="34" width="6" height="6" rx="1" fill="#fbbf24" stroke="#92400e"/>\n  <rect x="40" y="34" width="6" height="6" rx="1" fill="#fbbf24" stroke="#92400e"/>\n  <path d="M30 10 V4 H38 V14" fill="#fbbf24" stroke="#92400e"/>\n</svg>\n';

// assets/icons/flat/money/hospital.svg
var hospital_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#b91c1c" stroke-width="3"\n  stroke-linecap="round" stroke-linejoin="round">\n  <rect x="8" y="18" width="48" height="38" rx="3" fill="#fef2f2" stroke="#b91c1c"/>\n  <rect x="22" y="8" width="20" height="12" rx="2" fill="#fee2e2" stroke="#b91c1c"/>\n  <path d="M32 28 V46 M22 37 H42" stroke="#b91c1c" stroke-width="5"/>\n  <rect x="14" y="48" width="6" height="6" rx="1" fill="#fee2e2" stroke="#b91c1c" stroke-width="2"/>\n  <rect x="44" y="48" width="6" height="6" rx="1" fill="#fee2e2" stroke="#b91c1c" stroke-width="2"/>\n</svg>\n';

// assets/icons/flat/money/stock.svg
var stock_default = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <circle cx="32" cy="32" r="26" fill="#fde68a" stroke="#b45309" stroke-width="3"/>
  <circle cx="32" cy="32" r="20" fill="none" stroke="#b45309" stroke-width="1.5"/>
  <text x="32" y="42" text-anchor="middle"
    font-family="'PingFang SC','Microsoft YaHei','Hiragino Sans GB',sans-serif"
    font-size="30" font-weight="900" fill="#b45309">\u80A1</text>
</svg>
`;

// assets/icons/flat/money/fund.svg
var fund_default = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <circle cx="32" cy="32" r="26" fill="#fde68a" stroke="#b45309" stroke-width="3"/>
  <circle cx="32" cy="32" r="20" fill="none" stroke="#b45309" stroke-width="1.5"/>
  <text x="32" y="42" text-anchor="middle"
    font-family="'PingFang SC','Microsoft YaHei','Hiragino Sans GB',sans-serif"
    font-size="30" font-weight="900" fill="#b45309">\u57FA</text>
</svg>
`;

// assets/icons/flat/money/loan.svg
var loan_default = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <circle cx="32" cy="32" r="26" fill="#fde68a" stroke="#b45309" stroke-width="3"/>
  <circle cx="32" cy="32" r="20" fill="none" stroke="#b45309" stroke-width="1.5"/>
  <text x="32" y="42" text-anchor="middle"
    font-family="'PingFang SC','Microsoft YaHei','Hiragino Sans GB',sans-serif"
    font-size="30" font-weight="900" fill="#b45309">\u8D37</text>
</svg>
`;

// assets/icons/flat/money/borrow.svg
var borrow_default = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <circle cx="32" cy="32" r="26" fill="#fde68a" stroke="#b45309" stroke-width="3"/>
  <circle cx="32" cy="32" r="20" fill="none" stroke="#b45309" stroke-width="1.5"/>
  <text x="32" y="42" text-anchor="middle"
    font-family="'PingFang SC','Microsoft YaHei','Hiragino Sans GB',sans-serif"
    font-size="30" font-weight="900" fill="#b45309">\u501F</text>
</svg>
`;

// assets/icons/flat/money/lend-out.svg
var lend_out_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"\n  fill="none" stroke="#15803d" stroke-width="3"\n  stroke-linecap="round" stroke-linejoin="round">\n  <path d="M6 44 q4 -10 14 -10 q6 0 12 4 q6 4 14 4 q8 0 12 -6"\n    fill="#dcfce7" stroke="#15803d"/>\n  <circle cx="48" cy="22" r="9" fill="#fde68a" stroke="#b45309"/>\n  <text x="48" y="27" text-anchor="middle"\n    font-family="Arial, sans-serif" font-size="11" font-weight="900"\n    fill="#b45309" stroke="none">\xA5</text>\n  <path d="M48 32 L42 40 M48 32 L54 40" stroke="#15803d" stroke-width="3"/>\n  <path d="M14 50 V58 M30 52 V58 M46 52 V58" stroke="#15803d"/>\n</svg>\n';

// assets/icons/iso3d/digital/camera.svg
var camera_default2 = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">\n<defs>\n    <linearGradient id="c3dBody" x1="0" y1="0" x2="0" y2="1">\n      <stop offset="0" stop-color="#475569"/>\n      <stop offset="1" stop-color="#1e293b"/>\n    </linearGradient>\n    <radialGradient id="c3dLens" cx="0.5" cy="0.5" r="0.6">\n      <stop offset="0" stop-color="#60a5fa"/>\n      <stop offset="0.7" stop-color="#1e3a8a"/>\n      <stop offset="1" stop-color="#020617"/>\n    </radialGradient>\n  </defs>\n  <ellipse cx="32" cy="56" rx="18" ry="2.5" fill="rgba(0,0,0,0.18)"/>\n  <path d="M8 22 h12 l4 -6 h16 l4 6 h12 v24 h-48 z" fill="url(#c3dBody)"/>\n  <path d="M8 22 h48 v4 h-48 z" fill="rgba(255,255,255,0.15)"/>\n  <circle cx="32" cy="34" r="11" fill="#0f172a"/>\n  <circle cx="32" cy="34" r="9" fill="url(#c3dLens)"/>\n  <circle cx="28" cy="30" r="2.5" fill="rgba(255,255,255,0.55)"/>\n  <rect x="46" y="26" width="4" height="3" rx="1" fill="#ef4444"/>\n</svg>\n';

// assets/icons/iso3d/digital/lens.svg
var lens_default2 = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">\n<defs>\n    <linearGradient id="l3dBody" x1="0" y1="0" x2="0" y2="1">\n      <stop offset="0" stop-color="#334155"/>\n      <stop offset="0.5" stop-color="#0f172a"/>\n      <stop offset="1" stop-color="#334155"/>\n    </linearGradient>\n    <radialGradient id="l3dGlass" cx="0.5" cy="0.5" r="0.6">\n      <stop offset="0" stop-color="#93c5fd"/>\n      <stop offset="0.7" stop-color="#1e40af"/>\n      <stop offset="1" stop-color="#020617"/>\n    </radialGradient>\n  </defs>\n  <ellipse cx="32" cy="56" rx="18" ry="2.5" fill="rgba(0,0,0,0.18)"/>\n  <rect x="14" y="14" width="36" height="38" rx="4" fill="url(#l3dBody)"/>\n  <rect x="14" y="20" width="36" height="3" fill="rgba(239,68,68,0.9)"/>\n  <rect x="14" y="32" width="36" height="2" fill="rgba(255,255,255,0.25)"/>\n  <rect x="14" y="40" width="36" height="2" fill="rgba(255,255,255,0.18)"/>\n  <ellipse cx="32" cy="52" rx="18" ry="4" fill="#0f172a"/>\n  <ellipse cx="32" cy="52" rx="14" ry="3" fill="url(#l3dGlass)"/>\n  <ellipse cx="28" cy="50" rx="3" ry="1" fill="rgba(255,255,255,0.5)"/>\n</svg>\n';

// assets/icons/iso3d/digital/phone.svg
var phone_default2 = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">\n<defs>\n    <linearGradient id="p3dBody" x1="0" y1="0" x2="1" y2="1">\n      <stop offset="0" stop-color="#1e293b"/>\n      <stop offset="1" stop-color="#475569"/>\n    </linearGradient>\n    <linearGradient id="p3dScreen" x1="0" y1="0" x2="0" y2="1">\n      <stop offset="0" stop-color="#38bdf8"/>\n      <stop offset="1" stop-color="#1e3a8a"/>\n    </linearGradient>\n  </defs>\n  <ellipse cx="32" cy="56" rx="18" ry="2.5" fill="rgba(0,0,0,0.18)"/>\n  <rect x="18" y="6" width="28" height="48" rx="5" fill="url(#p3dBody)"/>\n  <rect x="21" y="10" width="22" height="38" rx="2" fill="url(#p3dScreen)"/>\n  <rect x="21" y="10" width="22" height="10" fill="rgba(255,255,255,0.18)"/>\n  <circle cx="32" cy="51" r="1.5" fill="rgba(255,255,255,0.5)"/>\n</svg>\n';

// assets/icons/iso3d/digital/tablet.svg
var tablet_default2 = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">\n<defs>\n    <linearGradient id="t3dBody" x1="0" y1="0" x2="1" y2="1">\n      <stop offset="0" stop-color="#334155"/>\n      <stop offset="1" stop-color="#0f172a"/>\n    </linearGradient>\n    <linearGradient id="t3dScreen" x1="0" y1="0" x2="1" y2="1">\n      <stop offset="0" stop-color="#a78bfa"/>\n      <stop offset="1" stop-color="#4c1d95"/>\n    </linearGradient>\n  </defs>\n  <ellipse cx="32" cy="56" rx="18" ry="2.5" fill="rgba(0,0,0,0.18)"/>\n  <rect x="10" y="8" width="44" height="46" rx="4" fill="url(#t3dBody)"/>\n  <rect x="13" y="11" width="38" height="40" rx="1" fill="url(#t3dScreen)"/>\n  <path d="M13 11 h38 v14 l-38 6 z" fill="rgba(255,255,255,0.2)"/>\n</svg>\n';

// assets/icons/iso3d/digital/laptop.svg
var laptop_default2 = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">\n<defs>\n    <linearGradient id="lp3dScreen" x1="0" y1="0" x2="0" y2="1">\n      <stop offset="0" stop-color="#60a5fa"/>\n      <stop offset="1" stop-color="#1e3a8a"/>\n    </linearGradient>\n    <linearGradient id="lp3dBase" x1="0" y1="0" x2="0" y2="1">\n      <stop offset="0" stop-color="#cbd5e1"/>\n      <stop offset="1" stop-color="#64748b"/>\n    </linearGradient>\n  </defs>\n  <ellipse cx="32" cy="56" rx="18" ry="2.5" fill="rgba(0,0,0,0.18)"/>\n  <path d="M10 14 h44 v28 h-44 z" fill="#1e293b"/>\n  <rect x="13" y="17" width="38" height="22" fill="url(#lp3dScreen)"/>\n  <path d="M13 17 h38 v7 l-38 4 z" fill="rgba(255,255,255,0.18)"/>\n  <path d="M4 42 h56 l-4 8 h-48 z" fill="url(#lp3dBase)"/>\n  <path d="M26 42 h12 l-1 2 h-10 z" fill="#475569"/>\n</svg>\n';

// assets/icons/iso3d/digital/drone.svg
var drone_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">\n<defs>\n    <linearGradient id="d3dBody" x1="0" y1="0" x2="0" y2="1">\n      <stop offset="0" stop-color="#e5e7eb"/>\n      <stop offset="1" stop-color="#6b7280"/>\n    </linearGradient>\n  </defs>\n  <ellipse cx="32" cy="56" rx="18" ry="2.5" fill="rgba(0,0,0,0.18)"/>\n  <path d="M6 20 l10 -4 l10 4 l-10 4 z" fill="#94a3b8"/>\n  <path d="M38 20 l10 -4 l10 4 l-10 4 z" fill="#94a3b8"/>\n  <path d="M6 44 l10 -4 l10 4 l-10 4 z" fill="#94a3b8"/>\n  <path d="M38 44 l10 -4 l10 4 l-10 4 z" fill="#94a3b8"/>\n  <path d="M16 20 l16 -4 l16 4 l-16 4 z" fill="#cbd5e1" opacity="0.5"/>\n  <path d="M16 44 l16 -4 l16 4 l-16 4 z" fill="#cbd5e1" opacity="0.5"/>\n  <ellipse cx="32" cy="32" rx="14" ry="8" fill="url(#d3dBody)"/>\n  <ellipse cx="32" cy="30" rx="14" ry="7" fill="rgba(255,255,255,0.3)"/>\n  <circle cx="32" cy="34" r="4" fill="#1e293b"/>\n  <circle cx="32" cy="34" r="2.5" fill="#38bdf8"/>\n</svg>\n';

// assets/icons/iso3d/digital/action-cam.svg
var action_cam_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">\n<defs>\n    <linearGradient id="ac3dBody" x1="0" y1="0" x2="0" y2="1">\n      <stop offset="0" stop-color="#64748b"/>\n      <stop offset="1" stop-color="#1e293b"/>\n    </linearGradient>\n    <radialGradient id="ac3dLens" cx="0.5" cy="0.5" r="0.6">\n      <stop offset="0" stop-color="#7dd3fc"/>\n      <stop offset="0.7" stop-color="#1e3a8a"/>\n      <stop offset="1" stop-color="#020617"/>\n    </radialGradient>\n  </defs>\n  <ellipse cx="32" cy="56" rx="18" ry="2.5" fill="rgba(0,0,0,0.18)"/>\n  <rect x="14" y="16" width="36" height="30" rx="4" fill="url(#ac3dBody)"/>\n  <rect x="14" y="16" width="36" height="8" rx="4" fill="rgba(255,255,255,0.18)"/>\n  <circle cx="32" cy="32" r="9" fill="#0f172a"/>\n  <circle cx="32" cy="32" r="7" fill="url(#ac3dLens)"/>\n  <circle cx="28" cy="29" r="2" fill="rgba(255,255,255,0.55)"/>\n  <rect x="18" y="40" width="6" height="2" rx="1" fill="#f87171"/>\n</svg>\n';

// assets/icons/iso3d/digital/gimbal-cam.svg
var gimbal_cam_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">\n<defs>\n    <linearGradient id="gc3dBody" x1="0" y1="0" x2="0" y2="1">\n      <stop offset="0" stop-color="#475569"/>\n      <stop offset="1" stop-color="#0f172a"/>\n    </linearGradient>\n    <radialGradient id="gc3dLens" cx="0.5" cy="0.5" r="0.6">\n      <stop offset="0" stop-color="#86efac"/>\n      <stop offset="0.7" stop-color="#14532d"/>\n      <stop offset="1" stop-color="#020617"/>\n    </radialGradient>\n  </defs>\n  <ellipse cx="32" cy="56" rx="18" ry="2.5" fill="rgba(0,0,0,0.18)"/>\n  <rect x="24" y="6" width="16" height="20" rx="2" fill="url(#gc3dBody)"/>\n  <circle cx="32" cy="16" r="5" fill="#0f172a"/>\n  <circle cx="32" cy="16" r="3.5" fill="url(#gc3dLens)"/>\n  <rect x="20" y="24" width="24" height="6" rx="2" fill="#334155"/>\n  <rect x="26" y="30" width="12" height="24" rx="3" fill="url(#gc3dBody)"/>\n  <rect x="28" y="36" width="8" height="4" rx="1" fill="#1e293b"/>\n  <circle cx="32" cy="46" r="2" fill="#ef4444"/>\n</svg>\n';

// assets/icons/iso3d/digital/projector.svg
var projector_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">\n<defs>\n    <linearGradient id="pj3dBody" x1="0" y1="0" x2="0" y2="1">\n      <stop offset="0" stop-color="#f3f4f6"/>\n      <stop offset="1" stop-color="#6b7280"/>\n    </linearGradient>\n    <radialGradient id="pj3dLens" cx="0.5" cy="0.5" r="0.6">\n      <stop offset="0" stop-color="#fef3c7"/>\n      <stop offset="0.7" stop-color="#92400e"/>\n      <stop offset="1" stop-color="#1c1917"/>\n    </radialGradient>\n  </defs>\n  <ellipse cx="32" cy="56" rx="18" ry="2.5" fill="rgba(0,0,0,0.18)"/>\n  <rect x="8" y="20" width="48" height="28" rx="4" fill="url(#pj3dBody)"/>\n  <rect x="8" y="20" width="48" height="8" rx="4" fill="rgba(255,255,255,0.4)"/>\n  <circle cx="22" cy="34" r="9" fill="#1e293b"/>\n  <circle cx="22" cy="34" r="7" fill="url(#pj3dLens)"/>\n  <circle cx="19" cy="31" r="2" fill="rgba(255,255,255,0.6)"/>\n  <circle cx="44" cy="28" r="1.5" fill="#22c55e"/>\n  <circle cx="50" cy="28" r="1.5" fill="#f59e0b"/>\n  <rect x="40" y="38" width="12" height="4" rx="1" fill="#374151"/>\n</svg>\n';

// assets/icons/iso3d/digital/power-bank.svg
var power_bank_default2 = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">\n<defs>\n    <linearGradient id="pb3dBody" x1="0" y1="0" x2="0" y2="1">\n      <stop offset="0" stop-color="#fb923c"/>\n      <stop offset="1" stop-color="#9a3412"/>\n    </linearGradient>\n  </defs>\n  <ellipse cx="32" cy="56" rx="18" ry="2.5" fill="rgba(0,0,0,0.18)"/>\n  <rect x="14" y="10" width="36" height="44" rx="5" fill="url(#pb3dBody)"/>\n  <rect x="14" y="10" width="36" height="10" rx="5" fill="rgba(255,255,255,0.25)"/>\n  <rect x="20" y="24" width="24" height="3" rx="1" fill="rgba(255,255,255,0.4)"/>\n  <rect x="20" y="30" width="18" height="3" rx="1" fill="rgba(255,255,255,0.3)"/>\n  <rect x="20" y="36" width="12" height="3" rx="1" fill="rgba(255,255,255,0.2)"/>\n  <rect x="28" y="44" width="8" height="4" rx="1" fill="#1e293b"/>\n</svg>\n';

// assets/icons/iso3d/digital/headphone.svg
var headphone_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">\n<defs>\n    <linearGradient id="h3dCup" x1="0" y1="0" x2="0" y2="1">\n      <stop offset="0" stop-color="#f87171"/>\n      <stop offset="1" stop-color="#7f1d1d"/>\n    </linearGradient>\n    <linearGradient id="h3dBand" x1="0" y1="0" x2="0" y2="1">\n      <stop offset="0" stop-color="#e5e7eb"/>\n      <stop offset="1" stop-color="#6b7280"/>\n    </linearGradient>\n  </defs>\n  <ellipse cx="32" cy="56" rx="18" ry="2.5" fill="rgba(0,0,0,0.18)"/>\n  <path d="M10 34 V30 a22 22 0 0 1 44 0 V34" fill="none" stroke="url(#h3dBand)" stroke-width="5" stroke-linecap="round"/>\n  <rect x="6" y="30" width="12" height="22" rx="4" fill="url(#h3dCup)"/>\n  <rect x="46" y="30" width="12" height="22" rx="4" fill="url(#h3dCup)"/>\n  <ellipse cx="12" cy="41" rx="3" ry="6" fill="rgba(255,255,255,0.3)"/>\n  <ellipse cx="52" cy="41" rx="3" ry="6" fill="rgba(255,255,255,0.3)"/>\n</svg>\n';

// assets/icons/iso3d/digital/earbuds.svg
var earbuds_default2 = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">\n<defs>\n    <linearGradient id="eb3dCase" x1="0" y1="0" x2="0" y2="1">\n      <stop offset="0" stop-color="#ffffff"/>\n      <stop offset="1" stop-color="#9ca3af"/>\n    </linearGradient>\n  </defs>\n  <ellipse cx="32" cy="56" rx="18" ry="2.5" fill="rgba(0,0,0,0.18)"/>\n  <rect x="18" y="20" width="28" height="24" rx="10" fill="url(#eb3dCase)" stroke="#cbd5e1"/>\n  <path d="M18 28 h28" stroke="#e5e7eb"/>\n  <path d="M24 28 q0 -6 4 -6 q2 0 2 4 v2 z" fill="#f3f4f6" stroke="#9ca3af" stroke-width="0.8"/>\n  <path d="M40 28 q0 -6 -4 -6 q-2 0 -2 4 v2 z" fill="#f3f4f6" stroke="#9ca3af" stroke-width="0.8"/>\n  <circle cx="32" cy="40" r="1.5" fill="#9ca3af"/>\n</svg>\n';

// assets/icons/iso3d/digital/watch.svg
var watch_default2 = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">\n<defs>\n    <linearGradient id="w3dCase" x1="0" y1="0" x2="0" y2="1">\n      <stop offset="0" stop-color="#e5e7eb"/>\n      <stop offset="1" stop-color="#6b7280"/>\n    </linearGradient>\n    <linearGradient id="w3dScreen" x1="0" y1="0" x2="0" y2="1">\n      <stop offset="0" stop-color="#22d3ee"/>\n      <stop offset="1" stop-color="#0e7490"/>\n    </linearGradient>\n  </defs>\n  <ellipse cx="32" cy="56" rx="18" ry="2.5" fill="rgba(0,0,0,0.18)"/>\n  <path d="M22 4 h20 v10 h-20 z" fill="#475569"/>\n  <rect x="16" y="14" width="32" height="32" rx="6" fill="url(#w3dCase)"/>\n  <rect x="20" y="18" width="24" height="24" rx="3" fill="url(#w3dScreen)"/>\n  <rect x="20" y="18" width="24" height="8" fill="rgba(255,255,255,0.25)"/>\n  <path d="M22 46 h20 v10 h-20 z" fill="#475569"/>\n  <circle cx="48" cy="28" r="2" fill="#1e293b"/>\n</svg>\n';

// assets/icons/iso3d/digital/speaker.svg
var speaker_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">\n<defs>\n    <linearGradient id="sp3dBody" x1="0" y1="0" x2="0" y2="1">\n      <stop offset="0" stop-color="#94a3b8"/>\n      <stop offset="1" stop-color="#1e293b"/>\n    </linearGradient>\n  </defs>\n  <ellipse cx="32" cy="56" rx="18" ry="2.5" fill="rgba(0,0,0,0.18)"/>\n  <rect x="16" y="8" width="32" height="46" rx="4" fill="url(#sp3dBody)"/>\n  <rect x="16" y="8" width="32" height="10" rx="4" fill="rgba(255,255,255,0.2)"/>\n  <circle cx="32" cy="26" r="5" fill="#0f172a"/>\n  <circle cx="32" cy="26" r="3" fill="#334155"/>\n  <circle cx="32" cy="42" r="7" fill="#0f172a"/>\n  <circle cx="32" cy="42" r="5" fill="#1e293b"/>\n  <circle cx="32" cy="42" r="2" fill="#475569"/>\n</svg>\n';

// assets/icons/iso3d/digital/keyboard.svg
var keyboard_default2 = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">\n<defs>\n    <linearGradient id="kb3dBody" x1="0" y1="0" x2="0" y2="1">\n      <stop offset="0" stop-color="#e5e7eb"/>\n      <stop offset="1" stop-color="#6b7280"/>\n    </linearGradient>\n  </defs>\n  <ellipse cx="32" cy="56" rx="18" ry="2.5" fill="rgba(0,0,0,0.18)"/>\n  <path d="M4 28 l56 -8 v16 l-56 8 z" fill="url(#kb3dBody)"/>\n  <path d="M4 28 l56 -8 l0 3 l-56 8 z" fill="rgba(255,255,255,0.4)"/>\n  <g fill="#94a3b8">\n    <rect x="10" y="30" width="5" height="3" rx="0.5" transform="skewY(-8)"/>\n    <rect x="18" y="29" width="5" height="3" rx="0.5" transform="skewY(-8)"/>\n    <rect x="26" y="28" width="5" height="3" rx="0.5" transform="skewY(-8)"/>\n    <rect x="34" y="27" width="5" height="3" rx="0.5" transform="skewY(-8)"/>\n    <rect x="42" y="26" width="5" height="3" rx="0.5" transform="skewY(-8)"/>\n    <rect x="10" y="36" width="36" height="3" rx="0.5" transform="skewY(-8)"/>\n  </g>\n</svg>\n';

// assets/icons/iso3d/digital/cube.svg
var cube_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">\n<defs>\n    <linearGradient id="cb3dTop" x1="0" y1="0" x2="0" y2="1">\n      <stop offset="0" stop-color="#fde68a"/>\n      <stop offset="1" stop-color="#f59e0b"/>\n    </linearGradient>\n    <linearGradient id="cb3dLeft" x1="0" y1="0" x2="0" y2="1">\n      <stop offset="0" stop-color="#f59e0b"/>\n      <stop offset="1" stop-color="#b45309"/>\n    </linearGradient>\n    <linearGradient id="cb3dRight" x1="0" y1="0" x2="0" y2="1">\n      <stop offset="0" stop-color="#fbbf24"/>\n      <stop offset="1" stop-color="#92400e"/>\n    </linearGradient>\n  </defs>\n  <ellipse cx="32" cy="56" rx="18" ry="2.5" fill="rgba(0,0,0,0.18)"/>\n  <path d="M32 8 L56 20 L32 32 L8 20 Z" fill="url(#cb3dTop)"/>\n  <path d="M8 20 L32 32 L32 56 L8 44 Z" fill="url(#cb3dLeft)"/>\n  <path d="M56 20 L32 32 L32 56 L56 44 Z" fill="url(#cb3dRight)"/>\n  <path d="M32 8 L56 20 L32 32 Z" fill="rgba(255,255,255,0.25)"/>\n</svg>\n';

// packages/ui-web/src/iconLibrary.ts
function svgDataUrl(svg) {
  const trimmed = svg.replace(/\s+/g, " ").trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(trimmed)}`;
}
function entry(id, name) {
  return { id, name, src: id };
}
var flat2d = [
  {
    id: "digital",
    name: "\u6570\u7801",
    icons: [
      entry(svgDataUrl(phone_default), "\u624B\u673A"),
      entry(svgDataUrl(tablet_default), "\u5E73\u677F"),
      entry(svgDataUrl(laptop_default), "\u7B14\u8BB0\u672C"),
      entry(svgDataUrl(monitor_default), "\u663E\u793A\u5668"),
      entry(svgDataUrl(tv_default), "\u7535\u89C6"),
      entry(svgDataUrl(keyboard_default), "\u952E\u76D8"),
      entry(svgDataUrl(mouse_default), "\u9F20\u6807"),
      entry(svgDataUrl(headphones_default), "\u8033\u673A"),
      entry(svgDataUrl(earbuds_default), "\u65E0\u7EBF\u8033\u673A"),
      entry(svgDataUrl(watch_default), "\u624B\u8868"),
      entry(svgDataUrl(camera_default), "\u76F8\u673A"),
      entry(svgDataUrl(lens_default), "\u955C\u5934"),
      entry(svgDataUrl(game_controller_default), "\u6E38\u620F\u624B\u67C4"),
      entry(svgDataUrl(power_bank_default), "\u5145\u7535\u5B9D"),
      entry(svgDataUrl(router_default), "\u8DEF\u7531\u5668"),
      entry(svgDataUrl(printer_default), "\u6253\u5370\u673A")
    ]
  },
  {
    id: "appliance",
    name: "\u5BB6\u5C45\u5BB6\u7535",
    icons: [
      entry(svgDataUrl(sofa_default), "\u6C99\u53D1"),
      entry(svgDataUrl(bed_default), "\u5E8A"),
      entry(svgDataUrl(chair_default), "\u6905\u5B50"),
      entry(svgDataUrl(lamp_default), "\u53F0\u706F"),
      entry(svgDataUrl(fridge_default), "\u51B0\u7BB1"),
      entry(svgDataUrl(washing_machine_default), "\u6D17\u8863\u673A"),
      entry(svgDataUrl(air_conditioner_default), "\u7A7A\u8C03"),
      entry(svgDataUrl(pot_default), "\u9505\u5177"),
      entry(svgDataUrl(coffee_default), "\u5496\u5561\u673A")
    ]
  },
  {
    id: "transport",
    name: "\u4EA4\u901A\u51FA\u884C",
    icons: [
      entry(svgDataUrl(car_default), "\u6C7D\u8F66"),
      entry(svgDataUrl(motorbike_default), "\u6469\u6258"),
      entry(svgDataUrl(bike_default), "\u81EA\u884C\u8F66"),
      entry(svgDataUrl(scooter_default), "\u6ED1\u677F\u8F66"),
      entry(svgDataUrl(plane_default), "\u822A\u6A21 / \u51FA\u884C")
    ]
  },
  {
    id: "hobby",
    name: "\u5174\u8DA3\u6536\u85CF",
    icons: [
      entry(svgDataUrl(guitar_default), "\u4E50\u5668"),
      entry(svgDataUrl(palette_default), "\u753B\u5177"),
      entry(svgDataUrl(ball_default), "\u7403\u7C7B"),
      entry(svgDataUrl(basketball_default), "\u7BEE\u7403"),
      entry(svgDataUrl(book_default), "\u4E66\u7C4D"),
      entry(svgDataUrl(toy_default), "\u73A9\u5076"),
      entry(svgDataUrl(dice_default), "\u684C\u6E38")
    ]
  },
  {
    id: "clothing",
    name: "\u670D\u9970\u914D\u4EF6",
    icons: [
      entry(svgDataUrl(shirt_default), "\u8863\u670D"),
      entry(svgDataUrl(shoe_default), "\u978B\u5B50"),
      entry(svgDataUrl(bag_default), "\u624B\u888B"),
      entry(svgDataUrl(backpack_default), "\u80CC\u5305"),
      entry(svgDataUrl(hat_default), "\u5E3D\u5B50")
    ]
  },
  {
    id: "misc",
    name: "\u5DE5\u5177\u6742\u9879",
    icons: [
      entry(svgDataUrl(toolbox_default), "\u5DE5\u5177\u7BB1"),
      entry(svgDataUrl(key_default), "\u94A5\u5319"),
      entry(svgDataUrl(gift_default), "\u793C\u7269"),
      entry(svgDataUrl(box_default), "\u7BB1\u5305"),
      entry(svgDataUrl(star_default), "\u6536\u85CF\u661F"),
      entry(svgDataUrl(trophy_default), "\u5956\u676F"),
      entry(svgDataUrl(heart_default), "\u559C\u7231")
    ]
  },
  {
    id: "money",
    name: "\u94B1",
    icons: [
      entry(svgDataUrl(banknote_default), "\u949E\u7968"),
      entry(svgDataUrl(yen_banknote_default), "\u4EBA\u6C11\u5E01\u949E\u7968"),
      entry(svgDataUrl(coin_default), "\u91D1\u5E01"),
      entry(svgDataUrl(coin_stack_default), "\u91D1\u5E01\u5806"),
      entry(svgDataUrl(money_bag_default), "\u94B1\u888B"),
      entry(svgDataUrl(wallet_default), "\u94B1\u5305"),
      entry(svgDataUrl(credit_card_default), "\u94F6\u884C\u5361"),
      entry(svgDataUrl(bank_default), "\u94F6\u884C"),
      entry(svgDataUrl(safe_default), "\u4FDD\u9669\u7BB1"),
      entry(svgDataUrl(piggy_bank_default), "\u5C0F\u732A\u5B58\u94B1\u7F50"),
      entry(svgDataUrl(chart_up_default), "\u4E0A\u6DA8"),
      entry(svgDataUrl(chart_down_default), "\u4E0B\u8DCC"),
      entry(svgDataUrl(receipt_default), "\u8D26\u5355"),
      entry(svgDataUrl(hand_coin_default), "\u6536\u6B3E"),
      entry(svgDataUrl(lend_out_default), "\u501F\u51FA"),
      entry(svgDataUrl(house_default), "\u4F4F\u623F"),
      entry(svgDataUrl(hospital_default), "\u533B\u9662"),
      entry(svgDataUrl(stock_default), "\u80A1\u7968"),
      entry(svgDataUrl(fund_default), "\u57FA\u91D1"),
      entry(svgDataUrl(loan_default), "\u8D37\u6B3E"),
      entry(svgDataUrl(borrow_default), "\u501F\u5165"),
      entry(svgDataUrl(dollar_default), "\u7F8E\u5143"),
      entry(svgDataUrl(yen_default), "\u4EBA\u6C11\u5E01")
    ]
  }
];
var iso3d = [
  {
    id: "digital",
    name: "\u6570\u7801",
    icons: [
      entry(svgDataUrl(camera_default2), "3D \u76F8\u673A"),
      entry(svgDataUrl(lens_default2), "3D \u955C\u5934"),
      entry(svgDataUrl(phone_default2), "3D \u624B\u673A"),
      entry(svgDataUrl(tablet_default2), "3D \u5E73\u677F"),
      entry(svgDataUrl(laptop_default2), "3D \u7B14\u8BB0\u672C"),
      entry(svgDataUrl(drone_default), "3D \u65E0\u4EBA\u673A"),
      entry(svgDataUrl(action_cam_default), "3D \u8FD0\u52A8\u76F8\u673A"),
      entry(svgDataUrl(gimbal_cam_default), "3D \u53E3\u888B\u4E91\u53F0"),
      entry(svgDataUrl(projector_default), "3D \u6295\u5F71\u4EEA"),
      entry(svgDataUrl(power_bank_default2), "3D \u5145\u7535\u5B9D"),
      entry(svgDataUrl(headphone_default), "3D \u5934\u6234\u8033\u673A"),
      entry(svgDataUrl(earbuds_default2), "3D \u771F\u65E0\u7EBF\u8033\u673A"),
      entry(svgDataUrl(watch_default2), "3D \u624B\u8868"),
      entry(svgDataUrl(speaker_default), "3D \u97F3\u7BB1"),
      entry(svgDataUrl(keyboard_default2), "3D \u952E\u76D8"),
      entry(svgDataUrl(cube_default), "3D \u7ACB\u65B9\u4F53")
    ]
  }
];
var ICON_LIBRARY = [
  { dimension: "3d", name: "3D", categories: iso3d },
  { dimension: "2d", name: "2D", categories: flat2d }
];
var ALL_ICONS = (() => {
  const out = [];
  ICON_LIBRARY.forEach((dim) => {
    dim.categories.forEach((cat) => {
      cat.icons.forEach((icon) => out.push(icon));
    });
  });
  return out;
})();
function getCategory(dimension, categoryId) {
  const dim = ICON_LIBRARY.find((d) => d.dimension === dimension);
  return dim?.categories.find((c) => c.id === categoryId);
}
var CASH_BANKNOTE_ICON = getCategory("2d", "money").icons.find((i) => i.name === "\u949E\u7968").id;
var CREDIT_CARD_ICON = getCategory("2d", "money").icons.find((i) => i.name === "\u94F6\u884C\u5361").id;
var BANK_ICON = getCategory("2d", "money").icons.find((i) => i.name === "\u94F6\u884C").id;
function moneyIconByName(name) {
  const found = getCategory("2d", "money").icons.find((i) => i.name === name);
  if (!found) {
    throw new Error(`[iconLibrary] money icon "${name}" not registered`);
  }
  return found.id;
}
var VIRTUAL_ACCOUNT_DEFAULT_ICON = moneyIconByName("\u4EBA\u6C11\u5E01");
var INVESTMENT_DEFAULT_ICON = moneyIconByName("\u4E0A\u6DA8");
var INVESTMENT_STOCK_ICON = moneyIconByName("\u80A1\u7968");
var INVESTMENT_FUND_ICON = moneyIconByName("\u57FA\u91D1");
var LIABILITY_DEFAULT_ICON = moneyIconByName("\u8D26\u5355");
var LIABILITY_LOAN_ICON = moneyIconByName("\u8D37\u6B3E");
var LIABILITY_BORROW_ICON = moneyIconByName("\u501F\u5165");
var CLAIM_DEFAULT_ICON = moneyIconByName("\u501F\u51FA");
var SOCIAL_SECURITY_DEFAULT_ICON = moneyIconByName("\u91D1\u5E01\u5806");
var SOCIAL_SECURITY_HOUSING_FUND_ICON = moneyIconByName("\u4F4F\u623F");
var SOCIAL_SECURITY_MEDICAL_ICON = moneyIconByName("\u533B\u9662");
var CUSTOM_ASSET_DEFAULT_ICON = moneyIconByName("\u94B1\u888B");

// packages/ui-web/src/assetIcons.ts
function buildGroups() {
  const out = [];
  ICON_LIBRARY.forEach((dim) => {
    dim.categories.forEach((cat) => {
      out.push({
        id: dim.dimension === "3d" ? `${cat.id}3d` : cat.id,
        name: dim.dimension === "3d" ? `3D ${cat.name}` : cat.name,
        icons: cat.icons
      });
    });
  });
  return out;
}
var ASSET_ICON_GROUPS = buildGroups();
function flattenIcons(groups) {
  const out = [];
  groups.forEach((g) => {
    g.icons.forEach((icon) => out.push(icon));
  });
  return out;
}
var ASSET_FLAT_ICONS = flattenIcons(ASSET_ICON_GROUPS);

// packages/ui-web/src/icons.ts
var ICONS = [...ASSET_FLAT_ICONS];
function findIcon(id) {
  if (!id) {
    return void 0;
  }
  if (id.startsWith("data:")) {
    return { id, name: "\u81EA\u5B9A\u4E49\u56FE\u7247", src: id };
  }
  if (isCustomImageRef(id)) {
    return { id, name: "\u81EA\u5B9A\u4E49\u56FE\u7247", src: id };
  }
  return ICONS.find((icon) => icon.id === id);
}

// packages/ui-web/src/iconResolver.ts
function getIconPath(iconId, plugin) {
  if (iconId && isCustomImageRef(iconId)) {
    return resolveCustomImageUrl(iconId);
  }
  if (iconId && iconId.startsWith("data:")) {
    return iconId;
  }
  const icon = findIcon(iconId);
  if (!icon) {
    return "";
  }
  if (icon.src.startsWith("data:")) {
    return icon.src;
  }
  const pluginDir = plugin?.manifest?.dir ?? PLUGIN_DIR;
  return host().resources.resolveUrl(`${pluginDir}/${icon.src}`);
}

// assets/logo/alipay.svg
var alipay_default = '<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 428.76 366.27"><defs><style type="text/css">.cls-1{fill:none;}.cls-2{fill:#1677ff;}.cls-3{fill:url(#untitled_gradient);}.cls-4{clip-path:url(#clip-path);}.cls-5{clip-path:url(#clip-path-2);}.cls-6{fill:url(#linear-gradient);}</style>\n<linearGradient id="untitled_gradient" x1="101.06" y1="348.72" x2="160.75" y2="245.32" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#1677ff" stop-opacity="0.8"/><stop offset="0.16" stop-color="#0c6bfc" stop-opacity="0.89"/><stop offset="0.36" stop-color="#0562fa" stop-opacity="0.95"/><stop offset="0.6" stop-color="#015df8" stop-opacity="0.99"/><stop offset="1" stop-color="#005bf8"/></linearGradient>\n<clipPath id="clip-path" transform="translate(5.15)">\n<path class="cls-1" d="M90.64,230.55c37.23,0,72.93,15.82,107.62,36.43,16.53,9.82,32.82,20.72,49,31.52,46,30.77,90.52,60.7,135,62.24-71.44-2.6-97.49-83.34-157-134.39h0c-39.57-18.66-79.11-34.45-127.69-34.45C40.27,191.9,0,229.19,0,276.56H0c0,46.78,41.2,84.24,97.57,84.24A207.92,207.92,0,0,0,214.1,325.52c-60,38.58-188.52,13.44-188.53-49h0C25.57,249.82,55,230.55,90.64,230.55Z"/></clipPath>\n<clipPath id="clip-path-2" transform="translate(5.15)"><rect class="cls-1" x="-5" y="186.9" width="392.25" height="178.9"/></clipPath>\n<linearGradient id="linear-gradient" x1="225.26" y1="293.58" x2="423.61" y2="293.58" gradientUnits="userSpaceOnUse"><stop offset="0.12" stop-color="#1677ff"/><stop offset="0.29" stop-color="#1677ff" stop-opacity="0.85"/><stop offset="0.51" stop-color="#1677ff" stop-opacity="0.7"/><stop offset="0.7" stop-color="#1677ff" stop-opacity="0.59"/><stop offset="0.87" stop-color="#1677ff" stop-opacity="0.52"/><stop offset="1" stop-color="#1677ff" stop-opacity="0.5"/></linearGradient></defs>\n<g id="layer_2">\n<g id="layer_1-2">\n<path class="cls-2" d="M350.75,57.17H235.54v-54A3.15,3.15,0,0,0,232.36,0c-46.77,0-57,11.53-57,26.58V57.17H66c-6.52,0-9.38,15.13-9.38,25.8a3.17,3.17,0,0,0,3.13,3.23h115.6v38.26H98.74c-6.55,0-9.4,15.59-9.38,25.9a3.12,3.12,0,0,0,3.13,3.12H246.35a218.78,218.78,0,0,1-21.09,72.87c18.89,8.91,37.8,18.47,57.7,27.28,23.23-37.36,37.44-80.17,37.71-122.84a6.28,6.28,0,0,0-6.28-6.33H235.54V86.2h109c6.53,0,9.39-14.51,9.39-25.8A3.17,3.17,0,0,0,350.75,57.17Z" transform="translate(5.15)"/>\n<path class="cls-3" d="M25.57,276.56c-.1,62.46,128.68,87.65,188.6,48.92a225.8,225.8,0,0,0,33-27c-2-1.36-12.26-8.8-24-16.43-8.6-5.58-18.25-11.13-24.94-15.08C126.53,349.76,25.57,327.82,25.57,276.56Z" transform="translate(5.15)"/>\n<g class="cls-4">\n<g class="cls-5">\n<image width="818" height="374" transform="translate(0 186.75) scale(0.48)" xlink:href="data:image/png;base64,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"/></g></g>\n<path class="cls-6" d="M385.81,360.81c28.89,0,36.46-36.06,37.79-64.43A9.92,9.92,0,0,0,414,286c-79.06-2.48-133.93-33.81-188.72-59.64C285.73,278.23,311.66,360.81,385.81,360.81Z" transform="translate(5.15)"/></g></g></svg>';

// assets/logo/wechat.svg
var wechat_default = '<svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1543 1543" width="1543" height="1543">\n	<title>wechat-seeklogo</title>\n	<style>\n		.s0 { fill: #2dc100 } \n		.s1 { fill: #ffffff } \n	</style>\n	<path id="Layer" class="s0" d="m0 231c0-127.6 103.4-231 231-231h1081c127.6 0 231 103.4 231 231v1081c0 127.6-103.4 231-231 231h-1081c-127.6 0-231-103.4-231-231z"/>\n	<g id="Layer">\n		<path id="Layer" fill-rule="evenodd" class="s1" d="m1032.8 575.4c-124.5 6.5-232.8 44.3-320.7 129.6-88.9 86.1-129.5 191.7-118.4 322.6-48.7-6-93-12.6-137.5-16.4-15.5-1.3-33.7 0.6-46.7 7.9-43.3 24.5-84.9 52.1-134 82.8 9-40.9 14.8-76.6 25.2-111 7.6-25.3 4.1-39.3-19.2-55.8-149.5-105.5-212.5-263.5-165.3-426.1 43.5-150.4 150.7-241.7 296.3-289.2 198.7-64.9 422 1.3 542.9 159 43.5 57 70.3 121 77.4 196.6zm-573.2-50.7c1.2-29.7-24.6-56.5-55.2-57.4-31.4-0.9-57.1 23-58 53.9-1 31.3 23 56.4 54.5 57.2 31.3 0.8 57.6-23.2 58.7-53.7zm299.1-57.4c-30.8 0.5-56.7 26.7-56.2 56.6 0.6 30.9 26 55.2 57.6 54.8 31.7-0.4 55.8-24.9 55.5-56.5-0.3-31-25.6-55.5-56.9-54.9z"/>\n		<path id="Layer" fill-rule="evenodd" class="s1" d="m1312.6 1351.8c-39.4-17.5-75.6-43.9-114.1-47.9-38.4-4-78.7 18.1-118.8 22.2-122.3 12.5-231.9-21.5-322.1-105.1-171.8-158.9-147.3-402.5 51.4-532.7 176.7-115.7 435.7-77.1 560.2 83.4 108.7 140.2 95.9 326.1-36.8 443.8-38.4 34.1-52.2 62.1-27.6 107 4.7 8.4 5.1 18.9 7.8 29.3zm-448.9-434.6c25.1 0 45.8-19.6 46.7-44.4 1-26.2-20.1-48.3-46.4-48.4-26-0.1-47.8 22.2-46.9 48.1 0.9 24.7 21.7 44.7 46.6 44.7zm289.4-92.7c-24.4-0.2-45.1 19.8-46.1 44.4-1 26.3 19.4 48 45.4 48 25.2 0.1 45.2-18.9 46-44 1.1-26.4-19.4-48.2-45.3-48.4z"/>\n	</g>\n</svg>';

// assets/logo/icbc.svg
var icbc_default = '<svg version="1.2" baseProfile="tiny-ps" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1528 1527" width="1528" height="1527">\n	<title>Industrial_and_Commercial_Bank_of_China_logo-svg</title>\n	<style>\n		tspan { white-space:pre }\n		.shp0 { fill: #cb0202 } \n	</style>\n	<g id="layer1">\n		<g id="layer1-0">\n			<g id="g3518">\n				<path id="path3520" fill-rule="evenodd" class="shp0" d="M0.31 763.46C0.31 341.65 342 0 764.01 0C1185.91 0 1527.84 341.65 1527.84 763.46C1527.84 1185.28 1185.91 1527.06 764.01 1527.06C342 1527.06 0.31 1185.28 0.31 763.46ZM118.54 763.46C118.54 1119.82 407.55 1408.84 764.01 1408.84C1120.39 1408.84 1409.45 1119.82 1409.45 763.46C1409.45 407.24 1120.39 118.01 764.01 118.01C407.55 118.01 118.54 407.24 118.54 763.46ZM1058.47 1056.62L1058.47 939.33L823.86 939.33L823.86 587.31L1058.47 587.31L1058.47 469.73L795.28 469.73L795.28 352.33L1175.97 352.33L1175.97 704.66L941.83 704.66L941.83 821.98L1175.97 821.98L1175.97 1173.91L795.28 1173.91L795.28 1056.62L1058.47 1056.62ZM472.22 469.41L472.22 586.73L706.81 586.73L706.81 939.06L472.22 939.06L472.22 1056.35L736.07 1056.35L736.07 1173.7L354.91 1173.7L354.91 821.63L588.47 821.63L588.47 704.18L354.91 704.18L354.91 352.06L736.07 352.06L736.07 469.41L472.22 469.41Z" />\n			</g>\n		</g>\n		<g id="g2931">\n		</g>\n	</g>\n</svg>';

// assets/logo/ccb.svg
var ccb_default = '<svg class="svg-icon" style="width: 1em;height: 1em;vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M0 0m224 0l576 0q224 0 224 224l0 576q0 224-224 224l-576 0q-224 0-224-224l0-576q0-224 224-224Z" fill="#FFFFFF" /><path d="M460.696 189.16c77.852-5.2 120.868 52.204 145.536 79.488l15.56 16.848 142.416 152.804-88.456 86.552-165-166.324-168.392 176.496 163.3 174.808 171.808-176.496 23.052-0.64c32.36-0.784 90.228-1.736 116.412 0.64 26.152 2.372 33.192 12.184 35.068 17.892-10.52 181.16-158.532 324.772-339.672 324.772C324.356 876 172 721.36 172 530.604c0-172.944 125.24-316.2 288.696-341.44zM852 341.732l-71.816 70.164-2.316-3.016c-23.516-30.476-219.948-280.428-300.404-232.516l-2.352 1.508c6.58-4.588 173.112-116.512 376.888 163.86z" fill="#06569F" /></svg>';

// assets/logo/abc.svg
var abc_default = '<svg version="1.2" baseProfile="tiny-ps" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1534 1534" width="1534" height="1534">\n	<title>Agricultural_Bank_of_China_logo-svg</title>\n	<defs>\n		<clipPath clipPathUnits="userSpaceOnUse" id="cp1">\n			<path d="M-7867.64 20026.54L15482.13 20026.54L15482.13 -11654.7L-7867.64 -11654.7L-7867.64 20026.54Z" />\n		</clipPath>\n	</defs>\n	<style>\n		tspan { white-space:pre }\n		.shp0 { fill: #12806a } \n	</style>\n	<g id="g18">\n		<g id="g22">\n			<g id="Clip-Path: g24" clip-path="url(#cp1)">\n				<g id="g24">\n					<g id="g38">\n					</g>\n					<g id="g58">\n					</g>\n					<g id="g70">\n					</g>\n					<g id="g102">\n					</g>\n					<g id="g106">\n						<path id="path108" class="shp0" d="M831.96 7.22C810.78 5.42 789.52 4.59 767.91 4.59L765.2 4.59C744.57 4.63 724.1 5.53 703.82 7.22C695.97 7.85 688.2 8.67 680.44 9.61L680.44 443.02C680.44 464.47 697.97 482 719.35 482L811.02 482C832.47 482 850.09 464.47 850.09 443.02L850.09 8.91C844.05 8.28 837.97 7.81 831.96 7.22Z" />\n					</g>\n					<g id="g110">\n						<path id="path112" class="shp0" d="M934.86 22.85L934.86 201.91L934.86 485.43C933.33 501.55 920.62 514.38 904.46 515.98L904.46 516.1L816.12 516.1C797.33 516.1 782.15 531.28 782.15 549.94L782.15 787.24C782.15 769.32 796.04 754.77 813.61 753.55L982.63 753.55C983.73 753.63 984.67 753.63 985.73 753.63C986.79 753.63 987.85 753.63 988.95 753.55C1000.44 752.53 1010.25 745.51 1015.58 735.75C1015.62 735.55 1015.7 735.47 1015.78 735.24C1016.56 733.79 1017.19 732.18 1017.82 730.57C1018.05 729.63 1018.44 728.65 1018.6 727.63C1018.84 726.96 1018.99 726.22 1018.99 725.39C1019.39 723.63 1019.5 721.98 1019.62 720.14L1019.62 719.9L1019.62 719.79L1019.62 719.75L1019.62 719.67L1019.62 719.47L1019.62 234.53C1219.98 329.79 1358.45 533.87 1358.45 770.34C1358.45 1069.08 1137.49 1316.26 850.01 1357.31L850.01 1024.61L982.63 1024.61C983.73 1024.69 984.67 1024.77 985.73 1024.77C986.79 1024.77 987.85 1024.69 988.95 1024.61C1006.09 1022.96 1019.62 1008.61 1019.62 990.92L1019.62 990.84L1019.62 990.77L1019.62 787.12L1019.62 753.24C1019.62 772.02 1004.48 787.12 985.73 787.12L816.12 787.12C797.33 787.12 782.15 802.34 782.15 821.04L782.15 1024.3L748.26 1024.3L748.26 821.04C748.26 802.34 733.12 787.12 714.37 787.12L544.72 787.12C525.97 787.12 510.68 772.02 510.68 753.24L510.68 990.92C510.95 1008.61 524.33 1022.96 541.62 1024.61C542.57 1024.69 543.62 1024.77 544.72 1024.77C545.7 1024.77 546.8 1024.69 547.9 1024.61L680.44 1024.61L680.44 1357.31C393 1316.26 172.12 1069.08 172.12 770.34C172.12 533.87 310.51 329.79 510.68 234.53L510.68 719.79L510.68 719.9C510.68 720.02 510.83 720.02 510.83 720.14C510.95 721.98 511.07 723.63 511.3 725.39C511.5 726.22 511.62 726.96 511.89 727.63C512.01 728.65 512.32 729.63 512.68 730.57C513.22 732.18 513.93 733.79 514.72 735.24C514.75 735.47 514.83 735.55 514.95 735.75C520.29 745.51 530.01 752.53 541.62 753.55C542.57 753.63 543.62 753.63 544.72 753.63C545.7 753.63 546.8 753.63 547.9 753.55L716.69 753.55C734.42 754.77 748.26 769.32 748.26 787.24L748.26 549.94C748.26 531.28 733.12 516.1 714.37 516.1L626.15 516.1L625.96 515.98C609.91 514.38 597.13 501.55 595.64 485.43L595.64 24.02C257.01 102.18 4.59 405.36 4.59 767.71C4.59 1188.22 344.99 1529.27 765.21 1530.76L767.91 1530.76C1189.47 1530.76 1531.19 1189.12 1531.19 767.71C1531.19 403.59 1276.19 99.04 934.86 22.85Z" />\n					</g>\n				</g>\n			</g>\n		</g>\n	</g>\n</svg>';

// assets/logo/boc.svg
var boc_default = '<svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1552 1552" width="1552" height="1552">\n	<title>Bank_of_China-svg</title>\n	<defs>\n		<clipPath clipPathUnits="userSpaceOnUse" id="cp1">\n			<path d="m0 0.51h5476.65v1551.01h-5476.65z"/>\n		</clipPath>\n	</defs>\n	<style>\n		.s0 { fill: #b10a32 } \n	</style>\n	<g id="Layer">\n		<g id="Clip-Path" clip-path="url(#cp1)">\n			<path id="Layer" fill-rule="evenodd" class="s0" d="m775.6 1551.5c-428.9 0-775.6-346.7-775.6-775.5 0-428.8 346.7-775.5 775.6-775.5 428.9 0 775.6 346.7 775.6 775.5 0 428.8-346.7 775.5-775.6 775.5zm196.9-1091.5c95.4 0 171.3 69.6 171.3 164.9v298.5c0 95.3-70 166.8-165.4 166.8h-114.2l0.5 288.5c294.3-43 519.8-296.7 519.8-602.8 0-306.1-226.1-559.4-520.3-602.3v286.6zm-568.5 164.8c0-95.3 58-165.3 153.2-165.3l126.9-0.4v-284.9c-292.8 44.2-517.4 296.6-517.4 601.7 0 305.1 224.6 558.1 517.4 602.2l-0.5-285.9-106.1-0.1c-95.3 0-173.5-73.5-173.5-168.7zm559.2 300.4c0 0 6-2.1 8.9-4.6 3.2-2.6 6.4-10 6.4-10v-265.8c0 0-3.2-12.1-9.1-15.3-6.7-3.7-12.5-2.8-12.5-2.8h-366.2c0 0-8.7 0.2-13.4 5.5-5 5.5-4.6 14.7-4.6 14.7v259c0 0-1.1 3.8 3 11 4.3 7.4 12.7 8.3 12.7 8.3l277.9 0.1z"/>\n		</g>\n	</g>\n</svg>';

// assets/logo/cmb.svg
var cmb_default = '<?xml version="1.0" encoding="UTF-8"?>\n<svg id="logosandtypes_com" data-name="logosandtypes com" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150">\n  <defs>\n    <style>\n      .cls-1 {\n        fill: #a30030;\n      }\n\n      .cls-2 {\n        fill: none;\n      }\n    </style>\n  </defs>\n  <path class="cls-2" d="M0,0H150V150H0V0Z"/>\n  <g>\n    <path class="cls-1" d="M73.34,9.22c25.72-.31,43.78,11.94,54.5,26.64,4.13,5.66,8.42,12.55,10.26,20.51h-28.02c-5.66-13.17-11.33-26.33-16.84-39.34h0c-5.97,14.85-11.94,29.7-17.76,44.55h-.15c-6.43-14.85-12.71-29.55-19.14-44.24h0c-11.02,27.86-22.2,55.57-33.22,83.43,4.9,7.04,9.8,13.93,14.85,20.97,25.87,0,51.59,.15,77.46,.15,3.37-5.36,6.58-10.72,9.95-16.23,.92-1.38,3.37-4.44,3.67-5.97-.46-1.22-1.07-2.3-1.53-3.52h9.95c-.31,1.53-1.22,3.21-1.84,4.59-2.14,5.05-4.75,9.49-7.81,13.63-8.88,12.09-21.13,20.51-37.97,24.65-2.3,.61-4.9,.92-7.5,1.38-1.22,.15-2.6,.15-3.83,.31-1.38,.31-3.52,.31-5.05,0-1.38,0-2.76-.15-4.13-.15-3.21-.46-6.12-.77-9.03-1.53-9.19-2.3-16.84-5.97-23.58-10.72-2.14-1.53-3.98-3.37-5.82-4.9-1.84-1.38-3.52-3.21-5.05-5.05-5.21-6.58-9.19-12.86-12.55-21.59-1.38-3.67-2.14-7.65-2.91-11.94-1.84-9.03-.46-20.36,1.84-27.71C17.77,37.55,30.32,22.85,48.08,15.04c4.75-2.14,9.95-3.52,15.62-4.75,2.3-.31,4.75-.61,7.04-.92,.92,0,1.68-.15,2.6-.15"/>\n    <path class="cls-1" d="M87.88,56.84c6.28,14.7,12.71,29.24,18.98,43.94H33.84c5.66-14.39,11.33-28.78,17.15-43.02v.15c6.28,14.08,12.55,28.17,18.98,42.25h0c5.97-14.54,11.94-28.93,17.91-43.32"/>\n    <path class="cls-1" d="M111.61,59.75h27.56c.15,.92,.31,1.84,.61,2.6h-26.94c-.46-.77-.77-1.68-1.22-2.6"/>\n    <path class="cls-1" d="M140.24,65.56c.15,.92,.15,1.84,.31,2.76h-25.26c-.31-.92-.77-1.84-1.22-2.76h26.18Z"/>\n    <path class="cls-1" d="M140.85,74.29h-22.96c-.31-.92-.77-1.84-1.07-2.76h17.76c1.07,0,5.82-.31,6.28,.15v2.6"/>\n    <path class="cls-1" d="M140.85,77.81c0,.92-.15,1.84-.15,2.76h-20.21c-.31-.92-.77-1.84-1.22-2.6h21.59v-.15Z"/>\n    <path class="cls-1" d="M140.24,84.24c-.15,.92-.31,1.84-.46,2.76h-16.53c-.46-.92-.77-1.84-1.22-2.6h18.22v-.15Z"/>\n    <path class="cls-1" d="M124.78,90.36h14.24c-.31,.92-.46,1.84-.77,2.76h-12.4c-.31-.92-.61-1.84-1.07-2.76"/>\n  </g>\n</svg>';

// assets/logo/bocom.svg
var bocom_default = '<svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1453 1588" width="1453" height="1588">\n	<title>Bank_of_Communications_2-svg</title>\n	<style>\n		.s0 { fill: #003c78 } \n	</style>\n	<g id="Layer">\n		<path id="Layer" class="s0" d="m1452.2 816.8c0 107.7-32.4 202.5-91.7 294.2-65.5 101.1-256.2 324.5-256.2 324.5 62.8-80.5 102.3-179 109.3-286l-307.8 0.2c-14.9 119.4-116.7 211.9-240.3 211.9-133.6 0-242.1-108.4-242.1-242.1 0-133.6 108.5-242.1 242.1-242.1 112.6 0 207.2 77 234.3 181.1l311.5 0.1c-29.6-265.7-261.5-472.6-543.2-472.6-302 0-546.8 237.3-546.8 530.1 0 205.6 120.9 383.7 297.3 471.7l-86.1-26.9c-193.2-64-332.5-245.6-332.5-459.5v-720.3l451.4-380.9v574.4l255.9-165.8c75.3-48.3 164.8-76.2 260.8-76.2 267.4 0 484.1 216.7 484.1 484.2z"/>\n	</g>\n</svg>';

// assets/logo/psbc.svg
var psbc_default = '<svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1551 1457" width="1551" height="1457">\n	<title>601658</title>\n	<style>\n		.s0 { fill: #006346 } \n	</style>\n	<path class="s0" d="m897.6 0.9l-40.2 217.7h-354l-81.5 436.6h-352.9l-68.4 364.5h351.7l-81.4 436.6h740.6l82-436h264.9l27.2-145.7-342.9-0.6-82 437.2h-584.8l13-72h507.5l82-438.3 420.8 0.6 28.3-145.1h-497.5l-82.6 436.5h-431.4l13.6-73.2 354.1 1.2 68.4-364.6-353.5-1.1 13.6-73.2h508.1l41.3-218.3 419.6 0.1 27.7-145.8-496.9 0.6-41.3 218.3h-430.7l13.5-72h353.5l40.1-218.8h576l27.7-145.2zm-426 800h275.5l-13.5 72h-276.2zm-352.3 0h275l-13.6 73.1h-275z"/>\n</svg>';

// assets/logo/citic_bank.svg
var citic_bank_default = '<svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1531 1531" width="1531" height="1531">\n	<title>China_Citic_Bank_logo-svg</title>\n	<style>\n		.s0 { fill: #d91920 } \n	</style>\n	<g id="layer1">\n		<g id="g23160">\n			<g id="g12467">\n				<path id="path12469" class="s0" d="m989 328.2c21.6-17.2 48.9-29.9 62.6-36.2v1061.2c-41.2 20.1-84.7 35.9-130.1 47.1v-927.3c0-64.3 23-109.3 67.5-144.8z"/>\n			</g>\n			<g id="g12471">\n				<path id="path12473" class="s0" d="m608.8 473v927.4c-45.4-11.2-89-27.1-130.1-47.1v-1061.3c13.6 6.3 40.9 19 62.5 36.2 44.5 35.5 67.6 80.6 67.6 144.8z"/>\n			</g>\n			<g id="g12475">\n				<path id="path12477" class="s0" d="m1052.3 201.9c0 34.6-48 27.3-108.3 75.2-55.5 44.4-84.4 106.7-84.4 176.7v958.5c-30.8 4.5-62.4 6.8-94.6 6.8-32 0-63.5-2.3-94.4-6.8v-958.5c0-70-28.8-132.3-84.5-176.7-60.1-47.9-108.2-40.6-108.2-75.2 0-19.5 16.8-31.7 29.1-38.1 79.1-34 166.4-52.9 258-52.9 92.1 0 179.7 19.1 259.2 53.4 12.1 6.5 28.1 18.7 28.1 37.6z"/>\n			</g>\n			<g id="g12479">\n				<path id="path12481" fill-rule="evenodd" class="s0" d="m765 1530.1c-423 0-765-342-765-765 0-423.1 342-765.1 765-765.1 423 0 765 342 765 765.1 0 423-342 765-765 765zm701.6-765c0-388.1-313.6-701.7-701.6-701.7-388 0-701.6 313.6-701.6 701.7 0 388 313.6 701.6 701.6 701.6 388 0 701.6-313.6 701.6-701.6z"/>\n			</g>\n			<g id="g12483">\n				<path id="path12485" class="s0" d="m414.8 212.5v513.1c-74.5-1.9-101.8-47-110.2-64.5-6.8-14.4-11.2-29.5-24.1-29.5-21.6 0-39.1 62.4-39.1 139.5 0 77.1 17.5 139.5 39.1 139.5 12.9 0 17.3-15.1 24.1-29.5 8.4-17.5 35.7-62.6 110.2-64.6v501.1c-182.6-116.1-303.9-320.1-303.9-552.5 0-232.5 121.3-436.6 303.9-552.6z"/>\n			</g>\n			<g id="g12487">\n				<path id="path12489" class="s0" d="m1417 816.8c-16.4 210.6-132.7 393.3-301.6 500.6v-1104.7c172.1 109.4 289.6 297 302.5 512.8-71.1-3.6-97.5-47.2-105.7-64.4-6.8-14.4-11.2-29.5-24.1-29.5-21.6 0-39.1 62.5-39.1 139.5 0 77.1 17.5 139.5 39.1 139.5 12.9 0 17.3-15.1 24.1-29.5 8.1-17.1 34.4-60.5 104.8-64.3z"/>\n			</g>\n		</g>\n	</g>\n</svg>';

// assets/logo/zhongan_bank.svg
var zhongan_bank_default = '<svg width="300" height="300" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">\n  <path d="M20 40C8.954 40 0 31.046 0 20S8.954 0 20 0s20 8.954 20 20-8.954 20-20 20Z" fill="#00CF9A"/>\n  <path d="M15.99 29.635h11.853a1.479 1.479 0 1 0 0-2.96H15.99a1.48 1.48 0 1 0 0 2.96Z" fill="#fff"/>\n  <path d="m17.104 29.132 11.823-13.338a1.483 1.483 0 0 0-2.218-1.966L14.886 27.17a1.478 1.478 0 0 0 .126 2.088c.612.542 1.55.486 2.092-.126Zm6.886-18.728H12.14a1.48 1.48 0 1 0 0 2.96h11.845c.816 0 1.48-.664 1.48-1.48a1.475 1.475 0 0 0-1.476-1.48Z" fill="#fff"/>\n  <path d="M22.869 10.903 11.05 24.24a1.483 1.483 0 0 0 2.218 1.966l11.819-13.338a1.483 1.483 0 0 0-2.218-1.966Z" fill="#fff"/>\n</svg>\n';

// assets/logo/bob.svg
var bob_default = '<svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1536 1536" width="1536" height="1536">\n	<title>Bank-of-Beijing_Company-Logo-svg</title>\n	<style>\n		.s0 { fill: #e50112 } \n	</style>\n	<g id="#e50112ff">\n		<path id="Layer" class="s0" d="m602.5 17c148.9-28.9 307.2-21.1 448.8 35.7 141.3 55.7 261.4 157.8 350.1 280 132.8 184.2 166.1 430.3 103.8 646.9-49-59.6-108-110.6-174.9-149.1 13.6-130.2-15.2-265.8-89.6-374.2-80.3-116.7-201.3-209.2-341.2-239.5-146.3-32.2-307.3-10.4-433.4 73.2-120.7 79-215 202.2-247.7 343.9-33.5 146.8-12.5 308.6 71 435.5 72.4 109.2 179.3 199 305.9 237 90.5 29.3 187.6 29.4 281.3 19.9 74.3-9.9 156.2-30.8 202.7-94.6 21.8-28 23.6-69.4 2.6-98.5-26.9-37.6-73.2-53.9-115.9-65.9-169.4-41.5-346.1-36.2-518-15.1-0.3-82.9-0.1-165.9-0.2-248.9 145.3-20.6 293-16.4 438.2 2.1 28.7 3.6 62.1 0.6 83.7-20.8 14.3-18.9 22-46.3 10.3-68.4-13.5-30-45.2-45.1-74-56.8-54.8-19.7-113.2-25.5-170.9-30.9-95.7-8.6-192.1-4.9-287.2 7.9-0.2-81.5 0.1-162.8-0.1-244.2 146.1-11.5 294.5-13.9 439.1 13.2 107.5 20.6 212.1 74.6 277.4 164.5 41.4 58 47.4 140.6 8.5 201.3-18.9 32.2-49.7 54.1-79.7 74.8 80.5 23.6 164.6 53.1 222.3 117.1 74.6 81.1 82.1 211.7 24.7 304.3-48.3 79.4-126.4 134.7-206.3 179.1-161 88.6-354.5 108.7-533.1 72.2-184.3-37.5-346.1-153.8-456.6-304-188.6-254-191.8-630.5-5.5-886.6 111.9-153.4 276-273.2 463.9-311.1z"/>\n	</g>\n</svg>';

// assets/logo/hsbc.svg
var hsbc_default = '<svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1516 759" width="1516" height="759">\n	<title>hsbc-logo-200x25-svg</title>\n	<style>\n		.s0 { fill: #ffffff } \n		.s1 { fill: #db0011 } \n	</style>\n	<path id="Layer" class="s0" d="m379.5 0h757.1v757.1h-757.1z"/>\n	<path id="Layer" class="s1" d="m1136.6 758v-758l378.6 379.5z"/>\n	<path id="Layer" class="s1" d="m379.5 0h757.1l-378.5 379.5z"/>\n	<path id="Layer" class="s1" d="m379.5 0v758l-379.5-378.5z"/>\n	<path id="Layer" class="s1" d="m1136.6 758h-757.1l378.6-378.5z"/>\n</svg>';

// assets/logo/henan_rcc.svg
var henan_rcc_default = '<?xml version="1.0" encoding="UTF-8"?>\n<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="402" height="264">\n<path d="M0 0 C2.19644214 1.84615986 4.25492476 3.69850071 6.3125 5.6875 C7.46790121 6.78084558 8.62414418 7.87330235 9.78125 8.96484375 C10.33425781 9.48933105 10.88726562 10.01381836 11.45703125 10.55419922 C14.21799898 13.14129588 17.09965668 15.57180559 20 18 C17.59041194 20.96035105 15.26961423 23.74386649 12.5 26.375 C6.67898621 32.48706448 3.07000711 39.1019012 2.96875 47.6328125 C3.58005958 58.60581945 8.19081457 67.43059333 16.08203125 74.99609375 C27.0165307 84.29857836 40.18295688 90.37522279 54 94 C54.84159668 94.22316895 55.68319336 94.44633789 56.55029297 94.67626953 C71.64032798 98.5202349 86.24138544 99.61590718 101.73950195 99.45996094 C102.44990128 99.46159241 103.1603006 99.46322388 103.89222717 99.46490479 C105.83087533 99.46852191 107.76952017 99.44512978 109.70800781 99.41992188 C113.93650979 100.1650213 115.25609548 101.77931671 118 105 C120.41581791 107.31490194 122.864558 109.59412367 125.3125 111.875 C125.98112061 112.49850342 126.64974121 113.12200684 127.33862305 113.7644043 C131.20944745 117.36375727 135.10786177 120.91803815 139.1171875 124.36328125 C141.42630383 126.37058362 143.6778114 128.43725674 145.9375 130.5 C149.92071965 134.11268759 154.04432802 137.41479369 158.3828125 140.58984375 C158.91648437 141.05519531 159.45015625 141.52054688 160 142 C160 142.66 160 143.32 160 144 C156.04415159 144.80440794 152.08492792 145.59094308 148.125 146.375 C147.03574219 146.59671875 145.94648438 146.8184375 144.82421875 147.046875 C128.57951722 150.2394753 112.72095133 151.31225293 96.18505859 151.20581055 C93.23917005 151.18743244 90.29359655 151.18530272 87.34765625 151.18554688 C71.83483493 151.15891577 56.79969052 150.32140842 41.5 147.5625 C40.44449951 147.37334015 40.44449951 147.37334015 39.36767578 147.18035889 C4.48413147 140.8065006 -35.81956871 126.84077126 -57.9765625 97.37109375 C-66.08301975 85.24590344 -69.9493889 71.96459795 -67.57421875 57.38671875 C-64.08895774 44.32233544 -56.42114154 34.29754056 -47 25 C-46.34257813 24.34386719 -45.68515625 23.68773438 -45.0078125 23.01171875 C-35.95729387 14.56327324 -24.92212194 8.74627521 -13.875 3.375 C-12.96210205 2.92471436 -12.0492041 2.47442871 -11.10864258 2.01049805 C-10.2452124 1.60226807 -9.38178223 1.19403809 -8.4921875 0.7734375 C-7.72245605 0.40653809 -6.95272461 0.03963867 -6.15966797 -0.33837891 C-3.6047242 -1.12109399 -2.46189707 -0.99175948 0 0 Z " fill="#A72116" transform="translate(99,61)"/>\n<path d="M0 0 C21.50371415 -0.33284841 42.71235168 -0.539155 64 3 C64.98500488 3.16097168 65.97000977 3.32194336 66.98486328 3.48779297 C102.52165378 9.53351922 144.33313427 23.51225171 166.9765625 53.62890625 C172.34252719 61.65501939 176.27956614 70.27414285 177 80 C177.0515625 80.66128906 177.103125 81.32257813 177.15625 82.00390625 C177.75052657 95.84559797 171.8803631 108.79750325 162.77539062 118.984375 C160.5634209 121.37058533 158.29712125 123.69584315 156 126 C155.23042969 126.77214844 154.46085938 127.54429687 153.66796875 128.33984375 C153.11753906 128.88769531 152.56710937 129.43554688 152 130 C147.53966242 128.58080168 144.67150822 126.13383357 141.375 122.9375 C137.50427013 119.28237631 133.59139497 115.7749192 129.4375 112.4375 C124.57495208 108.52632015 119.9842762 104.40809132 115.41015625 100.1640625 C113.34279164 98.30779022 111.25355413 96.6208858 109 95 C109.99 93.02 109.99 93.02 111 91 C111.66 91 112.32 91 113 91 C113.2475 90.443125 113.495 89.88625 113.75 89.3125 C115 87 115 87 116.875 84.8125 C122.97621007 76.73736903 124.1413301 69.03904637 123 59 C119.65482495 46.40861077 109.40795757 37.48968328 98.6875 31 C80.18145618 20.51036402 57.85777054 14.83605339 36.640625 14.90234375 C35.42246094 14.90427734 34.20429688 14.90621094 32.94921875 14.90820312 C30.46708312 14.92786101 27.98502432 14.97509312 25.50390625 15.04882812 C18.6514412 15.00877652 14.62922285 14.40332398 9.421875 9.75390625 C7.91949505 8.19619092 6.44523145 6.61087821 5 5 C3.3395504 3.32713937 1.67446177 1.65883493 0 0 Z " fill="#A72116" transform="translate(174,44)"/>\n<path d="M0 0 C2.41191855 1.74046869 4.50848816 3.44256677 6.6875 5.4375 C7.30109375 5.98156494 7.9146875 6.52562988 8.546875 7.08618164 C10.37559834 8.71232329 12.18903538 10.35413033 14 12 C14.96550781 12.86625 15.93101562 13.7325 16.92578125 14.625 C18.58045417 16.11144365 20.22821813 17.60563413 21.8671875 19.109375 C23.72583443 20.75696678 25.62634329 22.21871972 27.625 23.6875 C30 26 30 26 30.375 29.3125 C30.189375 30.6428125 30.189375 30.6428125 30 32 C24.60183935 34.79346173 19.2255394 37.18507556 13.51953125 39.26953125 C12.74365158 39.55479172 11.96777191 39.84005219 11.16838074 40.13395691 C9.54331096 40.72890378 7.91726374 41.32118714 6.2902832 41.91088867 C3.80401812 42.81558637 1.32502304 43.73857556 -1.15429688 44.66210938 C-2.74177463 45.24071734 -4.329652 45.81823036 -5.91796875 46.39453125 C-7.02279854 46.80998955 -7.02279854 46.80998955 -8.14994812 47.23384094 C-12.1243185 48.64972101 -14.96862465 49.49227957 -19 48 C-21.07781165 46.34348257 -22.92542395 44.7230982 -24.8125 42.875 C-25.87696677 41.86521307 -26.94207118 40.8560979 -28.0078125 39.84765625 C-28.52118164 39.35668457 -29.03455078 38.86571289 -29.56347656 38.35986328 C-31.39494332 36.62613285 -33.28071072 34.96275338 -35.1875 33.3125 C-35.79980469 32.77496094 -36.41210938 32.23742187 -37.04296875 31.68359375 C-38.50623337 30.42477728 -39.99186196 29.19187385 -41.48828125 27.97265625 C-42.31714844 27.28042969 -43.14601562 26.58820313 -44 25.875 C-44.763125 25.25367187 -45.52625 24.63234375 -46.3125 23.9921875 C-48 22 -48 22 -48.4375 19.4453125 C-47.91519096 16.52597802 -47.23032765 15.88029798 -45 14 C-43.15432739 13.10774231 -43.15432739 13.10774231 -41.06689453 12.37426758 C-40.2824295 12.09420364 -39.49796448 11.81413971 -38.68972778 11.52558899 C-37.84594574 11.23483994 -37.0021637 10.94409088 -36.1328125 10.64453125 C-34.82520462 10.18478157 -34.82520462 10.18478157 -33.49118042 9.71574402 C-31.64843279 9.07033216 -29.8041586 8.42926476 -27.95849609 7.79223633 C-25.13843906 6.81714682 -22.3249462 5.82467586 -19.51171875 4.83007812 C-17.71911729 4.20467541 -15.9261597 3.58029232 -14.1328125 2.95703125 C-13.29307892 2.6602095 -12.45334534 2.36338776 -11.58816528 2.05757141 C-3.84073414 -0.59366009 -3.84073414 -0.59366009 0 0 Z " fill="#A72217" transform="translate(207,83)"/>\n</svg>\n';

// assets/logo/huabei.svg
var huabei_default = '<?xml version="1.0" encoding="utf-8" ?>\n<svg baseProfile="full" height="1024" version="1.1" viewBox="0 0 1024 1024" width="1024" xmlns="http://www.w3.org/2000/svg" xmlns:ev="http://www.w3.org/2001/xml-events" xmlns:xlink="http://www.w3.org/1999/xlink"><defs /><path d="M 527 161 L 526 162 L 522 162 L 521 163 L 518 163 L 517 164 L 514 164 L 513 165 L 511 165 L 510 166 L 509 166 L 508 167 L 506 167 L 505 168 L 504 168 L 503 169 L 502 169 L 500 171 L 499 171 L 498 172 L 497 172 L 495 174 L 494 174 L 490 178 L 489 178 L 485 182 L 485 183 L 481 187 L 481 188 L 480 189 L 480 190 L 478 192 L 478 193 L 477 194 L 477 195 L 476 196 L 476 198 L 475 199 L 475 201 L 474 202 L 474 205 L 473 206 L 473 224 L 474 225 L 474 229 L 475 230 L 475 232 L 476 233 L 476 235 L 477 236 L 477 237 L 478 238 L 478 239 L 479 240 L 479 241 L 480 242 L 480 243 L 481 244 L 481 245 L 483 247 L 483 248 L 485 250 L 485 251 L 490 256 L 490 257 L 495 262 L 496 262 L 501 267 L 502 267 L 504 269 L 505 269 L 507 271 L 508 271 L 510 273 L 511 273 L 512 274 L 513 274 L 514 275 L 515 275 L 516 276 L 517 276 L 518 277 L 519 277 L 520 278 L 521 278 L 522 279 L 524 279 L 525 280 L 526 280 L 527 281 L 529 281 L 530 282 L 533 282 L 534 283 L 536 283 L 537 284 L 541 284 L 542 285 L 546 285 L 547 286 L 573 286 L 574 285 L 579 285 L 580 284 L 583 284 L 584 283 L 586 283 L 587 282 L 589 282 L 590 281 L 592 281 L 593 280 L 594 280 L 595 279 L 596 279 L 597 278 L 598 278 L 599 277 L 600 277 L 601 276 L 602 276 L 604 274 L 605 274 L 607 272 L 608 272 L 618 262 L 618 261 L 620 259 L 620 258 L 622 256 L 622 255 L 623 254 L 623 253 L 624 252 L 624 251 L 625 250 L 625 248 L 626 247 L 626 244 L 627 243 L 627 239 L 628 238 L 628 225 L 627 224 L 627 220 L 626 219 L 626 216 L 625 215 L 625 214 L 624 213 L 624 211 L 623 210 L 623 209 L 622 208 L 622 207 L 621 206 L 621 205 L 620 204 L 620 203 L 619 202 L 619 201 L 617 199 L 617 198 L 614 195 L 614 194 L 602 182 L 601 182 L 598 179 L 597 179 L 595 177 L 594 177 L 592 175 L 591 175 L 590 174 L 589 174 L 587 172 L 586 172 L 585 171 L 584 171 L 583 170 L 582 170 L 581 169 L 579 169 L 578 168 L 577 168 L 576 167 L 574 167 L 573 166 L 571 166 L 570 165 L 568 165 L 567 164 L 564 164 L 563 163 L 560 163 L 559 162 L 554 162 L 553 161 Z" fill="#38A5E5" stroke="none" /><path d="M 609 66 L 608 67 L 602 67 L 601 68 L 598 68 L 597 69 L 595 69 L 594 70 L 592 70 L 591 71 L 590 71 L 588 73 L 587 73 L 580 80 L 580 81 L 579 82 L 579 83 L 578 84 L 578 86 L 577 87 L 577 90 L 576 91 L 576 99 L 577 100 L 577 103 L 578 104 L 578 106 L 579 107 L 579 109 L 580 110 L 580 111 L 581 112 L 581 113 L 583 115 L 583 116 L 585 118 L 585 119 L 588 122 L 588 123 L 597 132 L 598 132 L 603 137 L 604 137 L 607 140 L 608 140 L 610 142 L 611 142 L 613 144 L 614 144 L 616 146 L 617 146 L 619 148 L 620 148 L 621 149 L 622 149 L 623 150 L 624 150 L 626 152 L 627 152 L 628 153 L 629 153 L 630 154 L 631 154 L 632 155 L 633 155 L 634 156 L 635 156 L 636 157 L 637 157 L 638 158 L 639 158 L 640 159 L 642 159 L 643 160 L 644 160 L 645 161 L 646 161 L 647 162 L 648 162 L 649 163 L 650 163 L 651 164 L 652 164 L 653 165 L 654 165 L 655 166 L 656 166 L 657 167 L 658 167 L 659 168 L 660 168 L 662 170 L 663 170 L 664 171 L 665 171 L 666 172 L 667 172 L 669 174 L 670 174 L 671 175 L 672 175 L 674 177 L 675 177 L 676 178 L 677 178 L 679 180 L 680 180 L 682 182 L 683 182 L 685 184 L 686 184 L 689 187 L 690 187 L 693 190 L 694 190 L 698 194 L 699 194 L 706 201 L 707 201 L 713 207 L 713 208 L 720 215 L 720 216 L 724 220 L 724 221 L 726 223 L 726 224 L 728 226 L 728 227 L 730 229 L 730 230 L 731 231 L 731 232 L 733 234 L 733 235 L 734 236 L 734 237 L 735 238 L 735 239 L 736 240 L 736 242 L 737 243 L 737 244 L 738 245 L 738 247 L 739 248 L 739 250 L 740 251 L 740 253 L 741 254 L 741 257 L 742 258 L 742 261 L 743 262 L 743 267 L 744 268 L 744 293 L 743 294 L 743 298 L 742 299 L 742 302 L 741 303 L 741 305 L 740 306 L 740 307 L 739 308 L 739 310 L 738 311 L 738 312 L 737 313 L 737 314 L 735 316 L 735 317 L 733 319 L 733 320 L 729 324 L 729 325 L 722 332 L 721 332 L 717 336 L 716 336 L 714 338 L 713 338 L 712 339 L 711 339 L 709 341 L 708 341 L 707 342 L 706 342 L 705 343 L 704 343 L 703 344 L 702 344 L 701 345 L 700 345 L 699 346 L 697 346 L 696 347 L 695 347 L 694 348 L 692 348 L 691 349 L 689 349 L 688 350 L 686 350 L 685 351 L 683 351 L 682 352 L 679 352 L 678 353 L 675 353 L 674 354 L 670 354 L 669 355 L 664 355 L 663 356 L 655 356 L 654 357 L 640 357 L 639 358 L 629 358 L 628 357 L 613 357 L 612 356 L 604 356 L 603 355 L 597 355 L 596 354 L 592 354 L 591 353 L 587 353 L 586 352 L 582 352 L 581 351 L 578 351 L 577 350 L 574 350 L 573 349 L 571 349 L 570 348 L 568 348 L 567 347 L 564 347 L 563 346 L 562 346 L 561 345 L 559 345 L 558 344 L 556 344 L 555 343 L 554 343 L 553 342 L 551 342 L 550 341 L 549 341 L 548 340 L 546 340 L 545 339 L 544 339 L 543 338 L 542 338 L 541 337 L 539 337 L 538 336 L 537 336 L 536 335 L 534 335 L 533 334 L 532 334 L 531 333 L 529 333 L 528 332 L 527 332 L 526 331 L 525 331 L 524 330 L 522 330 L 521 329 L 520 329 L 519 328 L 517 328 L 516 327 L 515 327 L 514 326 L 512 326 L 511 325 L 510 325 L 509 324 L 507 324 L 506 323 L 505 323 L 504 322 L 502 322 L 501 321 L 500 321 L 499 320 L 497 320 L 496 319 L 495 319 L 494 318 L 492 318 L 491 317 L 490 317 L 489 316 L 487 316 L 486 315 L 485 315 L 484 314 L 482 314 L 481 313 L 479 313 L 478 312 L 477 312 L 476 311 L 474 311 L 473 310 L 471 310 L 470 309 L 469 309 L 468 308 L 466 308 L 465 307 L 463 307 L 462 306 L 461 306 L 460 305 L 458 305 L 457 304 L 455 304 L 454 303 L 452 303 L 451 302 L 449 302 L 448 301 L 446 301 L 445 300 L 443 300 L 442 299 L 440 299 L 439 298 L 437 298 L 436 297 L 434 297 L 433 296 L 431 296 L 430 295 L 427 295 L 426 294 L 424 294 L 423 293 L 420 293 L 419 292 L 417 292 L 416 291 L 413 291 L 412 290 L 409 290 L 408 289 L 405 289 L 404 288 L 400 288 L 399 287 L 394 287 L 393 286 L 388 286 L 387 285 L 367 285 L 366 286 L 363 286 L 362 287 L 361 287 L 360 288 L 359 288 L 358 289 L 357 289 L 350 296 L 350 297 L 348 299 L 348 300 L 347 301 L 347 302 L 346 303 L 346 304 L 345 305 L 345 306 L 344 307 L 344 308 L 343 309 L 343 311 L 342 312 L 342 315 L 341 316 L 341 323 L 340 324 L 340 330 L 341 331 L 341 338 L 342 339 L 342 342 L 343 343 L 343 345 L 344 346 L 344 348 L 345 349 L 345 351 L 346 352 L 346 353 L 347 354 L 347 355 L 348 356 L 348 357 L 349 358 L 349 359 L 351 361 L 351 362 L 353 364 L 353 365 L 356 368 L 356 369 L 369 382 L 370 382 L 373 385 L 374 385 L 377 388 L 378 388 L 380 390 L 381 390 L 383 392 L 384 392 L 385 393 L 386 393 L 388 395 L 389 395 L 390 396 L 391 396 L 392 397 L 393 397 L 395 399 L 396 399 L 397 400 L 398 400 L 400 402 L 401 402 L 402 403 L 403 403 L 405 405 L 406 405 L 407 406 L 408 406 L 409 407 L 410 407 L 412 409 L 413 409 L 414 410 L 415 410 L 417 412 L 418 412 L 419 413 L 420 413 L 422 415 L 423 415 L 424 416 L 425 416 L 427 418 L 428 418 L 430 420 L 431 420 L 432 421 L 433 421 L 435 423 L 436 423 L 437 424 L 438 424 L 440 426 L 441 426 L 443 428 L 444 428 L 446 430 L 447 430 L 449 432 L 450 432 L 451 433 L 452 433 L 454 435 L 455 435 L 457 437 L 458 437 L 460 439 L 461 439 L 463 441 L 464 441 L 466 443 L 467 443 L 470 446 L 471 446 L 473 448 L 474 448 L 477 451 L 478 451 L 480 453 L 481 453 L 484 456 L 485 456 L 488 459 L 489 459 L 492 462 L 493 462 L 496 465 L 497 465 L 501 469 L 502 469 L 507 474 L 508 474 L 514 480 L 515 480 L 524 489 L 525 489 L 539 503 L 539 504 L 548 513 L 548 514 L 553 519 L 553 520 L 556 523 L 556 524 L 559 527 L 559 528 L 561 530 L 561 531 L 563 533 L 563 534 L 565 536 L 565 537 L 567 539 L 567 540 L 568 541 L 568 542 L 569 543 L 569 544 L 571 546 L 571 547 L 572 548 L 572 549 L 573 550 L 573 551 L 574 552 L 574 553 L 575 554 L 575 555 L 576 556 L 576 558 L 577 559 L 577 560 L 578 561 L 578 563 L 579 564 L 579 566 L 580 567 L 580 569 L 581 570 L 581 572 L 582 573 L 582 576 L 583 577 L 583 580 L 584 581 L 584 585 L 585 586 L 585 591 L 586 592 L 586 598 L 587 599 L 587 607 L 588 608 L 588 621 L 589 622 L 589 645 L 588 646 L 588 657 L 587 658 L 587 665 L 586 666 L 586 671 L 585 672 L 585 677 L 584 678 L 584 681 L 583 682 L 583 685 L 582 686 L 582 689 L 581 690 L 581 692 L 580 693 L 580 695 L 579 696 L 579 698 L 578 699 L 578 701 L 577 702 L 577 704 L 576 705 L 576 706 L 575 707 L 575 708 L 574 709 L 574 711 L 573 712 L 573 713 L 572 714 L 572 715 L 571 716 L 571 717 L 570 718 L 570 719 L 568 721 L 568 722 L 567 723 L 567 724 L 565 726 L 565 727 L 563 729 L 563 730 L 561 732 L 561 733 L 558 736 L 558 737 L 550 745 L 550 746 L 549 747 L 548 747 L 540 755 L 539 755 L 536 758 L 535 758 L 533 760 L 532 760 L 530 762 L 529 762 L 528 763 L 527 763 L 525 765 L 524 765 L 523 766 L 522 766 L 521 767 L 520 767 L 519 768 L 518 768 L 517 769 L 516 769 L 515 770 L 514 770 L 513 771 L 511 771 L 510 772 L 509 772 L 508 773 L 506 773 L 505 774 L 503 774 L 502 775 L 500 775 L 499 776 L 497 776 L 496 777 L 493 777 L 492 778 L 488 778 L 487 779 L 483 779 L 482 780 L 477 780 L 476 781 L 469 781 L 468 782 L 454 782 L 453 783 L 439 783 L 438 782 L 423 782 L 422 781 L 414 781 L 413 780 L 406 780 L 405 779 L 400 779 L 399 778 L 394 778 L 393 777 L 388 777 L 387 776 L 383 776 L 382 775 L 378 775 L 377 774 L 374 774 L 373 773 L 370 773 L 369 772 L 365 772 L 364 771 L 361 771 L 360 770 L 358 770 L 357 769 L 354 769 L 353 768 L 350 768 L 349 767 L 347 767 L 346 766 L 343 766 L 342 765 L 340 765 L 339 764 L 337 764 L 336 763 L 334 763 L 333 762 L 332 762 L 331 761 L 330 761 L 329 760 L 328 760 L 327 759 L 326 759 L 325 758 L 324 758 L 323 757 L 322 757 L 321 756 L 320 756 L 319 755 L 318 755 L 316 753 L 315 753 L 313 751 L 312 751 L 310 749 L 309 749 L 307 747 L 306 747 L 302 743 L 301 743 L 297 739 L 296 739 L 290 733 L 289 733 L 269 713 L 269 712 L 262 705 L 262 704 L 257 699 L 257 698 L 252 693 L 252 692 L 249 689 L 249 688 L 246 685 L 246 684 L 243 681 L 243 680 L 240 677 L 240 676 L 237 673 L 237 672 L 235 670 L 235 669 L 233 667 L 233 666 L 231 664 L 231 663 L 229 661 L 229 660 L 227 658 L 227 657 L 225 655 L 225 654 L 223 652 L 223 651 L 222 650 L 222 649 L 220 647 L 220 646 L 219 645 L 219 644 L 217 642 L 217 641 L 216 640 L 216 639 L 215 638 L 215 637 L 213 635 L 213 634 L 212 633 L 212 632 L 211 631 L 211 630 L 210 629 L 210 628 L 209 627 L 209 626 L 208 625 L 208 624 L 207 623 L 207 622 L 206 621 L 206 620 L 205 619 L 205 618 L 204 617 L 204 615 L 203 614 L 203 613 L 202 612 L 202 610 L 201 609 L 201 608 L 200 607 L 200 605 L 199 604 L 199 602 L 198 601 L 198 600 L 197 599 L 197 597 L 196 596 L 196 593 L 195 592 L 195 590 L 194 589 L 194 586 L 193 585 L 193 582 L 192 581 L 192 579 L 191 578 L 191 574 L 190 573 L 190 569 L 189 568 L 189 563 L 188 562 L 188 556 L 187 555 L 187 547 L 186 546 L 186 504 L 187 503 L 187 494 L 188 493 L 188 486 L 189 485 L 189 480 L 190 479 L 190 475 L 191 474 L 191 470 L 192 469 L 192 465 L 193 464 L 193 461 L 194 460 L 194 457 L 195 456 L 195 453 L 196 452 L 196 449 L 197 448 L 197 446 L 198 445 L 198 443 L 199 442 L 199 439 L 200 438 L 200 436 L 201 435 L 201 433 L 202 432 L 202 430 L 203 429 L 203 428 L 204 427 L 204 425 L 205 424 L 205 422 L 206 421 L 206 419 L 207 418 L 207 417 L 208 416 L 208 414 L 209 413 L 209 412 L 210 411 L 210 410 L 211 409 L 211 407 L 212 406 L 212 405 L 213 404 L 213 403 L 214 402 L 214 401 L 215 400 L 215 398 L 216 397 L 216 396 L 217 395 L 217 394 L 218 393 L 218 392 L 219 391 L 219 390 L 220 389 L 220 388 L 221 387 L 221 386 L 222 385 L 222 384 L 223 383 L 223 382 L 225 380 L 225 379 L 226 378 L 226 377 L 227 376 L 227 375 L 228 374 L 228 373 L 230 371 L 230 370 L 231 369 L 231 368 L 232 367 L 232 366 L 234 364 L 234 363 L 236 361 L 236 360 L 238 358 L 238 357 L 239 356 L 239 355 L 241 353 L 241 352 L 243 350 L 243 349 L 244 348 L 244 347 L 245 346 L 245 345 L 246 344 L 246 343 L 247 342 L 247 341 L 248 340 L 248 339 L 249 338 L 249 337 L 250 336 L 250 335 L 251 334 L 251 332 L 252 331 L 252 330 L 253 329 L 253 327 L 254 326 L 254 324 L 255 323 L 255 321 L 256 320 L 256 317 L 257 316 L 257 312 L 258 311 L 258 304 L 259 303 L 259 294 L 258 293 L 258 287 L 257 286 L 257 283 L 256 282 L 256 280 L 255 279 L 255 277 L 254 276 L 254 275 L 253 274 L 253 273 L 252 272 L 252 271 L 250 269 L 250 268 L 248 266 L 248 265 L 238 255 L 237 255 L 234 252 L 233 252 L 231 250 L 230 250 L 229 249 L 228 249 L 227 248 L 226 248 L 225 247 L 224 247 L 223 246 L 222 246 L 221 245 L 220 245 L 219 244 L 218 244 L 217 243 L 215 243 L 214 242 L 213 242 L 212 241 L 209 241 L 208 240 L 206 240 L 205 239 L 200 239 L 199 238 L 186 238 L 185 239 L 180 239 L 179 240 L 177 240 L 176 241 L 174 241 L 173 242 L 171 242 L 170 243 L 169 243 L 168 244 L 167 244 L 166 245 L 165 245 L 163 247 L 162 247 L 161 248 L 160 248 L 158 250 L 157 250 L 153 254 L 152 254 L 139 267 L 139 268 L 135 272 L 135 273 L 132 276 L 132 277 L 130 279 L 130 280 L 127 283 L 127 284 L 125 286 L 125 287 L 124 288 L 124 289 L 122 291 L 122 292 L 121 293 L 121 294 L 119 296 L 119 297 L 118 298 L 118 299 L 117 300 L 117 301 L 115 303 L 115 304 L 114 305 L 114 306 L 113 307 L 113 308 L 112 309 L 112 310 L 111 311 L 111 312 L 110 313 L 110 314 L 109 315 L 109 316 L 108 317 L 108 318 L 107 319 L 107 320 L 106 321 L 106 322 L 105 323 L 105 325 L 104 326 L 104 327 L 103 328 L 103 329 L 102 330 L 102 331 L 101 332 L 101 334 L 100 335 L 100 336 L 99 337 L 99 339 L 98 340 L 98 341 L 97 342 L 97 344 L 96 345 L 96 346 L 95 347 L 95 349 L 94 350 L 94 351 L 93 352 L 93 354 L 92 355 L 92 357 L 91 358 L 91 359 L 90 360 L 90 362 L 89 363 L 89 365 L 88 366 L 88 368 L 87 369 L 87 371 L 86 372 L 86 374 L 85 375 L 85 377 L 84 378 L 84 380 L 83 381 L 83 383 L 82 384 L 82 386 L 81 387 L 81 389 L 80 390 L 80 392 L 79 393 L 79 396 L 78 397 L 78 400 L 77 401 L 77 404 L 76 405 L 76 408 L 75 409 L 75 412 L 74 413 L 74 417 L 73 418 L 73 423 L 72 424 L 72 429 L 71 430 L 71 436 L 70 437 L 70 444 L 69 445 L 69 454 L 68 455 L 68 469 L 67 470 L 67 529 L 68 530 L 68 543 L 69 544 L 69 553 L 70 554 L 70 561 L 71 562 L 71 569 L 72 570 L 72 575 L 73 576 L 73 581 L 74 582 L 74 587 L 75 588 L 75 592 L 76 593 L 76 597 L 77 598 L 77 602 L 78 603 L 78 606 L 79 607 L 79 610 L 80 611 L 80 614 L 81 615 L 81 618 L 82 619 L 82 622 L 83 623 L 83 626 L 84 627 L 84 629 L 85 630 L 85 633 L 86 634 L 86 636 L 87 637 L 87 639 L 88 640 L 88 642 L 89 643 L 89 646 L 90 647 L 90 649 L 91 650 L 91 652 L 92 653 L 92 654 L 93 655 L 93 657 L 94 658 L 94 660 L 95 661 L 95 663 L 96 664 L 96 665 L 97 666 L 97 668 L 98 669 L 98 671 L 99 672 L 99 673 L 100 674 L 100 676 L 101 677 L 101 678 L 102 679 L 102 680 L 103 681 L 103 683 L 104 684 L 104 685 L 105 686 L 105 687 L 106 688 L 106 690 L 107 691 L 107 692 L 108 693 L 108 694 L 109 695 L 109 696 L 110 697 L 110 698 L 111 699 L 111 700 L 112 701 L 112 703 L 113 704 L 113 705 L 114 706 L 114 707 L 115 708 L 115 709 L 116 710 L 116 711 L 117 712 L 117 713 L 119 715 L 119 716 L 120 717 L 120 718 L 121 719 L 121 720 L 122 721 L 122 722 L 123 723 L 123 724 L 124 725 L 124 726 L 126 728 L 126 729 L 127 730 L 127 731 L 128 732 L 128 733 L 130 735 L 130 736 L 131 737 L 131 738 L 133 740 L 133 741 L 134 742 L 134 743 L 136 745 L 136 746 L 137 747 L 137 748 L 139 750 L 139 751 L 141 753 L 141 754 L 143 756 L 143 757 L 145 759 L 145 760 L 147 762 L 147 763 L 149 765 L 149 766 L 152 769 L 152 770 L 154 772 L 154 773 L 157 776 L 157 777 L 160 780 L 160 781 L 164 785 L 164 786 L 168 790 L 168 791 L 172 795 L 172 796 L 178 802 L 178 803 L 186 811 L 186 812 L 214 840 L 215 840 L 223 848 L 224 848 L 230 854 L 231 854 L 235 858 L 236 858 L 240 862 L 241 862 L 245 866 L 246 866 L 248 868 L 249 868 L 252 871 L 253 871 L 256 874 L 257 874 L 259 876 L 260 876 L 263 879 L 264 879 L 266 881 L 267 881 L 269 883 L 270 883 L 272 885 L 273 885 L 274 886 L 275 886 L 277 888 L 278 888 L 280 890 L 281 890 L 282 891 L 283 891 L 285 893 L 286 893 L 287 894 L 288 894 L 290 896 L 291 896 L 292 897 L 293 897 L 294 898 L 295 898 L 297 900 L 298 900 L 299 901 L 300 901 L 301 902 L 302 902 L 303 903 L 304 903 L 306 905 L 307 905 L 308 906 L 309 906 L 310 907 L 311 907 L 312 908 L 313 908 L 314 909 L 315 909 L 316 910 L 317 910 L 318 911 L 319 911 L 320 912 L 321 912 L 322 913 L 323 913 L 324 914 L 326 914 L 327 915 L 328 915 L 329 916 L 330 916 L 331 917 L 332 917 L 333 918 L 334 918 L 335 919 L 337 919 L 338 920 L 339 920 L 340 921 L 341 921 L 342 922 L 344 922 L 345 923 L 346 923 L 347 924 L 349 924 L 350 925 L 351 925 L 352 926 L 354 926 L 355 927 L 356 927 L 357 928 L 359 928 L 360 929 L 362 929 L 363 930 L 365 930 L 366 931 L 367 931 L 368 932 L 370 932 L 371 933 L 373 933 L 374 934 L 377 934 L 378 935 L 380 935 L 381 936 L 383 936 L 384 937 L 386 937 L 387 938 L 390 938 L 391 939 L 393 939 L 394 940 L 397 940 L 398 941 L 401 941 L 402 942 L 405 942 L 406 943 L 409 943 L 410 944 L 413 944 L 414 945 L 418 945 L 419 946 L 422 946 L 423 947 L 427 947 L 428 948 L 432 948 L 433 949 L 438 949 L 439 950 L 444 950 L 445 951 L 452 951 L 453 952 L 459 952 L 460 953 L 469 953 L 470 954 L 481 954 L 482 955 L 508 955 L 509 956 L 514 956 L 515 955 L 541 955 L 542 954 L 553 954 L 554 953 L 562 953 L 563 952 L 571 952 L 572 951 L 577 951 L 578 950 L 584 950 L 585 949 L 589 949 L 590 948 L 595 948 L 596 947 L 600 947 L 601 946 L 605 946 L 606 945 L 609 945 L 610 944 L 613 944 L 614 943 L 617 943 L 618 942 L 621 942 L 622 941 L 625 941 L 626 940 L 629 940 L 630 939 L 632 939 L 633 938 L 636 938 L 637 937 L 639 937 L 640 936 L 642 936 L 643 935 L 645 935 L 646 934 L 648 934 L 649 933 L 651 933 L 652 932 L 654 932 L 655 931 L 657 931 L 658 930 L 660 930 L 661 929 L 663 929 L 664 928 L 665 928 L 666 927 L 668 927 L 669 926 L 671 926 L 672 925 L 673 925 L 674 924 L 676 924 L 677 923 L 678 923 L 679 922 L 680 922 L 681 921 L 683 921 L 684 920 L 685 920 L 686 919 L 687 919 L 688 918 L 690 918 L 691 917 L 692 917 L 693 916 L 694 916 L 695 915 L 696 915 L 697 914 L 698 914 L 699 913 L 700 913 L 701 912 L 703 912 L 704 911 L 705 911 L 706 910 L 707 910 L 708 909 L 709 909 L 711 907 L 712 907 L 713 906 L 714 906 L 715 905 L 716 905 L 717 904 L 718 904 L 719 903 L 720 903 L 721 902 L 722 902 L 723 901 L 724 901 L 726 899 L 727 899 L 728 898 L 729 898 L 730 897 L 731 897 L 733 895 L 734 895 L 735 894 L 736 894 L 738 892 L 739 892 L 740 891 L 741 891 L 743 889 L 744 889 L 745 888 L 746 888 L 748 886 L 749 886 L 751 884 L 752 884 L 754 882 L 755 882 L 757 880 L 758 880 L 760 878 L 761 878 L 764 875 L 765 875 L 767 873 L 768 873 L 771 870 L 772 870 L 775 867 L 776 867 L 779 864 L 780 864 L 783 861 L 784 861 L 788 857 L 789 857 L 794 852 L 795 852 L 801 846 L 802 846 L 811 837 L 812 837 L 834 815 L 834 814 L 843 805 L 843 804 L 849 798 L 849 797 L 854 792 L 854 791 L 858 787 L 858 786 L 862 782 L 862 781 L 865 778 L 865 777 L 868 774 L 868 773 L 870 771 L 870 770 L 873 767 L 873 766 L 875 764 L 875 763 L 877 761 L 877 760 L 879 758 L 879 757 L 881 755 L 881 754 L 883 752 L 883 751 L 885 749 L 885 748 L 887 746 L 887 745 L 888 744 L 888 743 L 890 741 L 890 740 L 891 739 L 891 738 L 893 736 L 893 735 L 894 734 L 894 733 L 896 731 L 896 730 L 897 729 L 897 728 L 898 727 L 898 726 L 899 725 L 899 724 L 901 722 L 901 721 L 902 720 L 902 719 L 903 718 L 903 717 L 904 716 L 904 715 L 905 714 L 905 713 L 906 712 L 906 711 L 907 710 L 907 709 L 908 708 L 908 707 L 909 706 L 909 705 L 910 704 L 910 703 L 911 702 L 911 701 L 912 700 L 912 699 L 913 698 L 913 697 L 914 696 L 914 695 L 915 694 L 915 693 L 916 692 L 916 690 L 917 689 L 917 688 L 918 687 L 918 686 L 919 685 L 919 683 L 920 682 L 920 681 L 921 680 L 921 679 L 922 678 L 922 676 L 923 675 L 923 674 L 924 673 L 924 671 L 925 670 L 925 669 L 926 668 L 926 666 L 927 665 L 927 663 L 928 662 L 928 661 L 929 660 L 929 658 L 930 657 L 930 655 L 931 654 L 931 652 L 932 651 L 932 649 L 933 648 L 933 646 L 934 645 L 934 643 L 935 642 L 935 640 L 936 639 L 936 637 L 937 636 L 937 633 L 938 632 L 938 630 L 939 629 L 939 627 L 940 626 L 940 623 L 941 622 L 941 619 L 942 618 L 942 615 L 943 614 L 943 611 L 944 610 L 944 607 L 945 606 L 945 602 L 946 601 L 946 598 L 947 597 L 947 593 L 948 592 L 948 588 L 949 587 L 949 582 L 950 581 L 950 576 L 951 575 L 951 569 L 952 568 L 952 562 L 953 561 L 953 554 L 954 553 L 954 544 L 955 543 L 955 530 L 956 529 L 956 474 L 955 473 L 955 461 L 954 460 L 954 451 L 953 450 L 953 443 L 952 442 L 952 435 L 951 434 L 951 429 L 950 428 L 950 423 L 949 422 L 949 417 L 948 416 L 948 412 L 947 411 L 947 407 L 946 406 L 946 402 L 945 401 L 945 398 L 944 397 L 944 394 L 943 393 L 943 390 L 942 389 L 942 386 L 941 385 L 941 382 L 940 381 L 940 378 L 939 377 L 939 375 L 938 374 L 938 371 L 937 370 L 937 368 L 936 367 L 936 365 L 935 364 L 935 362 L 934 361 L 934 359 L 933 358 L 933 355 L 932 354 L 932 353 L 931 352 L 931 350 L 930 349 L 930 347 L 929 346 L 929 344 L 928 343 L 928 341 L 927 340 L 927 339 L 926 338 L 926 336 L 925 335 L 925 334 L 924 333 L 924 331 L 923 330 L 923 328 L 922 327 L 922 326 L 921 325 L 921 324 L 920 323 L 920 321 L 919 320 L 919 319 L 918 318 L 918 317 L 917 316 L 917 314 L 916 313 L 916 312 L 915 311 L 915 310 L 914 309 L 914 308 L 913 307 L 913 306 L 912 305 L 912 304 L 911 303 L 911 302 L 910 301 L 910 299 L 909 298 L 909 297 L 908 296 L 908 295 L 907 294 L 907 293 L 906 292 L 906 291 L 904 289 L 904 288 L 903 287 L 903 286 L 902 285 L 902 284 L 901 283 L 901 282 L 900 281 L 900 280 L 899 279 L 899 278 L 897 276 L 897 275 L 896 274 L 896 273 L 895 272 L 895 271 L 893 269 L 893 268 L 892 267 L 892 266 L 890 264 L 890 263 L 889 262 L 889 261 L 887 259 L 887 258 L 886 257 L 886 256 L 884 254 L 884 253 L 882 251 L 882 250 L 880 248 L 880 247 L 878 245 L 878 244 L 876 242 L 876 241 L 874 239 L 874 238 L 871 235 L 871 234 L 869 232 L 869 231 L 866 228 L 866 227 L 863 224 L 863 223 L 860 220 L 860 219 L 856 215 L 856 214 L 851 209 L 851 208 L 847 204 L 847 203 L 839 195 L 839 194 L 806 161 L 805 161 L 798 154 L 797 154 L 791 148 L 790 148 L 786 144 L 785 144 L 782 141 L 781 141 L 777 137 L 776 137 L 773 134 L 772 134 L 770 132 L 769 132 L 766 129 L 765 129 L 763 127 L 762 127 L 759 124 L 758 124 L 756 122 L 755 122 L 753 120 L 752 120 L 750 118 L 749 118 L 748 117 L 747 117 L 745 115 L 744 115 L 742 113 L 741 113 L 740 112 L 739 112 L 737 110 L 736 110 L 735 109 L 734 109 L 732 107 L 731 107 L 730 106 L 729 106 L 728 105 L 727 105 L 725 103 L 724 103 L 723 102 L 722 102 L 721 101 L 720 101 L 719 100 L 718 100 L 717 99 L 716 99 L 714 97 L 713 97 L 712 96 L 711 96 L 710 95 L 709 95 L 708 94 L 707 94 L 706 93 L 705 93 L 704 92 L 703 92 L 702 91 L 701 91 L 700 90 L 699 90 L 698 89 L 696 89 L 695 88 L 694 88 L 693 87 L 692 87 L 691 86 L 690 86 L 689 85 L 687 85 L 686 84 L 685 84 L 684 83 L 682 83 L 681 82 L 680 82 L 679 81 L 678 81 L 677 80 L 675 80 L 674 79 L 672 79 L 671 78 L 669 78 L 668 77 L 667 77 L 666 76 L 664 76 L 663 75 L 660 75 L 659 74 L 657 74 L 656 73 L 654 73 L 653 72 L 650 72 L 649 71 L 646 71 L 645 70 L 642 70 L 641 69 L 637 69 L 636 68 L 631 68 L 630 67 L 621 67 L 620 66 Z" fill="#38A5E5" stroke="none" /></svg>';

// assets/logo/jd_baitiao.svg
var jd_baitiao_default = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="1592pt" height="1592pt" viewBox="0 0 1592 1592">\n<g enable-background="new">\n<path transform="matrix(1,0,0,-1,0,1592)" d="M 0 1592 L 1591 1592 L 1591 1 L 0 1 L 0 1592 Z " fill="#ff0000"/>\n<clipPath id="cp0">\n<path transform="matrix(1,0,0,-1,0,1592)" d="M 675.59 457.65 C 684.78 400.34 710.47 364.73 795.1 406.83 C 787.79 387.96 780.37 369.09 773.06 350.22 C 703.4 339.25 657.67 384.78 675.59 457.65 Z "/>\n</clipPath>\n<g clip-path="url(#cp0)">\n<clipPath id="cp1">\n<path transform="matrix(1,0,0,-1,0,1592)" d="M 657.67 457.65 L 795.1 457.65 L 795.1 339.25 L 657.67 339.25 L 657.67 457.65 Z "/>\n</clipPath>\n<g clip-path="url(#cp1)">\n<image x="657" y="1134" width="139" height="119" xlink:href="data:image/png;base64,\n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\njCoAAAAASUVORK5CYII="/>\n</g>\n</g>\n<clipPath id="cp2">\n<path transform="matrix(1,0,0,-1,0,1592)" d="M 1433.7 872.41 C 1305.81 696.46 1177.93 627.35 1050.16 599.76 C 1050.16 589.97 1050.16 580.18 1050.16 570.39 C 1051.22 444.09 1048.87 318.5 1049.93 192.2 C 1034.13 192.2 1021.87 191.61 1006.08 191.61 C 1002.07 241.49 991.47 283.59 975.55 320.98 C 958.93 356.47 931.12 350.46 911.79 320.86 C 891.87 290.55 877.96 245.62 867.82 191.61 C 853.44 191.61 839.18 191.61 824.8 191.61 C 830.34 230.64 831.17 280.64 831.17 332.3 C 791.57 314.61 741 263.78 683.36 191.61 C 672.52 191.61 661.68 191.61 650.83 191.61 C 723.2 314.49 795.45 437.49 867.82 560.37 C 870.3 570.63 872.77 580.89 875.25 591.15 C 622.07 640.8 435.37 760.02 334.84 878.07 C 273.55 959.79 273.9 1034.8 341.2 1102.49 C 418.17 1178.55 524.72 1235.51 649.3 1280.8 C 893.99 1376.08 1278.94 1421.01 1470.35 1313.82 C 1589.05 1256.62 1535.77 1026.31 1433.7 872.41 Z "/>\n</clipPath>\n<g clip-path="url(#cp2)">\n<clipPath id="cp3">\n<path transform="matrix(1,0,0,-1,0,1592)" d="M 273.55 1395.42 L 1589.05 1395.42 L 1589.05 191.61 L 273.55 191.61 L 273.55 1395.42 Z "/>\n</clipPath>\n<g clip-path="url(#cp3)">\n<image x="273" y="196" width="1317" height="1205" xlink:href="data:image/png;base64,\niVBORw0KGgoAAAANSUhEUgAABSUAAAS1CAYAAABd4L4RAAAACXBIWXMAAA7EAAAO\nxAGVKw4bAADPE0lEQVR4nOzY2XJcS3Yu68P3f0s1W30vXdexKlmmMkl4LJIYAEb6\n9O+uuEggfq9AY/Htf/7nf/70/y3x7du3rz7CWrVhtWHGNsZNU2rDanNm7GPclOvp\nHidJErNv//3f//2nbb/wbDvPJrVhtWHWNtZdE2rDasOsbay7ch3d4SRJYvSXR8mn\nP1j2S8+282xSG1YbZmxj3DSpPqw2zNjGuCnX0z1OkiQWPzxKPv3HZb/0bDvPJrVh\ntWHGNsZNU2pzVh9mbGPclOvpHidJkld2fJR8+ouLfunZdJZtanNWH2ZsY9w0pTas\nNszaxror19I9TpIkr+anHyXv/2DZLzzbzrNJbVhtmLWNddeE2rDaMGMb46ZcT/c4\nSZK8il9+lHz6x4t+6dl0lm1qw2pzZuxj3DSlNqw2zNrGuivX0R1OkiTbvetR8ukD\nLfrFZ9NZNqoPqw0ztjFumlIbVpszYx/jplxP9zhJkmwz9ih5/4DLfuHZdp5NasNq\nw6xtrLsm1IbVhlnbWHflWrrHSZJkg/FHyacPvugXnk1n2ag+rDbM2Ma4aUptWG3O\njH2Mm3I93eMkSfKVPvRR8v5Jlv3Cs+08m9SG1YZZ21h3TagNqw2ztrHuynV0h5Mk\nyVf4lEfJHz7pol98Np1lm9qw2pwZ+xg3TakNqw2ztrHuyrV0j5MkyWf4kkfJ+ydf\n9gvPtvNsUhtWG2ZsY9w0pTasNmfGPsZNuZ7ucZIk+Uhf+ih5P8SyX3i2nWeT2rDa\nMGsb664JtWG1YdY21l25ju5wkiT5CCseJR9t+6Vn23k2qQ2rDTO2MW6aVB9WG2Zs\nY9yU6+keJ0mSKeseJR9t+6Vn23k2qQ2rDTO2MW6aUpuz+jBjG+OmXE/3OEmSvMfq\nR8lHm37p2XSWbWpzVh9mbGPcNKU2rDbM2sa6K9fSPU6SJL/qZR4lb7b9wrPtPJvU\nhtWGWdtYd02oDasNM7Yxbsr1dI+TJMnPerlHyUebfunZdJaN6sNqw4xtjJum1Oas\nPszYxrgp19M9TpIkJy/9KPlo0y89m86yUX1YbZixjXHTlNqw2pwZ+xg35Xq6x0mS\n5HuaR8mbbb/wbDvPJrVhtWHWNtZdE2rDasOsbay7ci3d4yRJ8me6R8lH237h2Xae\nTWrDasOMbYybJtWH1YYZ2xg35Xq6x0mSXJv6UfJm2y88286zSW1YbZi1jXXXhNqw\n2jBrG+uuXEd3OEmSa7rEo+T3Nv3is+ks29SG1ebM2Me4aUptWG2YtY11V66le5wk\nyTVc8lHyZtsvPNvOs0ltWG2YtY1114TasNowYxvjplxP9zhJErdLP0rebPuFZ9t5\nNqkNqw2ztrHumlAbVhtmbWPdlevoDidJ4tSj5He2/dKz7Tyb1IbVhlnbWHdNqA2r\nDTO2MW7K9XSPkyTx6FHyYNsvPdvOs0ltWG2YtY1114TasNowaxvrrlxL9zhJktf1\n7b/+67/uj5L9UGeb2mw6yza1OasPM7YxbppSG1YbZm1j3ZVr6R4nSfJ6nh4l73/Y\nD3W0rc2282xSG1YbZm1j3TWhNqw2zNjGuCnX0z1OkuR1vPko+fQX+sGONrXZdJaN\n6sNqw4xtjJsm1YfVhhnbGDflerrHSZLs9oePkk9/uR/saFubbefZpDasNszYxrhp\nSm1Ybc6MfYybcj3d4yRJ9vmlR8n7P+qHOtrWZtt5NqkNq82ZsY9x05TasNowaxvr\nrlxL9zhJkh1+61Hy6QP0Qx1ta7PtPJvUhtWGGdsYN02qD6sNM7Yxbsr1dI+TJPla\n736UvH+gfqijbW22nWeT2rDaMGsb664JtWG1YdY21l25ju5wkiRfY+xR8ocP3A93\ntKnNprNsU5uz+jBjG+OmKbVhtWHWNtZduZbucZIkn+PDHiXvn6Af6mhbm23n2aQ2\nrDbM2sa6a0JtWG2YsY1xU66ne5wkycf68EfJ+yfqh/rRpj6bzrJNbVhtmLWNddeE\n2rDaMGsb665cR3c4SZKP8WmPkk+ftB/saFubbefZpDasNszaxrprQm1YbZixjXFT\nrqd7nCTJnC95lHw6QD/Y0bY2286zSW1YbZi1jXXXhNqw2jBrG+uuXEv3OEmS3/fl\nj5KP+qHONrXZdJZtanNWH2ZsY9w0pTasNmfGPsZNuZ7ucZIkv27Vo+RNP9TZtjbb\nzrNJbVhtmLWNddeE2rDaMGMb46ZcT/c4SZKft/JR8lE/2NmmNpvOslF9WG2YsY1x\n06T6sNowYxvjplxP9zhJkrP1j5KP+sHOtrXZdp5NasNqw4xtjJum1IbV5szYx7gp\n19M9TpLkRy/1KHnTD3W2rc2282xSG1abM2Mf46YptWG1YdY21l25lu5xkiT/6yUf\nJR/1Q51ta7PtPJvUhtWGGdsYN02qD6sNM7Yxbsr1dI+TJFf38o+Sj/rBzra12Xae\nTWrDasOMbYybJtWH1YYZ2xg35Xq6x0mSK1I9Sj7qBzvb1GbTWbapzVl9mLGNcdOU\n2rDaMGsb665cS/c4SXIV2kfJm36os21ttp1nk9qw2jBrG+uuCbVhtWHGNsZNuZ7u\ncZLETv8oedMP9bNNfTadZZvasNqcGfsYN02pDasNs7ax7sp1dIeTJFaXeZT8Xj/c\n2aY2m86yUX1YbZixjXHTlNqw2jBrG+uuXEv3OElicdlHyZt+qLNtbbadZ5PasNow\naxvrrgm1YbVh1jbWXbmW7nGS5JVd/lHyUT/U2aY2m86yTW3O6sOMbYybptSG1ebM\n2Me4KdfTPU6SvKIeJd/QD3W2rc2282xSG1YbZm1j3TWhNqw2zNrGuivX0R1OkryS\nb//5n//5p354sdqcbeqz6Szb1IbV5szYx7hpSm1YbZi1jXVXrqV7nCTZ7C+Pkk9/\n0A8uVBu2rc2282xSG1YbZmxj3DSlNqw2Z8Y+xk25nu5xkmSjHx4l7/+hH1yoNmxb\nm23n2aQ2rDbM2sa6a0JtWG2YtY11V66jO5wk2QQfJZ/+Uj+8UG3YtjbbzrNJbVht\nmLGNcdOk+rDaMGMb46ZcT/c4SfLVfupR8ukf9MML1YZta7PtPJvUhtWGGdsYN02q\nD6sNM7Yxbsr1dI+TJF/hlx8l7/+wH1xH9WGb2mw6yza1OasPM7YxbppSG1YbZm1j\n3ZVr6R4nST7Lbz9KPn2QfnCh2rBtbbadZ5PasNowaxvrrgm1YbVhxjbGTbme7nGS\n5KONPEreP1g/uI7qwza12XSWjerDasOMbYybJtWH1YYZ2xg35Xq6x0mSjzD6KPnD\nB++HF6oN29Rm01k2qg+rDTO2MW6aUhtWmzNjH+OmXE/3OEky5UMfJe+fpB9cqDZs\nW5tt59mkNqw2zNrGumtCbVhtmLWNdVeupXucJHmPT3mUfPqE/eBCtWHb2mw7zya1\nYbVhxjbGTZPqw2rDjG2Mm3I93eMkye/49EfJ+yfuBxeqDdvWZtt5NqkNqw2ztrHu\nmlAbVhtmbWPdlevoDidJfsWXPUo+HaIfXqg2Z5v6bDrLNrVhtTkz9jFumlIbVhtm\nbWPdlWvpHidJTlY8Sj7qBxerDdvWZtt5NqkNqw2ztrHumlAbVhtmbGPclOvpHidJ\n3rLuUfKmH1ysNmxbm23n2aQ2rDbM2sa6a0JtWG2YtY11V66jO5wkebT2UfJRP7xY\nbdi2NtvOs0ltWG2YtY1114TasNowYxvjplxP9zhJ8hKPko/64cVqw7a12XaeTWrD\nasOsbay7JtSG1YZZ21h35Vq6x0lyPS/3KHnTD62z+rBNbTadZZvanNWHGdsYN02p\nDasNs7ax7sq1dI+T5Dpe9lHyUT+4WG3YtjbbzrNJbVhtmLWNddeE2rDaMGMb46Zc\nT/c4SfwUj5I3/eA6qw/b1GbTWTaqD6sNM7YxbppUH1YbZmxj3JTr6R4niZPqUfJ7\n/fBitWGb2mw6y0b1YbVhxjbGTVNqw2pzZuxj3JTr6R4niYf6UfKmH1ysNmxbm23n\n2aQ2rDZnxj7GTVNqw2rDrG2su3It3eMkeW2XeJR81A8uVhu2rc2282xSG1YbZmxj\n3DSpPqw2zNjGuCnX0z1Oktd0uUfJm35wsdqwbW22nWeT2rDaMGsb664JtWG1YdY2\n1l25ju5wkryWyz5KPuqH11l92KY2m86yTW1Ybc6MfYybptSG1YZZ21h35Vq6x0my\nW4+S3+kHF6sN29Zm23k2qQ2rDbO2se6aUBtWG2ZsY9yU6+keJ8lOPUqCfnCx2rBt\nbbadZ5PasNowaxvrrgm1YbVh1jbWXbmO7nCS7PLtP/7jP/7yKNk3aFYbVhu2rc22\n82xSG1YbZm1j3TWhNqw2zNjGuCnX0z1Okq93f5R8+sO+QaPasNqwbW22nWeT2rDa\nMGsb664JtWG1YdY21l25lu5xkny+Nx8l7/+xb8yoNmf1YZvabDrLNrU5qw8ztjFu\nmlIbVhtmbWPdlWvpHifJ5zk+Sj79xb45o9qw2rBtbbadZ5PasNowaxvrrgm1YbVh\nxjbGTbme7nGSfLyffpS8/4O+OaPanNWHbWqz6Swb1YfVhhnbGDdNqg+rDTO2MW7K\n9XSPk+Rj/PKj5A8foG/QqDasNmxTm01n2ag+rDbM2Ma4aUptWG3OjH2Mm3I93eMk\nmfPuR8n7B+qbM6oNqw3b1mbbeTapDavNmbGPcdOU2rDaMGsb665cS/c4Sd5n7FHy\n/gH7xnxUH1Ybtq3NtvNsUhtWG2ZsY9w0qT6sNszYxrgp19M9TpLfM/4o+cMn6Bs0\nqg2rDdvWZtt5NqkNqw0ztjFumlQfVhtmbGPclOvpHifJz/vwR8n7J+qbM6rNWX3Y\npjabzrJNbc7qw4xtjJum1IbVhlnbWHflWrrHSXL2aY+ST5+0b86oNqw2bFubbefZ\npDasNszaxrprQm1YbZixjXFTrqd7nCRv+5JHyfsn75szqg2rzdmmPpvOsk1tWG2Y\ntY1114TasNowaxvrrlxHdzhJnn3po+SjvkGf1YfVhm1qs+ksG9WH1YYZ2xg3TakN\nqw2ztrHuyrV0j5Nc3ZpHyUd9c2a1YbVh29psO88mtWG1YdY21l0TasNqw6xtrLty\nLd3jJFe08lHypm/MrDZn9WGb2mw6yza1OasPM7YxbppSG1abM2Mf46ZcT/c4yZWs\nfpR81DdnVhtWG7atzbbzbFIbVhtmbWPdNaE2rDbM2sa6K9fRHU5yBS/zKPmob9Cs\nNqw2Z5v6bDrLNrVhtTkz9jFumlIbVhtmbWPdlWvpHicxeslHyUd9c2a1YbVhm9ps\nOstG9WG1YcY2xk1TasNqc2bsY9yU6+keJzF5+UfJm745s9qw2pxt6rPpLNvUhtXm\nzNjHuGlKbVhtmLWNdVeupXuc5NVpHiVv+sZ8Vh9WG7atzbbzbFIbVhtmbWPdNaE2\nrDbM2Ma4KdfTPU7yqnSPkt/rGzSrDasN29Zm23k2qQ2rDTO2MW6aVB9WG2ZsY9yU\n6+keJ3kl+kfJm745s9qc1YdtarPpLNvU5qw+zNjGuGlKbVhtmLWNdVeupXucZLvL\nPEo+6pszqw2rDdvWZtt5NqkNqw2ztrHumlAbVhtmbGPclOvpHifZ6pKPkjd9c2a1\nYbU529Rn01m2qQ2rzZmxj3HTlNqw2jBrG+uuXEd3OMk2l36U/F7fpFltWG3Ypjab\nzrJRfVhtmLGNcdOU2rDaMGsb665cS/c4yVfrUfINfXNmtWG1YdvabDvPJrVhtWHW\nNtZdE2rDasOsbay7ci3d4yRfoUfJg74xn9WH1YZta7PtPJvUhtWGGdsYN02qD6sN\nM7Yxbsr1dI+TfKZv//7v/35/lOwbEKsNqw2rDdvWZtt5NqkNqw2ztrHumlAbVhtm\nbWPdlevoDif5DE+Pkk//oW9CqDasNqw2Z5v6bDrLNrVhtTkz9jFumlIbVhtmbWPd\nlWvpHif5CPgoef8LffM5qg+rDasN29Zm23k2qQ2rDbO2se6aUBtWG2ZsY9yU6+ke\nJ5n0h4+ST3+5b0CoNqw2rDZsW5tt59mkNqw2zNrGumtCbVhtmLWNdVeuozucZMIv\nPUre/1HfgI7qw2rDasO2tdl2nk1qw2rDrG2suybUhtWGGdsYN+V6usdJftdvPUr+\n8EH6JoRqw2rDasO2tdl2nk1qw2rDrG2suybUhtWGWdtYd+VausdJftbIo+T9g/XN\nB9WG1easPmxTm01n2aY2Z/VhxjbGTVNqw2rDrG2su3It3eMkf2T0UfLpA/cNCNWG\n1YbVhm1rs+08m9SG1YZZ21h3TagNqw0ztjFuyvV0j5OQD3uUvH+CvgGh2rDanNWH\nbWqz6Swb1YfVhhnbGDdNqg+rDTO2MW7K9XSPkzz68EfJp0/WN6Cj+rDasNqwTW02\nnWWj+rDaMGMb46YptWG1YdY21l25lu5xkk99lHz6xH0DQrVhtWG1YdvabDvPJrVh\ntTkz9jFumlIbVhtmbWPdlWvpHifX9GWPkvcD9M0H1easPqw2bFubbefZpDasNszY\nxrhpUn1YbZixjXFTrqd7nFzLlz9KPuobEKsNqw2rDdvWZtt5NqkNqw2ztrHumlAb\nVhtmbWPdlevoDifXsOpR8lHfhFhtWG1Ybc429dl0lm1qw2pzZuxj3DSlNqw2zNrG\nuivX0j1OnNY+Sj7qGxCrDasNqw3b1mbbeTapDasNs7ax7ppQG1YbZmxj3JTr6R4n\nLi/xKHnTNyBWG1YbVhu2rc2282xSG1YbZm1j3TWhNqw2zNrGuivX0R1OHF7qUfKm\nb0Bn9WG1YbVh29psO88mtWG1YdY21l0TasNqw4xtjJtyPd3j5HW95KPk9/omxGrD\nasNqw7a12XaeTWrDasOsbay7JtSG1YZZ21h35Vq6x8nrUDxK3vTNh9WG1easPmxT\nm01n2aY2Z/VhxjbGTVNqw2rDrG2su3It3eNkP9Wj5KO+AbHasNqw2rBtbbadZ5Pa\nsNowaxvrrgm1YbVhxjbGTbme7nGyl/ZR8qZvQKw2rDZn9WGb2mw6y0b1YbVhxjbG\nTVNqc1YfZmxj3JTr6R4nu+gfJR/1DeisPqw2rDZsU5tNZ9moPqw2zNjGuGlKbVht\nmLWNdVeupXucfL1LPUo+6hsQqw2rDasN29Zm23k2qQ2rzZmxj3HTlNqw2jBrG+uu\nXEv3OPkal32UvOmbD6vNWX1Ybdi2NtvOs0ltWG2YtY1114TasNowYxvjplxP9zj5\nXJd/lHzUNyBWG1YbVhu2rc2282xSG1YbZm1j3TWhNqw2zNrGuivX0R1OPkePkqBv\nQqw2rDZn9WGb2mw6yza1YbU5M/YxbppSG1YbZm1j3ZVr6R4nH+Pbv/3bv/3lUbIv\nMlYbVhtWG1Ybtq3NtvNsUhtWG2ZtY901oTasNszYxrgp19M9TmbdHyXvf9AXGaoN\nqw2rDasN29Zm23k2qQ2rDbO2se6aUBtWG2ZtY92V6+gOJzN+eJR8+o99oaHasNqc\n1YfVhm1qs+ks29TmrD7M2Ma4aUptWG2YtY11V66le5z8nuOj5NNf7IsM1YbVhtWG\n1YZta7PtPJvUhtWGWdtYd02oDasNs7ax7sq1dI+Tn/fTj5L3f9AXGKoNqw2rzVl9\n2KY2m86yTW3O6sOMbYybptSG1YZZ21h35Vq6x8kf++VHyfs/7AvsqD6sNqw2rDZs\nW5tt59mkNqw2zNrGumtCbVhtmLWNdVeuozucsN9+lPzhA/WFhmrDasNqw2pztqnP\nprNsUxtWmzNjH+OmKbVhtWHWNtZduZbucfJ/xh4l7x+wLzBUm7P6sNqw2rBNbTad\nZaP6sNowYxvjpim1YbU5M/Yxbsr1dI+TD3iUfPrgfZGh2rDasNqw2pxt6rPpLNvU\nhtXmzNjHuGlKbVhtmLWNdVeupXucq/rQR8n7J+kLDNWG1easPqw2bFubbefZpDas\nNszaxrprQm1YbZixjXFTrqd7nKv5lEfJHz5pX2ioNqw2rDasNmxbm23n2aQ2rDbM\n2Ma4aVJ9WG2YsY1xU66ne5wr+JJHyfsn74sM1YbVhtXmrD5sU5tNZ9mmNmf1YcY2\nxk1TasNqw6xtrLtyLd3jWH3po+T9EH2BHdWH1YbVhtWGbWuz7Tyb1IbVhlnbWHdN\nqA2rDTO2MW7K9XSPY7PiUfJRX2SsNqw2rDasNmeb+mw6yza1YbVh1jbWXRNqw2rD\nrG2su3Id3eFYrHuUfNQXGqsNq81ZfVht2KY2m86yUX1YbZixjXHTlNqw2jBrG+uu\nXEv3OK9q9aPko77IWG1YbVhtWG3YtjbbzrNJbVhtmLWNddeE2rDaMGsb665cS/c4\nr+RlHiVv+gJjtWG1YbU5qw/b1GbTWbapzVl9mLGNcdOU2rDanBn7GDflerrHeQUv\n9yh50xfYWX1YbVhtWG3YtjbbzrNJbVhtmLWNddeE2rDaMGsb665cR3c4m73so+T3\n+kJjtWG1YbVhtTnb1GfTWbapDavNmbGPcdOU2rDaMGsb665cS/c4m2geJW/6AmO1\nOasPqw2rDdvWZtt5NqkNqw2ztrHumlAbVhtmbGPclOvpHmeDb//6r//6l0dJ44U0\nbppSG1YbVhtWm7NNfTadZZvasNqcGfsYN02pDasNs7ax7sq1dI/zVe6Pkvc/EF5G\n46YptTmrD6sNqw3b1mbbeTapDasNs7ax7ppQG1YbZmxj3JTr6R7ns/3wKPn0H6UX\n0rprQm1YbVhtWG3YtjbbzrNJbVhtmLWNddeE2rDaMGsb665cS/c4H+34KPn0F4WX\n0bhpSm1YbVhtzurDNrXZdJZtanNWH2ZsY9w0pTasNszaxror19I9zkf56UfJp38k\nu5C2PdPqw2rDasNqw7a12XaeTWrDasOsbay7JtSG1YYZ2xg35Xq6x5n2W4+S938s\nvJDGTVNqw2rDanNWH7apzaazbFObs/owYxvjpim1OasPM7Yxbsr1dI8z4V2Pkk8f\nSHghjZum1IbV5qw+rDZsU5tNZ9moPqw2zNjGuGlKbVhtmLWNdVeupXuc3zX2KPn0\nQYUX0rhpSm1YbVhtWG3YtjbbzrNJbVhtzox9jJum1IbVhlnbWHflWrrH+RUf8ih5\n/+DCy2jcNKU2rDZn9WG1YdvabDvPJrVhtWHGNsZNk+rDasOMbYybcj3d4/yMD32U\nvH8S6WW07ppQG1YbVhtWG7atzbbzbFIbVhtmbWPdNaE2rDbM2sa6K9fRHc7JpzxK\n/vBJhZfSuGlKbVhtWG1Ybc429dl0lm1qw2pzZuxj3DSlNqw2zNrGuivX0j3Ooy95\nlLx/cuFlNG6aVB9WG1YbVhu2rc2282xSG1YbZm1j3TWhNqw2zNjGuCnX0z3On33p\no+Qj44U0bppSG1YbVhtWG7atzbbzbFIbVhtmbWPdNaE2rDbM2sa6K9fRHb62NY+S\nN8YLadw0pTZn9WG1YbVh29psO88mtWG1YdY21l0TasNqw4xtjJtyPd3j61n3KPk9\n46U0bppSG1YbVhtWG7atzbbzbFIbVhtmbWPdNaE2rDbM2sa6K9fSPfZb/yh5Y7yM\nxk1TasNqw2pzVh+2qc2ms2xTm7P6MGMb46YptWG1YdY21l25lu6x18s8St4YL6Nx\n06T6sNqw2rDasG1ttp1nk9qw2jBrG+uuCbVhtWHGNsZNuZ7usc/LPUo+Ml5I46Yp\ntWG1YbU5qw/b1GbTWTaqD6sNM7YxbppSm7P6MGMb46ZcT/fY4aUfJR8ZL6Rx05Ta\nsNqc1YfVhm1qs+ksG9WH1YYZ2xg3TakNqw2ztrHuyrV0j1+X5lHykfFCGjdNqQ2r\nDasNqw3b1mbbeTapDavNmbGPcdOU2rDaMGsb665cS/f4tSgfJW+Ml9G4aUptWG3O\n6sNqw7a12XaeTWrDasOsbay7JtSG1YYZ2xg35Xq6x69B/Sh5Y72M1l0TasNqw2rD\nasO2tdl2nk1qw2rDrG2suybUhtWGWdtYd+U6usO7XeJR8nvGS2ncNKU2rDasNqw2\nZ5v6bDrLNrVhtTkz9jFumlIbVhtmbWPdlWvpHu9yyUfJG+NlNG6aVB9WG1YbVhu2\nrc2282xSG1YbZm1j3TWhNqw2zNjGuCnX0z3e4dKPkjfWy2jdNaE2rDasNqw2bFub\nbefZpDasNszaxrprQm1YbZi1jXVXrqM7/LV6lHyD8VIaN02pDavNWX1YbdimNpvO\nslF9WG2YsY1x05TanNWHGdsYN+V6usef69u//Mu//Knob7N2se6aUBtWG1YbVhu2\nrc2282xSG1YbZm1j3TWhNqw2zNrGuivX0j3+eH95lLz/j4IjYxvjpim1YbVhtTmr\nD9vUZtNZtqnNWX2YsY1x05TasNowaxvrrlxL9/jjPD1K3v+w4MjYxrhpUn1YbVht\nWG3YtjbbzrNJbVhtmLWNddeE2rDaMGsb665cR3d43puPkj/8pcIjYxvjpim1YbVh\ntWG1OdvUZ9NZtqkNq82ZsY9x05TasNowaxvrrlxL9/j9fupR8v6XC46MbYybptTm\nrD6sNqw2bFObTWfZqD6sNszYxrhpSm1YbZi1jXVXrqV7/Pt+6VHy6R8W/U3WLtZd\nE2rDasNqw2pztqnPprNsUxtWmzNjH+OmKbVhtWHWNtZduZbu8a/57UfJ+wcoODK2\nMW6aUpuz+rDasNqwbW22nWeT2rDaMGsb664JtWG1YcY2xk25nu7xz3n3o+TTBys6\nsrax7ppQG1YbVhtWG7atzbbzbFIbVhtmbGPcNKU2Z/VhxjbGTbme7jEbfZR8+sBF\nR8Y2xk1TasNqw2pzVh+2qc2ms2xTG1abM2Mf46YptWG1YdY21l25lu7xsw97lLx/\ngoIjYxvjpkn1YbVhtWG1YdvabDvPJrVhtWHWNtZdE2rDasOMbYybcj3d4//14Y+S\n909UcGRtY901oTasNqw2rDZsW5tt59mkNqw2zNrGumtCbVhtmLWNdVeu4+p3+NMe\nJX/4xBcPf2JsY9w0pTasNmf1YbVhm9psOstG9WG1YcY2xk1TanNWH2ZsY9yU67na\nPf6yR8mnQ1ws+s+ydrHumlAbVhtWG1Ybtq3NtvNsUhtWG2ZtY901oTasNszaxror\n13KFe7ziUfLmCsF/l7GNcdOU2rDasNqc1YdtarPpLNvU5qw+zNjGuGlKbVhtmLWN\ndVeuxXyPVz1K3piDv5exjXHTpPqw2rDasNqwbW22nWeT2rDaMGsb664JtWG1YdY2\n1l25DuMdXvko+T1j+CnGNsZNU2rDasNqw2pztqnPprNsUxtWmzNjH+OmKbVhtWHW\nNtZduRbDPX6JR8kbQ/CPYmxj3DSlNmf1YbVhtWHb2mw7zya1YbVh1jbWXRNqw2rD\njG2Mm3I9r3yPX+pR8tErR/9I1i7WXRNqw2rDasNqc7apz6azbFMbVpszYx/jpim1\nYbVh1jbWXbmWV7vHL/soefNqwT+TsY1x05TanNWH1YbVhm1rs+08m9SG1YZZ21h3\nTagNqw0ztjFuyvW8yj1++UfJR68S/StY21h3TagNqw2rDasN29Zm23k2qQ2rDbO2\nse6aUBtWG2ZtY92Va9l6j1WPko+2Bt/A2Ma4aUptWG1Ybc7qwza12XSWbWpzVh9m\nbGPcNKU2rDbM2sa6K9ey7R5rHyVvtgXfxNjGuGlSfVhtWG1Ybdi2NtvOs0ltWG2Y\ntY1114TasNowYxvjplzPlnusf5S82RJ8I2sb664JtWG1YbU5qw/b1GbTWTaqD6sN\nM7YxbppSm7P6MGMb46Zcz1fe48s8Sn6vbx7M2Ma4aUptWG3O6sNqwza12XSWbWpz\nVh9mbGPcNKU2rDbM2sa6K9fy2ff4so+Sj/rm8TZrF+uuCbVhtWG1YbVh29psO88m\ntWG1OTP2MW6aUhtWG2ZtY92Va/mMe9yj5IO+cTBjG+OmKbVhtTmrD6sN29Zm23k2\nqQ2rDbO2se6aUBtWG2ZsY9yU6/nIe9yj5Bv6xsGsbay7JtSG1YbVhtWGbWuz7Tyb\n1IbVhlnbWHdNqA2rDbO2se7KdXzEHf72z//8z3/6qA9uURtmbGPcNKU2rDasNqw2\nZ5v6bDrLNrVhtTkz9jFumlIbVhtmbWPdlWuZuMf3R8nJD2pVG2ZsY9w0qT6sNqw2\nrDZsW5tt59mkNqw2zNrGumtCbVhtmLGNcVOu5z33+IdHyYkPalcbZm1j3TWhNqw2\nrDasNmeb+mw6yza1YbU5M/YxbppSG1YbZm1j3ZVr+dV7jI+S7/mgV1IbZmxj3DSl\nNmf1YbVhtWHb2mw7zya1YbVh1jbWXRNqw2rDrG2su3IdP3uHf+pR8nc+8BXVhlnb\nWHdNqA2rDasNqw3b1mbbeTapDasNs7ax7ppQG1YbZm1j3ZVroXv8y4+SP/NBU5sT\nYxvjpim1YbVhtTmrD9vUZtNZtqnNWX2YsY1x05TasNowaxvrrlzL9/f4XY+S9EHz\nf2rDjG2MmybVh9WG1YbVhm1rs+08m9SG1YZZ21h3TagNqw0ztjFuyvXc7vHIo+T3\nHzQ/qs2ZsY9x05TasNqw2pzVh21qs+ksG9WH1YYZ2xg3TanNWX2YsY1xU65l9FHy\nhw/eFwiqDTO2MW6aUhtWm7P6sNqwTW02nWWb2pzVhxnbGDdNqQ2rDbO2se6K24c+\nSj59or5AUG3eZu1i3TWhNqw2rDasNmxbm23n2aQ2rDZnxj7GTVNqw2rDrG2su+Lz\naY+S90/YFweqDTO2MW6aUpuz+rDasNqwbW22nWeT2rDaMGsb664JtWG1YcY2xk1x\n+fRHyfsn7osD1YZZ21h3TagNqw2rDasN29Zm23k2qQ2rDbO2se6aUBtWG2ZtY92V\n1/Zlj5Lf6wuE1YYZ2xg3TakNqw2rDavN2aY+m86yTW1Ybc6MfYybptSG1YZZ21h3\n5fWseZS86YuD1YYZ2xg3TaoPqw2rDasN29Zm23k2qQ2rDbO2se6aUBtWG2ZsY9yU\n17LuUfKmLw5WG2ZtY901oTasNqw2rDZsW5tt59mkNqw2zNrGumtCbVhtmLWNdVd2\nW/so+b2+QFhtmLGNcdOU2rDanNWH1YZtarPpLBvVh9WGGdsYN02pDavNmbGPcVN2\neplHyZu+OM7q8zZrF+uuCbVhtWG1YbVh29psO88mtWG1YdY21l0TasNqw6xtrLuy\nw8s9Sj7qi4PVhhnbGDdNqQ2rDavNWX3YpjabzrJNbc7qw4xtjJum1IbVhlnbWHfl\na730o+RNXxysNszYxrhpUn1YbVhtWG3YtjbbzrNJbVhtmLWNddeE2rDaMGsb6658\nPsWj5Pf6AmG1eZu1i3XXhNqw2rDasNqcbeqz6Szb1IbV5szYx7hpSm1YbZi1jXVX\nPofyUfKmLw5WG2ZsY9w0pTasNmf1YbVhm9psOstG9WG1YcY2xk1TasNqw6xtrLvy\nsdSPkjd9cbDaMGsb664JtWG1YbVhtTnb1GfTWbapDavNmbGPcdOU2rDaMGsb667M\nu8Sj5KO+OFhtmLGNcdOU2pzVh9WG1YZta7PtPJvUhtWGWdtYd02oDasNM7Yxbsqs\nyz1KPuoLhNWGGdsYN02qD6sNqw2rDdvWZtt5NqkNqw0ztjFumlKbs/owYxvjprzf\npR8lH/UF8ra6nBn7GDdNqQ2rDasNq83Zpj6bzrJNbVhtzox9jJum1IbVhlnbWHfl\n1/Uo+Z2+OFhtmLGNcdOk+rDasNqw2rBtbbadZ5PasNowaxvrrgm1YbVhxjbGTfk1\nPUqCvjhYbZi1jXXXhNqw2rDasNqwbW22nWeT2rDaMGsb664JtWG1YdY21l05+/ZP\n//RP90fJLgGrDasNM7YxbppSG1abs/qw2rBNbTadZaP6sNowYxvjpim1OasPM7Yx\nbsrbnh4l73/YBUC1YbVh1jbWXRNqw2rDasNqw7a12XaeTWrDasOsbay7JtSG1YZZ\n21h35X+9+Sh5/4/9n49qc1YfZmxj3DSlNqw2rDZn9WGb2mw6yza1OasPM7YxbppS\nG1YbZm1j3XV1x0fJp7/YBUC1YbVhxjbGTZPqw2rDasNqw7a12XaeTWrDasOsbay7\nJtSG1YZZ21h3XdFPP0o+/aMuwFF93laXM2Mf46YptWG1YbVhtTnb1GfTWbapDavN\nmbGPcdOU2rDaMGsb666r+K1HyacP0AVAtWG1YcY2xk1TasNqc1YfVhu2qc2ms2xU\nH1YbZmxj3DSlNqw2zNrGusvu3Y+S9w/UBUC1YbVh1jbWXRNqw2rDasNqc7apz6az\nbFMbVpszYx/jpim1YbVh1jbWXUZjj5JPH7QLgGrDasOMbYybptTmrD6sNqw2bFub\nbefZpDasNszaxrprQm1YbZixjXGTzYc8Sj59gi4Bqg2rDbO2se6aUBtWG1YbVhu2\nrc2282xSG1YbZm1j3TWhNqw2zNrGuuuVffij5NMn6wKg2rytLmfGPsZNU2rDasNq\nc1YftqnNprNsUxtWmzNjH+OmKbVhtWHWNtZdr+hTHyXvn7QLgGrDasOMbYybJtWH\n1YbVhtWGbWuz7Tyb1IbVhlnbWHdNqA2rDTO2MW56NV/yKHn/5F0AVBtWG2ZtY901\noTasNqw2Z/Vhm9psOstG9WG1YcY2xk1TanNWH2ZsY9z0Cr70UfJ7XQJWG1YbZmxj\n3DSlNqw2Z/VhtWGb2mw6y0b1YbVhxjbGTVNqc1YfZmxj3LTVqkfJmy7AWX3eVhdm\nbWPdNaE2rDasNqw2bFubbefZpDasNmfGPsZNU2rDasOsbay7tlj5KHnT//msNmf1\nYcY2xk1TasNqc1YfVhu2rc2282xSG1YbZm1j3TWhNqw2zNjGuGmD1Y+Sj7oArDas\nNszaxrprQm1YbVhtWG3YtjbbzrNJbVhtmLWNddeE2rDaMGsb666v8DKPkt/rErDa\nvK0uZ8Y+xk1TasNqw2rDanO2qc+ms2xTG1abM2Mf46YptWG1YdY21l2f5WUfJW+6\nAKw2rDbM2Ma4aVJ9WG1YbVht2LY2286zSW1YbZi1jXXXhNqw2jBjG+Omz/Dyj5I3\nXQBWG1YbZm1j3TWhNqw2rDasNmeb+mw6yza1YbU5M/YxbppSG1YbZm1j3fURNI+S\nj7oArDasNszYxrhpSm3O6sNqw2rDtrXZdp5NasNqw6xtrLsm1IbVhlnbWHdN+faP\n//iP90dJYyzjpim1YbVh1jbWXRNqw2rDasNqw7a12XaeTWrDasOsbay7JtSG1YZZ\n21h3vcfTo+T9D4WhjJum1IbV5szYx7hpSm1YbVhtzurDNrXZdJZtanNWH2ZsY9w0\npTasNszaxrrrd7z5KHn/j9JQ1l0TasNqw4xtjJsm1YfVhtWG1YZta7PtPJvUhtWG\nWdtYd02oDasNM7YxbvpVx0fJp78ojGXcNKU2rDZnxj7GTVNqw2rDanNWH7apzaaz\nbFQfVhtmbGPcNKU2Z/VhxjbGTT/jpx8lf/iHwmDGTVNqw2rDjG2Mm6bU5qw+rDas\nNmxTm01n2ag+rDbM2Ma4aUptzurDjG2Mm8hvP0reP4AwlnHTpPq8rS7M2sa6a0Jt\nWG1YbVht2LY2286zSW1Ybc6MfYybptSG1YZZ21h33bz7UfL+gYShjJsm1YfVhhnb\nGDdNqc1ZfVhtWG3YtjbbzrNJbVhtmLWNddeE2rDaMGMb46Y/G3uUfPqgwljGTVNq\nw2rDrG2suybUhtWG1YbVhm1rs+08m9SG1YZZ21h3TagNqw2ztjHt+pBHyadPIIr1\nyLprQm3eVpczYx/jpim1YbVhtWG1OdvUZ9NZtqkNq82ZsY9x05TasNowa5tX3/Xh\nj5L3T/TioYh114TasNowYxvjpkn1YbVhtWG1YdvabDvPJrVhtWHWNtZdE2rDasOM\nbV5106c9Sj590heNdWLcNKU2rDbM2sa6a0JtWG1YbVhtzjb12XSWbWrDanNm7GPc\nNKU2rDbM2uaVdn3Jo+TTAV4o1q+w7ppQG1YbZmxj3DSlNqw2Z/VhtWGb2mw6y0b1\nYbVhxjbGTVNqw2pzZuyzfdOXP0o+2h7rdxg3TakNqw2ztrHumlAbVhtWG1Ybtq3N\ntvNsUhtWG2ZtY901oTasNszaZuOuVY+SNxtDTbDumlAbVhtmbGPcNKU2rDasNmf1\nYZvabDrLNrU5qw8ztjFumlIbVhtmbbNp18pHyUebYk0xbppSG1YbZmxj3DSpPqw2\nrDasNmxbm23n2aQ2rDbM2sa6a0JtWG2Ytc1X71r/KPnoq2N9BOOmSfV5W12YtY11\n14TasNqw2rDanG3qs+ks29SG1ebM2Me4aUptWG2Ytc1X7HqpR8lHxktg3DSlNqw2\nzNjGuGlKbc7qw2rDasO2tdl2nk1qw2rDjG2Mm6bU5qw+zNjmMze97KPkTRfgWmrD\nasOsbay7JtSG1YbVhtXmbFOfTWfZpjasNmfGPsZNU2rDasOsbT5618s/St50Aa6n\nNqw2zNjGuGlKbc7qw2rDasO2tdl2nk1qw2rDrG2suybUhtWGGdt81CbNo+T3ugTX\nUhtWG2ZsY9w0qT6sNqw2rDZsW5tt59mkNqw2zNjGuGlKbc7qw4xtJjdpHyVvjBfg\nz6y7JtTmbXU5M/YxbppSG1YbVhtWm7NNfTadZZvasNqcGfsYN02pDasNs7Z57y79\no+RNF+B6asNqw4xtjJsm1YfVhtWG1YZta7PtPJvUhtWGWdtYd02oDasNM7b53U2X\neZR81AW4ltqw2jBrG+uuCbVhtWG1YbVh29psO88mtWG1YdY21l0TasNqw6xtfmXX\nJR8lv2e8CMZNU2rDasOMbYybptSG1easPqw2bFObTWfZqD6sNszYxrhpSm1Ybc6M\nff5oU4+SD654Aa6sNqw2zNrGumtCbVhtWG1Ybdi2NtvOs0ltWG2YtY1114TasNow\na5u3dvUo+QbjBTBumlKbs/owYxvjpim1YbVhtTmrD9vUZtNZtqnNWX2YsY1x05Ta\nsNowa5vHXT1K/gHjJTBumlIbVhtmbGPcNKk+rDasNqw2bFubbefZpDasNszaxrpr\nQm1YbZi1zbd/+Id/eHqUtA6dYGxj3DSlNqw2zNrGumtCbVhtWG1Ybc429dl0lm1q\nw2pzZuxj3DSlNqw2zNTmh0fJ+38QjZxmbWPdNaE2rDbM2Ma4aUptWG3O6sNqwza1\n2XSWbWpzVh9mbGPcNKU2rDbM0AYfJZ/+kmDoRzG2MW6aUhtWG2ZtY901oTasNqw2\nrDZnm/psOss2tWG1OTP2MW6aUhtWG/aqbX7qUfL+l1905GewtrHueq+6nNWHGdsY\nN02pzVl9WG1Ybdi2NtvOs0ltWG2YtY1114TasNqwV2rzS4+SP/zjFxr62YxtjJum\n1IbVhhnbGDdNqg+rDasNqw3b1mbbeTapDasNM7YxbppSm7P6sO1t3vUoef8gy0d+\nJWsb6673qgurzZmxj3HTlNqw2rDasNqcbeqz6Szb1IbV5szYx7hpSm1YbdjWNiOP\nkvcPtnTkBtY21l0TasNqw4xtjJsm1YfVhtWG1YZta7PtPJvUhtWGWdtYd02oDasN\n29Rm9FHy6QMvGrmNsY1x05TasNqcGfsYN02pDasNq81ZfdimNpvOslF9WG2YsY1x\n05TanNWHfXWbD3uUfPokXYAjYx/jpim1YbVhxjbGTVNqw2pzVh9WG7apzaazbFQf\nVhtmbGPcNKU2Z/VhX9HmUx4l75+s//OPjH2Mm6bUhtWGWdtYd02oDasNqw2rDdvW\nZtt5NqkNq82ZsY9x05TasNqwz2zzqY+ST5+4C4CMbYybptTmrD7M2Ma4aUptzurD\nasNqw7a12XaeTWrDasOsbay7JtSG1YZ9dJsve5R8OkQXABnbGDdNqQ2rDbO2se6a\nUBtWG1YbVhu2rc2282xSG1YbZm1j3TWhNqw27KParHiUfNQlYNY21l3vVRdWmzNj\nH+OmKbVhtWG1YbU529Rn01m2qQ2rzZmxj3HTlNqw2rDJNuseJR91CZixjXHTlNqw\n2jBjG+OmSfVhtWG1YbVh29psO88mtWG1YdY21l0TasNqw97bZvWj5E0XgBnbGDdN\nqQ2rDbO2se6aUBtWG1YbVpuzTX02nWWb2rDanBn7GDdNqQ2rDfvdNi/xKHnTBWDW\nNtZdE2rDasOMbYybptTmrD6sNqw2bFubbefZpDasNszaxrprQm1YbdivtHmpR8nv\ndQmYsY1x05TasNowaxvrrgm1YbVhtWG1YdvabDvPJrVhtWHWNtZdE2rDasP+qM1L\nP0redAGYsY1x05TasNqcGfsYN02pDasNq81ZfdimNpvOsk1tWG3OjH2Mm6bUhtWG\nURvFo+RNF4BZ21h3TagNqw0ztjFumlQfVhtWG1Ybtq3NtvNsUhtWG2ZtY901oTas\nNuyxzbe///u//5MxlnHTFGMb46YptWG1OTP2MW6aUhtWG1abs/qwTW02nWWj+rDa\nMGMb46YptTmrD/vLo+TTH0hjWXdNMLYxbppSG1YbZmxj3DSlNqw2Z/VhtWGb2mw6\ny0b1YbVhxjbGTVNqc1afZz88St7/gzCUcdMkYx/jpim1YbVh1jbWXRNqw2rDasNq\nw7a12XaeTWrDanNm7GPcNKU2rDb/Cx8ln/6SMJZx0xRrG+uu96rLWX2YsY1x05Ta\nnNWH1YbVhm1rs+08m9SG1YZZ21h3TagNu3Kbn3qUvP9laSjrrgnGNsZNU2rDasOs\nbay7JtSG1YbVhtWGbWuz7Tyb1IbVhlnbWHdNqA27YptfepT84R8Lgxk3TbG2se56\nr7qw2pwZ+xg3TakNqw2rDavN2aY+m86yTW1Ybc6MfYybptSGXaXNux4l7x9EGMu4\naYq1jXXXhNqw2jBjG+OmSfVhtWG1YbVh29psO88mtWG1YdY21l0TasPMbUYeJe8f\nTBrKumuCsY1x05TasNowaxvrrgm1YbVhtWG1OdvUZ9NZtqkNq82ZsY9x05TaMGOb\n0UfJpw9sjCXcNMXaxrprQm1YbZixjXHTlNqc1YfVhtWGbWuz7Tyb1IbVhlnbWHdN\nqA2ztPmwR8mnTyKJ9ci4aYq1jXXXhNqw2jBrG+uuCbVhtWG1YbVh29psO88mtWG1\nYdY21l0TasNeuc2nPEo+fcIXjkWMm6YY2xg3TakNq82ZsY9x05TasNqw2pzVh21q\ns+ks29TmrD7M2Ma4aUpt2Cu2+fRHyfsnfsFYf8S4aZKxj3HTlNqw2jBjG+OmSfVh\ntWG1YbVh29psO88mtWG1YdY21l0TasNepc2XPUp+71WC/QrjpinWNtZd71UXVhtm\nbWPdNaE2rDasNqw2Z5v6bDrLNrVhtWHWNtZdE2rDNrdZ8yh5sznWe1h3TTC2MW6a\nUhtWG2ZsY9w0pTZn9WG1YbVhm9psOstG9WG1YcY2xk1TanO2rc+6R8mbbaGmWHdN\nMLYxbppSG1YbZm1j3TWhNqw2rDasNmeb+mw6yza1YbU5M/YxbppSG7alzdpHyUdb\nYk0ybppibGPcNKU2Z/VhxjbGTVNqc1YfVhtWG7atzbbzbFIbVhtmbWPdNaE27Cvb\nvMSj5CPjRTJummJtY901oTasNszYxrhpUn1YbVhtWG3YtjbbzrNJbVhtmLGNcdOU\n2px9dp+Xe5S8sV4k664JxjbGTVNqw2pzZuxj3DSlNqw2rDasNmeb+mw6yza1YbU5\nM/YxbppSG/ZZbV72UfKR8SIZN02xtrHumlAbVhtmbGPcNKk+rDasNqw2bFubbefZ\npDasNszaxrprQm3YR7ZRPEreWC+RddcEYxvjpim1YbVh1jbWXRNqw2rDasNqc7ap\nz6azbFMbVpszYx/jpim1YR/RRvUo+T3jZTJummTsY9w0pTasNszYxrhpSm1Ybc7q\nw2rDNrXZdJaN6sNqw4xtjJum1IZNtVE/Sj4yXibjpinGNsZNU2rDasOsbay7JtSG\n1YbVhtWGbWuz7Tyb1IbVhlnbWHdNqA17T5vLPEreGC+ScdMUYxvjpim1OasPM7Yx\nbppSG1YbVpuz+rBNbTadZZvanNWHGdsYN02pDfudNpd7lLwxXiTjpknGPsZNU2rD\nasOMbYybJtWH1YbVhtWGbWuz7Tyb1IbVhlnbWHdNqA372TaXfZR8ZL1I1l0TjG2M\nm6bUhtWGWdtYd02oDasNqw2rzdmmPpvOsk1tWG3OjH2Mm6bUhp3a9Cj5HeNFMm6a\nYm1j3TWhNqw2zNjGuGlKbc7qw2rDasO2tdl2nk1qw2rDjG2Mm6bU5uz7Pj1KAutF\nsu6aYGxj3DSlNqw2zNrGumtCbVhtWG1Ybc429dl0lm1qw2pzZuxj3DSlNuzW5tvf\n/d3f/enxD/IjYxvjpinWNtZd71WXs/owYxvjpim1OasPqw2rDdvWZtt5NqkNqw2z\ntrHumlCbt90fJZ/+sFjI2sa6a4KxjXHTlNqw2jBjG+OmSfVhtWG1YbVh29psO88m\ntWG1YcY2xk1TavPszUfJp79QMGRsY9w0xdjGuGlKbVhtzox9jJum1IbVhtWG1eZs\nU59NZ9mmNqw2Z8Y+xk1TavMTj5L3v1gsZGxj3DTF2sa6a0JtWG2YsY1x06T6sNqw\n2rDasG1ttp1nk9qw2jBrG+uuCVdt89OPkvd/cNFQP8PaxrprgrGNcdOU2rDanBn7\nGDdNqQ2rDavNWX3YpjabzrJRfVhtmLGNcdOUq7X55UfJHz7AxYL9CmMb46YpxjbG\nTZPqw2rDjG2Mm6bUhtXmrD6sNmxTm01n2ag+rDbM2Ma4acoV2rz7UfL+gS4Q63cZ\n2xg3TTL2MW6aUhtWG2ZtY901oTasNqw2rDZsW5tt59mkNqw2Z8Y+xk1TrG3GHiWf\nPqg01gRjG+OmKcY2xk1TanNWH2ZsY9w0pTZn9WG1YbVh29psO88mtWG1YdY21l0T\nTG0+5FHy/sFFoaZZ21h3TTC2MW6aUhtWG2ZtY901oTasNqw2rDZsW5tt59mkNqw2\nzNrGumuCoc2HPkr+8MkEwT6KsY1x0xRjG+OmKbVhtWHWNtZdE2rDasNqw2pztqnP\nprNsUxtWmzNjH+OmKa/a5lMfJe+f9EVjfQZjG+OmKdY21l0TasNqw4xtjJsm1YfV\nhtWG1YZta7PtPJvUhtWGWdtYd014pTZf8ih5/+QvFOqzWdtYd00wtjFumlIbVhtm\nbWPdNaE2rDasNqw2Z5v6bDrLNrVhtTkz9jFumvIKbb70UfLRK8T6KsY2xk1TjG2M\nmybVh9WGGdsYN02pzVl9WG1Ybdi2NtvOs0ltWG2YtY1114StbdY8Sj7aGmsDYxvj\npknGPsZNU2rDasOsbay7JtSG1YbVhtWGbWuz7Tyb1IbVhlnbWHdN2NRm5aPkzaZQ\nGxn7GDdNMbYxbppSG1abM2Mf46YptWG1YbVhtTnb1GfTWbapDavNmbGPcdOUDW1W\nP0o+2hBrK2Mb46Yp1jbWXRNqw2rDjG2MmybVh9WG1YbVhm1rs+08m9SG1YZZ21h3\nTfiqNi/zKHnTJToz9jFummJsY9w0pTasNmfGPsZNU2rDasNqc1YftqnNprNsVB9W\nG2ZsY9w05bPbvNyj5Pe6TMzYxrhpirGNcdOk+rDaMGMb46YptWG1OasPqw3b1GbT\nWTaqD6sNM7YxbpryGW1e/lHypovEjG2MmyYZ+xg3TakNqw2ztrHumlAbVhtWG1Yb\ntq3NtvNsUhtWmzNjH+OmKR/VRvMo+aiLxIxtjJumGNsYN02pzVl9mLGNcdOU2pzV\nh9WG1YZta7PtPJvUhtWGWdtYd02YbKN8lLzpEjFrG+uuCcY2xk1TasNqw6xtrLsm\n1IbVhtWG1YZta7PtPJvUhtWGWdtYd02YaKN+lHzURWLWNtZdE4xtjJum1IbV5szY\nx7hpSm1YbVhtWG3ONvXZdJZtasNqc2bsY9w05XfbXOZR8lEXiRnbGDdNsbax7ppQ\nG1YbZmxj3DSpPqw2rDasNmxbm23n2aQ2rDbM2sa6a8KvtLnko+RNl4hZ21h3TTC2\nMW6aUhtWG2ZtY901oTasNqw2rDZnm/psOss2tWG1OTP2MW6a8jNtLv0o+aiLxIxt\njJumGNsYN02qD6sNM7YxbppSm7P6sNqw2rBtbbadZ5PasNowaxvrrgnUpkfJN3SR\nmLGNcdMUaxvrrgm1YbVh1jbWXRNqw2rDasNqw7a12XaeTWrDasOsbay7Jjy26VHy\noEvErG2suyYY2xg3TakNq82ZsY9x05TasNqw2pzVh21qs+ks29SG1ebM2Me4acqf\n23z7f//v//3p8Q/yttowYxvjpknGPsZNU2rDasOMbYybJtWH1YbVhtWGbWuz7Tyb\n1IbVhlnbWHe9x9Oj5NN/KNZRfZixjXHTFGMb46YptWG1YdY21l0TasNqw2rDasO2\ntdl2nk1qw2rDrG2su34VPko+/aViodowYxvjpinGNsZNk+rDasOMbYybptSG1eas\nPqw2bFObTWfZqD6sNszYxrjpV/zUo+T9L1881kltmLWNddcEYxvjpim1YbVh1jbW\nXRNqw2rDasNqc7apz6azbFMbVpszYx/jpj/yS4+ST//wgrF+Vm2YsY1x0xRjG+Om\nKbU5qw8ztjFumlKbs/qw2rDasG1ttp1nk9qw2jBrG+uu7/32o+TTB7lIrN9RG2Zs\nY9w0xdrGumtCbVhtmLGNcdOk+rDasNqw2rBtbbadZ5PasNowYxvjpkcjj5L3DyaP\n9R61YdY21l0TjG2Mm6bUhtXmzNjHuGlKbVhtWG1Ybc429dl0lm1qw2pzZuyj3DT5\nKPn0gYWxptSGGdsYN02xtrHumlAbVhtmbGPcNKk+rDasNqw2bFubbefZpDasNsza\nxrLrwx4l759AEuoj1IZZ21h3TTC2MW6aUhtWG2ZtY901oTasNqw2rDZnm/psOss2\ntWG1OTP2efVNH/4o+cMnfPFgH6k2zNjGuGmSrY9tz7T6sNowYxvjpim1YbU5qw+r\nDdvUZtNZNqoPqw0ztnnFTZ/+KHn/xC8Y67PUhlnbWHdNMLYxbppSG1YbZm1j3TWh\nNqw2rDasNmxbm23n2aQ2rDbM2uZVdn3Zo+T9AC8S6qvUhxnbGDdNMbYxbppSG1ab\nM2Mf46YptWG1YbU5qw/b1GbTWbapzVl9mLHN9k1f/ij5aHusr1QbZmxj3DTF2sa6\na0JtWG2YsY1x06T6sNqw2rDasG1ttp1nk9qw2jBrm427Vj1KPtoYa4vaMGsb664J\nxjbGTVNqw2rDrG2suybUhtWG1YbV5mxTn01n2aY2rDbM2mbLrrWPko+2xNqoNszY\nxrhpirGNcdOk+rDaMGMb46YptTmrD6sNqw3b1GbTWTaqD6sNM7b56k0v8Sh589Wx\nNqsNs7ax7ppgbGPcNKU2rDbM2sa6a0JtWG1YbVhtzjb12XSWbWrDanNm7PMVm17q\nUfKR8QJMqQ0ztjFummJsY9w0qT6sNszYxrhpSm3O6sNqw2rDtrXZdp5NasNqw6xt\nPmvXyz5KPrJeggm1YcY2xk1TrG2suybUhtWGGdsYN02qD6sNqw2rDdvWZtt5NqkN\nqw0ztvnoTYpHyRvjBZhSmzNjH+OmKcY2xk1TasNqc2bsY9w0pTasNqw2rDZnm/ps\nOss2tWG1OTP2+YhNqkfJR8YLMKU2zNjGuGmKtY1114TasNowYxvjpkn1YbVhtWG1\nYdvabDvPJrVhtWHWNlO7tI+SN9YLMKE2zNrGumuCsY1x05TasNowaxvrrgm1YbVh\ntWG1OdvUZ9NZtqnNWX2Ysc17N+kfJR8ZL8Ck+jBjG+OmKcY2xk2T6sNqw4xtjJum\n1IbV5qw+rDZsU5tNZ9moPqw2zNjmdzZd6lHykfECTKkNM7YxbppibWPdNaE2rDbM\n2sa6a0JtWG1YbVht2LY2286zSW1Ybc6MfX5202UfJW+M/+dPqc2ZsY9x0xRjG+Om\nKbU5qw8ztjFumlKbs/qw2rDasG1ttp1nk9qw2jBrm9Ouyz9KPrJegAm1YdY21l3v\nZe1i3TWhNqw2zNrGumtCbVhtWG1Ybdi2NtvOs0ltWG2Ytc1bu3qUBNZLMKE2zNrG\numuCsY1x05TasNowaxvrrgm1YbVhtWG1OdvUZ9NZtqkNq82Zsc9t07e//du//ZNx\n4KT6sNowYxvjpinWNtZdE2rDasOMbYybJtWH1YbVhtWGbWuz7Tyb1IbVhhnb/OVR\n8ukPhCOn1IbVhlnbWHdNMLYxbppSG1YbZm1j3TWhNqw2rDasNmeb+mw6yza1YbU5\ns/T54VHy6T9KRn6E2rDaMGMb46YpxjbGTZPqw2rDjG2Mm6bU5qw+rDasNmxbm23n\n2aQ2rDbs1dscHyWf/uKLD/1ItWG1YcY2xk1TrG2suybUhtWGWdtYd02oDasNqw2r\nDdvWZtt5NqkNqw17xTY//Sh5/wcvOPKz1IbV5szYx7hpirGNcdOU2rDanBn7GDdN\nqQ2rDasNq83Zpj6bzrJNbVhtzl6lzy8/Sj794xcZ+RVqw2rDjG2Mm6ZY21h3TagN\nqw0ztjFumlQfVhtWG1Ybtq3NtvNsUhtWG7a9zbseJe8fZPnIr1QbVpszYx/jpinG\nNsZNU2rDanNm7GPcNKU2rDasNmf1YZvabDrLRvVhtWEb24w8Sj59wIUjt6jNWX2Y\nsY1x0xRjG+OmSfVhtWHGNsZNU2rDanNWH1YbtqnNprNsVB9WG7alzfij5NMHXzJy\no9qw2jBjG+OmKdY21l0TasNqw6xtrLsm1IbVhtWG1YZta7PtPJvUhtXm7Cv7fOij\n5P2TdAGO6sNqw4xtjJumGNsYN02pzVl9mLGNcdOU2pzVh9WG1YZta7PtPJvUhtWG\nfUWbT3mUfPqEXQBUG1YbZm1j3fVe1i7WXRNqw2rDrG2suybUhtWG1YbVhm1rs+08\nm9SG1YZ9ZptPf5R8+uRdAlQbVhtmbWPdNcHYxrhpSm1YbZi1jXXXhNqw2rDasNqc\nbeqz6Szb1IbV5uwj+3zpo+SjLgGrDasNM7YxbppibWPdNaE2rDbM2Ma4aVJ9WG1Y\nbVht2LY2286zSW1YbdhHtFnzKHnTBWC1YbVh1jbWXROMbYybptSG1YZZ21h3TagN\nqw2rDavN2aY+m86yTW1Ybc6m+qx7lHzUJWC1YbVhxjbGTVOMbYybJtWH1YYZ2xg3\nTanNWX1YbVht2LY2286zSW1Ybdh726x+lHzUJWC1YbVhxjbGTVOsbay7JtSG1YZZ\n21h3TagNqw2rDasN29Zm23k2qQ2rDfudNi/zKHnTBWC1YbVh1jbWXROMbYybptSG\n1ebM2Me4aUptWG1YbVhtzjb12XSWbWrDanP2s31e7lHyUZeA1YbVhhnbGDdNsbax\n7ppQG1YbZmxj3DSpPqw2rDasNmxbm23n2aQ2rDbsj9q89KPkoy7BWX1YbZixjXHT\nFGMb46YptWG1YdY21l0TasNqw2rDasO2tdl2nk1qw2rD3mqjeZS86QKc1YfVhhnb\nGDdNMbYxbppUH1YbZmxj3DSlNqw2Z/VhtWGb2mw6y0b1YbVhtza6R8lHXQBWG1Yb\nZm1j3TXB2Ma4aUptWG2YtY1114TasNqw2rDanG3qs+ks29SG1YapHyVvugBn9WG1\nYcY2xk1TjG2Mm6bU5qw+zNjGuGlKbc7qw2rDasO2tdl2nk1qw2rz7BKPkt/rErDa\nsNowYxvjpinWNtZdE2rDasOMbYybptTmrD6sNqw2bFubbefZpDasNhd9lLzpArDa\nsNowaxvrrgnGNsZNU2rDanNm7GPcNKU2rDasNqw2Z5v6bDrLNrVhV25z6UfJR1e+\nBH+kNqw2zNjGuGmKtY1114TasNowYxvjpkn1YbVhtWG1YdvabDvPJrVhV2vTo+R3\nrnYBfkVtWG3OjH2Mm6YY2xg3TakNqw2ztrHumlAbVhtWG1abs019Np1lm9qwq7Tp\nUfLgKpfgd9SG1ebM2Me4aYqxjXHTlNqc1YcZ2xg3TakNq81ZfVht2KY2m86yUX2Y\ntc23v/mbv7k/SlpHTqgNqw2rDbO2se56L2sX664JtWG1YdY21l0TasNqw2rDasO2\ntdl2nk1qw2xtnh4l738oGzmpNqw2Z/VhxjbGTVOMbYybptSG1ebM2Me4aUptWG1Y\nbc7qwza12XSWbWrDLG3efJR8+guSoR+hNqw2rDbM2Ma4aYq1jXXXhNqw2jBjG+Om\nSfVhtWG1YbVh29psO88mtWGv3OYPHyWf/vILD/1otWG1YbVh1jbWXROMbYybptSG\n1YZZ21h3TagNqw2rDasN29Zm23k2qQ17tTa/9Ch5/0cvNvIz1easPqw2zNjGuGmK\nsY1x06T6sNowYxvjpim1YbU5qw+rDdvUZtNZNqoPe4U2v/Uo+fQBXmDkV6kNqw2r\nDbO2se6aYGxj3DSlNqw2zNrGumtCbVhtWG1Ybc429dl0lm1qwza3efej5P0DLR65\nQX1YbVhtmLGNcdMUYxvjpkn1YbVhxjbGTVNqc1YfVhtWG7atzbbzbFIbtq3N2KPk\n0wddNnKb+rDasNowYxvjpinWNtZdE2rDasOMbYybptTmrD6sNqw2bFubbefZpDZs\nQ5sPeZR8+gQLRm5VG1YbVpszYx/jpinGNsZNU2rDanNm7GPcNKU2rDasNqw2Z5v6\nbDrLNrVhX9nmwx8lnz5ZlwDVhtWG1YYZ2xg3TbG2se6aUBtWG2ZsY9w0qT6sNqw2\nrDZsW5tt59mkNuyz23zqo+T9k3YBUG1YbVhtmLGNcdMkYx/jpim1YbVh1jbWXRNq\nw2rDasNqc7apz6azbFObs8/o8yWPkk8H6BKg2rDanNWHGdsYN00xtjFumlQfVhtm\nbGPcNKU2rDZn9WG1YZvabDrLRvVhH9Xmyx8lH3UBWG1YbVhtmLGNcdMUaxvrrgm1\nYbVh1jbWXRNqw2rDasNqw7a12XaeTWrDptusepS86QKw2rDasNqcGfsYN00xtjFu\nmlIbVpszYx/jpim1YbVhtTmrD9vUZtNZtqnN2USflY+Sj7oErDasNqw2zNjGuGmK\ntY1114TasNowaxvrrgm1YbVhtWG1YdvabDvPJrVh72mz/lHyUZeA1YbVhtWGWdtY\nd00wtjFumlIbVhtmbWPdNaE2rDasNqw2Z5v6bDrLNrVhv9rmpR4lb7oAZ/VhtWG1\nYcY2xk1TrG2suybUhtWGGdsYN02pzVl9WG1Ybdi2NtvOs0lt2M+0eclHyUddAFYb\nVhtWG2ZsY9w0ydjHuGlKbVhtmLWNddeE2rDasNqw2pxt6rPpLNvUhp3avPyj5E0X\n4Kw+rDasNszYxrhpirGNcdOk+rDaMGMb46YptTmrD6sNqw3b1mbbeTapDfu+jeZR\n8ntdAlYbVhtWG2ZsY9w0xdrGumtCbVhtmLWNddeE2rDasNqw2rBtbbadZ5PasD+3\n+fbXf/3Xf3r8Axvjpim1YbVhtTkz9jFummJsY9w0pTasNmfGPsZNU2rDasNqw2pz\ntqnPprNsU5u3PT1K3v9QGsu6a0JtWG1YbZixjXHTFGsb664JtWG1YcY2xk2T6sNq\nw2rDasO2tdl2nk1q83/efJR8+gvCWMZNU2rDanNWH2ZrY9szzdjHuGlKbVhtzox9\njJum1IbVhtXmrD5sU5tNZ9no6n3+8FHy6S8LYxk3TakNq81ZfZixjXHTFGMb46ZJ\n9WG1YcY2xk1TasNqc1YfVhu2qc2ms2x0xT6/9Ch5/0fSUNZdE2rDasNqw4xtjJum\nWNtYd02oDasNs7ax7ppQG1YbVhtWG7atzbbzbHKlNr/1KPn0AYSxjJum1OasPqw2\nzNjGuGmKsY1x05TanNWHGdsYN02pzVl9WG1Ybdi2NtvOs4m9zbsfJe8fSBrKumtC\nbVhtWG2YsY1x0xRrG+uuCbVhtWHWNtZdE2rDasNqw2rDtrXZdp5NrG3GHiV/+MDC\nYMZNU2rDasNqc2bsY9w0xdjGuGlKbVhtmLWNddeE2rDasNqw2pxt6rPpLNuY2nzY\no+T9E4hi3Rg3TaoPqw2rDTO2MW6aYm1j3TWhNqw2zNjGuGlSfVhtWG1Ybdi2NtvO\ns8mrt/nwR8mnT/bisd5i3DSlNqw2rDbM2Ma4aZKxj3HTlNqw2jBrG+uuCbVhtWG1\nYbU529Rn01m2edU2n/ooef+kLxrrj1h3TagNqw2rDTO2MW6aYmxj3DSpPqw2zNjG\nuGlKbc7qw2rDasO2tdl2nk1eqc2XPEo+HeCFYv0K664JtWG1YbVhxjbGTVOsbay7\nJtSG1YZZ21h3TagNqw2rDasN29Zm23k22d7myx8lH22P9TuMm6bUhtXmrD7M2Ma4\naYqxjXHTlNqw2pwZ+xg3TakNqw2rDavN2aY+m86yzdY2qx4lb7bGei/rrgm1YbVh\ntWHGNsZNU6xtrLsm1IbVhhnbGDdNqg+rDasNqw3b1mbbeTbZ1Gblo+SjTbEmWXdN\nqA2rDasNs7ax7ppgbGPcNKU2rDbM2sa6a0JtWG1YbVht2LY2286zyVe3Wf8o+eir\nY30E46YptTmrD6sNM7YxbppibGPcNKk+rDbM2Ma4aUptWG3O6sNqwza12XSWjb6i\nz0s9St5YL5J114TasNqw2jBjG+OmScY+xk1TasNqw6xtrLsm1IbVhtWG1eZsU59N\nZ9nmM9u85KPkI+NFMm6aUhtWm7P6MGMb46YpxjbGTZPqw2rDjG2Mm6bU5qw+rDas\nNmxbm23n2eSj27z8o+Qj40UybppUH1YbVhtmbGPcNMXaxrprQm1YbZixjXHTlNqc\n1YfVhtWGbWqz6SwbfUQf1aPkI+NlMm6aUhtWG1YbZm1j3TXB2Ma4aUptWG2YtY11\n14TasNqw2rDanG3qs+ks20y20T5K3lgvknXXhNqw2rDaMGMb46Yp1jbWXRNqw2rD\njG2MmybVh9WG1YbVhm1rs+08m7y3jf5R8pHxIhk3TakNqw2rzZmtj23PNGMf46Yp\ntWG1YdY21l0TasNqw2rDanO2qc+ms2zzu20u9Sj5yHiZjJum1IbVhtXmzNjHuGmK\nsY1x05TanNWHGdsYN02pDavNWX1YbdimNpvOstHP9rnso+Qj42UybppSG1YbVpsz\nWx/bnknWNtZdE2rDasOsbay7JtSG1YbVhtWGbWuz7Tyb/FGbHiUfGC+ScdOU2rDa\nsNqcGfsYN00xtjFumlIbVpszYx/jpim1YbVhtWG1OdvUZ9NZtqE2PUq+wXiRjJsm\n1YfVhtWGGdsYN02xtrHumlAbVhtmbGPcNKk+rDasNqw2bFubbefZ5LHNt7/6q7/6\n0/d/mGfGNsZNU2rDasNqw6xtrLsmGNsYN02pDasNs7ax7ppQG1YbVhtWG7atzbbz\nbHJ/lLz/QbGQtY1114TasNqw2jBjG+OmKcY2xk2T6sNqw4xtjJum1IbV5qw+rDZs\nU5tNZ9nih0fJp/9YMGRsY9w0pTasNqw2zNjGuGmSsY9x05TasNowaxvrrgm1YbVh\ntWG1OdvUZ9NZvtLxUfL+l4qFjG2MmybVh9WG1eZt1i7WXROMbYybJtWH1YYZ2xg3\nTanNWX1YbVht2LY2287zmX7qUfLpH1w41h+xtrHumlAbVhtWG2ZsY9w0xdrGumtC\nbVhtmLGNcdOU2pzVh9WG1YZtarPpLJ/llx8ln/7xBYP9LGMb46YptWG1YbVh1jbW\nXROMbYybptSG1ebM2Me4aUptWG1YbVhtzjb12XSWj/SuR8n7B7lIrN9hbGPcNKk+\nrDasNszYxrhpirWNddeE2rDaMGMb46ZJ9WG1YbVhtWHb2mw7z6SRR8mnDyiO9V7G\nNsZNU2rDasNqw4xtjJsmGfsYN02pDasNs7ax7ppQG1YbVhtWm7NNfTadZcr4o+TT\nBxcGm2JsY9w0pTasNqw2Z8Y+xk1TjG2Mm6bU5qw+zNjGuGlKbVhtzurDasM2tdl0\nlvf40EfJp08kCfYRjG2Mm6bUhtWG1YYZ2xg3TbG2se6aUBtWG2ZtY901oTasNqw2\nrDZsW5tt5/kVn/Yoef+ELxzroxnbGDdNqQ2rDasNs7ax7ppgbGPcNKU2rDZnxj7G\nTVNqw2rDanNWH7apzaaz/KxPf5S8f+IXjPVZjG2MmybVh9WG1YYZ2xg3TbG2se6a\nUBtWG2ZtY901oTasNqw2rDZsW5tt5yFf9ij5vVcJ9hWMbYybptSG1YbVhlnbWHdN\nMLYxbppSG1YbZm1j3TWhNqw2rDasNmxbm23nebTmUfJmc6yvZm1j3TWhNqw2rDbM\n2Ma4aYq1jXXXhNqw2jBjG+OmKbU5qw+rDasN29Zm3Xm2PUo+2hZrE2Mb46YptWG1\nYbVhxjbGTZOMfYybptSG1YZZ21h3TagNqw2rDavN2aY+W86y+lHyZkusjYxtjJsm\n1YfVhtXmbdYu1l0TjG2MmybVh9WGGdsYN02pzVl9WG1Ybdi2Nl95npd4lHy07f+8\nTaxtrLsm1IbVhtWGGdsYN02xtrHumlAbVhtmbWPdNaE2rDasNqw2bFubzz7Pyz1K\nPtr2f94mxjbGTVNqw2rDasOsbay7JhjbGDdNqQ2rzZmxj3HTlNqw2rDasNqcberz\nWWd56UfJm03/x21jbGPcNKk+rDasNszYxrhpirWNddeE2rDaMGMb46ZJ9WG1YbVh\ntWHb2nzkeRSPko+2/Z+3ibGNcdOU2rDasNowaxvrrgnGNsZNU2rDanNm7GPcNKU2\nrDZn9WG1YZvafMRZdI+Sjzb9n7eNsY1x05TasNqw2pwZ+xg3TTG2MW6aVB9WG2Zs\nY9w0pTasNmf1YbVhm9pMnUX9KPlo0/952xjbGDdNqQ2rDasNM7YxbppibWPdNaE2\nrDbM2sa6a0JtWG1YbVht2LY27znPZR4lb7b9n7eJsY1x05TasNqw2jBrG+uuCcY2\nxk2T6sNqw4xtjJum1OasPuz/Z8dOt+JI1y1Zn3X/11d9fyWrhvY+UkEu7Es108HD\n3J5/qZSAaeEEjLc2rDbsbm1+9et53FHyu7u9cHdibGPctFQfVhtWG2ZsY9y0Ym1j\n3bVQG1YbZm1j3bVQG1YbVhtWG3a3Nj/79Tz2KPlXd3sB78TYxrhppTasNqw2zNrG\numvB2Ma4aaU2rDbM2sa6a6E2rDasNqw2Z3fqc/paOkr+xZ1euLuxtrHuWqgNqw2r\nDTO2MW5asbax7lqoDasNM7YxblqqD6sNqw2rDbtbm79+PR0lD+724t2JsY1x00pt\nWG1YbZixjXHTkrGPcdNKbVhtmLWNdddCbVhtWG1Ybc7u1Of71/KP//N//s8/3/5B\n/lVtmLGNcdNSfVhtWG0+Zu1i3bVgbGPctFQfVhtmbGPctFQfVhtWG1Ybdqc2P46S\n7/7wRl/g3dSGWdtYdy3UhtWG1YYZ2xg3rVjbWHct1IbVhlnbWHct1IbVhtWG1YZ9\ndZsPj5I//mcv3FF9mLGNcdNKbVhtWG2YtY1114KxjXHTSm1Ybc6MfYybVmrDasNq\nw2pz9hV9jkfJd3+xFw/VhhnbGDct1YfVhtWGGdsYN61Y21h3LdSG1YYZ2xg3LdWH\n1YbVhtWGfWabnz5K/vgHvXBH9WHGNsZNK7VhtWG1YdY21l0LxjbGTSu1YbU5M/Yx\nblqpDavNWX1YbdjVbX75KPnuH/fCHdWHGdsYN63UhtWG1ebM2Me4acXYxrhpqT6s\nNszYxrhppTasNmf1YbVhV7T5o6Pkuw/UC3dUH2ZsY9y0UhtWG1YbZmxj3LRk7GPc\ntFIbVhtmbWPdtVAbVhtWG1YbtmwzO0r++IC9cEf1YcY2xk0rtWG1YbVh1jbWXQvG\nNsZNS/VhtWHGNsZNK7U5qw+rDasN+9M286Pkv3yCXjxUG2ZtY921UBtWG1YbZmxj\n3LRibWPdtVAbVhtmbGPctFKbs/qw2rDasN9pc/lR8scn6oU7qg8ztjFuWqkNqw2r\nDbO2se5aMLYxblqpDasNs7ax7lqoDasNqw2rzdnP9vm0o+S7T9qLh2rDrG2suxZq\nw2rDasOMbYybVqxtrLsWasNqw4xtjJuW6sNqw2rDasP+rs2XHCV/fPJeuKP6MGMb\n46aV2rDasNowYxvjpiVjH+Omldqw2jBrG+uuhdqw2rDasNqcfdTnS4+Sb/XindWH\nGdsYN63UhtWG1YZZ21h3LRjbGDet1OasPszYxrhppTasNmf1YbVh39vc5ij5Vi8c\nqw2ztrHuWqgNqw2rDTO2MW5asbax7lqoDasNs7ax7lqoDasNqw2rDbvlUfK7Xriz\n+jBjG+Omldqw2rDaMGsb664FYxvjppXasNqcGfsYN63UhtWG1YbV5l/d+ij5Vi8e\nqw0ztjFuWqoPqw2rDTO2MW5asbax7lqoDasNM7YxblqqD6sNqw2rzb97maPkW714\nZ/VhxjbGTSu1YbVhtWHWNtZdC8Y2xk0rtWG1YdY21l0LtWG1YbVhT27zkkfJt578\n4v2d2jBrG+uuhdqw2rDaMGMb46YVYxvjpqX6sNowYxvjppXasNqc1Yc9rc3LHyW/\ne9oL96vqw4xtjJtWasNqw2rDjG2Mm5aMfYybVmrDasOsbay7FmrDasNqw57SRnOU\nfOspL97vqA0ztjFuWqoPqw2rzcesXay7FoxtjJuW6sNqw4xtjJtWanNWH1YbZm6j\nPEq+ZX7x/lRtmLWNdddCbVhtWG2YsY1x04q1jXXXQm1YbZixjXHTSm3O6sNqw2xt\n9EfJ72wv3Fp9mLGNcdNKbVhtWG2YtY1114KxjXHTSm1YbZi1jXXXQm1YbVhtmKXN\nY46Sb1levCvUhhnbGDct1YfVhtWGGdsYN61Y21h3LdSG1YYZ2xg3LdWH1YbVhr1y\nm0ceJb975RfuM9SHGdsYN63UhtWG1YYZ2xg3LRn7GDet1IbVhlnbWHct1IbVhtWG\nvWKbRx8l33rFF+8z1YcZ2xg3rdSG1YbVhlnbWHctGNsYN63U5qw+zNjGuGmlNqw2\nZ/Vhr9Cmo+QHXuGF+yq1YcY2xk1L9WG1YbVhxjbGTSvWNtZdC7VhtWHWNtZdC7Vh\ntWG1YXdu01Hy4M4v3B3UhxnbGDet1IbVhtWGWdtYdy0Y2xg3rdSG1ebM2Me4aaU2\nrDasNuyObf7xv//3//5xlLzjF3gXtWG1YcY2xk1L9WG1YbVhxjbGTSvWNtZdC7Vh\ntWHWNtZdC7VhtWG1YXdp8+4o+e5/3OQLvKPanNWHGdsYN63UhtWG1YZZ21h3LRjb\nGDet1IbVhlnbWHct1IbVhtWGfWUbPEq++0u9eKg2rDbM2sa6a6E2rDYfq8uZsY9x\n04qxjXHTUn1YbZixjXHTSm1Ybc7qwz67zU8dJX/85V44VJuz+jBjG+Omldqw2rDa\nMGMb46YlYx/jppXasNowaxvrroXasNqw2rDPavNLR8l3/7AXD9WG1YYZ2xg3LdWH\n1eZjdWHWNtZdC8Y2xk1L9WG1YcY2xk0rtTmrD6sNu7LNbx8l332QXjxUG1YbZm1j\n3bVQG1YbVhtmbGPctGJtY921UBtWG2ZtY921UBtWG1Ybtm4zOUr++GC9cKg2Z/Vh\nxjbGTSu1YbVhtWHWNtZdC8Y2xk0rtWG1OTP2MW5aqQ2rDasNW7WZHiXffeBePFQb\nVhtmbGPctFQfVhtWG2ZsY9y0Ym1j3bVQG1YbZmxj3LRUH1YbVhv2J20uO0r++AS9\ncKg2Z/VhxjbGTSu1YbVhtWHWNtZdC8Y2xk0rtWG1OTP2MW5aqQ2rzVl92K+2ufwo\n+e6T9cKh2pzVhxnbGDet1IbVhtXmzNjHuGnF2Ma4aaU2Z/VhxjbGTSu1YbU5qw/7\nmTafepR894l74VBtWG2YsY1x01J9WG1YbZixjXHTirWNdddCbVhtmLWNdddCbVht\nWG3Yqc2XHSV/fAG9cKg2Z/VhxjbGTSu1YbVhtWHWNtZdC8Y2xk1L9WG1YcY2xk0r\ntTmrD6sN+2ubLz9KvtULx2rDasOMbYyblurDasNqw4xtjJtWrG2suxZqw2rDrG2s\nuxZqw2rDasO+t7nVUfKtXjxWm7P6MGMb46aV2rDasNowaxvrrgVjG+Omldqw2jBr\nG+uuhdqw2rDafOy2R8m3evFYbVhtmLWNdddCbVhtPlaXM2Mf46YVaxvrroXasNow\nYxvjpqX6sNqw2vw/L3GU/K4XjtXmrD7M2Ma4aaU2rDasNszYxrhpydjHuGmlNqw2\nzNrGumuhNqw2rDYvdpR8qxeP1YbVhhnbGDct1YfV5mN1YdY21l0LxjbGTUv1YbVh\nxjbGTUv1YbVhT23zskfJt5764v2M2rDaMGsb666F2rDasNowYxvjphVrG+uuhdqw\n2jBrG+uuhdqw2rAntVEcJb970gv3q2pzVh9mbGPctFIbVhtWG2ZtY921YGxj3LRS\nG1abM2Mf46aV2rDasCe0+cf/+l//65/GocZNK7VhtWHGNsZNS/VhtWG1YcY2xk0r\n1jbWXQu1YbVhxjbGTUv1YbVh1jb/dpT88R/CkcZNK7U5qw8ztjFuWqkNqw2rDbO2\nse5aMLYxblqpDavNmbGPcdNKbVhtzkx93h0l3/0P0cjvjJtWanNWH2ZsY9y0UhtW\nG1abM2Mf46YVYxvjpqX6sNowYxvjppXasNqcvXofPEq++0svPvIjxk0rtTmrDzO2\nMW5aqQ2rDasNM7Yxbloy9jFuWqkNqw2ztrHuWqgNqw171TY/dZT88ZdfdOSJcdNK\nbc7qw4xtjJtWasNqw2rDrG2suxaMbYyblurDasOMbYybVmpzVh/2Sm1+6Sj5L//4\nhYb+LOOmldqw2jBrG+uuhdqw2rDaMGMb46YVaxvrroXasNowYxvjppXasNqc3b3P\nHx0lf3yQm4/8HcZNK7U5qw8ztjFuWqkNqw2rDbO2se5aMLYxblqpDasNs7ax7lqo\nDasNu2ubyVHy3Qe86dA/Ydy0UhtWG2ZtY921UBtWm4/V5czYx7hpxdrGumuhNqw2\nzNjGuGmpPqw27E5t5kfJHx/4RiNXjJtWanNWH2ZsY9y0UhtWG1YbZmxj3LRk7GPc\ntFIbVhtmbWPdtVAbVht2hzaXHSXffZIbDF0zblqpzVl9mLGNcdNKbVhtWG2YtY11\n14KxjXHTSm3O6sOMbYybVmrDasO+qs2nHCXffULhQ2DctFIbVhtmbWPdtVAbVhtW\nG2ZsY9y0Ym1j3bVQG1YbZm1j3bVQG1Yb9pltPv0o+eMTCx8A46aV2pzVhxnbGDet\n1IbVhtWGWdtYdy0Y2xg3rdSG1ebM2Me4aaU2rDbsM9p82VHy3RchfAiMm1Zqw2rD\njG2Mm5bqw2rDasOMbYybVqxtrLsWasNqw4xtjJuW6sNqw65qc4uj5FvGh8C4aaU2\nrDbM2sa6a6E2rDasNszaxrprwdjGuGmlNqw2Z8Y+xk0rtWG1Ycs2tztKfmd8AIyb\nVmpzVh9mbGPctFIbVhtWmzNjH+OmFWMb46al+rDaMGMb46aV2rDanP1pn9seJd8y\nPgTGTSu1OasPM7YxblqpDasNqw0ztjFuWjL2MW5aqQ2rDbO2se5aqA2rDfvdNi9x\nlHzL+BAYN63UhtWGGdsYNy3Vh9XmY3Vh1jbWXQvGNsZNS/VhtWHGNsZNK7U5qw/7\nlTYvd5R8y/gQGDet1IbVhlnbWHct1IbVhtWGGdsYN61Y21h3LdSG1YYZ2xg3rdSG\n1ebs7/q89FHyO+NDYNy0Upuz+jBjG+Omldqw2rDaMGsb664FYxvjppXasNowaxvr\nroXasNowaqM4Sr5lfAiMm1Zqw2rDjG2Mm5bqw2rDasOMbYybVqxtrLsWasNqw4xt\njJuW6sNqw962+cf//J//85/GWG16ltqc1YcZ2xg3rdSG1YbVhhnbGDctGfsYN63U\nhtWGWdtYdy3UhtWGfWvzb0fJv/6hTZuepTZn9WHGNsZNK7VhtWG1YdY21l0LxjbG\nTSu1OasPM7YxblqpDavNv/qXo+SP/yGNZdxl3LRSG1YbZmxj3LRUH1YbVhtmbGPc\ntGJtY921UBtWG2ZtY921UBtWm3+HR8l3f0kYq03PUpuz+jBjG+Omldqw2rDaMGsb\n664FYxvjppXasNqcGfsYN63Uhj29zU8dJX/8ZWks4y7jppXasNowYxvjpqX6sNqw\n2jBjG+OmFWsb666F2rDaMGsb666F2rAntvmlo+S//GNhsDY9S23O6sOMbYybVmrD\nasNqw6xtrLsWjG2Mm1Zqw2rDrG2suxZqw57S5o+Okj8+iDBWm56lNmf1YcY2xk0r\ntWG1YbU5M/YxbloxtjFuWqoPqw0ztjFuWqkNs7eZHCXffUBhsDY9S23O6sOMbYyb\nVmrDasNqw4xtjJuWjH2Mm1Zqw2rDrG2suxZqw4xt5kfJHx9YGOsb4y7jppXasNow\nYxvjpqX6fKwurDbM2sa6a8HYxrhpqT6sNszYxrhpqT7M0uayo+S7TyKJ9VfGXcZN\nK7VhtWHWNtZdC7VhtWG1YcY2xk0r1jbWXQu1YbVhxjbGTSu1OXvlPp9ylHz3CV84\nFmnTs9TmrD7M2Ma4aaU2rDasNszaxrprwdjGuGmlNqw2zNrGumuhNuwV23z6UfLH\nJ37BWD/DuMu4aaU2rDbM2Ma4aak+H6vLWX2YsY1x04q1jXXXQm1YbZixjXHTUn3Y\nq7T5sqPkuy/iRWL9ijY9S23O6sOMbYybVmrDasNqw6xtrLsWjG2Mm1Zqw2pzZuxj\n3LRSG3b3Nrc4Sr5192C/o03PUpuz+jBjG+Omldqw2rDaMGsb664FYxvjppXanNWH\nGdsYN63Uht2xze2Okt/dMdaCcZdx00ptWG2YsY1x01J9WG1YbZixjXHTirWNdddC\nbVhtmLWNdddCbdhd2tz2KPnWXWIttelZanNWH2ZsY9y0UhtWG1YbZm1j3bVgbGPc\ntFQfVhtmbGPctFKbs6/s8xJHye+sD5Jxl3HTSm1YbZixjXHTUn0+Vpez+jBjG+Om\nFWsb666F2rDaMGsb666F2rCvaPNSR8m/Mj5MbXqW2pzVhxnbGDet1IbVhtWGWdtY\ndy0Y2xg3rdSG1YZZ21h3LdSGfVablz5Kfmd9kIy7jJtWasNqw6xtrLsWavOxurDa\nnBn7GDetWNtYdy3UhtWGGdsYNy3Vh13ZRnGUfMv4ILXpWWpzVh9mbGPctFIbVhtW\nG2ZsY9y0ZOxj3LRSG1YbZm1j3bVQG3ZFG91R8jvrg2TcZdy0UhtWG2ZsY9y0VJ+P\n1YXV5szYx7hpxdjGuGmpPqw2zNjGuGmpPmzVRnuUfMv6IBl3GTet1IbVhlnbWHct\n1IbVhtWGGdsYN61Y21h3LdSG1YZZ21h3LdSG/UmbRxwl3zI+SG16ltqc1YcZ2xg3\nrdSG1YbVhlnbWHctGNsYN63UhtXmzNjHuGmlNux32jzuKPmd9UEy7jJuWqkNqw0z\ntjFuWqrPx+pyVh9mbGPctGJtY921UBtWG2ZsY9y0VB/2s20ee5R8y/ggtelZanNW\nH2ZsY9y0UhtWG1YbZm1j3bVgbGPctFIbVpszYx/jppXasL9r01HyL4wPU5uepTZn\n9WHGNsZNK7VhtWG1OTP2MW5aMbYxblqpzVl9mLGNcdNKbdhHbTpKAuuDZNxl3LRS\nG1YbZmxj3LRUH1YbVhtmbGPctGTsY9y0UhtWG2ZtY921UBv2vc0//sf/+B//fPsH\n+VfGNm16ltqc1YcZ2xg3rdSG1YbVhlnbWHctGNsYNy3Vh9WGGdsYN63Uhv04Sr77\nw4IhaxvjLuOmldqw2jBrG+uuhdp8rC5n9WHGNsZNK9Y21l0LtWG1YcY2xk0rtXnv\nw6Pku79QMGRs06Znqc1ZfZixjXHTSm1YbVhtmLWNddeCsY1x00ptWG2YtY1110Jt\nfuIo+eMvFgtZ2xh3GTet1IbVhlnbWHct1OZjdWG1OTP2MW5asbax7lqoDasNM7Yx\nblp6ap+fPkq++0cPjfUzjG3a9Cy1OasPM7YxblqpDasNqw0ztjFuWjL2MW5aqQ2r\nDbO2se5aeFqb3zpKvvsADwv2K4xt2vQstTmrDzO2MW5aqQ2rDasNs7ax7lowtjFu\nWqnNWX2YsY1x08oT2vzxUfLHB3pArN9lbWPcZdy0UhtWG2ZtY921UBtWG1YbZmxj\n3LRibWPdtVAbVhtmbWPdtWBtMztKvvug0lgLxjZtepbanNWHGdsYN63UhtWG1YZZ\n21h3LRjbGDet1IbV5szYx7hpxdbmkqPkjw8ui7VkbWPcZdy0UhtWG2ZsY9y0VJ+P\n1eWsPszYxrhpxdrGumuhNqw2zNjGuGnJ0OfSo+S7TySIdRVrG+Mu46aV2rDaMGsb\n666F2rDasNowaxvrrgVjG+Omldqw2pwZ+xg3rbxqm087Sr77pC8a6zMY27TpWWpz\nVh9mbGPctFIbVhtWmzNjH+OmFWMb46al+rDaMGMb46aVV2vzJUfJH5/8xWJ9Jmsb\n4y7jppXasNowYxvjpqX6sNqw2jBjG+OmJWMf46aV2rDaMGsb666FV2jzpUfJt14h\n1lcxtmnTs9TmrD7M2Ma4aaU2rDasNszaxrprwdjGuGmpPqw2zNjGuGnlzm1uc5R8\n687Bvpq1jXGXcdNKbVhtmLWNdddCbT5Wl7P6MGMb46YVaxvrroXasNowYxvjppW7\ntbnlUfKtuwW7E2ObNj1Lbc7qw4xtjJtWasNqw2rDrG2suxaMbYybVmrDasOsbay7\nFu7Q5vZHye/uEOuurG2Mu4ybVmrDasOMbYyblurzsbqc1YcZ2xg3rVjbWHct1IbV\nhhnbGDctfVWflzlKvtXDxIxt2vQstTmrDzO2MW5aqQ2rDasNM7Yxbloy9jFuWqkN\nqw2ztrHuWvjsNi95lHyrh4kZ27TpWWpzVh9mbGPctFIbVhtWG2ZtY921YGxj3LRS\nm7P6MGMb46aVz2jz8kfJ73qQmLWNcZdx00ptWG2YsY1x01J9WG1YbZixjXHTirWN\ndddCbVhtmLWNddfCVW00R8m3epCYsU2bnqU2Z/VhxjbGTSu1YbVhtWHWNtZdC8Y2\nxk0rtWG1OTP2MW5aWbdRHiW/60Fi1jbGXcZNK7VhtWHGNsZNS/X5WF3O6sOMbYyb\nVqxtrLsWasNqw4xtjJuWFn3UR8m/6oFixjZtepbanNWHGdsYN63UhtWG1YZZ21h3\nLRjbGDet1IbV5szYx7hp5XfbPOoo+V0PEjO2adOz1OasPszYxrhppTasNqw2Z8Y+\nxk0rxjbGTUv1YbVhxjbGTSu/2uaRR8nvepCYtY1xl3HTSm1YbZixjXHTUn1YbVht\nmLGNcdOSsY9x00ptWG2YtY1118LPtHn0UfKtHiRmbNOmZ6nNWX2YsY1x00ptWG1Y\nbZi1jXXXgrGNcdNSfVhtmLGNcdMS9eko+YEeJmZtY9xl3LRSG1YbZm1j3bVQG1Yb\nVhtmbGPctGJtY921UBtWG2ZsY9y08tc2HSX/Rg8TM7Zp07PU5qw+zNjGuGmlNqw2\nrDbM2sa6a8HYxrhppTasNszaxrpr4Vubf/z3//7f//n2D/Kx2jBrG+Mu46aV2rDa\nMGMb46al+nysLmf1YcY2xk0r1jbWXQu1YbVhxjbGTQvvjpI//rBYR/VhxjZtepba\nnNWHGdsYN63UhtWG1YZZ21h3LRjbGDet1IbV5szYx7jpd314lHz3F4p1VB9mbNOm\nZ6nNWX2YsY1x00ptWG1YbZi1jXXXgrGNcdNKbc7qw4xtjJt+xd8eJd/95YfHOqkN\ns7Yx7jJuWqkNqw0ztjFuWqoPqw2rDTO2MW5asbax7lqoDasNs7ax7jr5paPkj3/0\nwFC/oj7M2KZNz1Kbs/owYxvjppXasNqw2jBrG+uuBWMb46al+rDaMGMb4ybyW0fJ\ndx/gQbF+VW2YtY1xl3HTSm1YbZixjXHTSm1Ybc7qw4xtjJtWrG2suxZqw2rDrG2s\nu77746Pkuw8mj/Wn6sOMbdr0LLU5qw8ztjFuWqkNqw2rDbO2se5aMLYxblqpDasN\ns7Yx7poeJX98UGGopfowY5s2PUttzurDjG2Mm1Zqw2rDanNm7GPctGJtY921UBtW\nG2ZsY9p0yVHy3ScQxVqrDbO2Me4yblqpDasNM7YxblqqD6sNqw0ztjFuWjL2MW5a\nqQ2rDbO2efVdlx8l332yF491pdowY5s2PUttzurDjG2Mm1Zqw2rDanNm7GPctGJs\nY9y0VB9WG2Zs86qbPvUo+e4Tv2iwz1AbZm1j3GXctFIbVhtmbWPd9afqclYfVhtm\nbGPctGJtY921UBtWG2Zt8yq7vuwo+eMLeJFQX6U+zNimTc9Sm7P6MGMb46aV2rDa\nsNowaxvrrgVjG+Omldqw2jBrm7vv+vKj5Ft3j/WVasOsbYy7jJtWasNqw4xtjJtW\nasNqc1YfZmxj3LRibWPdtVAbVhtmbHPXTbc6Sn5311h3UR9mbNOmZ6nNWX2YsY1x\n00ptWG1YbZi1jXXXgrGNcdNKbVhtzox97rTplkfJt+4U647qw4xt2vQstTmrDzO2\nMW5aqQ2rDasNs7ax7lowtjFuWqnNWX2Ysc1Xb7r9UfKtr451Z7Vh1jbGXcZNK7Vh\ntWHGNsZNS/VhtWG1YcY2xk0r1jbWXQu1YbVh1jZfseuljpLfWR+AlfowY5s2PUtt\nzurDjG2Mm1Zqw2rDasOsbay7FoxtjJuW6sNqw4xtPnPTSx4l3zI+ACu1YdY2xl3G\nTSu1YbVhxjbGTSu1YbU5qw8ztjFuWrG2se5aqA2rDbO2uXrXyx8l37I+BCv1YcY2\nbXqW2pzVhxnbGDet1IbVhtWGWdtYdy0Y2xg3rdSG1YZZ21yxS3WU/M76AKzUhxnb\ntOlZanNWH2ZsY9y0UhtWG1abM2Mf46YVaxvrroXasNowY5vlJuVR8i3jA7BSG2Zt\nY9xl3LRSG1YbZmxj3LRUH1YbVhtmbGPctGTsY9y0UhtWG2Zt86e79EfJt6wPwUp9\nmLFNm56lNmf1YcY2xk0rtWG1YbVh1jbWXQvGNsZNK7U5qw8ztvmdTY86Sr5lfABW\nasOsbYy7jJtWasNqw6xtrLv+VF3O6sNqw4xtjJtWrG2suxZqw2rDrG1+dtdjj5Lf\nWR+AlfowY5s2PUttzurDjG2Mm1Zqw2rDasOsbay7FoxtjJtWasNqc2bs83ebHn+U\nfMv4AKzUhlnbGHcZN63UhtWGGdsYN63UhtXmrD7M2Ma4acXaxrproTasNszYhjZ1\nlATGh2ClNszaxrjLuGmlNqw2zNrGumuhNqw2rDbM2sa6a8HYxrhppTasNmfGPt83\n/eO//bf/9k/jwJXanNWHGdu06Vlqc1YfZmxj3LRSG1YbVpszYx/jphVjG+Omldqc\n1YcZ2/zbUfLdHwhHrtSG1YZZ2xh3GTet1IbVhhnbGDct1YfVhtWGGdsYNy0Z+xg3\nrdSG1YaZ2vzLUfLH/xCNXKvNWX2YsU2bnqU2Z/VhxjbGTSu1YbVhtWHWNtZdC8Y2\nxk1L9WG1Ya/eBo+S//IXX3zolWrDasOsbYy7jJtWasNqw6xtrLv+VF1Ybc7qw4xt\njJtWrG2suxZqw2rDXrHNTx8lf/yDFxz5WWpzVh9mbNOmZ6nNWX2YsY1x00ptWG1Y\nbZi1jXXXgrGNcdNKbVht2Cu1+eWj5Lt//EJDP1ttWG2YtY1xl3HTSm1YbZixjXHT\nSm1Ybc7qw4xtjJtWrG2suxZqw2rD7t7mj46SPz7IzUd+pdqw2jBrG+Mu46aV2rDa\nMGMb46al+rDasNowYxvjpiVjH+Omldqw2rC7tpkcJd99wJsOvYPanNWHGdu06Vlq\nc1YfZmxj3LRSG1YbVhtmbWPdtWBsY9y0Upuz+rC7tJkfJd998JuMvKPasNowaxvj\nLuOmldqw2jBjG+Omldqc1YfVhhnbGDetWNtYdy3UhtWGfXWbS4+SPz5JDwCqzVl9\nmLFNm56lNmf1YcY2xk0rtWG1YbVh1jbWXQvGNsZNK7VhtTn7ij6fcpR89wl7CFBt\nWG2YtY1xl3HTSm1YbZixjXHTSm1Ybc7qw4xtjJtWrG2suxZqw2rDPrPNpx8l333y\nHgJUm7P6MGObNj1Lbc7qw4xtjJtWasNqw2rDrG2suxaMbYybVmrDanN2ZZ8vPUr+\n+CJ6AFBtzurDjG3a9Cy1OasPM7YxblqpDasNq82ZsY9x04qxjXHTUn1YbdgVbW5x\nlHyrB4DVhtWGWdsYdxk3rdSG1YYZ2xg3LdWH1YbVhhnbGDctGfsYN63UhtWGLdvc\n7ij5XQ/AWX1YbZixTZuepTZn9WHGNsZNK7VhtWG1OTP2MW5aMbYxblqqD6sN+9M2\ntz1K/lUPAasNqw2ztjHuMm5aqQ2rDbO2se76U3U5qw+rDTO2MW5asbax7lqoDasN\n+502L3OU/K4HgNXmrD7M2KZNz1Kbs/owYxvjppXasNqw2jBrG+uuBWMb46aV2rDa\nsF9p83JHybd6CFhtWG2YtY1xl3HTSm1YbZixjXHTSm1Ybc7qw4xtjJtWrG2suxZq\nw2rD/q7NSx8lv+sBYLU5qw8ztmnTs9TmrD7M2Ma4aaU2rDasNszYxrhpydjHuGml\nNqw2jNoojpJv9RCw2pzVhxnbtOlZanNWH2ZsY9y0UhtWG1YbZm1j3bVgbGPctFKb\ns/qw7210R8m3egBYbVhtmLWNcZdx00ptWG2YsY1x00ptzurDasOMbYybVqxtrLsW\nasNqw9RHye96AFhtzurDjG3a9Cy1OasPM7YxblqpDasNqw2ztrHuWjC2MW5aqg+r\nzXuPOEq+1QPAasNqw6xtjLuMm1Zqw2rDjG2Mm1Zqw2pzVh9mbGPctGJtY921UBtW\nm3/3uKPkWz0ErDZn9WHGNm16ltqc1YcZ2xg3rdSG1YbVhlnbWHctGNsYN63Uhj25\nzaOPkt89+QH4O7U5qw8ztmnTs9TmrD7M2Ma4aaU2rDasNmfGPsZNK9Y21l0LtWFP\na9NR8i+e9gD8itqw2jBrG+Mu46aV2rDaMGMb46al+rDasNowYxvjpiVjH+Omldqw\np7TpKAme8gD8rvqw2jBjmzY9S23O6sOMbYybVmrDasNqc2bsY9y0Ymxj3LRUH2Zu\n84//+l//64+jpHnon6oNqw2rDbO2Me4yblqpDasNs7ax7vpTdTmrD6sNM7Yxblqx\ntrHuWqgNs7V5d5T88YeykUu1YbU5qw8ztmnTs9TmrD7M2Ma4aaU2rDasNszaxrpr\nwdjGuGmlNszS5sOj5Lu/IBl6hdqw2rDaMGsb4y7jppXasNowYxvjppXasNqc1YcZ\n2xg3rVjbWHct1Ia9cpu/PUr++IsvPPJqtWG1OasPM7Zp07PU5qw+zNjGuGmlNqw2\nrDbM2sa6a8HYxrhppTZnr9bnp4+S7/7Ri438TLVhtTmrDzO2adOz1OasPszYxrhp\npTasNqw2zNrGumvB2Ma4aaU2Z6/Q57eOku8+wAuM/Cq1YbVhtWHWNsZdxk0rtWG1\nYcY2xk0rtTmrD6sNM7YxblqxtrHuWqgNu3ObPz5K/vhANx751WrDanNWH2Zs06Zn\nqc1ZfZixjXHTSm1YbVhtmLWNddeCsY1x01J92N3azI6S7z7ozUbeSW1YbVhtmLWN\ncZdx00ptWG2YsY1x00ptWG3O6sOMbYybVqxtrLsWasPu0uaSo+S7T3CToXdUG1ab\ns/owY5s2PUttzurDjG2Mm1Zqw2rDasOsbay7FoxtjJtWasO+ss3lR8kfn6gHANWG\n1easPszYpk3PUpuz+jBjG+Omldqw2rDanBn7GDetWNtYdy3Uhn12m087Sr77pD0A\nqDasNqw2zNrGuMu4aaU2rDbM2Ma4aak+rDasNszYxrhpydjHuGmlNuyz2nzJUfLd\nF9BDgGrDanNWH2Zs06Znqc1ZfZixjXHTSm1YbVhtmLWNddeCsY1x00ptzq7q8+VH\nybd6CFhtWG1YbZi1jXGXcdNKbVhtmLGNcdNKbc7qw2rDjG2Mm1asbay7FmrD1m1u\ndZT8rgeA1YbV5qw+zNimTc9Sm7P6MGMb46aV2rDasNowaxvrrgVjG+OmldqwVZtb\nHiXf6iFgtWG1YbVh1jbGXcZNK7VhtWHGNsZNK7VhtTmrDzO2MW5asbax7lqoDfuT\nNrc/Sr7VQ8Bqw2rDasOsbYy7jJtWasNqw6xtrLsWasNqw2rDrG2suxaMbYybVmrD\nfrXNSx0lv+sBYLVhtTmrDzO2adOz1OasPszYxrhppTasNqw2zNrGumvB2Ma4aaU2\nZz/T5yWPkm/1ELDasNqw2jBrG+Mu46aV2rDaMGMb46al+rDasNowYxvjpiVjH+Om\nldqwU5uXP0p+1wPAasNqc1YfZmzTpmepzVl9mLGNcdNKbVhtWG2YtY1114KxjXHT\nSm3O/tpHc5T8qx4EVhtWG1YbZm1j3GXctFIbVhtmbGPctFIbVpuz+jBjG+OmFWsb\n666F2rBvbf7xX/7Lf/nn2z+wMW5aqQ2rzVl9mLFNm56lNmf1YcY2xk0rtWG1YbVh\n1jbWXQvGNsZNK7X52Luj5I8/FMYyblqpDavNWX2YsU2bnqU2Z/VhxjbGTSu1YbU5\nqw8ztjFuWrG2se5aqM3/8+FR8sf/lIay7lqoDasNqw2ztjHuMm5aqQ2rDTO2MW5a\nqg+rDasNM7Yxbloy9jFuWqnN3xwl/+UvC4MZN63UhtXmrD7M2KZNz1Kbs/owYxvj\nppXasNqw2jBrG+uuBWMb46aVp7b5paPkj38kjWXdtVAbVhtWG2ZtY9xl3LRSG1Yb\nZmxj3LRSm7P6sNowYxvjphVrG+uuhSe1+a2j5LsPIIxl3LRSG1abs/owY5s2PUtt\nzurDjG2Mm1Zqw2rDasOsbay7FoxtjJtWntDmj4+SPz6QNJZ110JtWG1YbZi1jXGX\ncdNKbVhtmLGNcdNKbVhtzurDjG2Mm1asbay7FqxtZkfJf/nAwmDGTSu1YbU5qw8z\ntmnTs9TmrD7M2Ma4aaU2rDasNszYxrhpydjHuGnF1Oayo+SPTyCK9Z1x00ptWG3O\n6sOMbdr0LLU5qw8ztjFuWqkNqw2rzZmxj3HTirGNcdPSq/e5/Cj54xO9eChi3bVQ\nG1YbVhtmbWPcZdy0UhtWG2ZsY9y0VB9WG1YbZmxj3LRk7GPctPKqbT7tKPnuk75o\nrBPjppXanNWH1YYZ27TpWWpzVh9mbGPctFIbVhtWmzNjH+OmFWMb46alV+rzJUfJ\nd1/AC8X6FdZdC7VhtWG1YdY2xl3GTSu1YbVhxjbGTSu1YbU5qw8ztjFuWjG2MW5a\nunufLz9KvnX3WL/DuGmlNqw2Z/VhxjZtepbanNWHGdsYN63UhtWG1YZZ21h3LRjb\nGDet3LXNrY6S39011p+y7lqoDasNqw2ztjHuMm5aqQ2rDTO2MW5aqQ2rzVl9mLGN\ncdOKtY1118Kd2tzyKPndnUItWXct1IbVhtWGWdsYdxk3rdSG1YYZ2xg3LdWH1YbV\nhhnbGDctGfsYN63coc2tj5J/dYdga8ZNK7VhtTmrDzO2adOz1OasPszYxrhppTas\nNqw2zNrGumvB2Ma4aeWr2rzUUfI764Nk3bVQG1YbVhtmbWPcZdy0UhtWG2ZsY9y0\nUpuz+rDaMGMb46YVaxvrroXPbPOSR8m3jA+ScdNKbVhtzurDjG3a9Cy1OasPM7Yx\nblqpDasNqw2ztrHuWjC2MW5a+Yw2L3+U/M76IFl3LdSG1YbVhlnbGHcZN63UhtWG\nGdsYN63U5qw+rDbM2Ma4acXaxrpr4ao2mqPkXxkfJuOmldqw2pzVhxnbtOlZanNW\nn49Zu1h3LdSG1YbVhlnbWHctGNsYN60s22iPkt8ZHyTjppXasNqc1YcZ27TpWWpz\nVh9mbGPctFIbVhtWmzNjH+OmFWMb46alP+2jP0p+Z32QrLsWasNqw2rDrG2Mu4yb\nVmrDasOMbYyblurDasNqw4xtjJuWjH2Mm1Z+t81jjpJvGR8k46aV2pzVh9WGGdu0\n6Vlqc1afj1m7WHct1IbVhtWGWdtYdy0Y2xg3Lf1Kn0ceJd+yPkzWXQu1YbVhtWHW\nNsZdxk0rtWG1YcY2xk0rtTmrD6sNM7YxblqxtrHuWvi7No8/Sr5lfJCMm1Zqw2pz\nVh9mbNOmZ6nNWX0+Zu1i3bVQG1YbVhtmbWPdtWBsY9y0Qm06Sn7A+iBZdy3UhtWG\n1YZZ2xh3GTet1IbVhhnbGDet1IbV5qw+zNjGuGnF2sa6a+Ftm46SB9aHyLproTas\nNqw2zNrGuMu4aaU2rDbM2sa6a6E2rDasNszaxrprwdjGuGnlW5t//Of//J//+dc/\nzMeMbYybVmrDanNWH2Zs06Znqc1ZfZixjXHTSm1YbVhtzox9jJtWjG2Mm/7Uvxwl\nf/yPYiFrG+uuhdqw2rDaMGsb4y7jppXasNowYxvjppXanNWH1YYZ2xg3rVjbWHf9\nKjxKvvtLxULGNsZNK7VhtTmrDzO2adOz1OasPh+zdrHuWqgNqw2rDbO2se5aMLYx\nbvoVP3WU/PGXHx7rxNrGumuhNqw2rDbM2sa4y7hppTasNszYxrhppTasNmf1YcY2\nxk0r1jbWXSe/dJT8l3/8wGA/y9jGuGmlNqw2Z/VhxjZtepbanNXnY9Yu1l0LtWG1\nYbVhxjbGTUvGPsZNH/mjo+SPD/KQWL/D2Ma4aaU2rDZn9WHGNm16ltqc1YcZ2xg3\nrdSG1YbV5szYx7hpxdrGuuubyVHyxwcTh/pT1jbWXQu1YbVhtWHWNsZdxk0rtWG1\nYcY2xk1L9WG1YbVhxjbGTUvGPspNy6Pkv3xwYbAVYxvjppXasNqc1YcZ27TpWWpz\nVp+PWbtYdy3UhtWG1YZZ21h3LRjbWDZdepT88Ukksa5gbWPdtVAbVhtWG2ZtY9xl\n3LRSG1YbZmxj3LRSm7P6sNowYxvjphVrm1fe9SlHyXef8IVjXc3YxrhppTasNmf1\nYcY2bXqW2pzV52PWLtZdC7VhtWG1YdY21l0LxjavuOnTj5I/PvELxvos1jbWXQu1\nYbVhtWHWNsZdxk0rtWG1YcY2xk0rtWG1OasPM7YxblqxtnmVXV92lHz3RbxIrK9g\nbWPdtVAbVhtWG2ZtY9xl3LRSG1YbZmxj3LRUH1YbVhtmbGPctGJtc+ddtzhKvnXn\nWF/N2Ma4aaU2rDZn9WHGNm16ltqc1YcZ2xg3rdSG1YbVhlnbWHctGNvccdPtjpLf\n3THWXVjbWHct1IbVhtWGWdsYdxk3rdSG1YYZ2xg3LdWH1YbVhhnbGDctGfvcZdNt\nj5Jv3SXWHRnbGDet1IbV5qw+zNimTc9Sm7P6fMzaxbproTasNqw2zNrGumvB2Oar\nN73EUfKtrw52Z9Y21l0LtWG1YbVh1jbGXcZNK7VhtWHGNsZNK7VhtTmrDzO2MW5a\nsbb57F0vd5R8y/oQLBjbGDet1IbV5qw+zNimTc9Sm7P6fMzaxbproTasNqw2zNrG\numvB2OazNr30UfI74wOwYmxj3LRSG1abs/owY5s2PUttzurDjG2Mm1Zqw2pzVh9m\nbGPctGJtc+UuxVHyO+sDsGBtY921UBtWG1YbZm1j3GXctFIbVhtmbGPctFQfVhtW\nG2ZtY921YGxzxaZ//Kf/9J/+aYz1jXXXgrGNcdNKbVhtzurDjG3a9Cy1OavPx6xd\nrLsWasNqw2rDrG2suxaMbVab/u0oecUHvhPjphVrG+uuhdqw2rDaMGsb4y7jppXa\nsNowYxvjppXanNWH1YYZ2xg3rVjb/MmufzlKLj7onVl3LRjbGDet1IbV5qw+zNim\nTc9Sm7P6fMzaxbproTasNqw2zNrGumvB2OZ3NuFR8k8/8N0ZN61Y21h3LdSG1YbV\nhlnbGHcZN63UhtWGGdsYN63UhtXmrD7M2Ma4acXa5md3/dRR8nc+8CsxblqxtrHu\nWqgNqw2rDbO2Me4yblqpDasNs7ax7lqoDasNqw0ztjFuWjL2OW365aPkz3zQV2bd\ntWBsY9y0UhtWm7P6MGObNj1Lbc7qw4xtjJtWasNqw2pzZuxj3LRibPPRpt8+Sv7d\nB351xk0r1jbWXQu1YbVhtWHWNsZdxk0rtWG1YcY2xk1L9WG1YbVhxjbGTUvGPt83\nTY6SH31gE+OmFWMb46aV2pzVh9WGGdu06Vlqc1afj1m7WHct1IbVhtXmzNjHuGnF\n2GZ+lHz3wY3BhJtWrG2suxZqw2rDasOsbYy7jJtWasNqw4xtjJtWasNqc1YfZmxj\n3LRiaXPpUfLHJ5HE+ivrrgVjG+Omldqw2pzVhxnbtOlZanNWn49Zu1h3LdSG1YbV\nhlnbWHctvHKbTzlKvvuELxyLGDetWNtYdy3UhtWG1YZZ2xh3GTet1IbVhhnbGDet\n1IbV5qw+zNjGuGnlFdt8+lHyxyd+wVh/x7hpxdrGumuhNqw2rDbM2sa4y7hppTas\nNszYxrhpqT6sNqw2zNjGuGnpVfp82VHy3RfxIrF+lXXXgrGNcdNKbVhtzurDjG3a\n9Cy1OasPM7YxblqpDasNqw2ztrHuWrhzm1scJd+6c6zfZdy0Ym1j3bVQG1YbVhtm\nbWPcZdy0UhtWG2ZsY9y0Upuz+rDaMGMb46aVO7a53VHyuzvGWrDuWjC2MW5aqQ2r\nzVl9mLFNm56lNmf1+Zi1i3XXQm1YbVhtmLWNddfCXdrc9ij51l1iLRk3rVjbWHct\n1IbVhtWGWdsYdxk3rdSG1YYZ2xg3rdTmrD6sNszYxrhp5avbvMRR8q2vDnYF46YV\naxvrroXasNqw2jBrG+Mu46aV2rDaMGsb666F2rDasNowYxvjpqXP7vNyR8nvrA+S\nddeCsY1x00ptWG3O6sOMbdr0LLU5qw8ztjFuWqkNqw2rzZmxj3HTyme1edmj5FvG\nB8m4acXaxrproTasNqw2zNrGuMu4aaU2rDbM2Ma4aak+rDasNszaxrpr4co2iqPk\nW8YHybhpxdjGuGmlNmf1YbVhxjZtepbanNXnY9Yu1l0LtWG1YbVh1jbWXQtXtNEd\nJd8yPkzGTSvWNtZdC7VhtWG1YdY2xl3GTSu1YbVhxjbGTSu1YbU5qw8ztjFuWlm1\nUR8lv7M+SNZdC8Y2xk0rtWG1OasPM7Zp07PU5qw+H7N2se5aqA2rDasNs7ax7lr4\nkzaPOEq+ZXyQjJtWrG2suxZqw2rDasOsbYy7jJtWasNqw4xtjJtWasNqc1YfZmxj\n3LTyO20ed5T8zvggGTetWNtYdy3UhtWG1YZZ2xh3GTet1IbVhlnbWHct1IbVhtWG\nWdtYdy38bJvHHiXfsj5I1l0LxjbGTSu1YbU5qw8ztmnTs9SG1ebM2Me4aaU2rDas\nNszaxrpr4dSmo+RfGB8k46YVaxvrroXasNqw2jBrG+Mu46aV2rDaMGMb46aV2pzV\nh9WGGdsYN6181KajJLA+SNZdC8Y2xk0rtWG1OasPM7Zp07PUhtWGWdtYdy3UhtWG\n1YZZ21h3LXxv01HyJxgfJOOmFWsb666F2rDasNowaxvjLuOmldqw2jBjG+Omldqw\n2pzVhxnbGDetdJT8RdaHybprwdjGuGmlNqw2Z/VhxjZtepbasNowaxvrroXasNqw\n2jBjG+OmP9FR8jdZHyTrrgVjG+Omldqw2pzVhxnbtOlZasNqc2bsY9y0UhtWG1ab\nM2Mf46Zf1VFywPggGTetWNtYdy3UhtWG1YZZ2xh3GTet1IbVhhnbGDct1YfVhtWG\nGdsYN/2sjpJj1ofJumvB2Ma4aaU2rDZn9WHGNm16ltqw2jBrG+uuhdqw2rDaMGsb\n666PdJS8kPFBMm5asbax7lqoDasNqw2ztjHuMm5aqQ2rDTO2MW5aqc1ZfVhtmLGN\ncdNf/eM//sf/+M8nDP1K1r7WXQvGNsZNK7VhtTmrDzO2adOz1IbVhlnbWHct1IbV\nhtWGWdtod307Sv74D+nIOzE2Nm5asbax7lqoDasNqw2ztjHuMm5aqQ2rDTO2MW5a\nqQ2rzVl9mLGNbdO7o+S7/yEbekfGxsZNK9Y21l0LtWG1YbVh1jbGXcZNK7VhtWHG\nNsZNS/VhtWG1YcY2hk14lHz3lwRD78za17prwdjGuGmlNqw2Z/VhxjZtepbasNqc\nGfsYN63UhtWG1ebM2OdVN/3UUfLHX37Rka/E2Ni4acXaxrproTasNqw2zNrGuMu4\naaU2rDbM2Ma4aak+rDasNszY5tU2/dJR8t0/fLGhr8ba17prwdjGuGmlNqw2Z/Vh\nxjZtepbasNowaxvrroXasNqw2jBrm1fY9dtHyXcf5AWGvjpjY+OmFWsb666F2rDa\nsNowaxvjLuOmldqw2jBjG+Omldqw2pzVhxnb3HXT5Cj57gPedKiFta9114KxjXHT\nSm1Ybc7qw4xt2vQstWG1YdY21l0LtWG1YbVhxjZ32zQ/Sv74wDcbamPta921YGxj\n3LRSG1abs/owY5s2PUttzurDjG2Mm1Zqw2pzVh9mbHOHTZcdJX98ghuMtDM2Nm5a\nsbax7lqoDasNqw2ztjHuMm5aqQ2rDTO2MW5aqg+rDasNs7b5ql2XHyX/5RNKX8C7\nsPa17lowtjFuWqkNq81ZfZixTZuepTasNszaxrproTasNqw2zNrmM3d9+lHyxyeW\nvnh3Ymxs3LRibWPdtVAbVhtWG2ZtY9xl3LRSG1YbZmxj3LRSm7P6sNowY5vP2PRl\nR8l3X4TwxbsTa1/rrgVjG+Omldqw2pzVhxnbtOlZasNqw6xtrLsWasNqw2rDrG2u\n2nWLo+R31hfvToyNjZtWrG2suxZqw2rDasOsbYy7jJtWasNqw4xtjJtWasNqc1Yf\nZmyz3nSro+RbxhfvboyNjZtWrG2suxZqw2rDasOsbYy7jJtWasNqw6xtrLsWasNq\nw2rDjG0Wm257lHzL+OLdibWvddeCsY1x00ptWG3O6sOMbdr0LLVhtTkz9jFuWqkN\nqw2rDbO2+d1dL3GU/M764t2JsbFx04q1jXXXQm1YbVhtmLWNcZdx00ptWG2YsY1x\n01J9WG1YbZixza9ueqmj5FvGF+9ujI2Nm1aMbYybVmpzVh9WG2Zs06ZnqQ2rDbO2\nse5aqA2rDavNmbHPz2x62aPkW8YX726MjY2bVqxtrLsWasNqw2rDrG2Mu4ybVmrD\nasOMbYybVmrDanNWH2ZsQ5sUR8m3jC/enVj7WnctGNsYN63UhtXmrD7M2KZNz1Ib\nVhtmbWPdtVAbVhtWG2Zt83aX7ij5nfXFuxNjY+OmFWMb46aV2pzVh9WGGdu06Vlq\nc1YfZmxj3LRSG1abs/owY5tvm7RHye+ML9zdGBsbN61Y21h3LdSG1YbVhlnbGHcZ\nN63UhtWGGdsYNy3Vh9WG1YbZ2uiPkn9lewHvxtrXumvB2Ma4aaU2rDZn9WHGNm16\nltqw2jBrG+uuhdqw2rDaMEObxx0lvzO8eHdnbGzctGJtY921UBtWG1YbZm1j3GXc\ntFIbVhtmbGPctFKbs/qw2rBXbfPYo+Rbr/rivQprX+uuBWMb46aV2rDanNWHGdu0\n6Vlqw2rDrG2suxZqw2rDasNerU1HyTde7cV7RcbGxk0r1jbWXQu1YbVhtWHWNsZd\nxk0rtWG1YcY2xk0rtTmrD6sNe4U2HSXBK7x4r87Y2LhpxdrGumuhNqw2rDbM2sa4\ny7hppTasNszaxrproTasNqw27K5t/vEf/sN/+Oddv7i7qM+1rH2tuxaMbYybVmrD\nanNWH2Zs06ZnqQ2rzZmxj3HTSm1YbVhtzu7U59+Oku/+4EZf3N3U5nrGxsZNK9Y2\n1l0LtWG1YbVh1jbGXcZNK7VhtWHGNsZNS/VhtWG1YXdo8y9HyXf/8wZf4F3V5nrG\nxsZNK8Y2xk0rtTmrD6sNM7Zp07PUhtWGWdtYdy3UhtWG1YZ9ZZvjUfLdX+wFRLW5\nnrGxcdOKtY1110JtWG1YbZi1jXGXcdNKbVhtmLGNcdNKbc7qw2rDPrPNTx8lf/yD\nXrij+lzL2te6a8HYxrhppTasNmf1YcY2bXqW2rDaMGsb666F2rDasNqwz2jzy0fJ\nd/+4Fw/V5nrGxsZNK8Y2xk0rtTmrD6sNM7Zp07PU5qw+zNjGuGmlNqw2Z/VhV7X5\no6Pkjw/SC4dqcz1jY+OmFWsb666F2rDasNowaxvjLuOmldqw2jBrG+uuhdqw2rDa\nsHWbyVHy3QfsxTuqz7Wsfa27FoxtjJtWasNqc1YfZmzTpmepDavNmbGPcdNKbVht\nWG3Yos38KPnug/fiodpcz9jYuGnF2sa6a6E2rDasNszaxrjLuGmlNqw2zNjGuGml\nNmf1YbVhv9vm0qPkj0/SC3dUn2tZ+1p3LRjbGDet1IbV5qw+zNimTc9SG1YbZm1j\n3bVQG1YbVpuzX+nzKUfJd5+wFw/V5nrGxsZNK9Y21l0LtWG1YbVh1jbGXcZNK7Vh\ntWHGNsZNK7VhtTmrD/uZNp9+lHz3yXvxUG2uZ2xs3LRibWPdtVAbVhtWG2ZtY9xl\n3LRSG1YbZm1j3bVQG1YbVhtGbb70KPnji+iFO6rPtax9rbsWjG2Mm1Zqw2pzVh9m\nbNOmZ6kNq82ZsY9x00ptWG1Ybc7e9rnFUfKtXjxWm+sZGxs3rVjbWHct1IbVhtWG\nWdsYdxk3rdSG1YYZ2xg3LdWH1YbVhn1rc7uj5Fu9eKw21zM2Nm5aMbYxblqpzVl9\nWG2YsU2bnqU2rDZnxj7GTSu1YbVhtfnYrY+Sb/UCstpcz9jYuGnF2sa6a6E2rDas\nNszaxrjLuGmlNqw2zNjGuGmlNqw2Z/X5dy9zlPyuF+6sPtey9rXuWjC2MW5aqQ2r\nzVl9mLFNm56lNqw2zNrGumuhNqw27OltXu4o+dbTX7yT2lzP2Ni4acXYxrhppTZn\n9WG1YcY2bXqW2pzVhxnbGDet1OasPuyJbV76KPnWE1+8n1Wb6xkbGzetWNtYdy3U\nhtWG1YZZ2xh3GTet1IbVhhnbGDct1YfVhj2ljeYo+d1TXrjfVZ9rWftady0Y2xg3\nrdSG1easPszYpk3PUhtWmzNjH+Omldqw2jB7G91R8i37i/cnanM9Y2PjphVrG+uu\nhdqw2rDaMGsb4y7jppXasNowYxvjppXanNWHGduoj5LfGV+4pfpcy9rXumvB2Ma4\naaU2rDZn9WHGNm16ltqw2jBrG+uuhdqw2jBTm0ccJf/K9AKu1eZ6xsbGTSvWNtZd\nC7VhtWG1YdY2xl3GTSu1YbVhxjbGTSu1YbU5e+U+jzxKfvfKL9zVanM9Y2PjphVr\nG+uuhdqw2rDaMGsb4y7jppXasNowaxvrroXasNqwV2zz6KPkd6/4wn2m+lzL2te6\na8HYxrhppTasNmf1YcY2bXqW2pzVhxnbGDet1IbV5uxV+nSU/ItXeeG+Qm2uZ2xs\n3LRibWPdtVAbVhtWG2ZtY9xl3LRSG1YbZm1j3bVQG1Ybdvc2HSUP7v7ifbX6XMva\n17prwdjGuGmlNqw2Z/VhxjZtepbasNowaxvrroXasNqwO7bpKPmT7vji3UVtrmds\nbNy0Ym1j3bVQG1YbVhtmbWPcZdy0UhtWG2ZsY9y0Upuz+rC7tOko+Yvu8sLdVX2u\nZe1r3bVgbGPctFIbVpuz+jBjmzY9S21YbZi1jXXXQm1YbdhXt+ko+Qe++sW7s9pc\nz9jYuGnF2Ma4aaU2Z/VhtWHGNm16ltqc1YcZ2xg3rdSG1ebsK/p0lBzp4Wa1uZ6x\nsXHTirWNdddCbVhtWG2YtY1xl3HTSm1YbZi1jXXXQm1YbdhntekoOdZDfVafa1n7\nWnctGNsYN63UhtXmrD7M2KZNz1IbVpszYx/jppXasNqwq9t0lLxQDzarzfWMjY2b\nVqxtrLsWasNqw2rDrG2Mu4ybVmrDasOMbYyblurDasOuaNNR8pP0YLPaXM/Y2Lhp\nxdjGuGmlNmf1YbVhxjZtepbasNowaxvrroXasNqwZZuOkl+gh5vV5nrGxsZNK9Y2\n1l0LtWG1YbVh1jbGXcZNK7VhtWHGNsZNK7VhtTn7kz4dJb9QDzarzfWMjY2bVqxt\nrLsWasNqw2rDrG2Mu4ybVmrDasOsbay7FmrDasN+p01HyZvowWa1uZ6xsXHTirGN\ncdNKbc7qw2rDjG3a9Cy1OasPM7YxblqpDavN2c/26Sh5Mz3YrDbXMzY2blqxtrHu\nWqgNqw2rDbO2Me4yblqpDasNM7YxblqqD6sN+7s2HSVvrAf7rD7Xsva17lowtjFu\nWqkNq81ZfZixTZuepTasNmfGPsZNK7VhtWEfteko+SJ6sFltrmdsbNy0Ym1j3bVQ\nG1YbVhtmbWPcZdy0UhtWG2ZsY9y0Upuz+rDvbTpKvpge6rP6XMva17prwdjGuGml\nNqw2Z/VhxjZtepbasNowaxvrroXasNqwjpIvrAeb1eZ6xsbGTSvGNsZNK7U5qw+r\nDTO2adOz1OasPszYxrhppTZn9Xmvo6REDzarzfWMjY2bVqxtrLsWasNqw2rDrG2M\nu4ybVmrDasOsbay7FmrDatNRUqeH+qw+17L2te5aMLYxblqpDavNWX2YsU2bnqU2\nrDZnxj7GTSu1YU9u01FS7MkP9t+pzfWMjY2bVqxtrLsWasNqw2rDrG2Mu4ybVmrD\nasOMbYyblurDntamo+RDPO3B/hW1uZ6xsXHTirGNcdNKbc7qw2rDjG3a9Cy1YbVh\n1jbWXQu1YU9p01HygZ7ycP+O2lzP2Ni4acXaxrproTasNqw2zNrGuMu4aaU2rDbM\n2Ma4aaU2Z9Y+HSUfzPpQL9TmesbGxk0r1jbWXQu1YbVhtWHWNsZdxk0rtWG1YdY2\n1l0LtWG2Nh0l829sD/ZSba5nbGzctGJsY9y0Upuz+rDaMGObNj1Lbc7qw4xtjJtW\nasMsbTpK5h3Lg32F2lzP2Ni4acXaxrproTasNqw2zNrGuMu4aaU2rDbM2sa6a6E2\n7JXbdJQMeuUH+zPU51rWvtZdC8Y2xk0rtWG1OasPM7Zp07PUhtWGWdtYdy3Uhr1a\nm46S+Smv9mB/ptpcz9jYuGnF2sa6a6E2rDasNszaxrjLuGmlNqw2zNjGuGmlNmev\n0KejZH7JKzzUX6k+17L2te5aMLYxblqpDavNWX2YsU2bnqU2rDbM2sa6a6E27M5t\nOkrmt935wf5qtbmesbFx04qxjXHTSm3O6sNqw4xt2vQstTmrDzO2MW5aqQ27Y5uO\nkpm448N9F7W5nrGxcdOKtY1110JtWG1YbZi1jXGXcdNKbVhtmLWNdddCbdgd2nSU\nzNQdHuo7q8+1rH2tuxaMbYybVmrDanNWH2Zs06ZnqQ2rzZmxj3HTSm3YV7bpKJnL\n9E3PanM9Y2PjphVrG+uuhdqw2rDaMGsb4y7jppXasNowYxvjpqX6sM9u01Eyn6Jv\nelab6xkbGzetGNsYN63U5qw+rDbM2KZNz1IbVpszYx/jppXasM9q01Eyn65vfFab\n6xkbGzetWNtYdy3UhtWG1YZZ2xh3GTet1IbVhhnbGDet1IZd2aajZL5M3/SsNtcz\nNjZuWrG2se5aqA2rDasNs7Yx7jJuWqkNqw2ztrHuWqgNW7fpKJlb6Jue1eZ6xsbG\nTSvGNsZNK7U5qw+rDTO2adOz1OasPszYxrhppTZniz4dJXM7feOz2lzP2Ni4acXa\nxrproTasNqw2zNrGuMu4aaU2rDbM2Ma4aak+7HfbdJTMbfUNf1afa1n7WnctGNsY\nN63UhtXmrD7M2KZNz1IbVpszYx/jppXasF9t01EyL6Fvelab6xkbGzetWNtYdy3U\nhtWG1YZZ2xh3GTet1IbVhhnbGDet1ObsZ/p0lMxL6Zv+rD7Xsva17lowtjFuWqkN\nq81ZfZixTZuepTasNszaxrproTbs1KajZF5W3/Rn9bmWta9114KxjXHTSm1Ybc7q\nw4xt2vQ89WG1YcY2xk0rtTl726ejZBT6pme1uZ6xsXHTirWNdddCbVhtWG2YtY1x\nl3HTSm1YbZi1jXXXQm3YtzYdJaPSN/xZfa5l7WvdtWBsY9y0UhtWm7P6MGObNj1L\nbc7qw4xtjJtWavOxjpLR6pue1eZ6xsbGTSvWNtZdC7VhtWG1YdY2xl3GTSu1YbVh\n1jbWXQu1+X86SuYR+qY/q8+1rH2tuxaMbYybVmrDanNWH2Zs06ZnqQ2rDbO2se5a\neHqbjpJ5nKd/05/U5nrGxsZNK9Y21l0LtWG1YbVh1ja2XbY9a/VhtWHGNsZNK09t\n01Eyj/XUb/qfUZvrGRsbN61Y21h3LdSG1YbVhlnbGHcZN63UhtWGWdtYdy08qU1H\nyeT/e9Y3/a+qzfWMjY2bVoxtjJtWanNWH1YbZmzTpmepzVl9mLGNcdPKE9p0lEz+\n4gnf+L+rNtczNjZuWrG2se5aqA2rDasNs7Yx7jJuWqkNqw2ztrHuWjC26SiZAOM3\n/FJ9rmXta921YGxj3LRSG1abs/owY5s2PUttWG3OjH2Mm1ZMbTpKJj/B9E2/Vpvr\nGRsbN61Y21h3LdSG1YbVhlnbGHcZN63UhtWGGdsYNy29ep+OkskvevVv+ivV5nrG\nxsZNK8Y2xk0rtTmrD6sNM7Zp07PUhtWGWdtYdy28apuOkslvetVv+s9Sn2tZ+1p3\nLRjbGDet1IbV5qw+zNimTc9TH1YbZmxj3LTySm06SiYDr/RN/9lqcz1jY+OmFWsb\n666F2rDasNowaxvjLuOmldqw2jBrG+uuhbu36SiZjN39m/4r1eZ6xsbGTSvGNsZN\nK7U5qw+rDTO2adOz1IbV5szYx7hp5a5tOkomF7nrN/0d1OZ6xsbGTSvWNtZdC7Vh\ntWG1YdY2xl3GTSu1YbVhxjbGTUt36tNRMvkEd/qmv6P6XMva17prwdjGuGmlNqw2\nZ/VhxjZtepbasNqcGfsYN618dZuOkskn++pv+jurzfWMjY2bVqxtrLsWasNqw2rD\nrG1su2x71urDasOMbYybVr6qTUfJ5Iv0hnhWn2tZ+1p3LRjbGDet1IbV5qw+zNim\nTc9SG1YbZm1j3bXwmW06SiY30Bsiq831jI2Nm1aMbYybVmpzVh9WG2Zs06Znqc1Z\nfZixjXHTyme06SiZ3Exviqw21zM2Nm5asbax7lqoDasNqw2ztjHuMm5aqQ2rDTO2\nMW5auqJPR8nkpnpDPKvPtax9rbsWjG2Mm1Zqw2pzVh9mbNOmZ6kNq82ZsY9x08qy\nTUfJ5AX0hshqcz1jY+OmFWsb666F2rDasNowaxvjLuOmldqw2jBjG+OmlUWbjpLJ\ni+lNkdXmesbGxk0rxjbGTSu1OasPqw0ztmnTs9SG1YZZ21h3Lfxum46SyQvrTZHV\n5nrGxsZNK9Y21l0LtWG1YbVh1ja2XbY9a/VhtWHGNsZNK7/SpqNkItAbIqvN9YyN\njZtWrG2suxZqw2rDasOsbYy7jJtWasNqw6xtrLsW/q5NR8lEpjdEVpvrGRsbN60Y\n2xg3rdTmrD6sNszYpk3PUpuz+jBjG+OmFWrTUTKR6g2R1eZ6xsbGTSvWNtZdC7Vh\ntWG1YdY2xl3GTSu1YbVh1jbWXQtv23SUTB6gN8Sz+lzL2te6a8HYxrhppTasNmf1\nYcY2bXqW2rDaMGsb666FjpLJw/SGyGpzPWNj46YVaxvrroXasNqw2jBrG9su2561\n+rDaMGMb46Y/1VEyeajeEM/qcy1rX+uuBWMb46aV2rDanNWHGdu06Vlqw2rDrG2s\nu35VR8kkvSEe1OZ6xsbGTSvGNsZNK7U5qw+rDTO2adOz1OasPszYxrjpV3SUTPLO\n098UT2pzPWNj46YVaxvrroXasNqw2jBrG+Mu46aV2rDaMGsb6y7SUTLJh572Zvir\n6nMta1/rrgVjG+Omldqw2pzVhxnbtOlZasNqc2bsY9z0kY6SSf7WU94Qf0dtrmds\nbNy0Ym1j3bVQG1YbVhtmbWPcZdy0UhtWG2ZsY9z0VkfJJL/E/qb4J2pzPWNj46YV\nYxvjppXanNWH1YYZ27TpWWrDanNm7KPc1FEyye8yvimu1OZ6xsbGTSvWNtZdC7Vh\ntWG1YcY2bXqe+rDaMGMby6aOkkn+mOUN8Qq1uZ6xsXHTirWNdddCbVhtWG2YsY1x\n0zfWXQu1YbVh1javvKujZJKpV35DvFptrmdsbNy0Ymxj3LRSm7P6sNowY5s2PUtt\nzurDjG1ecVNHySSXeMU3xM9Sm+sZGxs3rVjbWHct1IbVhtWGGdsYN31j3bVQG1Yb\nZm3zKrs6Sia53Ku8IX6V+lzL2te6a8HYxrhppTasNmf1YcY2bXqW2rDanBn73HlT\nR8kkn+rOb4hfrTbXMzY2blqxtrHuWqgNqw2rDTO2adPz1IfVhhnb3HFTR8kkX+KO\nb4h3Up9rWftady0Y2xg3rdSG1easPszYpk3PUhtWG2Ztc5ddHSWTfLm7vCHeVX2u\nZe1r3bVgbGPctFIbVpuz+jBjmzY9T31YbZixzVdu6iiZ5FaMb/IrtbmesbFx04q1\njXXXQm1YbVhtmLGNcdM31l0LtWG1YdY2n72ro2SSW7K+ya/U51rWvtZdC8Y2xk0r\ntWG1OasPM7Zp07PU5qw+zNjmszZ1lExye8Y3+ZXaXM/Y2LhpxdrGumuhNqw2rDbM\n2Ma46RvrroXasNowY5urN3WUTPJSjG/0S/W5lrWvddeCsY1x00ptWG3O6sOMbdr0\nLLVhtWHWNutdHSWTvCzrG/1Cba5nbGzctGJtY921UBtWG1YbZmzTpuepD6sNM7ZZ\nbeoomeTlGd/kV2pzPWNj46YVaxvrroXasNqw2jBjG+Omb6y7FmrDasOsbf5kV0fJ\nJCrWN/qF2lzP2Ni4acXYxrhppTZn9WG1YcY2bXqW2pzVhxnb/M6mjpJJtIxv9Cu1\nuZ6xsXHTirWNdddCbVhtWG2YsY1x0zfWXQu1YbVh1jY/s6ujZBI965v8Sn2uZe1r\n3bVgbGPctFIbVpuz+jBjmzY9S21Ybc6MfU6bOkomeRTjm/xKba5nbGzctGJtY921\nUBtWG1YbZmxj3PSNdddCbVhtmLHNR5s6SiZ5JOOb/FJ9rmXta921YGxj3LRSG1ab\ns/owY5s2PUttWG2Ytc33XR0lkzye9Y1+pT7Xsva17lowtjFuWqkNq81ZfZixTZue\npTZn9WG2Nh0lk+QN25v8Um2uZ2xs3LRibWPdtVAbVhtWG2ZsY9z0jXXXQm1YbZil\nTUfJJAGWN/or1OZ6xsbGTSvGNsZNK7U5qw+rDTO2adOz1IbV5uyV+3SUTJK/8cpv\n8lerzfWMjY2bVqxtrLsWasNqw2rDjG2Mm76x7lqoDasNe8U2HSWT5Be84hv9Z6rP\ntax9rbsWjG2Mm1Zqw2pzVh9mbNOmZ6kNq83ZK/TpKJkkv+kV3uS/Sm2uZ2xs3LRi\nbWPdtVAbVhtWG2Zs06bnqQ+rDbtzm46SSfKH7vwm/9Vqcz1jY+OmFWsb666F2rDa\nsNowaxvjLuOmldqw2rA7tukomSRDd3yjv4vaXM/Y2LhpxdjGuGmlNmf1YbVhxjZt\nepbanNWH3aVNR8kkuchd3ujvqDbXMzY2blqxtrHuWqgNqw2rDTO2MW76xrproTas\nNuwr23SUTJKL9QPwrD7Xsva17lowtjFuWqkNq81ZfZixTZuepTasNmef3aejZJJ8\non4Istpcz9jYuGnF2sa6a6E2rDasNszYxrjpG+uuhdqw2rDPatNRMkm+QD8Az+pz\nLWtf664FYxvjppXasNqw2jBrG+Mu46aV2rDanF3Zp6Nkknyxfgie1eda1r7WXQvG\nNsZNK7VhtTmrDzO2adPz1IfVhq3bdJRMkhvpByCrzfWMjY2bVqxtrLsWasNqw2rD\njG2Mm76x7lqoDasNW7XpKJkkN9UPQVab6xkbGzetGNsYN63U5qw+rDbM2KZNz1Kb\ns/qwP2nTUTJJbq4fgKw21zM2Nm5asbax7lqoDasNqw0ztjFu+sa6a6E2rDbsd9p0\nlEySF9IPwbP6XMva17prwdjGuGmlNqw2Z/VhxjZtepbasNqwn23TUTJJXlQ/BFlt\nrmdsbNy0Ym1j3bVQG1YbVhtmbNOm56kPqw07tekomSQvrh+ArDbXMzY2blqxtrHu\nWqgNqw2rDbO2Me4yblqpDasN+6hNR8kkEemHIKvN9YyNjZtWjG2Mm1Zqc1YfVhtm\nbNOm56kPqw373qajZJJI9UOQ1eZ6xsbGTSvWNtZdC7VhtWG1YcY2xk3fWHct1IbV\n5mMdJZNErh+AZ/W5lrWvddeCsY1x00ptWG3O6vMxaxfjLuOmldqw2rzXUTJJHqQf\ngqw21zM2Nm5asbax7lqoDasNqw0ztjFu+sa6a6E2rDYdJZPkkfoBeFafa1n7Wnct\nGNsYN63UhtWG1YZZ2xh3GTet1IY9uU1HySR5uCf/EPwZ9bmWta9114KxjXHTSm1Y\nbc7qw4xt2vQ89WFPatNRMknyw5N+AP6q2lzP2Ni4acXaxrproTasNqw2zNjGuOkb\n666F2rAntOkomST50BN+CP6u2lzP2Ni4acXYxrhppTZn9WG1YcY2bXqW2pxZ+3SU\nTJIcWX8ALtTmesbGxk0r1jbWXQu1YbVhtWHGNsZN31h3LdSG2dp0lEyS/DTbD8G1\n+lzL2te6a8HYxrhppTasNmf1+Zi1i3GXcdNKbZihTUfJJMlvMfwQvEptrmdsbNy0\nYm1j3bVQG1YbVhtmbNOm56kPe9U2HSWTJH/kVX8AfobaXM/Y2LhpxdrGumuhNqw2\nrDbM2sa4y7hppTbs1dp0lEySzLzaD8HPVp9rWftady0Y2xg3rdSG1easPszYpk3P\nUpuzu/fpKJkkucTdfwB+pdpcz9jYuGnF2sa6a6E2rDasNszYxrjpG+uuhdqwu7bp\nKJkkudRdfwDeRX2uZe1r3bVgbGPctFIbVpuz+nzM2sW4y7hppTZnd+rTUTJJ8mnu\n9APwbmpzPWNj46YVaxvrroXasNqw2jBjG+Omb6y7FmrD7tCmo2SS5Evc4YfgndXn\nWta+1l0LxjbGTSu1YbU5q8/HrF2Mu4ybVmrDvqpNR8kkyZfrFwRWm+sZGxs3rVjb\nWHct1IbVhtWGGdu06Xnqwz6zTUfJJMlt9MsBq831jI2Nm1asbay7FmrDasNqw4xt\njJu+se5aqA37jDYdJZMkt9QvCKw21zM2Nm5aMbYxblqpzVl9WG2YsU2bnqU2Z1f1\n6SiZJLm9fklgtbmesbFx04q1jXXXQm1YbVhtmLGNcdM31l0LtWHLNh0lkyQvo18O\nzupzLWtf664FYxvjppXasNqc1edj1i7GXcZNK7VhizYdJZMkL6lfEFhtrmdsbNy0\nYm1j3bVQG1YbVhtmbGPc9I1110Jt2O+26SiZJHlp/XLAanM9Y2PjphVrG+uuhdqw\n2rDaMGsb4y7jppXasF9t01EySaLRLwhn9bmWta9114KxjXHTSm1Ybc7qw4xt2vQs\ntTn7uz4dJZMkSv2CwGpzPWNj46YVaxvrroXasNqw2jBjG+Omb6y7FmrDqE1HySSJ\nWr8cnNXnWta+1l0LxjbGTSu1YbU5q8/HrF2Mu4ybVmpz9rZPR8kkyWP0CwKrzfWM\njY2bVqxtrLsWasNqw2rDjG2Mm76x7lqoDfvWpqNkkuSR+gXhrD7Xsva17lowtjFu\nWqkNq81ZfT5m7WLcZdy0Upt/1VEySfJ4/YLAanM9Y2PjphVjG+Omldqc1YfVhhnb\ntOl56vPvOkomSfL/65cDVpvrGRsbN61Y21h3LdSG1YbVhlnbGHcZN608vU1HySRJ\nPvD0XxBOanM9Y2PjphVjG+Omldqc1YfVhhnbtOlZntqmo2SSJH/jqb8k/IzaXM/Y\n2LhpxdrGumuhNqw2rDbM2Ma46RvrroWntOkomSTJT3rKLwe/qz7Xsva17lowtjFu\nWqkNq81ZfT5m7WLcZdy0Ym/TUTJJkt9g/wXhT9TmesbGxk0r1jbWXQu1YbVhtWHG\nNsZN31h3LRjbdJRMkuQPGH85WKrPtax9rbsWjG2Mm1Zqw2rDasOsbYy7jJtWTG06\nSiZJMmL6BeEK9bmWta9114KxjXHTSm1Ybc7qw4xt2vQ8r9yno2SSJBd45V8Orlab\n6xkbGzetWNtYdy3UhtWG1YYZ2xg3fWPdtfCKbTpKJklysVf8BeGz1OZ6xsbGTSvG\nNsZNK7U5qw+rDTO2adOzvFKbjpJJknySV/oF4bPV5nrGxsZNK9Y21l0LtWG1YbVh\nxjbGTd9Ydy3cvU1HySRJvsDdf0H4avW5lrWvddeCsY1x00ptWG3O6vOx/9uOHSVJ\njiRZEuz7n3opm6Z2pqtDURkZau6AOPMBQPTkC6bVLsVdxU1b7tjGURIA3uyOPwh3\noc15xcbFTVuKbYqbtmhzTZ+ZNrNiG5s+z136OEoCwE3c5efgjrQ5r9i4uGlLtU11\n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"/>\n</g>\n</g>\n<path transform="matrix(1,0,0,-1,0,1592)" d="M 1449.85 898 C 1462.22 918.76 1473.65 940.45 1483.91 962.74 C 1412.48 908.97 1308.88 883.26 1202.92 888.09 C 1072.91 893.99 939.61 945.88 857.33 1037.75 C 830.46 1067.93 804.18 1047.65 826.92 1016.75 C 953.51 865.57 1222.72 797.88 1449.85 898 Z " fill-rule="evenodd"/>\n<clipPath id="cp4">\n<path transform="matrix(1,0,0,-1,0,1592)" d="M 806.53 374.28 C 809.95 381.24 817.5 385.84 821.03 379 C 827.99 366.85 832.35 352.23 831.17 332.3 C 798.17 317.67 757.62 279.94 711.77 226.04 L 806.53 374.28 Z "/>\n</clipPath>\n<g clip-path="url(#cp4)">\n<clipPath id="cp5">\n<path transform="matrix(1,0,0,-1,0,1592)" d="M 711.77 385.84 L 832.35 385.84 L 832.35 226.04 L 711.77 226.04 L 711.77 385.84 Z "/>\n</clipPath>\n<g clip-path="url(#cp5)">\n<image x="711" y="1206" width="122" height="160" xlink:href="data:image/png;base64,\n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\nAVFKPpU6Ma5gAAAAAElFTkSuQmCC"/>\n</g>\n</g>\n<clipPath id="cp6">\n<path transform="matrix(1,0,0,-1,0,1592)" d="M 955.28 385.72 C 1000.19 383.12 1022.94 307.65 1028 191.96 C 1020.93 191.73 1013.98 191.61 1006.08 191.61 C 1002.07 241.49 991.47 283.59 975.55 320.98 C 958.93 356.47 931.12 350.46 911.79 320.86 C 894.34 294.32 881.5 256.59 871.71 211.3 C 884.33 302.46 922.99 383.6 955.28 385.72 Z "/>\n</clipPath>\n<g clip-path="url(#cp6)">\n<clipPath id="cp7">\n<path transform="matrix(1,0,0,-1,0,1592)" d="M 871.71 385.72 L 1028 385.72 L 1028 191.61 L 871.71 191.61 L 871.71 385.72 Z "/>\n</clipPath>\n<g clip-path="url(#cp7)">\n<image x="871" y="1206" width="157" height="195" xlink:href="data:image/png;base64,\n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\nfwGqmQ0EzwHqvQAAAABJRU5ErkJggg=="/>\n</g>\n</g>\n<path transform="matrix(1,0,0,-1,0,1592)" d="M 855.63 1146.71 C 831.41 1146.71 811.84 1164.63 811.84 1186.81 C 811.84 1208.98 831.41 1226.9 855.63 1226.9 C 879.84 1226.9 899.41 1208.98 899.41 1186.81 C 899.41 1164.63 879.84 1146.71 855.63 1146.71 Z " fill-rule="evenodd"/>\n<clipPath id="cp8">\n<path transform="matrix(1,0,0,-1,0,1592)" d="M 1340.89 1236.77 C 1270.2 1236.77 1213.05 1259.75 1213.05 1288.19 C 1213.05 1316.63 1270.2 1339.62 1340.89 1339.62 C 1411.59 1339.62 1468.74 1316.63 1468.74 1288.19 C 1468.74 1259.75 1411.59 1236.77 1340.89 1236.77 Z "/>\n</clipPath>\n<g clip-path="url(#cp8)">\n<clipPath id="cp9">\n<path transform="matrix(1,0,0,-1,0,1592)" d="M 1212.23 1343.18 L 1472.12 1343.18 L 1472.12 1233.27 L 1212.23 1233.27 L 1212.23 1343.18 Z "/>\n</clipPath>\n<g clip-path="url(#cp9)">\n<image x="1213" y="252" width="256" height="104" xlink:href="data:image/png;base64,\n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"/>\n</g>\n</g>\n<path transform="matrix(1,0,0,-1,0,1592)" d="M 867.82 560.37 C 870.3 570.63 872.77 580.89 875.25 591.15 C 944.08 584.07 1005.02 584.43 1050.16 599.76 C 1050.16 589.97 1050.16 580.18 1050.16 570.39 C 1010.68 544.45 942.2 549.29 867.82 560.37 Z " fill="#94261e" fill-rule="evenodd"/>\n<clipPath id="cp10">\n<path transform="matrix(1,0,0,-1,0,1592)" d="M 311.03 963.92 C 298.18 971.71 285.21 979.37 272.25 987.04 C 305.13 822.88 251.74 755.66 131.87 706.01 C 69.52 681.95 57.03 689.27 32.16 706.13 C 9.64 722.17 .33 754.48 16.6 803.54 C 48.54 898.83 99.93 935.03 123.5 1075.13 C 128.22 1115.7 168.76 1143.29 207.3 1124.42 C 242.66 1105.67 277.91 1087.04 313.27 1068.29 C 323.4 1044.23 330.59 1019.11 333.07 992.22 C 335.42 961.09 326.23 955.9 311.03 963.92 Z "/>\n</clipPath>\n<g clip-path="url(#cp10)">\n<clipPath id="cp11">\n<path transform="matrix(1,0,0,-1,0,1592)" d="M .33 1143.29 L 335.42 1143.29 L 335.42 681.95 L .33 681.95 L .33 1143.29 Z "/>\n</clipPath>\n<g clip-path="url(#cp11)">\n<image x="0" y="448" width="336" height="463" xlink:href="data:image/png;base64,\n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\n6XOu/x+39ekEtIfPhwAAAABJRU5ErkJggg=="/>\n</g>\n</g>\n<clipPath id="cp12">\n<path transform="matrix(1,0,0,-1,0,1592)" d="M 181.61 1059.33 C 211.9 1035.27 242.07 1011.09 272.25 987.04 C 305.13 822.88 251.74 755.66 131.87 706.01 C 96.16 692.21 76.83 688.79 62.09 691.51 C 122.68 785.26 157.33 915.1 181.61 1059.33 Z "/>\n</clipPath>\n<g clip-path="url(#cp12)">\n<clipPath id="cp13">\n<path transform="matrix(1,0,0,-1,0,1592)" d="M 62.09 1059.33 L 305.13 1059.33 L 305.13 688.79 L 62.09 688.79 L 62.09 1059.33 Z "/>\n</clipPath>\n<g clip-path="url(#cp13)">\n<image x="62" y="532" width="244" height="372" xlink:href="data:image/png;base64,\n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"/>\n</g>\n</g>\n</g>\n</svg>\n';

// packages/ui-web/src/fund/bankLogoRegistry.ts
var BANK_LOGO_SVG = {
  alipay: alipay_default,
  wechat: wechat_default,
  icbc: icbc_default,
  ccb: ccb_default,
  abc: abc_default,
  boc: boc_default,
  cmb: cmb_default,
  bocom: bocom_default,
  psbc: psbc_default,
  citic_bank: citic_bank_default,
  zhongan_bank: zhongan_bank_default,
  bob: bob_default,
  hsbc: hsbc_default,
  henan_rcc: henan_rcc_default,
  huabei: huabei_default,
  jd_baitiao: jd_baitiao_default
};
function getBuiltInBankLogoSvg(key) {
  return BANK_LOGO_SVG[key] ?? null;
}

// packages/ui-web/src/fund/fundLogo.ts
function normalizeSvgContent(svgText, size) {
  let text = svgText.trim();
  text = text.replace(/<\?xml[^>]*\?>/g, "").trim();
  text = text.replace(/<!DOCTYPE[^>]*>/gi, "").trim();
  const uniqueSuffix = `-ul${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
  const idRegex = /\bid\s*=\s*(["'])([^"']+)\1/g;
  const ids = /* @__PURE__ */ new Set();
  let m;
  while (m = idRegex.exec(text)) {
    ids.add(m[2]);
  }
  if (ids.size > 0) {
    text = text.replace(idRegex, (_m, q, id) => `id=${q}${id}${uniqueSuffix}${q}`);
    text = text.replace(/url\(\s*(['"]?)#([^)'"\s]+)\1\s*\)/g, (_m, q, id) => {
      return ids.has(id) ? `url(${q}#${id}${uniqueSuffix}${q})` : _m;
    });
    text = text.replace(/(\b(?:xlink:)?href\s*=\s*)(["'])#([^"']+)\2/g, (_m, pre, q, id) => {
      return ids.has(id) ? `${pre}${q}#${id}${uniqueSuffix}${q}` : _m;
    });
  }
  const classNames = /* @__PURE__ */ new Set();
  const classAttrRegex = /\bclass\s*=\s*(["'])([^"']+)\1/g;
  let cm;
  while (cm = classAttrRegex.exec(text)) {
    cm[2].split(/\s+/).forEach((c) => {
      if (c) classNames.add(c);
    });
  }
  if (classNames.size > 0) {
    text = text.replace(classAttrRegex, (_m, q, val) => {
      const next = val.split(/\s+/).filter(Boolean).map((c) => `${c}${uniqueSuffix}`).join(" ");
      return `class=${q}${next}${q}`;
    });
    text = text.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (_full, css) => {
      let next = css;
      classNames.forEach((cn) => {
        const esc = cn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp(`\\.${esc}(?![\\w-])`, "g");
        next = next.replace(re, `.${cn}${uniqueSuffix}`);
      });
      return `<style>${next}</style>`;
    });
  }
  text = text.replace(/<svg\b([^>]*)>/i, (_match, attrs) => {
    let a = attrs;
    const wMatch = a.match(/\swidth\s*=\s*"([^"]*)"/i);
    const hMatch = a.match(/\sheight\s*=\s*"([^"]*)"/i);
    const hasViewBox = /\sviewBox\s*=\s*"[^"]*"/i.test(a);
    a = a.replace(/\swidth\s*=\s*"[^"]*"/gi, "");
    a = a.replace(/\sheight\s*=\s*"[^"]*"/gi, "");
    a = a.replace(/\sstyle\s*=\s*"[^"]*"/gi, "");
    if (!hasViewBox) {
      const w = wMatch ? parseFloat(wMatch[1]) : NaN;
      const h = hMatch ? parseFloat(hMatch[1]) : NaN;
      if (isFinite(w) && isFinite(h) && w > 0 && h > 0) {
        a += ` viewBox="0 0 ${w} ${h}"`;
      }
    }
    return `<svg${a} width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet" style="max-width:100%;max-height:100%;display:block;">`;
  });
  return text;
}
function getPluginAssetDir(plugin) {
  const dir = plugin.manifest?.dir;
  if (dir) {
    return dir;
  }
  return PLUGIN_DIR;
}
var BankLogoLoader = class {
  constructor(plugin) {
    this.plugin = plugin;
  }
  plugin;
  cache = /* @__PURE__ */ new Map();
  inflight = /* @__PURE__ */ new Map();
  has(key) {
    return this.cache.has(key) || getBuiltInBankLogoSvg(key) != null;
  }
  get(key) {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    const builtIn = getBuiltInBankLogoSvg(key);
    if (builtIn) {
      this.cache.set(key, builtIn);
      return builtIn;
    }
    return void 0;
  }
  /** Vault-relative path to the plugin's logo asset folder. */
  assetDir() {
    return getPluginAssetDir(this.plugin);
  }
  /** Host-agnostic resource URL for a specific logo file (default ext = svg). */
  resourceUrl(key, ext = "svg") {
    const path = `${this.assetDir()}/assets/logo/${key}.${ext}`;
    return host().resources.resolveUrl(path);
  }
  /** Async load the SVG text; resolves to null when the file doesn't exist. */
  async loadSvg(key) {
    if (this.cache.has(key)) {
      return this.cache.get(key) ?? null;
    }
    const builtIn = getBuiltInBankLogoSvg(key);
    if (builtIn) {
      this.cache.set(key, builtIn);
      return builtIn;
    }
    const existing = this.inflight.get(key);
    if (existing) {
      return existing;
    }
    const path = `${this.assetDir()}/assets/logo/${key}.svg`;
    const promise = (async () => {
      try {
        const store = host().store;
        const exists = await store.exists(path);
        if (!exists) {
          this.cache.set(key, null);
          return null;
        }
        const raw = await store.read(path);
        this.cache.set(key, raw);
        return raw;
      } catch {
        this.cache.set(key, null);
        return null;
      } finally {
        this.inflight.delete(key);
      }
    })();
    this.inflight.set(key, promise);
    return promise;
  }
  /** Check whether a `<key>.png` fallback exists on disk. */
  async pngExists(key) {
    const pngPath = `${this.assetDir()}/assets/logo/${key}.png`;
    try {
      return await host().store.exists(pngPath);
    } catch {
      return false;
    }
  }
};
function getFundLogoPlaceholder(fund) {
  if (fund.bank) {
    return fund.bank.charAt(0);
  }
  const category = getFundCategory(fund);
  const map = {
    cash: "\u{1F4B5}",
    virtual_account: "\u25C9",
    investment: "\u{1F4C8}",
    claim: "\u21A9",
    liability: "\u26A0",
    social_security: "\u{1F6E1}",
    custom_asset: "\u2605"
  };
  return map[category.id] ?? "\u2022";
}
function renderFundCategoryIconInto(container, categoryId, size) {
  if (categoryId === "cash") {
    return drawCashIcon(container, size);
  }
  return false;
}
function drawCashIcon(container, size) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 64 64");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "#16a34a");
  svg.setAttribute("stroke-width", "3");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  const note = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  note.setAttribute("x", "6");
  note.setAttribute("y", "16");
  note.setAttribute("width", "52");
  note.setAttribute("height", "32");
  note.setAttribute("rx", "3");
  note.setAttribute("fill", "#d1fae5");
  svg.appendChild(note);
  const centerHole = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  centerHole.setAttribute("cx", "32");
  centerHole.setAttribute("cy", "32");
  centerHole.setAttribute("r", "7");
  centerHole.setAttribute("fill", "#ffffff");
  svg.appendChild(centerHole);
  const dollar = document.createElementNS("http://www.w3.org/2000/svg", "text");
  dollar.setAttribute("x", "32");
  dollar.setAttribute("y", "35");
  dollar.setAttribute("text-anchor", "middle");
  dollar.setAttribute("font-family", "Arial, sans-serif");
  dollar.setAttribute("font-size", "9");
  dollar.setAttribute("font-weight", "900");
  dollar.setAttribute("fill", "#16a34a");
  dollar.setAttribute("stroke", "none");
  dollar.textContent = "$";
  svg.appendChild(dollar);
  [14, 50].forEach((cx) => {
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", String(cx));
    dot.setAttribute("cy", "32");
    dot.setAttribute("r", "2");
    dot.setAttribute("fill", "#16a34a");
    dot.setAttribute("stroke", "none");
    svg.appendChild(dot);
  });
  container.appendChild(svg);
  return true;
}
function getFundLogoKey(fund) {
  const bankKeyMap = {
    "\u5DE5\u5546\u94F6\u884C": "icbc",
    "\u5EFA\u8BBE\u94F6\u884C": "ccb",
    "\u519C\u4E1A\u94F6\u884C": "abc",
    "\u4E2D\u56FD\u94F6\u884C": "boc",
    "\u62DB\u5546\u94F6\u884C": "cmb",
    "\u4EA4\u901A\u94F6\u884C": "bocom",
    "\u90AE\u653F\u94F6\u884C": "psbc",
    "\u90AE\u50A8\u94F6\u884C": "psbc",
    "\u4E2D\u4FE1\u94F6\u884C": "citic_bank",
    "\u4F17\u5B89\u94F6\u884C": "zhongan_bank",
    "\u5317\u4EAC\u94F6\u884C": "bob",
    "\u6C47\u4E30\u94F6\u884C": "hsbc",
    "\u6CB3\u5357\u519C\u6751\u4FE1\u7528\u793E": "henan_rcc",
    "\u652F\u4ED8\u5B9D": "alipay",
    "\u5FAE\u4FE1": "wechat",
    "\u8682\u8681\u82B1\u5457": "huabei",
    "\u82B1\u5457": "huabei",
    "\u4EAC\u4E1C\u767D\u6761": "jd_baitiao",
    "\u767D\u6761": "jd_baitiao",
    "\u80A1\u7968": "stock",
    "\u57FA\u91D1": "fund",
    "\u5176\u4ED6\u6295\u8D44": "other_investment"
  };
  if (fund.bank) {
    if (bankKeyMap[fund.bank]) return bankKeyMap[fund.bank];
    for (const zh of Object.keys(bankKeyMap)) {
      if (fund.bank.includes(zh)) return bankKeyMap[zh];
    }
  }
  const source = `${fund.name ?? ""}`;
  for (const zh of Object.keys(bankKeyMap)) {
    if (source.includes(zh)) return bankKeyMap[zh];
  }
  return null;
}
function renderFundLogoInto(loader, container, fund, size) {
  container.empty();
  if (fund.icon) {
    const src = getIconPath(fund.icon);
    if (src) {
      const img = container.createEl("img");
      img.src = src;
      img.alt = fund.name || "icon";
      img.style.width = `${size}px`;
      img.style.height = `${size}px`;
      img.style.objectFit = "contain";
      img.style.display = "block";
      return;
    }
  }
  const key = getFundLogoKey(fund);
  const fallback = () => {
    container.empty();
    if (renderFundCategoryIconInto(container, getFundCategory(fund).id, size)) {
      return;
    }
    container.innerText = getFundLogoPlaceholder(fund);
  };
  if (!key) {
    fallback();
    return;
  }
  const cached = loader.get(key);
  if (cached) {
    container.innerHTML = normalizeSvgContent(cached, size);
    return;
  }
  if (cached === null) {
    renderLogoFallbackImage(loader, container, key, size, fallback);
    return;
  }
  fallback();
  loader.loadSvg(key).then((svg) => {
    if (!container.isConnected) {
      return;
    }
    if (svg) {
      container.empty();
      container.innerHTML = normalizeSvgContent(svg, size);
    } else {
      renderLogoFallbackImage(loader, container, key, size, fallback);
    }
  });
}
function renderLogoFallbackImage(loader, container, key, size, fallback) {
  loader.pngExists(key).then((ok) => {
    if (!container.isConnected) {
      return;
    }
    if (!ok) {
      fallback();
      return;
    }
    container.empty();
    const img = container.createEl("img");
    img.src = loader.resourceUrl(key, "png");
    img.alt = key;
    img.style.width = `${size}px`;
    img.style.height = `${size}px`;
    img.style.objectFit = "contain";
    img.style.display = "block";
    img.onerror = () => fallback();
  });
}
function getCardTail(cardNumber) {
  if (!cardNumber) {
    return "";
  }
  const digits = cardNumber.replace(/\D/g, "");
  if (!digits) {
    return cardNumber.trim();
  }
  return digits.slice(-4);
}
function getFundPrimaryLabel(fund) {
  if (fund.bank) {
    const tail = getCardTail(fund.card_number);
    return tail ? `${fund.bank}\uFF08${tail}\uFF09` : fund.bank;
  }
  return fund.name || getFundCategory(fund).name;
}
function getFundSecondaryLabel(fund) {
  if (fund.category === "social_security" && fund.city && fund.city.trim()) {
    const city = fund.city.trim();
    const remark = fund.remark?.trim();
    return remark ? `${city}\uFF08${remark}\uFF09` : city;
  }
  if (fund.remark && fund.remark.trim()) {
    return fund.remark.trim();
  }
  if (fund.bank) {
    const category = getFundCategory(fund);
    const defaultName = `${fund.bank}${category.id === "debit_card" ? "\u50A8\u84C4\u5361" : "\u4FE1\u7528\u5361"}`;
    if (fund.name && fund.name !== defaultName && fund.name !== fund.bank) {
      return fund.name;
    }
  }
  return "";
}

// packages/ui-web/src/components/idleWatermark.ts
var ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "wheel",
  "scroll",
  "touchstart",
  "touchmove"
];
var IdleWatermarkController = class {
  constructor(ctx) {
    this.ctx = ctx;
  }
  ctx;
  timer = null;
  overlayEl = null;
  hostActivityHandler = null;
  documentActivityHandler = null;
  visibilityHandler = null;
  /** (Re)arm the watermark according to current plugin settings. */
  setup() {
    this.teardown();
    const settings = this.ctx.plugin.settings;
    if (!settings.idleWatermarkEnabled) {
      return;
    }
    this.ctx.host.style.position = "relative";
    const timeoutMs = Math.max(5, settings.idleWatermarkTimeoutSec) * 1e3;
    const scheduleIdle = () => {
      if (this.timer !== null) {
        window.clearTimeout(this.timer);
      }
      this.timer = window.setTimeout(() => {
        this.show();
      }, timeoutMs);
    };
    const handleActivity = () => {
      if (this.overlayEl) {
        return;
      }
      scheduleIdle();
    };
    this.hostActivityHandler = handleActivity;
    ACTIVITY_EVENTS.forEach((evt) => {
      this.ctx.host.addEventListener(evt, handleActivity, { passive: true });
    });
    this.documentActivityHandler = handleActivity;
    ACTIVITY_EVENTS.forEach((evt) => {
      document.addEventListener(evt, handleActivity, { passive: true });
    });
    this.visibilityHandler = () => {
      if (document.hidden) {
        this.show();
      } else if (!this.overlayEl) {
        scheduleIdle();
      }
    };
    document.addEventListener("visibilitychange", this.visibilityHandler);
    scheduleIdle();
  }
  /** Release timers, listeners and any currently-shown overlay. */
  teardown() {
    if (this.timer !== null) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.hostActivityHandler) {
      const host2 = this.ctx.host;
      const handler = this.hostActivityHandler;
      ACTIVITY_EVENTS.forEach((evt) => {
        host2.removeEventListener(evt, handler);
      });
      this.hostActivityHandler = null;
    }
    if (this.documentActivityHandler) {
      const handler = this.documentActivityHandler;
      ACTIVITY_EVENTS.forEach((evt) => {
        document.removeEventListener(evt, handler);
      });
      this.documentActivityHandler = null;
    }
    if (this.visibilityHandler) {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
      this.visibilityHandler = null;
    }
    this.hide();
  }
  /** Obsidian 的所有 Modal 都会在 body 下挂 .modal-container 节点。 */
  isAnyModalOpen() {
    return !!document.body.querySelector(".modal-container");
  }
  show() {
    if (this.overlayEl) {
      return;
    }
    if (this.isAnyModalOpen()) {
      if (this.timer !== null) {
        window.clearTimeout(this.timer);
      }
      const timeoutMs = Math.max(5, this.ctx.plugin.settings.idleWatermarkTimeoutSec) * 1e3;
      this.timer = window.setTimeout(() => {
        this.show();
      }, timeoutMs);
      return;
    }
    const host2 = this.ctx.host;
    const overlay = host2.createDiv();
    overlay.style.position = "absolute";
    overlay.style.inset = "0";
    overlay.style.zIndex = "50";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.background = "var(--background-primary)";
    overlay.style.cursor = "pointer";
    overlay.style.userSelect = "none";
    overlay.addEventListener("click", () => {
      this.hide();
      if (this.timer !== null) {
        window.clearTimeout(this.timer);
      }
      const timeoutMs = Math.max(5, this.ctx.plugin.settings.idleWatermarkTimeoutSec) * 1e3;
      this.timer = window.setTimeout(() => {
        this.show();
      }, timeoutMs);
    });
    overlay.addEventListener("wheel", (e) => e.stopPropagation(), { passive: true });
    overlay.addEventListener("mousemove", (e) => e.stopPropagation());
    this.renderWatermarkSymbol(overlay);
    this.overlayEl = overlay;
  }
  renderWatermarkSymbol(overlay) {
    const page = this.ctx.getCurrentPage();
    if (page === "home") {
      const wm = overlay.createDiv({ text: "ObsiWealth" });
      wm.style.fontSize = "min(9vw, 14vh)";
      wm.style.fontWeight = "950";
      wm.style.color = "var(--text-muted)";
      wm.style.opacity = "0.14";
      wm.style.lineHeight = "1";
      wm.style.letterSpacing = "-0.03em";
      wm.style.pointerEvents = "none";
      wm.style.fontFamily = "Georgia, 'Times New Roman', serif";
      wm.style.whiteSpace = "nowrap";
      wm.style.maxWidth = "92vw";
      return;
    }
    if (page === "wishlist") {
      this.renderWatermarkSvg(overlay, "heart");
      return;
    }
    if (page === "assets") {
      this.renderWatermarkSvg(overlay, "assets");
      return;
    }
    if (page === "assetStats") {
      this.renderWatermarkSvg(overlay, "chart");
      return;
    }
    this.renderWatermarkSvg(overlay, "funds");
  }
  renderWatermarkSvg(overlay, iconName) {
    const wrap = overlay.createDiv();
    wrap.style.width = "min(60vw, 60vh)";
    wrap.style.height = "min(60vw, 60vh)";
    wrap.style.opacity = "0.16";
    wrap.style.color = "var(--text-muted)";
    wrap.style.pointerEvents = "none";
    wrap.style.display = "flex";
    wrap.style.alignItems = "center";
    wrap.style.justifyContent = "center";
    const svg = this.ctx.createNavIcon(iconName, 600);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("stroke-width", "1.2");
    wrap.appendChild(svg);
  }
  hide() {
    if (this.overlayEl) {
      this.overlayEl.remove();
      this.overlayEl = null;
    }
  }
};

// packages/ui-web/src/lock/passwordGate.ts
function renderPasswordGate(ctx, el) {
  const tr = ctx.tr;
  const lock = el.createDiv();
  lock.style.flex = "1 1 auto";
  lock.style.display = "flex";
  lock.style.flexDirection = "column";
  lock.style.alignItems = "center";
  lock.style.justifyContent = "center";
  lock.style.gap = "12px";
  lock.style.padding = "24px";
  const title = lock.createDiv({ text: tr("passwordSecurity") });
  title.style.fontSize = "24px";
  title.style.fontWeight = "950";
  const desc = lock.createDiv({ text: tr("passwordPrompt") });
  desc.style.fontSize = "14px";
  desc.style.fontWeight = "800";
  desc.style.color = "var(--text-muted)";
  const input = lock.createEl("input");
  input.type = "password";
  input.placeholder = tr("password");
  input.style.width = "min(320px, 100%)";
  input.style.padding = "10px 12px";
  input.style.borderRadius = "12px";
  input.style.border = "1px solid var(--background-modifier-border)";
  const error = lock.createDiv();
  error.style.minHeight = "18px";
  error.style.fontSize = "13px";
  error.style.fontWeight = "800";
  error.style.color = "var(--text-error)";
  const button = lock.createEl("button", { text: tr("enter") });
  button.style.padding = "8px 18px";
  button.style.borderRadius = "999px";
  button.style.cursor = "pointer";
  const submit = () => {
    if (input.value === ctx.plugin.settings.password) {
      ctx.onUnlock();
      return;
    }
    error.innerText = tr("wrongPassword");
  };
  button.onclick = submit;
  input.onkeydown = (event) => {
    if (event.key === "Enter") {
      submit();
    }
  };
  input.focus();
}

// packages/ui-web/src/view/responsiveZoom.ts
var ResponsiveZoomController = class {
  constructor(host2, target, getBaseline, minZoom = 0.4) {
    this.host = host2;
    this.target = target;
    this.getBaseline = getBaseline;
    this.minZoom = minZoom;
  }
  host;
  target;
  getBaseline;
  minZoom;
  observer;
  scheduled = false;
  setup() {
    this.teardown();
    this.apply();
    this.observer = new ResizeObserver(() => this.schedule());
    this.observer.observe(this.host);
  }
  teardown() {
    this.observer?.disconnect();
    this.observer = void 0;
    const style = this.target.style;
    style.zoom = "";
    this.target.style.minWidth = "";
  }
  /** rAF-coalesced to avoid thrashing under rapid resize events. */
  schedule() {
    if (this.scheduled) return;
    this.scheduled = true;
    requestAnimationFrame(() => {
      this.scheduled = false;
      this.apply();
    });
  }
  apply() {
    const hostWidth = this.host.clientWidth;
    if (hostWidth <= 0) return;
    const baseline = Math.max(1, Math.round(this.getBaseline()));
    const style = this.target.style;
    const nextMinWidth = `${baseline}px`;
    if (this.target.style.minWidth !== nextMinWidth) {
      this.target.style.minWidth = nextMinWidth;
    }
    let zoom = hostWidth / baseline;
    zoom = Math.max(this.minZoom, Math.min(1, zoom));
    const rounded = Math.round(zoom * 1e3) / 1e3;
    const nextZoom = String(rounded);
    if (style.zoom !== nextZoom) {
      style.zoom = nextZoom;
    }
  }
};

// packages/ui-web/src/pages/homePage.ts
function renderHomePage(ctx, el) {
  const assets = ctx.plugin.assets;
  const assetTotal = ctx.getVisibleAssetTotal(assets);
  const fundTotal = ctx.getFundTotal();
  const metrics = el.createDiv();
  metrics.style.display = "grid";
  metrics.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
  metrics.style.gap = "16px";
  metrics.style.marginBottom = "18px";
  renderHomeMetric(metrics, "\u8D44\u91D1", ctx.displayCurrency(fundTotal));
  renderHomeMetric(metrics, "\u8D44\u4EA7", ctx.displayCurrency(assetTotal));
}
function renderHomeMetric(parent, label, value) {
  const item = parent.createDiv();
  item.style.padding = "28px 22px";
  item.style.borderRadius = "22px";
  item.style.background = "var(--background-primary)";
  item.style.border = "1px solid var(--background-modifier-border)";
  item.style.boxShadow = "0 10px 24px rgba(0,0,0,0.08)";
  item.style.display = "flex";
  item.style.flexDirection = "column";
  item.style.alignItems = "center";
  item.style.justifyContent = "center";
  item.style.textAlign = "center";
  item.style.gap = "12px";
  const labelEl = item.createDiv({ text: label });
  labelEl.style.fontSize = "24px";
  labelEl.style.fontWeight = "950";
  labelEl.style.letterSpacing = "0.04em";
  labelEl.style.color = "var(--text-muted)";
  const valueEl = item.createDiv();
  valueEl.style.fontSize = "38px";
  valueEl.style.fontWeight = "950";
  valueEl.style.lineHeight = "1.05";
  valueEl.style.color = "var(--text-normal)";
  valueEl.style.display = "flex";
  valueEl.style.justifyContent = "center";
  valueEl.style.width = "100%";
  const slotWrap = valueEl.createDiv();
  renderSlotNumber(slotWrap, value);
}

// packages/ui-web/src/modals/wishlistModal.ts
var import_obsidian4 = require("obsidian");

// packages/core/src/i18n/index.ts
var translations = {
  "zh-CN": {
    appTitle: "ObsiWealth",
    home: "\u4E3B\u9875",
    wishlist: "\u5FC3\u613F",
    stats: "\u6570\u636E\u7EDF\u8BA1",
    settings: "\u8BBE\u7F6E",
    overview: "\u8D44\u4EA7\u603B\u89C8",
    totalAssets: "\u603B\u8D44\u4EA7",
    dailyCost: "\u65E5\u5747\u6210\u672C",
    perDay: "\u5929",
    all: "\u5168\u90E8",
    active: "\u670D\u5F79\u4E2D",
    sold: "\u5DF2\u5356\u51FA",
    retired: "\u5DF2\u9000\u5F79",
    sort: "sort",
    bulkEdit: "\u6279\u91CF\u4FEE\u6539",
    bulkEditStatus: "\u6279\u91CF\u4FEE\u6539\u72B6\u6001",
    targetStatus: "\u76EE\u6807\u72B6\u6001",
    apply: "\u5E94\u7528",
    cancel: "\u53D6\u6D88",
    selectedAssets: "\u5DF2\u9009\u8D44\u4EA7",
    noAssetsToEdit: "\u6CA1\u6709\u53EF\u4FEE\u6539\u7684\u8D44\u4EA7",
    updated: "\u5DF2\u66F4\u65B0",
    passwordSecurity: "\u5BC6\u7801\u4E0E\u5B89\u5168",
    passwordPrompt: "\u8BF7\u8F93\u5165\u5BC6\u7801\u8FDB\u5165 ObsiWealth \u9875\u9762",
    password: "\u5BC6\u7801",
    enter: "\u8FDB\u5165",
    wrongPassword: "\u5BC6\u7801\u4E0D\u6B63\u786E",
    wishlistTotal: "\u5FC3\u613F\u603B\u503C",
    noWishlistData: "\u5F53\u524D\u8FD8\u6CA1\u6709\u5FC3\u613F\u6570\u636E",
    assetTotalValue: "\u8D44\u4EA7\u603B\u503C",
    assetValueTrend: "\u8D44\u4EA7\u4EF7\u503C\u8D8B\u52BF",
    dailyCostTrend: "\u65E5\u5747\u6210\u672C\u8D8B\u52BF",
    categoryDistribution: "\u7C7B\u578B\u5206\u5E03",
    averageUsageByCategory: "\u5404\u7C7B\u578B\u5E73\u5747\u670D\u5F79\u65F6\u957F",
    totalCount: "\u603B\u4EF6\u6570",
    emptyChart: "\u6682\u65E0\u8DB3\u591F\u6570\u636E\u7ED8\u5236\u56FE\u8868",
    assetInfo: "\u8D44\u4EA7\u4FE1\u606F",
    unitPrice: "\u5355\u4EF7",
    buyDate: "\u8D2D\u4E70\u65E5\u671F",
    category: "\u7C7B\u522B",
    statusInfo: "\u72B6\u6001\u4FE1\u606F",
    status: "\u72B6\u6001",
    date: "\u65E5\u671F",
    soldDate: "\u5356\u51FA\u65E5\u671F",
    soldPrice: "\u5356\u51FA\u4EF7\u683C",
    notFilled: "\u672A\u586B\u5199",
    used: "\u5DF2\u4F7F\u7528",
    years: "\u5E74",
    months: "\u6708",
    days: "\u5929",
    deleteConfirm: "\u5220\u9664 {name} ?",
    edit: "\u4FEE\u6539",
    delete: "\u5220\u9664",
    addAsset: "\u65B0\u589E\u8D44\u4EA7",
    editAsset: "\u7F16\u8F91\u8D44\u4EA7",
    icon: "\u56FE\u6807",
    chooseIcon: "\u9009\u62E9\u56FE\u6807",
    current: "\u5F53\u524D",
    name: "\u540D\u79F0",
    price: "\u4EF7\u683C",
    retiredDate: "\u9000\u5F79\u65E5\u671F",
    save: "\u4FDD\u5B58",
    inputAssetName: "\u8BF7\u8F93\u5165\u8D44\u4EA7\u540D\u79F0",
    selectSoldDate: "\u8BF7\u9009\u62E9\u5356\u51FA\u65E5\u671F",
    inputSoldPrice: "\u8BF7\u8F93\u5165\u5356\u51FA\u4EF7\u683C",
    soldDateBeforeBuyDate: "\u5356\u51FA\u65E5\u671F\u4E0D\u80FD\u65E9\u4E8E\u8D2D\u4E70\u65E5\u671F",
    selectRetiredDate: "\u8BF7\u9009\u62E9\u9000\u5F79\u65E5\u671F",
    retiredDateBeforeBuyDate: "\u9000\u5F79\u65E5\u671F\u4E0D\u80FD\u65E9\u4E8E\u8D2D\u4E70\u65E5\u671F",
    assetUpdated: "\u5DF2\u66F4\u65B0\u8D44\u4EA7",
    assetAdded: "\u5DF2\u6DFB\u52A0\u8D44\u4EA7",
    tech: "\u6570\u7801",
    clothes: "\u670D\u9970",
    homeCategory: "\u5BB6\u5C45",
    other: "\u5176\u4ED6",
    netAssetChart: "\u51C0\u8D44\u91D1",
    fundAssetChart: "\u8D44\u91D1",
    fundLiabilityChart: "\u8D1F\u503A"
  },
  "en-US": {
    appTitle: "ObsiWealth",
    home: "Home",
    wishlist: "Wishlist",
    stats: "Stats",
    settings: "Settings",
    overview: "Asset Overview",
    totalAssets: "Total Assets",
    dailyCost: "Daily Cost",
    perDay: "day",
    all: "All",
    active: "Active",
    sold: "Sold",
    retired: "Retired",
    sort: "sort",
    bulkEdit: "Bulk Edit",
    bulkEditStatus: "Bulk Edit Status",
    targetStatus: "Target Status",
    apply: "Apply",
    cancel: "Cancel",
    selectedAssets: "Selected assets",
    noAssetsToEdit: "No assets to edit",
    updated: "Updated",
    passwordSecurity: "Password & Security",
    passwordPrompt: "Enter the password to open ObsiWealth",
    password: "Password",
    enter: "Enter",
    wrongPassword: "Incorrect password",
    wishlistTotal: "Wishlist Total",
    noWishlistData: "No wishlist data yet",
    assetTotalValue: "Asset Total Value",
    assetValueTrend: "Asset Value Trend",
    dailyCostTrend: "Daily Cost Trend",
    categoryDistribution: "Category Distribution",
    averageUsageByCategory: "Average Service Time by Category",
    totalCount: "Total Count",
    emptyChart: "Not enough data to draw the chart",
    assetInfo: "Asset Info",
    unitPrice: "Unit Price",
    buyDate: "Purchase Date",
    category: "Category",
    statusInfo: "Status Info",
    status: "Status",
    date: "Date",
    soldDate: "Sold Date",
    soldPrice: "Sold Price",
    notFilled: "Not filled",
    used: "Used",
    years: "y",
    months: "m",
    days: "d",
    deleteConfirm: "Delete {name}?",
    edit: "Edit",
    delete: "Delete",
    addAsset: "Add Asset",
    editAsset: "Edit Asset",
    icon: "Icon",
    chooseIcon: "Choose Icon",
    current: "Current",
    name: "Name",
    price: "Price",
    retiredDate: "Retired Date",
    save: "Save",
    inputAssetName: "Please enter an asset name",
    selectSoldDate: "Please select a sold date",
    inputSoldPrice: "Please enter a sold price",
    soldDateBeforeBuyDate: "Sold date cannot be earlier than purchase date",
    selectRetiredDate: "Please select a retired date",
    retiredDateBeforeBuyDate: "Retired date cannot be earlier than purchase date",
    assetUpdated: "Asset updated",
    assetAdded: "Asset added",
    tech: "Tech",
    clothes: "Clothes",
    homeCategory: "Home",
    other: "Other",
    netAssetChart: "Net Worth",
    fundAssetChart: "Assets",
    fundLiabilityChart: "Liabilities"
  },
  "ja-JP": {
    appTitle: "ObsiWealth",
    home: "\u30DB\u30FC\u30E0",
    wishlist: "\u6B32\u3057\u3044\u7269",
    stats: "\u7D71\u8A08",
    settings: "\u8A2D\u5B9A",
    overview: "\u8CC7\u7523\u6982\u8981",
    totalAssets: "\u7DCF\u8CC7\u7523",
    dailyCost: "\u65E5\u5272\u308A\u8CBB\u7528",
    perDay: "\u65E5",
    all: "\u3059\u3079\u3066",
    active: "\u4F7F\u7528\u4E2D",
    sold: "\u58F2\u5374\u6E08\u307F",
    retired: "\u9000\u5F79\u6E08\u307F",
    sort: "sort",
    bulkEdit: "\u4E00\u62EC\u7DE8\u96C6",
    bulkEditStatus: "\u72B6\u614B\u3092\u4E00\u62EC\u5909\u66F4",
    targetStatus: "\u5909\u66F4\u5148",
    apply: "\u9069\u7528",
    cancel: "\u30AD\u30E3\u30F3\u30BB\u30EB",
    selectedAssets: "\u9078\u629E\u6E08\u307F\u8CC7\u7523",
    noAssetsToEdit: "\u7DE8\u96C6\u3067\u304D\u308B\u8CC7\u7523\u304C\u3042\u308A\u307E\u305B\u3093",
    updated: "\u66F4\u65B0\u3057\u307E\u3057\u305F",
    passwordSecurity: "\u30D1\u30B9\u30EF\u30FC\u30C9\u3068\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3",
    passwordPrompt: "ObsiWealth \u306B\u5165\u308B\u306B\u306F\u30D1\u30B9\u30EF\u30FC\u30C9\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044",
    password: "\u30D1\u30B9\u30EF\u30FC\u30C9",
    enter: "\u5165\u308B",
    wrongPassword: "\u30D1\u30B9\u30EF\u30FC\u30C9\u304C\u9055\u3044\u307E\u3059",
    wishlistTotal: "\u6B32\u3057\u3044\u7269\u306E\u5408\u8A08",
    noWishlistData: "\u6B32\u3057\u3044\u7269\u30C7\u30FC\u30BF\u306F\u307E\u3060\u3042\u308A\u307E\u305B\u3093",
    assetTotalValue: "\u8CC7\u7523\u7DCF\u984D",
    assetValueTrend: "\u8CC7\u7523\u4FA1\u5024\u306E\u63A8\u79FB",
    dailyCostTrend: "\u65E5\u5272\u308A\u8CBB\u7528\u306E\u63A8\u79FB",
    categoryDistribution: "\u30AB\u30C6\u30B4\u30EA\u5206\u5E03",
    averageUsageByCategory: "\u30AB\u30C6\u30B4\u30EA\u5225\u5E73\u5747\u4F7F\u7528\u671F\u9593",
    totalCount: "\u5408\u8A08\u6570",
    emptyChart: "\u30B0\u30E9\u30D5\u3092\u63CF\u753B\u3059\u308B\u5341\u5206\u306A\u30C7\u30FC\u30BF\u304C\u3042\u308A\u307E\u305B\u3093",
    assetInfo: "\u8CC7\u7523\u60C5\u5831",
    unitPrice: "\u5358\u4FA1",
    buyDate: "\u8CFC\u5165\u65E5",
    category: "\u30AB\u30C6\u30B4\u30EA",
    statusInfo: "\u72B6\u614B\u60C5\u5831",
    status: "\u72B6\u614B",
    date: "\u65E5\u4ED8",
    soldDate: "\u58F2\u5374\u65E5",
    soldPrice: "\u58F2\u5374\u4FA1\u683C",
    notFilled: "\u672A\u5165\u529B",
    used: "\u4F7F\u7528\u6E08\u307F",
    years: "\u5E74",
    months: "\u304B\u6708",
    days: "\u65E5",
    deleteConfirm: "{name} \u3092\u524A\u9664\u3057\u307E\u3059\u304B\uFF1F",
    edit: "\u7DE8\u96C6",
    delete: "\u524A\u9664",
    addAsset: "\u8CC7\u7523\u3092\u8FFD\u52A0",
    editAsset: "\u8CC7\u7523\u3092\u7DE8\u96C6",
    icon: "\u30A2\u30A4\u30B3\u30F3",
    chooseIcon: "\u30A2\u30A4\u30B3\u30F3\u3092\u9078\u629E",
    current: "\u73FE\u5728",
    name: "\u540D\u524D",
    price: "\u4FA1\u683C",
    retiredDate: "\u9000\u5F79\u65E5",
    save: "\u4FDD\u5B58",
    inputAssetName: "\u8CC7\u7523\u540D\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044",
    selectSoldDate: "\u58F2\u5374\u65E5\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044",
    inputSoldPrice: "\u58F2\u5374\u4FA1\u683C\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044",
    soldDateBeforeBuyDate: "\u58F2\u5374\u65E5\u306F\u8CFC\u5165\u65E5\u3088\u308A\u524D\u306B\u3067\u304D\u307E\u305B\u3093",
    selectRetiredDate: "\u9000\u5F79\u65E5\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044",
    retiredDateBeforeBuyDate: "\u9000\u5F79\u65E5\u306F\u8CFC\u5165\u65E5\u3088\u308A\u524D\u306B\u3067\u304D\u307E\u305B\u3093",
    assetUpdated: "\u8CC7\u7523\u3092\u66F4\u65B0\u3057\u307E\u3057\u305F",
    assetAdded: "\u8CC7\u7523\u3092\u8FFD\u52A0\u3057\u307E\u3057\u305F",
    tech: "\u30C7\u30B8\u30BF\u30EB",
    clothes: "\u8863\u985E",
    homeCategory: "\u30DB\u30FC\u30E0",
    other: "\u305D\u306E\u4ED6",
    netAssetChart: "\u7D14\u8CC7\u7523",
    fundAssetChart: "\u8CC7\u7523",
    fundLiabilityChart: "\u8CA0\u50B5"
  },
  "ko-KR": {
    appTitle: "ObsiWealth",
    home: "\uD648",
    wishlist: "\uC704\uC2DC",
    stats: "\uD1B5\uACC4",
    settings: "\uC124\uC815",
    overview: "\uC790\uC0B0 \uAC1C\uC694",
    totalAssets: "\uCD1D\uC790\uC0B0",
    dailyCost: "\uC77C\uC77C \uBE44\uC6A9",
    perDay: "\uC77C",
    all: "\uC804\uCCB4",
    active: "\uC0AC\uC6A9 \uC911",
    sold: "\uD310\uB9E4\uB428",
    retired: "\uD1F4\uC5ED",
    sort: "sort",
    bulkEdit: "\uC77C\uAD04 \uC218\uC815",
    bulkEditStatus: "\uC0C1\uD0DC \uC77C\uAD04 \uC218\uC815",
    targetStatus: "\uB300\uC0C1 \uC0C1\uD0DC",
    apply: "\uC801\uC6A9",
    cancel: "\uCDE8\uC18C",
    selectedAssets: "\uC120\uD0DD\uB41C \uC790\uC0B0",
    noAssetsToEdit: "\uC218\uC815\uD560 \uC790\uC0B0\uC774 \uC5C6\uC2B5\uB2C8\uB2E4",
    updated: "\uC5C5\uB370\uC774\uD2B8\uB428",
    passwordSecurity: "\uBE44\uBC00\uBC88\uD638 \uBC0F \uBCF4\uC548",
    passwordPrompt: "ObsiWealth\uC5D0 \uB4E4\uC5B4\uAC00\uB824\uBA74 \uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD558\uC138\uC694",
    password: "\uBE44\uBC00\uBC88\uD638",
    enter: "\uC785\uC7A5",
    wrongPassword: "\uBE44\uBC00\uBC88\uD638\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4",
    wishlistTotal: "\uC704\uC2DC \uCD1D\uC561",
    noWishlistData: "\uC544\uC9C1 \uC704\uC2DC \uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4",
    assetTotalValue: "\uC790\uC0B0 \uCD1D\uC561",
    assetValueTrend: "\uC790\uC0B0 \uAC00\uCE58 \uCD94\uC138",
    dailyCostTrend: "\uC77C\uC77C \uBE44\uC6A9 \uCD94\uC138",
    categoryDistribution: "\uCE74\uD14C\uACE0\uB9AC \uBD84\uD3EC",
    averageUsageByCategory: "\uCE74\uD14C\uACE0\uB9AC\uBCC4 \uD3C9\uADE0 \uC0AC\uC6A9 \uAE30\uAC04",
    totalCount: "\uCD1D \uAC1C\uC218",
    emptyChart: "\uCC28\uD2B8\uB97C \uADF8\uB9B4 \uB370\uC774\uD130\uAC00 \uBD80\uC871\uD569\uB2C8\uB2E4",
    assetInfo: "\uC790\uC0B0 \uC815\uBCF4",
    unitPrice: "\uB2E8\uAC00",
    buyDate: "\uAD6C\uB9E4\uC77C",
    category: "\uCE74\uD14C\uACE0\uB9AC",
    statusInfo: "\uC0C1\uD0DC \uC815\uBCF4",
    status: "\uC0C1\uD0DC",
    date: "\uB0A0\uC9DC",
    soldDate: "\uD310\uB9E4\uC77C",
    soldPrice: "\uD310\uB9E4 \uAC00\uACA9",
    notFilled: "\uBBF8\uC785\uB825",
    used: "\uC0AC\uC6A9",
    years: "\uB144",
    months: "\uAC1C\uC6D4",
    days: "\uC77C",
    deleteConfirm: "{name}\uC744(\uB97C) \uC0AD\uC81C\uD560\uAE4C\uC694?",
    edit: "\uC218\uC815",
    delete: "\uC0AD\uC81C",
    addAsset: "\uC790\uC0B0 \uCD94\uAC00",
    editAsset: "\uC790\uC0B0 \uC218\uC815",
    icon: "\uC544\uC774\uCF58",
    chooseIcon: "\uC544\uC774\uCF58 \uC120\uD0DD",
    current: "\uD604\uC7AC",
    name: "\uC774\uB984",
    price: "\uAC00\uACA9",
    retiredDate: "\uD1F4\uC5ED\uC77C",
    save: "\uC800\uC7A5",
    inputAssetName: "\uC790\uC0B0 \uC774\uB984\uC744 \uC785\uB825\uD558\uC138\uC694",
    selectSoldDate: "\uD310\uB9E4\uC77C\uC744 \uC120\uD0DD\uD558\uC138\uC694",
    inputSoldPrice: "\uD310\uB9E4 \uAC00\uACA9\uC744 \uC785\uB825\uD558\uC138\uC694",
    soldDateBeforeBuyDate: "\uD310\uB9E4\uC77C\uC740 \uAD6C\uB9E4\uC77C\uBCF4\uB2E4 \uBE60\uB97C \uC218 \uC5C6\uC2B5\uB2C8\uB2E4",
    selectRetiredDate: "\uD1F4\uC5ED\uC77C\uC744 \uC120\uD0DD\uD558\uC138\uC694",
    retiredDateBeforeBuyDate: "\uD1F4\uC5ED\uC77C\uC740 \uAD6C\uB9E4\uC77C\uBCF4\uB2E4 \uBE60\uB97C \uC218 \uC5C6\uC2B5\uB2C8\uB2E4",
    assetUpdated: "\uC790\uC0B0\uC774 \uC5C5\uB370\uC774\uD2B8\uB418\uC5C8\uC2B5\uB2C8\uB2E4",
    assetAdded: "\uC790\uC0B0\uC774 \uCD94\uAC00\uB418\uC5C8\uC2B5\uB2C8\uB2E4",
    tech: "\uB514\uC9C0\uD138",
    clothes: "\uC758\uB958",
    homeCategory: "\uD648",
    other: "\uAE30\uD0C0",
    netAssetChart: "\uC21C\uC790\uC0B0",
    fundAssetChart: "\uC790\uC0B0",
    fundLiabilityChart: "\uBD80\uCC44"
  },
  "fr-FR": {
    appTitle: "ObsiWealth",
    home: "Accueil",
    wishlist: "Envies",
    stats: "Stats",
    settings: "R\xE9glages",
    overview: "Aper\xE7u des actifs",
    totalAssets: "Actifs totaux",
    dailyCost: "Co\xFBt quotidien",
    perDay: "jour",
    all: "Tout",
    active: "En service",
    sold: "Vendu",
    retired: "Retir\xE9",
    sort: "sort",
    bulkEdit: "Modification group\xE9e",
    bulkEditStatus: "Modifier le statut",
    targetStatus: "Statut cible",
    apply: "Appliquer",
    cancel: "Annuler",
    selectedAssets: "Actifs s\xE9lectionn\xE9s",
    noAssetsToEdit: "Aucun actif \xE0 modifier",
    updated: "Mis \xE0 jour",
    passwordSecurity: "Mot de passe et s\xE9curit\xE9",
    passwordPrompt: "Saisissez le mot de passe pour ouvrir ObsiWealth",
    password: "Mot de passe",
    enter: "Entrer",
    wrongPassword: "Mot de passe incorrect",
    wishlistTotal: "Total des envies",
    noWishlistData: "Aucune donn\xE9e d'envie",
    assetTotalValue: "Valeur totale",
    assetValueTrend: "\xC9volution de la valeur",
    dailyCostTrend: "\xC9volution du co\xFBt quotidien",
    categoryDistribution: "R\xE9partition par cat\xE9gorie",
    averageUsageByCategory: "Dur\xE9e moyenne par cat\xE9gorie",
    totalCount: "Total",
    emptyChart: "Donn\xE9es insuffisantes pour le graphique",
    assetInfo: "Infos actif",
    unitPrice: "Prix unitaire",
    buyDate: "Date d'achat",
    category: "Cat\xE9gorie",
    statusInfo: "Infos statut",
    status: "Statut",
    date: "Date",
    soldDate: "Date de vente",
    soldPrice: "Prix de vente",
    notFilled: "Non renseign\xE9",
    used: "Utilis\xE9",
    years: "a",
    months: "m",
    days: "j",
    deleteConfirm: "Supprimer {name} ?",
    edit: "Modifier",
    delete: "Supprimer",
    addAsset: "Ajouter un actif",
    editAsset: "Modifier l'actif",
    icon: "Ic\xF4ne",
    chooseIcon: "Choisir une ic\xF4ne",
    current: "Actuel",
    name: "Nom",
    price: "Prix",
    retiredDate: "Date de retrait",
    save: "Enregistrer",
    inputAssetName: "Saisissez le nom de l'actif",
    selectSoldDate: "S\xE9lectionnez la date de vente",
    inputSoldPrice: "Saisissez le prix de vente",
    soldDateBeforeBuyDate: "La date de vente ne peut pas pr\xE9c\xE9der l'achat",
    selectRetiredDate: "S\xE9lectionnez la date de retrait",
    retiredDateBeforeBuyDate: "La date de retrait ne peut pas pr\xE9c\xE9der l'achat",
    assetUpdated: "Actif mis \xE0 jour",
    assetAdded: "Actif ajout\xE9",
    tech: "Tech",
    clothes: "V\xEAtements",
    homeCategory: "Maison",
    other: "Autre",
    netAssetChart: "Patrimoine net",
    fundAssetChart: "Actifs",
    fundLiabilityChart: "Passifs"
  },
  "de-DE": {
    appTitle: "ObsiWealth",
    home: "Start",
    wishlist: "Wunschliste",
    stats: "Statistik",
    settings: "Einstellungen",
    overview: "Asset-\xDCbersicht",
    totalAssets: "Gesamtverm\xF6gen",
    dailyCost: "Tageskosten",
    perDay: "Tag",
    all: "Alle",
    active: "Aktiv",
    sold: "Verkauft",
    retired: "Ausgemustert",
    sort: "sort",
    bulkEdit: "Stapelbearbeitung",
    bulkEditStatus: "Status stapelweise \xE4ndern",
    targetStatus: "Zielstatus",
    apply: "Anwenden",
    cancel: "Abbrechen",
    selectedAssets: "Ausgew\xE4hlte Assets",
    noAssetsToEdit: "Keine Assets zum Bearbeiten",
    updated: "Aktualisiert",
    passwordSecurity: "Passwort & Sicherheit",
    passwordPrompt: "Passwort eingeben, um ObsiWealth zu \xF6ffnen",
    password: "Passwort",
    enter: "\xD6ffnen",
    wrongPassword: "Falsches Passwort",
    wishlistTotal: "Wunschlistenwert",
    noWishlistData: "Noch keine Wunschdaten",
    assetTotalValue: "Gesamtwert",
    assetValueTrend: "Wertentwicklung",
    dailyCostTrend: "Tageskosten-Trend",
    categoryDistribution: "Kategorieverteilung",
    averageUsageByCategory: "Durchschnittliche Nutzung nach Kategorie",
    totalCount: "Gesamtzahl",
    emptyChart: "Nicht gen\xFCgend Daten f\xFCr das Diagramm",
    assetInfo: "Asset-Info",
    unitPrice: "Einzelpreis",
    buyDate: "Kaufdatum",
    category: "Kategorie",
    statusInfo: "Statusinfo",
    status: "Status",
    date: "Datum",
    soldDate: "Verkaufsdatum",
    soldPrice: "Verkaufspreis",
    notFilled: "Nicht ausgef\xFCllt",
    used: "Genutzt",
    years: "J",
    months: "M",
    days: "T",
    deleteConfirm: "{name} l\xF6schen?",
    edit: "Bearbeiten",
    delete: "L\xF6schen",
    addAsset: "Asset hinzuf\xFCgen",
    editAsset: "Asset bearbeiten",
    icon: "Icon",
    chooseIcon: "Icon w\xE4hlen",
    current: "Aktuell",
    name: "Name",
    price: "Preis",
    retiredDate: "Ausmusterungsdatum",
    save: "Speichern",
    inputAssetName: "Asset-Namen eingeben",
    selectSoldDate: "Verkaufsdatum w\xE4hlen",
    inputSoldPrice: "Verkaufspreis eingeben",
    soldDateBeforeBuyDate: "Verkaufsdatum darf nicht vor Kaufdatum liegen",
    selectRetiredDate: "Ausmusterungsdatum w\xE4hlen",
    retiredDateBeforeBuyDate: "Ausmusterungsdatum darf nicht vor Kaufdatum liegen",
    assetUpdated: "Asset aktualisiert",
    assetAdded: "Asset hinzugef\xFCgt",
    tech: "Technik",
    clothes: "Kleidung",
    homeCategory: "Zuhause",
    other: "Sonstiges",
    netAssetChart: "Nettoverm\xF6gen",
    fundAssetChart: "Verm\xF6genswerte",
    fundLiabilityChart: "Verbindlichkeiten"
  },
  "es-ES": {
    appTitle: "ObsiWealth",
    home: "Inicio",
    wishlist: "Deseos",
    stats: "Datos",
    settings: "Ajustes",
    overview: "Resumen de activos",
    totalAssets: "Activos totales",
    dailyCost: "Coste diario",
    perDay: "d\xEDa",
    all: "Todo",
    active: "En uso",
    sold: "Vendido",
    retired: "Retirado",
    sort: "sort",
    bulkEdit: "Edici\xF3n masiva",
    bulkEditStatus: "Modificar estado",
    targetStatus: "Estado destino",
    apply: "Aplicar",
    cancel: "Cancelar",
    selectedAssets: "Activos seleccionados",
    noAssetsToEdit: "No hay activos para editar",
    updated: "Actualizado",
    passwordSecurity: "Contrase\xF1a y seguridad",
    passwordPrompt: "Introduce la contrase\xF1a para abrir ObsiWealth",
    password: "Contrase\xF1a",
    enter: "Entrar",
    wrongPassword: "Contrase\xF1a incorrecta",
    wishlistTotal: "Total de deseos",
    noWishlistData: "A\xFAn no hay datos de deseos",
    assetTotalValue: "Valor total",
    assetValueTrend: "Tendencia de valor",
    dailyCostTrend: "Tendencia de coste diario",
    categoryDistribution: "Distribuci\xF3n por categor\xEDa",
    averageUsageByCategory: "Uso medio por categor\xEDa",
    totalCount: "Total",
    emptyChart: "No hay suficientes datos para el gr\xE1fico",
    assetInfo: "Informaci\xF3n",
    unitPrice: "Precio unitario",
    buyDate: "Fecha de compra",
    category: "Categor\xEDa",
    statusInfo: "Informaci\xF3n de estado",
    status: "Estado",
    date: "Fecha",
    soldDate: "Fecha de venta",
    soldPrice: "Precio de venta",
    notFilled: "Sin completar",
    used: "Usado",
    years: "a",
    months: "m",
    days: "d",
    deleteConfirm: "\xBFEliminar {name}?",
    edit: "Editar",
    delete: "Eliminar",
    addAsset: "A\xF1adir activo",
    editAsset: "Editar activo",
    icon: "Icono",
    chooseIcon: "Elegir icono",
    current: "Actual",
    name: "Nombre",
    price: "Precio",
    retiredDate: "Fecha de retiro",
    save: "Guardar",
    inputAssetName: "Introduce el nombre del activo",
    selectSoldDate: "Selecciona la fecha de venta",
    inputSoldPrice: "Introduce el precio de venta",
    soldDateBeforeBuyDate: "La venta no puede ser anterior a la compra",
    selectRetiredDate: "Selecciona la fecha de retiro",
    retiredDateBeforeBuyDate: "El retiro no puede ser anterior a la compra",
    assetUpdated: "Activo actualizado",
    assetAdded: "Activo a\xF1adido",
    tech: "Tecnolog\xEDa",
    clothes: "Ropa",
    homeCategory: "Hogar",
    other: "Otro",
    netAssetChart: "Patrimonio neto",
    fundAssetChart: "Activos",
    fundLiabilityChart: "Pasivos"
  }
};
var defaultCategoryLabelKeys = {
  tech: "tech",
  clothes: "clothes",
  home: "homeCategory",
  other: "other"
};
function t(language, key, replacements) {
  let text = translations[language]?.[key] ?? translations["zh-CN"][key] ?? key;
  const values = replacements ?? {};
  Object.keys(values).forEach((name) => {
    text = text.replace(`{${name}}`, values[name]);
  });
  return text;
}
function statusLabel(language, status) {
  return t(language, status);
}
function defaultCategoryLabel(language, id) {
  const key = defaultCategoryLabelKeys[id];
  return key ? t(language, key) : id;
}

// packages/core/src/storage/jsonArrayRepo.ts
var JsonArrayRepository = class {
  constructor(options) {
    this.options = options;
  }
  options;
  items = [];
  get store() {
    return this.options.store;
  }
  async load() {
    try {
      if (!await this.store.exists(this.options.path)) {
        this.items = [];
        return;
      }
      const data = await this.store.read(this.options.path);
      const raw = decodeArray(data);
      if (this.options.onLoad) {
        const { items, mutated } = this.options.onLoad(raw);
        this.items = items;
        if (mutated) {
          try {
            await this.save();
          } catch {
          }
        }
      } else {
        this.items = raw;
      }
    } catch {
      this.items = [];
      this.options.notifier?.notify(`${this.options.label}\u8BFB\u53D6\u5931\u8D25\uFF0C\u5DF2\u4F7F\u7528\u7A7A\u5217\u8868`);
    }
  }
  async save() {
    const dir = parentDir(this.options.path);
    if (dir && !await this.store.exists(dir)) {
      await this.store.mkdir(dir);
    }
    await this.store.write(this.options.path, yamlStringify(this.items));
  }
  async saveAndNotify() {
    await this.save();
    if (this.options.afterChange) {
      await this.options.afterChange();
    }
  }
  async add(item) {
    this.items.push(item);
    await this.saveAndNotify();
  }
  async update(item) {
    const id = this.options.getId(item);
    const index = this.items.findIndex((current) => this.options.getId(current) === id);
    if (index === -1) {
      this.items.push(item);
    } else {
      this.items[index] = item;
    }
    await this.saveAndNotify();
  }
  async remove(id) {
    this.items = this.items.filter((item) => this.options.getId(item) !== id);
    await this.saveAndNotify();
  }
  async replaceAll(items) {
    this.items = items;
    await this.saveAndNotify();
  }
};
function decodeArray(source) {
  const trimmed = (source ?? "").trim();
  if (trimmed === "") return [];
  const parsed = yamlParse(trimmed);
  return Array.isArray(parsed) ? parsed : [];
}
function parentDir(p) {
  const idx = p.lastIndexOf("/");
  return idx <= 0 ? "" : p.slice(0, idx);
}

// packages/core/src/storage/tar.ts
var BLOCK = 512;
function tarEncode(entries) {
  let total = 0;
  for (const entry2 of entries) {
    total += BLOCK;
    if (entry2.type === "file" && entry2.data) {
      total += roundUpToBlock(entry2.data.byteLength);
    }
  }
  total += BLOCK * 2;
  const out = new Uint8Array(total);
  let cursor = 0;
  const now = Math.floor(Date.now() / 1e3);
  for (const entry2 of entries) {
    writeHeader(out, cursor, entry2, now);
    cursor += BLOCK;
    if (entry2.type === "file" && entry2.data && entry2.data.byteLength > 0) {
      out.set(entry2.data, cursor);
      cursor += roundUpToBlock(entry2.data.byteLength);
    }
  }
  return out;
}
function writeHeader(out, offset, entry2, mtime) {
  const name = normaliseName(entry2.name, entry2.type);
  if (encodeUtf8(name).byteLength > 100) {
    throw new Error(`tar: path too long for USTAR basic header: ${name}`);
  }
  writeString(out, offset + 0, name, 100);
  writeOctal(out, offset + 100, entry2.type === "dir" ? 493 : 420, 8);
  writeOctal(out, offset + 108, 0, 8);
  writeOctal(out, offset + 116, 0, 8);
  writeOctal(out, offset + 124, entry2.type === "file" ? entry2.data?.byteLength ?? 0 : 0, 12);
  writeOctal(out, offset + 136, mtime, 12);
  for (let i = 0; i < 8; i++) out[offset + 148 + i] = 32;
  out[offset + 156] = entry2.type === "dir" ? 53 : 48;
  writeString(out, offset + 257, "ustar", 6);
  writeString(out, offset + 263, "00", 2);
  let sum = 0;
  for (let i = 0; i < BLOCK; i++) sum += out[offset + i];
  const chksum = sum.toString(8).padStart(6, "0");
  for (let i = 0; i < 6; i++) out[offset + 148 + i] = chksum.charCodeAt(i);
  out[offset + 148 + 6] = 0;
  out[offset + 148 + 7] = 32;
}
function normaliseName(name, type) {
  let clean = name.replace(/\\/g, "/").replace(/^\/+/, "");
  if (type === "dir" && !clean.endsWith("/")) clean += "/";
  return clean;
}
function writeString(out, offset, value, field) {
  const bytes = encodeUtf8(value);
  const limit = Math.min(bytes.byteLength, field);
  for (let i = 0; i < limit; i++) out[offset + i] = bytes[i];
}
function writeOctal(out, offset, value, field) {
  const str = Math.floor(value).toString(8).padStart(field - 1, "0");
  for (let i = 0; i < field - 1; i++) out[offset + i] = str.charCodeAt(i);
  out[offset + field - 1] = 0;
}
function roundUpToBlock(bytes) {
  return Math.ceil(bytes / BLOCK) * BLOCK;
}
function tarDecode(buffer) {
  const bytes = new Uint8Array(buffer);
  const out = [];
  let cursor = 0;
  while (cursor + BLOCK <= bytes.byteLength) {
    if (isZeroBlock(bytes, cursor)) break;
    const name = readString(bytes, cursor + 0, 100);
    const prefix = readString(bytes, cursor + 345, 155);
    const size = readOctal(bytes, cursor + 124, 12);
    const typeflag = bytes[cursor + 156];
    const fullName = prefix ? `${prefix}/${name}` : name;
    cursor += BLOCK;
    if (typeflag === 53) {
      out.push({ name: fullName.replace(/\/+$/, ""), type: "dir" });
    } else if (typeflag === 48 || typeflag === 0) {
      const data = bytes.slice(cursor, cursor + size);
      out.push({ name: fullName, type: "file", data });
    }
    cursor += roundUpToBlock(size);
  }
  return out;
}
function isZeroBlock(bytes, offset) {
  for (let i = 0; i < BLOCK; i++) {
    if (bytes[offset + i] !== 0) return false;
  }
  return true;
}
function readString(bytes, offset, field) {
  let end = offset;
  const limit = offset + field;
  while (end < limit && bytes[end] !== 0) end++;
  return decodeUtf8(bytes.subarray(offset, end));
}
function readOctal(bytes, offset, field) {
  const str = readString(bytes, offset, field).trim();
  if (!str) return 0;
  const n = parseInt(str, 8);
  return Number.isFinite(n) ? n : 0;
}
function encodeUtf8(value) {
  const TE = globalThis.TextEncoder;
  if (TE) return new TE().encode(value);
  const out = new Uint8Array(value.length);
  for (let i = 0; i < value.length; i++) out[i] = value.charCodeAt(i) & 255;
  return out;
}
function decodeUtf8(bytes) {
  const TD = globalThis.TextDecoder;
  if (TD) return new TD("utf-8").decode(bytes);
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += String.fromCharCode(bytes[i]);
  return out;
}

// packages/core/src/calc/assetMath.ts
var MS_PER_DAY = 1e3 * 3600 * 24;
function getTodayISODate() {
  return formatLocalDate(/* @__PURE__ */ new Date());
}
function getUsedDays(asset) {
  const buyDate = parseLocalDate(asset.buy_date);
  if (!buyDate) {
    return 1;
  }
  const endDate = getAssetEndDate(asset);
  if (!endDate || buyDate.getTime() > endDate.getTime()) {
    return 1;
  }
  return Math.max(1, Math.floor((endDate.getTime() - buyDate.getTime()) / MS_PER_DAY) + 1);
}
function getAssetTotalCost(asset) {
  const accessoryTotal = (asset.accessories ?? []).filter((accessory) => accessory.include_total).reduce((sum, accessory) => sum + accessory.price, 0);
  return asset.price + accessoryTotal;
}
function getNetAssetCost(asset) {
  const totalCost = getAssetTotalCost(asset);
  return getAssetStatus(asset) === "sold" ? totalCost - (asset.lifecycle?.sold_price ?? 0) : totalCost;
}
function isAssetAppreciated(asset) {
  return getAssetStatus(asset) === "sold" && getNetAssetCost(asset) < 0;
}
function getAssetEndDate(asset) {
  const status = getAssetStatus(asset);
  if (status === "sold" && asset.lifecycle?.sold_date) {
    return parseLocalDate(asset.lifecycle.sold_date);
  }
  if (status === "retired" && asset.lifecycle?.retired_date) {
    return parseLocalDate(asset.lifecycle.retired_date);
  }
  return parseLocalDate(getTodayISODate());
}
function getAssetEndDateValue(asset) {
  const endDate = getAssetEndDate(asset);
  return endDate ? formatLocalDate(endDate) : getTodayISODate();
}
function getDailyCost(asset) {
  const days = getUsedDays(asset);
  const cost = getNetAssetCost(asset);
  return days > 0 ? cost / days : 0;
}
function getDailyCostOnDate(asset, dateValue) {
  const buyDate = parseLocalDate(asset.buy_date);
  const date = parseLocalDate(dateValue);
  if (!buyDate || !date || buyDate.getTime() > date.getTime()) {
    return 0;
  }
  const endDate = getAssetEndDate(asset);
  const effectiveEndDate = endDate && date.getTime() > endDate.getTime() ? endDate : date;
  const days = Math.max(1, Math.floor((effectiveEndDate.getTime() - buyDate.getTime()) / MS_PER_DAY) + 1);
  const cost = endDate && date.getTime() >= endDate.getTime() ? getNetAssetCost(asset) : getAssetTotalCost(asset);
  return cost / days;
}
function getUsageDuration(asset) {
  const buyDate = parseLocalDate(asset.buy_date);
  const endDate = getAssetEndDate(asset);
  if (!buyDate || !endDate || buyDate.getTime() > endDate.getTime()) {
    return { years: 0, months: 0, days: 0 };
  }
  const inclusiveEndDate = addDays(endDate, 1);
  let years = inclusiveEndDate.getFullYear() - buyDate.getFullYear();
  let months = inclusiveEndDate.getMonth() - buyDate.getMonth();
  let days = inclusiveEndDate.getDate() - buyDate.getDate();
  if (days < 0) {
    months -= 1;
    days += new Date(inclusiveEndDate.getFullYear(), inclusiveEndDate.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days };
}
function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = padTwoDigits(date.getMonth() + 1);
  const day = padTwoDigits(date.getDate());
  return `${year}-${month}-${day}`;
}
function padTwoDigits(value) {
  return value < 10 ? `0${value}` : String(value);
}
function parseLocalDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}
function getAssetStatus(asset) {
  if (asset.lifecycle?.sold) return "sold";
  if (asset.lifecycle?.retired) return "retired";
  return "active";
}
function createAssetFormState(asset) {
  if (!asset) {
    return {
      icon: "",
      name: "",
      price: 0,
      buy_date: getTodayISODate(),
      category: "other",
      accessories: [],
      exclude_total: false,
      exclude_daily: false,
      sold: false,
      retired: false,
      sold_date: "",
      sold_price: 0,
      retired_date: ""
    };
  }
  return {
    icon: asset.icon,
    name: asset.name,
    price: asset.price,
    buy_date: asset.buy_date,
    category: asset.category,
    accessories: asset.accessories ?? [],
    exclude_total: asset.flags?.exclude_total ?? false,
    exclude_daily: asset.flags?.exclude_daily ?? false,
    sold: asset.lifecycle?.sold ?? false,
    retired: asset.lifecycle?.retired ?? false,
    sold_date: asset.lifecycle?.sold_date ?? "",
    sold_price: asset.lifecycle?.sold_price ?? 0,
    retired_date: asset.lifecycle?.retired_date ?? ""
  };
}
function formStateToAsset(state, id = crypto.randomUUID()) {
  return {
    id,
    icon: state.icon,
    name: state.name,
    price: state.price,
    buy_date: state.buy_date,
    category: state.category,
    accessories: state.accessories,
    flags: {
      exclude_total: state.exclude_total,
      exclude_daily: state.exclude_daily
    },
    lifecycle: {
      sold: state.sold,
      retired: state.retired,
      sold_date: state.sold_date,
      sold_price: state.sold_price,
      retired_date: state.retired_date
    }
  };
}

// packages/core/src/calc/assetSorting.ts
var STATUS_WEIGHT = {
  active: 0,
  sold: 1,
  retired: 2
};
function sortAssets(assets, field, direction) {
  if (field === "manual") {
    return [...assets];
  }
  const directionMultiplier = direction === "asc" ? 1 : -1;
  return [...assets].sort((a, b) => {
    const diff = getSortValue(a, field) - getSortValue(b, field);
    if (diff !== 0) {
      return diff * directionMultiplier;
    }
    return a.name.localeCompare(b.name) * directionMultiplier;
  });
}
function getSortValue(asset, field) {
  if (field === "buyDate") {
    return parseLocalDate(asset.buy_date)?.getTime() ?? 0;
  }
  if (field === "dailyCost") {
    return getDailyCost(asset);
  }
  if (field === "status") {
    return STATUS_WEIGHT[getAssetStatus(asset)];
  }
  if (field === "serviceTime") {
    return getUsedDays(asset);
  }
  if (field === "value") {
    return getNetAssetCost(asset);
  }
  return 0;
}

// packages/core/src/calc/fundStats.ts
function getFundEffectiveAmount(fund) {
  const history = fund.history ?? [];
  if (history.length === 0) {
    return fund.amount ?? 0;
  }
  let latest = history[0];
  for (let i = 1; i < history.length; i++) {
    if (history[i].date.localeCompare(latest.date) > 0) {
      latest = history[i];
    }
  }
  return latest.amount ?? (fund.amount ?? 0);
}
function getFundAssetTotal(plugin) {
  return plugin.funds.filter((fund) => getFundCategory(fund).type === "asset").reduce((sum, fund) => sum + getFundEffectiveAmount(fund), 0);
}
function getFundLiabilityTotal(plugin) {
  return plugin.funds.filter((fund) => getFundCategory(fund).type === "liability").reduce((sum, fund) => sum + getFundEffectiveAmount(fund), 0);
}
function getFundNetAsset(plugin) {
  return getFundAssetTotal(plugin) - getFundLiabilityTotal(plugin);
}
function getFundTotal(plugin) {
  return getFundNetAsset(plugin);
}
function getFundAmountOnDate(fund, date) {
  const history = (fund.history ?? [{ id: fund.id, amount: fund.amount, date: fund.date }]).filter((point) => point.date <= date).sort((a, b) => a.date.localeCompare(b.date));
  return history[history.length - 1]?.amount ?? 0;
}
function collectFundDates(plugin) {
  const dateSet = /* @__PURE__ */ new Set();
  plugin.funds.forEach((fund) => {
    (fund.history ?? [{ id: fund.id, amount: fund.amount, date: fund.date }]).forEach((point) => {
      if (point.date) {
        dateSet.add(point.date);
      }
    });
  });
  return Array.from(dateSet).sort((a, b) => a.localeCompare(b));
}
function getFundTrendPointsByTab(plugin, tab) {
  return collectFundDates(plugin).map((date) => ({
    date,
    value: plugin.funds.reduce((sum, fund) => {
      const amount = getFundAmountOnDate(fund, date);
      const type = getFundCategory(fund).type;
      if (tab === "asset") {
        return sum + (type === "asset" ? amount : 0);
      }
      if (tab === "liability") {
        return sum + (type === "liability" ? amount : 0);
      }
      return sum + (type === "liability" ? -amount : amount);
    }, 0)
  }));
}
function buildFundMonthMap(plugin, tab) {
  const daily = getFundTrendPointsByTab(plugin, tab);
  const monthMap = /* @__PURE__ */ new Map();
  daily.forEach((point) => {
    const month = point.date.slice(0, 7);
    const existing = monthMap.get(month);
    if (!existing || existing.date < point.date) {
      monthMap.set(month, { date: point.date, value: point.value });
    }
  });
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const todayMonth = today.slice(0, 7);
  if (!monthMap.has(todayMonth)) {
    const currentValue = tab === "asset" ? getFundAssetTotal(plugin) : tab === "liability" ? getFundLiabilityTotal(plugin) : getFundNetAsset(plugin);
    if (monthMap.size > 0 || currentValue !== 0) {
      monthMap.set(todayMonth, { date: today, value: currentValue });
    }
  }
  return monthMap;
}
function getAvailableFundYears(plugin, tab) {
  const months = buildFundMonthMap(plugin, tab);
  const years = /* @__PURE__ */ new Set();
  months.forEach((_, month) => {
    years.add(month.slice(0, 4));
  });
  return Array.from(years).sort();
}
function getFundMonthlySeries(plugin, tab, range) {
  const months = buildFundMonthMap(plugin, tab);
  const makeSlot = (key, label) => {
    const info = months.get(key);
    if (!info) {
      return { date: key, value: null, label };
    }
    return { date: key, value: info.value, label, actualDate: info.date };
  };
  if (/^\d{4}$/.test(range)) {
    const year = range;
    const slots = [];
    for (let i = 1; i <= 12; i++) {
      const mm = i < 10 ? `0${i}` : String(i);
      slots.push(makeSlot(`${year}-${mm}`, `${i}\u6708`));
    }
    return slots;
  }
  if (range === "recent") {
    const now = /* @__PURE__ */ new Date();
    const slots = [];
    for (let offset = 11; offset >= 0; offset--) {
      const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const mm = m < 10 ? `0${m}` : String(m);
      const label = m === 1 || offset === 11 ? `${String(y).slice(2)}/${m}` : `${m}\u6708`;
      slots.push(makeSlot(`${y}-${mm}`, label));
    }
    return slots;
  }
  if (range === "all") {
    if (months.size === 0) return [];
    const sortedKeys = Array.from(months.keys()).sort();
    const firstKey = sortedKeys[0];
    const todayMonth = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
    const lastKey = sortedKeys[sortedKeys.length - 1] > todayMonth ? sortedKeys[sortedKeys.length - 1] : todayMonth;
    const [fy, fm] = firstKey.split("-").map((s) => parseInt(s, 10));
    const [ly, lm] = lastKey.split("-").map((s) => parseInt(s, 10));
    const slots = [];
    let y = fy;
    let m = fm;
    while (y < ly || y === ly && m <= lm) {
      const mm = m < 10 ? `0${m}` : String(m);
      const label = m === 1 ? `${String(y).slice(2)}/1` : `${m}\u6708`;
      slots.push(makeSlot(`${y}-${mm}`, label));
      m++;
      if (m > 12) {
        m = 1;
        y++;
      }
    }
    return slots;
  }
  return [];
}
function getFundRanking(plugin, tab, granularity = "category", labelOf) {
  if (tab === "netAsset") {
    const asset = getFundAssetTotal(plugin);
    const liability = getFundLiabilityTotal(plugin);
    const items = [];
    if (asset > 0) items.push({ name: "\u8D44\u91D1", value: asset, color: "#60a5fa" });
    if (liability > 0) items.push({ name: "\u8D1F\u503A", value: liability, color: "#ef4444" });
    return items;
  }
  const targetType = tab;
  const palette = ["#60a5fa", "#4ade80", "#f59e0b", "#f472b6", "#a78bfa", "#22d3ee", "#fb7185", "#34d399"];
  if (granularity === "item") {
    const entries = [];
    plugin.funds.forEach((fund) => {
      const cat = getFundCategory(fund);
      if (cat.type !== targetType) return;
      const value = getFundEffectiveAmount(fund);
      if (value <= 0) return;
      const name = (labelOf ? labelOf(fund) : "") || cat.name;
      entries.push({ name, value });
    });
    return entries.sort((a, b) => b.value - a.value).map((entry2, index) => ({
      name: entry2.name,
      value: entry2.value,
      color: palette[index % palette.length]
    }));
  }
  const categoryMap = /* @__PURE__ */ new Map();
  plugin.funds.forEach((fund) => {
    const cat = getFundCategory(fund);
    if (cat.type !== targetType) return;
    const value = getFundEffectiveAmount(fund);
    if (value <= 0) return;
    const entry2 = categoryMap.get(cat.id);
    if (entry2) {
      entry2.value += value;
    } else {
      categoryMap.set(cat.id, { name: cat.name, value });
    }
  });
  return Array.from(categoryMap.values()).sort((a, b) => b.value - a.value).map((entry2, index) => ({
    name: entry2.name,
    value: entry2.value,
    color: palette[index % palette.length]
  }));
}

// packages/ui-web/src/modals/accessoryModal.ts
var import_obsidian3 = require("obsidian");

// packages/ui-web/src/modals/iconPicker.ts
var import_obsidian = require("obsidian");
var lastDimension = "2d";
var lastCategoryByDim = {
  "2d": "digital",
  "3d": "digital"
};
function openIconPicker(app, onSelect, variant = "asset") {
  const modal = new import_obsidian.Modal(app);
  renderIconPicker(modal, app, onSelect, variant);
  modal.open();
}
function renderIconPicker(modal, app, onSelect, variant) {
  const { contentEl } = modal;
  contentEl.empty();
  contentEl.style.overflow = "visible";
  contentEl.createEl("h3", { text: "\u9009\u62E9\u56FE\u6807" });
  renderLocalPickerBar(contentEl, app, async (dataUrl) => {
    try {
      const ref = await saveCustomImageFromDataUrl(dataUrl);
      onSelect({ id: ref, name: "\u81EA\u5B9A\u4E49\u56FE\u7247", src: ref });
    } catch (err) {
      console.error(err);
      notify("\u4FDD\u5B58\u56FE\u7247\u5931\u8D25\uFF0C\u5DF2\u56DE\u9000\u4E3A\u5185\u8054");
      onSelect({ id: dataUrl, name: "\u81EA\u5B9A\u4E49\u56FE\u7247", src: dataUrl });
    }
    modal.close();
  });
  if (variant === "money") {
    const moneyCat = getCategory("2d", "money");
    if (moneyCat) {
      renderCategoryGrid(modal, contentEl, app, moneyCat, onSelect);
    }
    return;
  }
  renderTwoTierPicker(modal, contentEl, app, onSelect);
}
function renderTwoTierPicker(modal, contentEl, app, onSelect) {
  const availableDims = ICON_LIBRARY.map((d) => d.dimension);
  let currentDim = availableDims.includes(lastDimension) ? lastDimension : availableDims[0];
  const dimRow = contentEl.createDiv();
  dimRow.style.display = "flex";
  dimRow.style.gap = "6px";
  dimRow.style.margin = "4px 0 10px";
  dimRow.style.padding = "4px";
  dimRow.style.background = "var(--background-secondary)";
  dimRow.style.borderRadius = "8px";
  dimRow.style.width = "fit-content";
  const catRow = contentEl.createDiv();
  catRow.style.display = "flex";
  catRow.style.flexWrap = "wrap";
  catRow.style.gap = "6px";
  catRow.style.margin = "2px 0 12px";
  const gridHost = contentEl.createDiv();
  gridHost.style.maxHeight = "60vh";
  gridHost.style.overflowY = "auto";
  gridHost.style.paddingRight = "4px";
  const renderDimTabs = () => {
    dimRow.empty();
    ICON_LIBRARY.forEach((dim) => {
      const tab = dimRow.createEl("button", { text: dim.name });
      tab.type = "button";
      applyDimTabStyle(tab, dim.dimension === currentDim);
      tab.onclick = () => {
        if (dim.dimension === currentDim) return;
        currentDim = dim.dimension;
        lastDimension = currentDim;
        renderDimTabs();
        renderCatTabsAndGrid();
      };
    });
  };
  const renderCatTabsAndGrid = () => {
    catRow.empty();
    gridHost.empty();
    const dim = ICON_LIBRARY.find((d) => d.dimension === currentDim);
    if (!dim || dim.categories.length === 0) {
      const empty = gridHost.createDiv({ text: "\u8BE5\u98CE\u683C\u6682\u65E0\u56FE\u6807" });
      empty.style.padding = "20px";
      empty.style.textAlign = "center";
      empty.style.color = "var(--text-muted)";
      empty.style.fontSize = "12px";
      return;
    }
    const remembered = lastCategoryByDim[currentDim];
    let currentCat = dim.categories.find((c) => c.id === remembered) ?? dim.categories[0];
    const renderGrid = () => {
      gridHost.empty();
      renderCategoryGrid(modal, gridHost, app, currentCat, onSelect);
    };
    dim.categories.forEach((cat) => {
      const chip = catRow.createEl("button", { text: cat.name });
      chip.type = "button";
      applyCatChipStyle(chip, cat.id === currentCat.id);
      chip.onclick = () => {
        if (cat.id === currentCat.id) return;
        currentCat = cat;
        lastCategoryByDim[currentDim] = cat.id;
        Array.from(catRow.children).forEach((node, idx) => {
          applyCatChipStyle(
            node,
            dim.categories[idx].id === currentCat.id
          );
        });
        renderGrid();
      };
    });
    lastCategoryByDim[currentDim] = currentCat.id;
    renderGrid();
  };
  renderDimTabs();
  renderCatTabsAndGrid();
}
function renderCategoryGrid(modal, host2, app, category, onSelect) {
  const grid = host2.createDiv("icon-grid");
  applyGridStyle(grid);
  category.icons.forEach((icon) => {
    grid.appendChild(createIconItem(modal, app, icon, onSelect));
  });
}
function applyDimTabStyle(el, active) {
  el.style.padding = "6px 18px";
  el.style.borderRadius = "6px";
  el.style.border = "0";
  el.style.background = active ? "var(--interactive-accent)" : "transparent";
  el.style.color = active ? "var(--text-on-accent)" : "var(--text-normal)";
  el.style.fontWeight = "800";
  el.style.fontSize = "13px";
  el.style.cursor = "pointer";
  el.style.transition = "background 0.12s ease";
}
function applyCatChipStyle(el, active) {
  el.style.padding = "5px 12px";
  el.style.borderRadius = "999px";
  el.style.border = active ? "1px solid var(--interactive-accent)" : "1px solid var(--background-modifier-border)";
  el.style.background = active ? "var(--interactive-accent-hover, rgba(56, 139, 253, 0.12))" : "transparent";
  el.style.color = active ? "var(--interactive-accent)" : "var(--text-muted)";
  el.style.fontSize = "12px";
  el.style.fontWeight = active ? "800" : "600";
  el.style.cursor = "pointer";
  el.style.transition = "background 0.12s ease, color 0.12s ease";
}
function renderLocalPickerBar(parent, app, onPicked) {
  const bar = parent.createDiv();
  bar.style.display = "flex";
  bar.style.alignItems = "center";
  bar.style.gap = "8px";
  bar.style.margin = "4px 0 12px";
  const button = bar.createEl("button");
  button.type = "button";
  button.style.display = "inline-flex";
  button.style.alignItems = "center";
  button.style.gap = "6px";
  button.style.padding = "6px 14px";
  button.style.borderRadius = "0";
  button.style.border = "1px solid var(--background-modifier-border)";
  button.style.background = "var(--background-secondary)";
  button.style.color = "var(--text-normal)";
  button.style.fontSize = "13px";
  button.style.fontWeight = "800";
  button.style.cursor = "pointer";
  button.insertAdjacentHTML(
    "beforeend",
    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M3 8h4l2-3h6l2 3h4v11H3z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>`
  );
  button.appendChild(document.createTextNode("\u672C\u5730"));
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.style.display = "none";
  bar.appendChild(fileInput);
  button.onclick = () => fileInput.click();
  fileInput.onchange = () => {
    const file = fileInput.files && fileInput.files[0];
    fileInput.value = "";
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const src = typeof reader.result === "string" ? reader.result : "";
      if (!src) {
        return;
      }
      openSquareCropper(app, src, onPicked);
    };
    reader.readAsDataURL(file);
  };
}
function openSquareCropper(app, imageSrc, onConfirm) {
  const modal = new import_obsidian.Modal(app);
  const { contentEl } = modal;
  contentEl.empty();
  contentEl.createEl("h3", { text: "\u88C1\u526A\u56FE\u7247\uFF08\u6B63\u65B9\u5F62\uFF09" });
  const wrap = contentEl.createDiv();
  wrap.style.display = "flex";
  wrap.style.flexDirection = "column";
  wrap.style.alignItems = "center";
  wrap.style.gap = "12px";
  const viewportSize = 320;
  const viewport = wrap.createDiv();
  viewport.style.position = "relative";
  viewport.style.width = `${viewportSize}px`;
  viewport.style.height = `${viewportSize}px`;
  viewport.style.overflow = "hidden";
  viewport.style.background = "repeating-conic-gradient(#e5e7eb 0 25%, #f9fafb 0 50%) 50% / 20px 20px";
  viewport.style.border = "2px solid var(--interactive-accent)";
  viewport.style.borderRadius = "6px";
  viewport.style.cursor = "grab";
  viewport.style.userSelect = "none";
  viewport.style.touchAction = "none";
  const img = document.createElement("img");
  img.src = imageSrc;
  img.alt = "preview";
  img.draggable = false;
  img.style.position = "absolute";
  img.style.left = "0";
  img.style.top = "0";
  img.style.pointerEvents = "none";
  img.style.userSelect = "none";
  viewport.appendChild(img);
  const frame = viewport.createDiv();
  frame.style.position = "absolute";
  frame.style.inset = "0";
  frame.style.border = "2px dashed rgba(255,255,255,0.9)";
  frame.style.borderRadius = "0";
  frame.style.boxShadow = "0 0 0 9999px rgba(0,0,0,0.35)";
  frame.style.pointerEvents = "none";
  const state = {
    naturalW: 0,
    naturalH: 0,
    minScale: 1,
    scale: 1,
    x: 0,
    y: 0
  };
  const clampPosition = () => {
    const w = state.naturalW * state.scale;
    const h = state.naturalH * state.scale;
    const minX = Math.min(0, viewportSize - w);
    const maxX = 0;
    const minY = Math.min(0, viewportSize - h);
    const maxY = 0;
    state.x = w <= viewportSize ? (viewportSize - w) / 2 : Math.min(maxX, Math.max(minX, state.x));
    state.y = h <= viewportSize ? (viewportSize - h) / 2 : Math.min(maxY, Math.max(minY, state.y));
  };
  const apply = () => {
    img.style.width = `${state.naturalW * state.scale}px`;
    img.style.height = `${state.naturalH * state.scale}px`;
    img.style.transform = `translate(${state.x}px, ${state.y}px)`;
  };
  img.onload = () => {
    state.naturalW = img.naturalWidth || 1;
    state.naturalH = img.naturalHeight || 1;
    state.minScale = Math.max(viewportSize / state.naturalW, viewportSize / state.naturalH);
    state.scale = state.minScale;
    state.x = (viewportSize - state.naturalW * state.scale) / 2;
    state.y = (viewportSize - state.naturalH * state.scale) / 2;
    apply();
  };
  let dragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragOriginX = 0;
  let dragOriginY = 0;
  viewport.onpointerdown = (event) => {
    dragging = true;
    viewport.setPointerCapture(event.pointerId);
    viewport.style.cursor = "grabbing";
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    dragOriginX = state.x;
    dragOriginY = state.y;
  };
  viewport.onpointermove = (event) => {
    if (!dragging) return;
    state.x = dragOriginX + (event.clientX - dragStartX);
    state.y = dragOriginY + (event.clientY - dragStartY);
    clampPosition();
    apply();
  };
  const endDrag = (event) => {
    if (!dragging) return;
    dragging = false;
    viewport.releasePointerCapture(event.pointerId);
    viewport.style.cursor = "grab";
  };
  viewport.onpointerup = endDrag;
  viewport.onpointercancel = endDrag;
  viewport.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      const delta = -event.deltaY;
      const factor = delta > 0 ? 1.08 : 1 / 1.08;
      const nextScale = Math.min(state.minScale * 6, Math.max(state.minScale, state.scale * factor));
      if (nextScale === state.scale) return;
      const rect = viewport.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      const ratio = nextScale / state.scale;
      state.x = mouseX - (mouseX - state.x) * ratio;
      state.y = mouseY - (mouseY - state.y) * ratio;
      state.scale = nextScale;
      clampPosition();
      apply();
    },
    { passive: false }
  );
  const sliderRow = wrap.createDiv();
  sliderRow.style.display = "flex";
  sliderRow.style.alignItems = "center";
  sliderRow.style.gap = "10px";
  sliderRow.style.width = `${viewportSize}px`;
  const sliderLabel = sliderRow.createSpan({ text: "\u7F29\u653E" });
  sliderLabel.style.fontSize = "12px";
  sliderLabel.style.color = "var(--text-muted)";
  const slider = sliderRow.createEl("input");
  slider.type = "range";
  slider.min = "1";
  slider.max = "6";
  slider.step = "0.01";
  slider.value = "1";
  slider.style.flex = "1";
  slider.oninput = () => {
    const ratio = parseFloat(slider.value);
    const nextScale = state.minScale * ratio;
    const centerX = viewportSize / 2;
    const centerY = viewportSize / 2;
    const k = nextScale / state.scale;
    state.x = centerX - (centerX - state.x) * k;
    state.y = centerY - (centerY - state.y) * k;
    state.scale = nextScale;
    clampPosition();
    apply();
  };
  const SIZE_STEPS = [96, 128, 192, 256, 384, 512];
  const DEFAULT_STEP_INDEX = (() => {
    const preferred = getDefaultCustomIconSize();
    let bestIdx = 3;
    let bestDelta = Number.POSITIVE_INFINITY;
    for (let i = 0; i < SIZE_STEPS.length; i++) {
      const delta = Math.abs(SIZE_STEPS[i] - preferred);
      if (delta < bestDelta) {
        bestDelta = delta;
        bestIdx = i;
      }
    }
    return bestIdx;
  })();
  const compressRow = wrap.createDiv();
  compressRow.style.display = "flex";
  compressRow.style.alignItems = "center";
  compressRow.style.gap = "10px";
  compressRow.style.width = `${viewportSize}px`;
  const compressLabel = compressRow.createSpan({ text: "\u8F93\u51FA\u5C3A\u5BF8" });
  compressLabel.style.fontSize = "12px";
  compressLabel.style.color = "var(--text-muted)";
  const sizeSlider = compressRow.createEl("input");
  sizeSlider.type = "range";
  sizeSlider.min = "0";
  sizeSlider.max = String(SIZE_STEPS.length - 1);
  sizeSlider.step = "1";
  sizeSlider.value = String(DEFAULT_STEP_INDEX);
  sizeSlider.style.flex = "1";
  const sizeValue = compressRow.createSpan({
    text: `${SIZE_STEPS[DEFAULT_STEP_INDEX]}px`
  });
  sizeValue.style.fontSize = "12px";
  sizeValue.style.color = "var(--text-muted)";
  sizeValue.style.minWidth = "52px";
  sizeValue.style.textAlign = "right";
  const fileSizeRow = wrap.createDiv();
  fileSizeRow.style.display = "flex";
  fileSizeRow.style.justifyContent = "center";
  fileSizeRow.style.width = `${viewportSize}px`;
  fileSizeRow.style.fontSize = "11px";
  fileSizeRow.style.color = "var(--text-muted)";
  fileSizeRow.style.marginTop = "-4px";
  const fileSizeLabel = fileSizeRow.createSpan({ text: "\u9884\u8BA1\u5927\u5C0F\uFF1A\u2014" });
  let sizePreviewTimer = null;
  const updateFileSizePreview = () => {
    if (!state.naturalW || !state.naturalH) {
      fileSizeLabel.setText("\u9884\u8BA1\u5927\u5C0F\uFF1A\u2014");
      return;
    }
    if (sizePreviewTimer !== null) {
      window.clearTimeout(sizePreviewTimer);
    }
    sizePreviewTimer = window.setTimeout(() => {
      const idx = parseInt(sizeSlider.value, 10);
      const outSize = SIZE_STEPS[Math.max(0, Math.min(SIZE_STEPS.length - 1, idx))];
      const preview = renderCroppedSquare(img, state, viewportSize, outSize);
      if (!preview) {
        fileSizeLabel.setText("\u9884\u8BA1\u5927\u5C0F\uFF1A\u2014");
        return;
      }
      fileSizeLabel.setText(`\u9884\u8BA1\u5927\u5C0F\uFF1A${formatByteSize(estimateDataUrlBytes(preview))}`);
    }, 40);
  };
  sizeSlider.oninput = () => {
    const idx = parseInt(sizeSlider.value, 10);
    sizeValue.setText(`${SIZE_STEPS[idx]}px`);
    updateFileSizePreview();
  };
  const refreshSizeOnCropChange = () => updateFileSizePreview();
  viewport.addEventListener("pointerup", refreshSizeOnCropChange);
  slider.addEventListener("input", refreshSizeOnCropChange);
  const prevOnLoad = img.onload;
  img.onload = function(ev) {
    if (typeof prevOnLoad === "function") prevOnLoad.call(img, ev);
    updateFileSizePreview();
  };
  const compressHint = wrap.createDiv();
  compressHint.setText("\u8F93\u51FA PNG\uFF08\u4FDD\u7559\u900F\u660E\uFF09\uFF0C\u5C3A\u5BF8\u8D8A\u5C0F\u4F53\u79EF\u8D8A\u5C0F");
  compressHint.style.fontSize = "11px";
  compressHint.style.color = "var(--text-muted)";
  compressHint.style.width = `${viewportSize}px`;
  compressHint.style.textAlign = "center";
  const actions = wrap.createDiv();
  actions.style.display = "flex";
  actions.style.justifyContent = "flex-end";
  actions.style.gap = "10px";
  actions.style.width = `${viewportSize}px`;
  const cancelBtn = actions.createEl("button", { text: "\u53D6\u6D88" });
  cancelBtn.type = "button";
  cancelBtn.style.padding = "8px 16px";
  cancelBtn.style.borderRadius = "999px";
  cancelBtn.style.border = "1px solid var(--background-modifier-border)";
  cancelBtn.style.background = "var(--background-secondary)";
  cancelBtn.style.cursor = "pointer";
  cancelBtn.onclick = () => modal.close();
  const okBtn = actions.createEl("button", { text: "\u786E\u5B9A" });
  okBtn.type = "button";
  okBtn.style.padding = "8px 18px";
  okBtn.style.borderRadius = "999px";
  okBtn.style.border = "0";
  okBtn.style.background = "var(--interactive-accent)";
  okBtn.style.color = "var(--text-on-accent)";
  okBtn.style.fontWeight = "800";
  okBtn.style.cursor = "pointer";
  okBtn.onclick = () => {
    const idx = parseInt(sizeSlider.value, 10);
    const outputSize = SIZE_STEPS[Math.max(0, Math.min(SIZE_STEPS.length - 1, idx))];
    const dataUrl = renderCroppedSquare(img, state, viewportSize, outputSize);
    if (dataUrl) {
      onConfirm(dataUrl);
    }
    modal.close();
  };
  modal.open();
}
function renderCroppedSquare(img, state, viewportSize, outputSize = 256) {
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return "";
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const sx = (0 - state.x) / state.scale;
  const sy = (0 - state.y) / state.scale;
  const sSize = viewportSize / state.scale;
  try {
    ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, outputSize, outputSize);
  } catch {
    return "";
  }
  try {
    return canvas.toDataURL("image/png");
  } catch {
    return "";
  }
}
function estimateDataUrlBytes(dataUrl) {
  const commaIdx = dataUrl.indexOf(",");
  if (commaIdx < 0) return 0;
  const b64 = dataUrl.slice(commaIdx + 1);
  let padding = 0;
  if (b64.endsWith("==")) padding = 2;
  else if (b64.endsWith("=")) padding = 1;
  return Math.max(0, Math.floor(b64.length * 3 / 4) - padding);
}
function formatByteSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
function createIconItem(modal, app, icon, onSelect) {
  const item = document.createElement("button");
  item.type = "button";
  item.className = "icon-item";
  item.title = icon.name;
  applyItemStyle(item);
  const img = document.createElement("img");
  img.src = getIconPath(icon.id);
  img.alt = icon.name;
  applyImageStyle(img);
  item.appendChild(img);
  item.onclick = () => {
    onSelect(icon);
    modal.close();
  };
  return item;
}
function applyGridStyle(el) {
  el.style.display = "grid";
  el.style.gridTemplateColumns = "repeat(auto-fill, minmax(56px, 1fr))";
  el.style.gap = "8px";
  el.style.overflow = "visible";
}
function applyItemStyle(el) {
  el.style.display = "flex";
  el.style.alignItems = "center";
  el.style.justifyContent = "center";
  el.style.width = "56px";
  el.style.height = "56px";
  el.style.padding = "2px";
  el.style.border = "1px solid transparent";
  el.style.borderRadius = "10px";
  el.style.background = "transparent";
  el.style.cursor = "pointer";
  el.style.transition = "transform 0.12s ease, background 0.12s ease, box-shadow 0.12s ease";
  el.style.position = "relative";
  el.onmouseenter = () => {
    el.style.transform = "scale(1.45)";
    el.style.zIndex = "10";
    el.style.background = "var(--background-secondary)";
    el.style.boxShadow = "0 6px 18px rgba(0,0,0,0.22)";
  };
  el.onmouseleave = () => {
    el.style.transform = "scale(1)";
    el.style.zIndex = "";
    el.style.background = "transparent";
    el.style.boxShadow = "none";
  };
}
function applyImageStyle(el) {
  el.style.width = "52px";
  el.style.height = "52px";
  el.style.maxWidth = "52px";
  el.style.maxHeight = "52px";
  el.style.objectFit = "contain";
}

// packages/ui-web/src/modals/shared/formFields.ts
var import_obsidian2 = require("obsidian");
function addTextField(containerEl, options) {
  const setting = new import_obsidian2.Setting(containerEl).setName(options.name);
  if (options.desc !== void 0) setting.setDesc(options.desc);
  setting.addText((text) => {
    if (options.placeholder !== void 0) text.setPlaceholder(options.placeholder);
    text.setValue(options.value);
    text.onChange(options.onChange);
  });
  return setting;
}
function addNumberField(containerEl, options) {
  const setting = new import_obsidian2.Setting(containerEl).setName(options.name);
  if (options.desc !== void 0) setting.setDesc(options.desc);
  setting.addText((text) => {
    text.inputEl.type = "number";
    if (options.min !== void 0) text.inputEl.min = String(options.min);
    if (options.max !== void 0) text.inputEl.max = String(options.max);
    if (options.placeholder !== void 0) text.setPlaceholder(options.placeholder);
    text.setValue(options.value ? String(options.value) : "");
    text.onChange((raw) => {
      options.onChange(Number(raw || 0));
    });
  });
  return setting;
}
function addDateField(containerEl, options) {
  const setting = new import_obsidian2.Setting(containerEl).setName(options.name);
  if (options.desc !== void 0) setting.setDesc(options.desc);
  setting.addText((text) => {
    const today = getTodayISODate();
    const maxValue = options.max === void 0 ? today : options.max === "today" ? today : options.max;
    text.inputEl.type = "date";
    if (maxValue) text.inputEl.max = maxValue;
    if (options.min !== void 0) text.inputEl.min = options.min;
    text.setValue(options.value || today);
    text.onChange((raw) => {
      const clamped = maxValue && raw > maxValue ? maxValue : raw;
      if (clamped !== raw) text.setValue(clamped);
      options.onChange(clamped);
    });
  });
  return setting;
}
function addToggleField(containerEl, options) {
  const setting = new import_obsidian2.Setting(containerEl).setName(options.name);
  if (options.desc !== void 0) setting.setDesc(options.desc);
  setting.addToggle((toggle) => {
    toggle.setValue(options.value);
    toggle.onChange(options.onChange);
  });
  return setting;
}
function addDropdownField(containerEl, options) {
  const setting = new import_obsidian2.Setting(containerEl).setName(options.name);
  if (options.desc !== void 0) setting.setDesc(options.desc);
  setting.addDropdown((dropdown) => {
    options.options.forEach((opt) => dropdown.addOption(opt.value, opt.label));
    dropdown.setValue(options.value);
    dropdown.onChange(options.onChange);
  });
  return setting;
}

// packages/ui-web/src/modals/accessoryModal.ts
var AccessoryModal = class extends import_obsidian3.Modal {
  constructor(app, accessory, onSave, defaultBuyDate = getTodayISODate()) {
    super(app);
    this.onSave = onSave;
    this.state = accessory ? { ...accessory } : {
      id: crypto.randomUUID(),
      icon: "",
      name: "",
      price: 0,
      buy_date: defaultBuyDate,
      include_total: true
    };
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "\u9644\u52A0\u7269\u54C1" });
    this.renderIconSetting(contentEl);
    this.renderNameSetting(contentEl);
    this.renderPriceSetting(contentEl);
    this.renderBuyDateSetting(contentEl);
    this.renderIncludeTotalSetting(contentEl);
    this.renderActions(contentEl);
  }
  renderIconSetting(contentEl) {
    const iconSetting = new import_obsidian3.Setting(contentEl).setName("\u56FE\u6807").setDesc(this.getIconDescription()).addButton((button) => {
      button.setButtonText("\u9009\u62E9\u56FE\u6807");
      button.onClick(() => {
        openIconPicker(this.app, (icon) => {
          this.state.icon = icon.id;
          iconSetting.setDesc(this.getIconDescription());
          this.renderSelectedIconPreview(iconSetting.controlEl);
        });
      });
    });
    this.renderSelectedIconPreview(iconSetting.controlEl);
  }
  renderSelectedIconPreview(controlEl) {
    controlEl.find(".obsiwealth-selected-icon")?.remove();
    const preview = controlEl.createDiv("obsiwealth-selected-icon");
    preview.style.display = "flex";
    preview.style.alignItems = "center";
    preview.style.justifyContent = "center";
    preview.style.width = "36px";
    preview.style.height = "36px";
    preview.style.borderRadius = "8px";
    preview.style.background = "var(--background-modifier-hover)";
    preview.style.overflow = "hidden";
    preview.style.marginRight = "8px";
    preview.style.order = "-1";
    const icon = findIcon(this.state.icon);
    if (!icon) {
      preview.setText("\u{1F4E6}");
      return;
    }
    const img = preview.createEl("img");
    img.src = getIconPath(icon.id);
    img.alt = icon.name;
    img.style.width = "32px";
    img.style.height = "32px";
    img.style.objectFit = "contain";
  }
  getIconDescription() {
    const icon = findIcon(this.state.icon);
    return `\u5F53\u524D: ${icon?.name ?? (this.state.icon || "\u672A\u586B\u5199")}`;
  }
  renderNameSetting(contentEl) {
    addTextField(contentEl, {
      name: "\u540D\u79F0",
      value: this.state.name,
      onChange: (value) => {
        this.state.name = value;
      }
    });
  }
  renderPriceSetting(contentEl) {
    addNumberField(contentEl, {
      name: "\u91D1\u989D",
      value: this.state.price,
      min: 0,
      onChange: (value) => {
        this.state.price = value;
      }
    });
  }
  renderBuyDateSetting(contentEl) {
    addDateField(contentEl, {
      name: "\u8D2D\u4E70\u65F6\u95F4",
      value: this.state.buy_date,
      max: "today",
      onChange: (value) => {
        this.state.buy_date = value;
      }
    });
  }
  renderIncludeTotalSetting(contentEl) {
    addToggleField(contentEl, {
      name: "\u8BA1\u5165\u603B\u4EF7",
      desc: "\u5F00\u542F\u540E\u4F1A\u8BA1\u5165\u8D44\u4EA7\u603B\u4EF7\u3001\u603B\u8D44\u4EA7\u548C\u65E5\u5747\u6210\u672C",
      value: this.state.include_total,
      onChange: (value) => {
        this.state.include_total = value;
      }
    });
  }
  renderActions(contentEl) {
    new import_obsidian3.Setting(contentEl).addButton((button) => {
      button.setButtonText("\u4FDD\u5B58");
      button.setCta();
      button.onClick(() => this.save());
    });
  }
  save() {
    if (!this.state.name.trim()) {
      notify("\u8BF7\u8F93\u5165\u9644\u52A0\u7269\u54C1\u540D\u79F0");
      return;
    }
    if (this.state.price < 0) {
      notify("\u91D1\u989D\u4E0D\u80FD\u5C0F\u4E8E 0");
      return;
    }
    this.onSave({ ...this.state, name: this.state.name.trim() });
    this.close();
  }
};

// packages/ui-web/src/modals/wishlistModal.ts
var WishlistModal = class extends import_obsidian4.Modal {
  constructor(app, plugin, item) {
    super(app);
    this.plugin = plugin;
    this.item = item;
    this.state = item ? {
      id: item.id,
      icon: item.icon,
      name: item.name,
      priceHistory: [...item.priceHistory],
      accessories: [...item.accessories ?? []]
    } : {
      id: crypto.randomUUID(),
      icon: "",
      name: "",
      priceHistory: [{ id: crypto.randomUUID(), price: 0, date: getTodayISODate() }],
      accessories: []
    };
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: this.item ? "\u7F16\u8F91\u5FC3\u613F" : "\u65B0\u589E\u5FC3\u613F" });
    this.renderIconSetting(contentEl);
    this.renderNameSetting(contentEl);
    this.renderPricesSection(contentEl);
    this.renderAccessoriesSection(contentEl);
    this.renderSaveButton(contentEl);
  }
  renderIconSetting(contentEl) {
    const iconSetting = new import_obsidian4.Setting(contentEl).setName("\u56FE\u6807").setDesc(this.getIconDescription()).addButton((button) => {
      button.setButtonText("\u9009\u62E9\u56FE\u6807");
      button.onClick(() => {
        openIconPicker(this.app, (icon) => {
          this.state.icon = icon.id;
          iconSetting.setDesc(this.getIconDescription());
          this.renderSelectedIconPreview(iconSetting.controlEl);
        });
      });
    });
    this.renderSelectedIconPreview(iconSetting.controlEl);
  }
  renderSelectedIconPreview(controlEl) {
    controlEl.find(".obsiwealth-selected-icon")?.remove();
    const preview = controlEl.createDiv("obsiwealth-selected-icon");
    preview.style.display = "flex";
    preview.style.alignItems = "center";
    preview.style.justifyContent = "center";
    preview.style.width = "36px";
    preview.style.height = "36px";
    preview.style.borderRadius = "8px";
    preview.style.background = "var(--background-modifier-hover)";
    preview.style.overflow = "hidden";
    preview.style.marginRight = "8px";
    preview.style.order = "-1";
    const icon = findIcon(this.state.icon);
    if (!icon) {
      preview.setText("\u2661");
      return;
    }
    const img = preview.createEl("img");
    img.src = getIconPath(icon.id);
    img.alt = icon.name;
    img.style.width = "32px";
    img.style.height = "32px";
    img.style.objectFit = "contain";
  }
  getIconDescription() {
    const icon = findIcon(this.state.icon);
    return `\u5F53\u524D: ${icon?.name ?? (this.state.icon || "\u672A\u586B\u5199")}`;
  }
  renderNameSetting(contentEl) {
    new import_obsidian4.Setting(contentEl).setName("\u540D\u79F0").addText((text) => {
      text.setValue(this.state.name);
      text.onChange((value) => {
        this.state.name = value;
      });
    });
  }
  renderPricesSection(contentEl) {
    const title = contentEl.createEl("h3", { text: "\u4EF7\u683C\u8BB0\u5F55" });
    title.style.margin = "18px 0 10px";
    this.state.priceHistory.forEach((price) => {
      const setting = new import_obsidian4.Setting(contentEl).setName("\u4EF7\u683C");
      setting.addText((text) => {
        text.inputEl.type = "number";
        text.inputEl.min = "0";
        text.setValue(String(price.price || ""));
        text.onChange((value) => {
          price.price = Number(value || 0);
        });
      });
      setting.addText((text) => {
        const today = getTodayISODate();
        text.inputEl.type = "date";
        text.inputEl.max = today;
        text.setValue(price.date || today);
        text.onChange((value) => {
          price.date = value > today ? today : value;
          text.setValue(price.date);
        });
      });
      setting.addButton((button) => {
        button.setButtonText("\u5220\u9664");
        button.onClick(() => {
          if (this.state.priceHistory.length <= 1) {
            notify("\u81F3\u5C11\u4FDD\u7559\u4E00\u6761\u4EF7\u683C");
            return;
          }
          this.state.priceHistory = this.state.priceHistory.filter((item) => item.id !== price.id);
          this.onOpen();
        });
      });
    });
    new import_obsidian4.Setting(contentEl).addButton((button) => {
      button.setButtonText("\u6DFB\u52A0\u4EF7\u683C");
      button.onClick(() => {
        this.state.priceHistory.push({ id: crypto.randomUUID(), price: 0, date: getTodayISODate() });
        this.onOpen();
      });
    });
  }
  renderAccessoriesSection(contentEl) {
    const title = contentEl.createEl("h3", { text: "\u9644\u52A0\u7269\u54C1" });
    title.style.margin = "18px 0 10px";
    const grid = contentEl.createDiv();
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(auto-fill, minmax(210px, 1fr))";
    grid.style.gap = "10px";
    this.state.accessories.forEach((accessory) => this.renderAccessoryCard(grid, accessory));
    this.renderAddAccessoryCard(grid);
  }
  renderAccessoryCard(parent, accessory) {
    const card = parent.createDiv();
    card.style.display = "grid";
    card.style.gridTemplateColumns = "46px 1fr auto";
    card.style.gap = "10px";
    card.style.alignItems = "center";
    card.style.padding = "10px";
    card.style.borderRadius = "14px";
    card.style.background = "var(--background-secondary)";
    card.style.border = "1px solid var(--background-modifier-border)";
    const iconWrap = card.createDiv();
    iconWrap.style.width = "46px";
    iconWrap.style.height = "46px";
    iconWrap.style.display = "flex";
    iconWrap.style.alignItems = "center";
    iconWrap.style.justifyContent = "center";
    iconWrap.style.overflow = "hidden";
    const icon = findIcon(accessory.icon);
    if (!icon) {
      iconWrap.setText("\u{1F4E6}");
      iconWrap.style.fontSize = "28px";
    } else {
      const img = iconWrap.createEl("img");
      img.src = getIconPath(icon.id);
      img.alt = icon.name;
      img.style.width = "42px";
      img.style.height = "42px";
      img.style.objectFit = "contain";
    }
    const info = card.createDiv();
    info.style.display = "flex";
    info.style.flexDirection = "column";
    info.style.gap = "3px";
    info.style.minWidth = "0";
    const name = info.createDiv({ text: accessory.name });
    name.style.fontSize = "14px";
    name.style.fontWeight = "850";
    name.style.whiteSpace = "nowrap";
    name.style.overflow = "hidden";
    name.style.textOverflow = "ellipsis";
    const price = info.createDiv({ text: `${this.plugin.settings.currencySymbol} ${accessory.price}` });
    price.style.fontSize = "13px";
    price.style.fontWeight = "750";
    const date = info.createDiv({ text: accessory.buy_date });
    date.style.fontSize = "12px";
    date.style.color = "var(--text-muted)";
    const actions = card.createDiv();
    actions.style.display = "flex";
    actions.style.flexDirection = "column";
    actions.style.gap = "6px";
    this.createAccessoryActionButton(actions, "\u270E", "\u4FEE\u6539", () => this.editAccessory(accessory));
    this.createAccessoryActionButton(actions, "\u232B", "\u5220\u9664", () => this.deleteAccessory(accessory.id), true);
  }
  renderAddAccessoryCard(parent) {
    const card = parent.createDiv({ text: "+" });
    card.title = "\u6DFB\u52A0\u9644\u52A0\u7269\u54C1";
    card.style.minHeight = "68px";
    card.style.display = "flex";
    card.style.alignItems = "center";
    card.style.justifyContent = "center";
    card.style.borderRadius = "14px";
    card.style.border = "1px dashed var(--background-modifier-border)";
    card.style.background = "var(--background-primary)";
    card.style.color = "var(--text-muted)";
    card.style.fontSize = "34px";
    card.style.fontWeight = "850";
    card.style.cursor = "pointer";
    card.onclick = () => this.editAccessory();
  }
  createAccessoryActionButton(parent, text, title, onClick, danger = false) {
    const button = parent.createEl("button", { text });
    button.type = "button";
    button.title = title;
    button.style.width = "28px";
    button.style.height = "28px";
    button.style.padding = "0";
    button.style.borderRadius = "999px";
    button.style.border = "1px solid var(--background-modifier-border)";
    button.style.background = danger ? "#fee2e2" : "var(--background-primary)";
    button.style.color = danger ? "#dc2626" : "var(--text-normal)";
    button.style.cursor = "pointer";
    button.onclick = onClick;
  }
  editAccessory(accessory) {
    new AccessoryModal(this.app, accessory, (nextAccessory) => {
      const index = this.state.accessories.findIndex((item) => item.id === nextAccessory.id);
      if (index === -1) {
        this.state.accessories.push(nextAccessory);
      } else {
        this.state.accessories[index] = nextAccessory;
      }
      this.onOpen();
    }).open();
  }
  deleteAccessory(id) {
    this.state.accessories = this.state.accessories.filter((item) => item.id !== id);
    this.onOpen();
  }
  renderSaveButton(contentEl) {
    new import_obsidian4.Setting(contentEl).addButton((button) => {
      button.setButtonText("\u4FDD\u5B58");
      button.setCta();
      button.onClick(() => this.save());
    });
  }
  async save() {
    const name = this.state.name.trim();
    if (!name) {
      notify("\u8BF7\u8F93\u5165\u5FC3\u613F\u540D\u79F0");
      return;
    }
    const priceHistory = this.state.priceHistory.filter((price) => price.date && price.price >= 0).sort((a, b) => a.date.localeCompare(b.date));
    if (priceHistory.length === 0) {
      notify("\u8BF7\u81F3\u5C11\u586B\u5199\u4E00\u6761\u4EF7\u683C");
      return;
    }
    const nextItem = {
      id: this.state.id,
      icon: this.state.icon,
      name,
      priceHistory,
      accessories: this.state.accessories
    };
    if (this.item) {
      await this.plugin.updateWishlistItem(nextItem);
      notify("\u5DF2\u66F4\u65B0\u5FC3\u613F");
    } else {
      await this.plugin.addWishlistItem(nextItem);
      notify("\u5DF2\u6DFB\u52A0\u5FC3\u613F");
    }
    this.close();
  }
};

// packages/ui-web/src/charts/chartAxis.ts
function formatAxisValue(value) {
  if (value === 0) {
    return "0";
  }
  const abs = Math.abs(value);
  if (abs >= 1e8) {
    return `${(value / 1e8).toFixed(abs >= 10 * 1e8 ? 0 : 1)}\u4EBF`;
  }
  if (abs >= 1e4) {
    return `${(value / 1e4).toFixed(abs >= 10 * 1e4 ? 0 : 1)}\u4E07`;
  }
  if (abs >= 1e3) {
    return `${(value / 1e3).toFixed(abs >= 1e4 ? 0 : 1)}k`;
  }
  return String(Math.round(value));
}
function createSmoothPath(points) {
  if (points.length === 0) {
    return "";
  }
  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }
  const path = [`M ${points[0].x} ${points[0].y}`];
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const controlDistance = (next.x - current.x) / 2;
    const controlStartX = current.x + controlDistance;
    const controlEndX = next.x - controlDistance;
    path.push(`C ${controlStartX} ${current.y}, ${controlEndX} ${next.y}, ${next.x} ${next.y}`);
  }
  return path.join(" ");
}
function polarToCartesian(cx, cy, radius, angle) {
  const radians = (angle - 90) * Math.PI / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians)
  };
}
function describeDonutSlice(cx, cy, outerRadius, innerRadius, startAngle, endAngle) {
  const outerStart = polarToCartesian(cx, cy, outerRadius, endAngle);
  const outerEnd = polarToCartesian(cx, cy, outerRadius, startAngle);
  const innerStart = polarToCartesian(cx, cy, innerRadius, startAngle);
  const innerEnd = polarToCartesian(cx, cy, innerRadius, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${innerEnd.x} ${innerEnd.y}`,
    "Z"
  ].join(" ");
}

// packages/ui-web/src/pages/wishlistPage.ts
function renderWishlistPage(ctx, el) {
  const items = ctx.plugin.wishlist;
  const totalValue = items.reduce(
    (sum, item) => sum + getWishlistCurrentPrice(item) + getWishlistAccessoriesTotal(item),
    0
  );
  const card = ctx.createStatsHeroCard(el, ctx.tr("wishlistTotal"));
  ctx.applyStickyTop(card);
  const value = card.createDiv();
  value.style.fontSize = "44px";
  value.style.fontWeight = "950";
  value.style.lineHeight = "1.05";
  value.style.color = "var(--text-normal)";
  value.style.display = "flex";
  renderSlotNumber(value.createDiv(), ctx.displayCurrency(totalValue));
  const desc = card.createDiv();
  desc.style.marginTop = "12px";
  desc.style.fontSize = "16px";
  desc.style.fontWeight = "800";
  desc.style.color = "var(--text-muted)";
  desc.style.display = "flex";
  desc.style.justifyContent = "center";
  renderSlotNumber(
    desc.createSpan(),
    items.length > 0 ? `${items.length} \u4E2A\u5FC3\u613F` : ctx.tr("noWishlistData")
  );
  const grid = el.createDiv();
  ctx.applyGridStyle(grid);
  items.forEach((item) => renderWishlistCard(ctx, grid, item));
  renderAddWishlistCard(ctx, grid);
}
function renderWishlistCard(ctx, grid, item) {
  const card = grid.createDiv();
  ctx.applyCardStyle(card);
  card.style.display = "grid";
  card.style.gridTemplateColumns = "minmax(220px, 0.8fr) minmax(0, 1.6fr)";
  card.style.alignItems = "stretch";
  card.style.justifyContent = "stretch";
  card.style.gap = "20px";
  card.style.padding = "48px 22px 22px 22px";
  card.style.minHeight = "260px";
  card.onclick = () => new WishlistModal(ctx.app, ctx.plugin, item).open();
  renderWishlistActions(ctx, card, item);
  const left = card.createDiv();
  left.style.display = "flex";
  left.style.flexDirection = "column";
  left.style.alignItems = "flex-start";
  left.style.justifyContent = "flex-start";
  left.style.gap = "10px";
  left.style.minWidth = "0";
  renderWishlistIcon(ctx, left, item);
  const info = left.createDiv();
  info.style.minWidth = "0";
  info.style.maxWidth = "100%";
  info.style.display = "flex";
  info.style.flexDirection = "column";
  info.style.gap = "4px";
  const name = info.createDiv({ text: item.name });
  name.style.fontSize = "22px";
  name.style.fontWeight = "850";
  name.style.color = "var(--text-normal)";
  name.style.whiteSpace = "nowrap";
  name.style.overflow = "hidden";
  name.style.textOverflow = "ellipsis";
  const currentPrice = getWishlistCurrentPrice(item);
  const totalPrice = currentPrice + getWishlistAccessoriesTotal(item);
  const price = info.createDiv();
  price.style.fontSize = "28px";
  price.style.fontWeight = "950";
  price.style.color = "var(--text-normal)";
  price.style.display = "flex";
  renderSlotNumber(price.createSpan(), ctx.displayCurrency(totalPrice));
  const meta = info.createDiv();
  meta.style.fontSize = "13px";
  meta.style.fontWeight = "800";
  meta.style.color = "var(--text-muted)";
  meta.style.display = "flex";
  renderSlotNumber(
    meta.createSpan(),
    `${item.priceHistory.length} \u6761\u4EF7\u683C \xB7 ${(item.accessories ?? []).length} \u4E2A\u9644\u52A0\u7269\u54C1`
  );
  const chartCol = card.createDiv();
  chartCol.style.display = "flex";
  chartCol.style.alignItems = "stretch";
  chartCol.style.justifyContent = "stretch";
  chartCol.style.minWidth = "0";
  renderWishlistTrendChart(ctx, chartCol, item);
}
function renderWishlistActions(ctx, card, item) {
  const actions = card.createDiv();
  actions.style.position = "absolute";
  actions.style.top = "6px";
  actions.style.right = "6px";
  actions.style.display = "flex";
  actions.style.gap = "6px";
  actions.style.opacity = "0";
  actions.style.transition = "opacity 0.15s";
  card.addEventListener("mouseenter", () => {
    actions.style.opacity = "1";
  });
  card.addEventListener("mouseleave", () => {
    actions.style.opacity = "0";
  });
  ctx.createActionButton(actions, "\u270E", ctx.tr("edit"), () => {
    new WishlistModal(ctx.app, ctx.plugin, item).open();
  });
  ctx.createActionButton(
    actions,
    "\u232B",
    ctx.tr("delete"),
    async () => {
      if (confirm(ctx.tr("deleteConfirm", { name: item.name }))) {
        await ctx.plugin.deleteWishlistItem(item.id);
      }
    },
    true
  );
}
function renderWishlistIcon(ctx, parent, item) {
  const iconWrap = parent.createDiv();
  iconWrap.style.display = "flex";
  iconWrap.style.alignItems = "center";
  iconWrap.style.justifyContent = "center";
  iconWrap.style.width = "82px";
  iconWrap.style.height = "82px";
  iconWrap.style.overflow = "visible";
  const icon = findIcon(item.icon);
  if (!icon) {
    iconWrap.setText("\u2661");
    iconWrap.style.fontSize = "56px";
    iconWrap.style.lineHeight = "1";
    return;
  }
  const img = iconWrap.createEl("img");
  img.src = getIconPath(icon.id);
  img.alt = icon.name;
  img.style.width = "78px";
  img.style.height = "78px";
  img.style.objectFit = "contain";
}
function renderWishlistTrendChart(ctx, parent, item) {
  const wrap = parent.createDiv();
  wrap.style.position = "relative";
  wrap.style.flex = "1 1 auto";
  wrap.style.alignSelf = "stretch";
  wrap.style.background = "transparent";
  wrap.style.border = "none";
  wrap.style.padding = "0";
  wrap.style.boxSizing = "border-box";
  wrap.style.minHeight = "190px";
  wrap.style.display = "flex";
  const points = [...item.priceHistory].sort((a, b) => a.date.localeCompare(b.date)).filter((p) => Number.isFinite(p.price));
  if (points.length === 0) {
    renderChartPlaceholder(wrap, "\u6682\u65E0\u4EF7\u683C\u8BB0\u5F55");
    return;
  }
  if (points.length === 1) {
    renderChartPlaceholder(wrap, `\u5355\u6761\u8BB0\u5F55 \xB7 ${ctx.displayCurrency(points[0].price)}`);
    return;
  }
  const Y_AXIS_FONT = 17;
  const X_AXIS_FONT = 13;
  const Y_LABEL_WIDTH = 64;
  const X_LABEL_HEIGHT = 30;
  const TOP_PAD = 14;
  const RIGHT_PAD = 14;
  const layout = wrap.createDiv();
  layout.style.position = "relative";
  layout.style.flex = "1 1 auto";
  layout.style.alignSelf = "stretch";
  layout.style.minHeight = "190px";
  const plot = layout.createDiv();
  plot.style.position = "absolute";
  plot.style.left = `${Y_LABEL_WIDTH}px`;
  plot.style.right = `${RIGHT_PAD}px`;
  plot.style.top = `${TOP_PAD}px`;
  plot.style.bottom = `${X_LABEL_HEIGHT}px`;
  const yAxis = layout.createDiv();
  yAxis.style.position = "absolute";
  yAxis.style.left = "0";
  yAxis.style.top = `${TOP_PAD}px`;
  yAxis.style.bottom = `${X_LABEL_HEIGHT}px`;
  yAxis.style.width = `${Y_LABEL_WIDTH}px`;
  yAxis.style.pointerEvents = "none";
  const xAxis = layout.createDiv();
  xAxis.style.position = "absolute";
  xAxis.style.left = `${Y_LABEL_WIDTH}px`;
  xAxis.style.right = `${RIGHT_PAD}px`;
  xAxis.style.bottom = "0";
  xAxis.style.height = `${X_LABEL_HEIGHT}px`;
  xAxis.style.pointerEvents = "none";
  const values = points.map((p) => p.price);
  const rawMax = Math.max(...values);
  const rawMin = Math.min(...values);
  const span = rawMax - rawMin;
  let yMin;
  let yMax;
  if (span <= 0) {
    const v = rawMax;
    const pad = Math.max(Math.abs(v) * 0.1, 1);
    yMin = v - pad;
    yMax = v + pad;
  } else {
    const pad = span * 0.08;
    yMax = rawMax + pad;
    yMin = rawMin - pad;
    if (rawMin > 0 && rawMin < span * 0.2) {
      yMin = 0;
    }
  }
  const yRange = yMax - yMin || 1;
  const dateMs = points.map((p) => parseDateMs(p.date));
  const tMin = dateMs[0];
  const tMax = dateMs[dateMs.length - 1];
  const tRange = Math.max(1, tMax - tMin);
  const xTickCount = Math.min(7, Math.max(2, points.length));
  const Y_TICK_COUNT = 5;
  const yTicks = [];
  for (let i = 0; i < Y_TICK_COUNT; i += 1) {
    yTicks.push(yMin + yRange * i / (Y_TICK_COUNT - 1));
  }
  yTicks.forEach((value, tickIndex) => {
    const ratio = tickIndex / (Y_TICK_COUNT - 1);
    const bottomPct = ratio * 100;
    if (tickIndex > 0) {
      const grid = plot.createDiv();
      grid.style.position = "absolute";
      grid.style.left = "0";
      grid.style.right = "0";
      grid.style.bottom = `${bottomPct}%`;
      grid.style.height = "0";
      grid.style.borderTop = "1px dashed var(--background-modifier-border)";
      grid.style.pointerEvents = "none";
    }
    const label = yAxis.createDiv({ text: formatAxisValue(value) });
    label.style.position = "absolute";
    label.style.right = "8px";
    label.style.bottom = `calc(${bottomPct}% - ${Y_AXIS_FONT / 2}px)`;
    label.style.fontSize = `${Y_AXIS_FONT}px`;
    label.style.fontWeight = "900";
    label.style.color = "var(--text-muted)";
    label.style.lineHeight = "1";
    label.style.whiteSpace = "nowrap";
  });
  for (let i = 0; i < xTickCount; i += 1) {
    const ratio = xTickCount === 1 ? 0.5 : i / (xTickCount - 1);
    const ms = tMin + ratio * tRange;
    const tick = plot.createDiv();
    tick.style.position = "absolute";
    tick.style.left = `${ratio * 100}%`;
    tick.style.bottom = "-5px";
    tick.style.width = "0";
    tick.style.height = "5px";
    tick.style.borderLeft = "2px solid var(--background-modifier-border)";
    tick.style.transform = "translateX(-1px)";
    tick.style.pointerEvents = "none";
    const prevMs = i === 0 ? null : tMin + (i - 1) / (xTickCount - 1) * tRange;
    const label = xAxis.createDiv({ text: formatXTickLabel(ms, prevMs) });
    label.style.position = "absolute";
    label.style.left = `${ratio * 100}%`;
    label.style.top = "8px";
    label.style.fontSize = `${X_AXIS_FONT}px`;
    label.style.fontWeight = "900";
    label.style.color = "var(--text-muted)";
    label.style.lineHeight = "1";
    label.style.whiteSpace = "nowrap";
    if (i === 0) {
      label.style.transform = "translateX(0)";
    } else if (i === xTickCount - 1) {
      label.style.transform = "translateX(-100%)";
    } else {
      label.style.transform = "translateX(-50%)";
    }
  }
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 1000 1000`);
  svg.setAttribute("preserveAspectRatio", "none");
  svg.style.position = "absolute";
  svg.style.left = "0";
  svg.style.top = "0";
  svg.style.width = "100%";
  svg.style.height = "100%";
  svg.style.display = "block";
  svg.style.overflow = "visible";
  const xForMs = (ms) => (ms - tMin) / tRange * 1e3;
  const yForValue = (value) => (1 - (value - yMin) / yRange) * 1e3;
  const positions = points.map((point, index) => ({
    point,
    index,
    x: xForMs(dateMs[index]),
    y: yForValue(point.price)
  }));
  const axis = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  axis.setAttribute("points", `0,0 0,1000 1000,1000`);
  axis.setAttribute("fill", "none");
  axis.setAttribute("stroke", "var(--background-modifier-border)");
  axis.setAttribute("stroke-width", "1");
  axis.setAttribute("vector-effect", "non-scaling-stroke");
  svg.appendChild(axis);
  let pathData = "";
  positions.forEach((p, index) => {
    pathData += `${index === 0 ? "M" : "L"} ${p.x} ${p.y} `;
  });
  const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
  line.setAttribute("d", pathData.trim());
  line.setAttribute("fill", "none");
  line.setAttribute("stroke", "#60a5fa");
  line.setAttribute("stroke-width", "3");
  line.setAttribute("stroke-linecap", "round");
  line.setAttribute("stroke-linejoin", "round");
  line.setAttribute("vector-effect", "non-scaling-stroke");
  svg.appendChild(line);
  if (ctx.plugin.settings.showChartDots) {
    positions.forEach((p) => {
      const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      dot.setAttribute("cx", String(p.x));
      dot.setAttribute("cy", String(p.y));
      dot.setAttribute("r", "5");
      dot.setAttribute("fill", "var(--background-secondary)");
      dot.setAttribute("stroke", "#60a5fa");
      dot.setAttribute("stroke-width", "3");
      dot.setAttribute("vector-effect", "non-scaling-stroke");
      svg.appendChild(dot);
    });
  }
  const guide = document.createElementNS("http://www.w3.org/2000/svg", "line");
  guide.setAttribute("y1", "0");
  guide.setAttribute("y2", "1000");
  guide.setAttribute("stroke", "var(--text-muted)");
  guide.setAttribute("stroke-width", "1");
  guide.setAttribute("stroke-dasharray", "4 4");
  guide.setAttribute("opacity", "0");
  guide.setAttribute("pointer-events", "none");
  guide.setAttribute("vector-effect", "non-scaling-stroke");
  svg.appendChild(guide);
  const hoverDot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  hoverDot.setAttribute("r", "6");
  hoverDot.setAttribute("fill", "#60a5fa");
  hoverDot.setAttribute("stroke", "var(--background-secondary)");
  hoverDot.setAttribute("stroke-width", "2");
  hoverDot.setAttribute("opacity", "0");
  hoverDot.setAttribute("pointer-events", "none");
  hoverDot.setAttribute("vector-effect", "non-scaling-stroke");
  svg.appendChild(hoverDot);
  plot.appendChild(svg);
  const tooltip = wrap.createDiv();
  tooltip.style.position = "absolute";
  tooltip.style.display = "none";
  tooltip.style.pointerEvents = "none";
  tooltip.style.padding = "9px 11px";
  tooltip.style.borderRadius = "12px";
  tooltip.style.background = "var(--background-primary)";
  tooltip.style.border = "1px solid var(--background-modifier-border)";
  tooltip.style.boxShadow = "0 12px 28px rgba(0,0,0,0.2)";
  tooltip.style.fontSize = "13px";
  tooltip.style.fontWeight = "900";
  tooltip.style.zIndex = "2";
  tooltip.style.lineHeight = "1.5";
  tooltip.style.whiteSpace = "nowrap";
  const hideHover = () => {
    guide.setAttribute("opacity", "0");
    hoverDot.setAttribute("opacity", "0");
    tooltip.style.display = "none";
  };
  positions.forEach((p, index) => {
    const prevX = index > 0 ? positions[index - 1].x : 0;
    const nextX = index < positions.length - 1 ? positions[index + 1].x : 1e3;
    const hitX = index === 0 ? 0 : (prevX + p.x) / 2;
    const hitWidth = index === positions.length - 1 ? 1e3 - hitX : (p.x + nextX) / 2 - hitX;
    const hit = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    hit.setAttribute("x", String(hitX));
    hit.setAttribute("y", "0");
    hit.setAttribute("width", String(Math.max(hitWidth, 4)));
    hit.setAttribute("height", "1000");
    hit.setAttribute("fill", "transparent");
    hit.setAttribute("pointer-events", "all");
    hit.style.cursor = "pointer";
    const showHover = () => {
      guide.setAttribute("x1", String(p.x));
      guide.setAttribute("x2", String(p.x));
      guide.setAttribute("opacity", "1");
      hoverDot.setAttribute("cx", String(p.x));
      hoverDot.setAttribute("cy", String(p.y));
      hoverDot.setAttribute("opacity", "1");
      tooltip.empty();
      const dateText = tooltip.createDiv({ text: formatTooltipDate(p.point.date) });
      dateText.style.color = "var(--text-muted)";
      dateText.style.fontSize = "12px";
      dateText.style.fontWeight = "700";
      dateText.style.marginBottom = "2px";
      const valueText = tooltip.createDiv({ text: ctx.displayCurrency(p.point.price) });
      valueText.style.fontSize = "15px";
      valueText.style.fontWeight = "900";
      valueText.style.color = "var(--text-normal)";
      if (index > 0) {
        const prev = positions[index - 1].point.price;
        const delta = p.point.price - prev;
        const sign = delta > 0 ? "+" : delta < 0 ? "-" : "\xB1";
        const color = delta > 0 ? "#22c55e" : delta < 0 ? "#ef4444" : "var(--text-muted)";
        const deltaText = tooltip.createDiv({
          text: `${sign}${ctx.displayCurrency(Math.abs(delta))}`
        });
        deltaText.style.fontSize = "13px";
        deltaText.style.fontWeight = "800";
        deltaText.style.color = color;
        deltaText.style.marginTop = "2px";
        const hint = tooltip.createDiv({ text: "\u8F83\u4E0A\u671F" });
        hint.style.fontSize = "11px";
        hint.style.fontWeight = "600";
        hint.style.color = "var(--text-faint)";
      }
      const plotRect = plot.getBoundingClientRect();
      const wrapRect = wrap.getBoundingClientRect();
      const plotOffsetX = plotRect.left - wrapRect.left;
      const plotOffsetY = plotRect.top - wrapRect.top;
      const px = plotOffsetX + p.x / 1e3 * plotRect.width;
      const py = plotOffsetY + p.y / 1e3 * plotRect.height;
      const wrapWidth = wrap.clientWidth || 1;
      tooltip.style.left = `${Math.min(Math.max(px - 72, 8), Math.max(wrapWidth - 160, 8))}px`;
      tooltip.style.top = `${Math.max(py - 64, 8)}px`;
      tooltip.style.display = "block";
    };
    hit.onmouseenter = showHover;
    hit.onmousemove = showHover;
    hit.onmouseleave = hideHover;
    svg.appendChild(hit);
  });
}
function renderChartPlaceholder(wrap, text) {
  wrap.style.alignItems = "center";
  wrap.style.justifyContent = "center";
  wrap.style.color = "var(--text-muted)";
  wrap.style.fontSize = "13px";
  wrap.style.fontWeight = "850";
  wrap.setText(text);
}
function parseDateMs(iso) {
  const t2 = Date.parse(iso);
  return Number.isFinite(t2) ? t2 : 0;
}
function formatXTickLabel(ms, prevMs) {
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const showYear = prevMs === null || new Date(prevMs).getFullYear() !== y;
  return showYear ? `${y}-${m}\u6708` : `${m}\u6708`;
}
function formatTooltipDate(iso) {
  const parts = iso.split("-");
  if (parts.length >= 3) {
    const y = parts[0];
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (!Number.isNaN(m) && !Number.isNaN(d)) {
      return `${y}\u5E74${m}\u6708${d}\u65E5`;
    }
  }
  return iso;
}
function renderAddWishlistCard(ctx, grid) {
  const card = grid.createDiv();
  card.style.minHeight = "132px";
  card.style.display = "flex";
  card.style.alignItems = "center";
  card.style.justifyContent = "center";
  card.style.borderRadius = "21px";
  card.style.border = "1px dashed var(--background-modifier-border)";
  card.style.background = "var(--background-primary)";
  card.style.color = "var(--text-muted)";
  card.style.fontSize = "44px";
  card.style.fontWeight = "850";
  card.style.cursor = "pointer";
  card.style.boxShadow = "0 4px 14px rgba(0,0,0,0.06)";
  card.title = "\u6DFB\u52A0\u5FC3\u613F";
  card.innerText = "+";
  card.onclick = () => new WishlistModal(ctx.app, ctx.plugin).open();
}
function getWishlistCurrentPrice(item) {
  const prices = [...item.priceHistory].sort((a, b) => a.date.localeCompare(b.date));
  return prices[prices.length - 1]?.price ?? 0;
}
function getWishlistAccessoriesTotal(item) {
  return (item.accessories ?? []).reduce((sum, accessory) => sum + accessory.price, 0);
}

// packages/ui-web/src/components/navIcon.ts
function createNavIcon(name, size = 22) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.8");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  const paths = getIconPaths(name);
  paths.forEach(({ tag, attrs }) => {
    const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.keys(attrs).forEach((k) => node.setAttribute(k, attrs[k]));
    svg.appendChild(node);
  });
  return svg;
}
function getIconPaths(name) {
  switch (name) {
    case "home":
      return [
        { tag: "path", attrs: { d: "M3 11.5 12 4l9 7.5" } },
        { tag: "path", attrs: { d: "M5 10.5V20h14V10.5" } },
        { tag: "path", attrs: { d: "M10 20v-5h4v5" } }
      ];
    case "funds":
      return [
        { tag: "circle", attrs: { cx: "12", cy: "12", r: "9" } },
        { tag: "path", attrs: { d: "M12 6.5v11" } },
        { tag: "path", attrs: { d: "M15 9.2c-.6-1.1-1.7-1.7-3-1.7-1.8 0-3 1-3 2.4 0 1.4 1.2 2 3 2.4 1.8.4 3 1 3 2.4 0 1.5-1.2 2.5-3 2.5-1.4 0-2.5-.6-3.1-1.8" } }
      ];
    case "assets":
      return [
        { tag: "path", attrs: { d: "M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z" } },
        { tag: "path", attrs: { d: "M3 7.5 12 12l9-4.5" } },
        { tag: "path", attrs: { d: "M12 12v9" } }
      ];
    case "chart":
      return [
        { tag: "path", attrs: { d: "M4 4v16h16" } },
        { tag: "path", attrs: { d: "M7 15l3.5-4 3 2.5L17.5 8" } },
        { tag: "circle", attrs: { cx: "7", cy: "15", r: "0.8", fill: "currentColor", stroke: "none" } },
        { tag: "circle", attrs: { cx: "10.5", cy: "11", r: "0.8", fill: "currentColor", stroke: "none" } },
        { tag: "circle", attrs: { cx: "13.5", cy: "13.5", r: "0.8", fill: "currentColor", stroke: "none" } },
        { tag: "circle", attrs: { cx: "17.5", cy: "8", r: "0.8", fill: "currentColor", stroke: "none" } }
      ];
    case "heart":
      return [
        { tag: "path", attrs: { d: "M12 20s-7-4.35-7-10a4 4 0 017-2.65A4 4 0 0119 10c0 5.65-7 10-7 10z" } }
      ];
    case "settings":
      return [
        {
          tag: "path",
          attrs: {
            d: "M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 005 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 005 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 5a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
          }
        },
        { tag: "circle", attrs: { cx: "12", cy: "12", r: "3" } }
      ];
    case "eye":
      return [
        { tag: "path", attrs: { d: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" } },
        { tag: "circle", attrs: { cx: "12", cy: "12", r: "3" } }
      ];
    case "eyeOff":
      return [
        { tag: "path", attrs: { d: "M3 3l18 18" } },
        { tag: "path", attrs: { d: "M10.6 10.6a2 2 0 002.8 2.8" } },
        { tag: "path", attrs: { d: "M9.3 6.2A9.8 9.8 0 0112 6c6 0 9.5 6 9.5 6a17.5 17.5 0 01-3.1 3.8" } },
        { tag: "path", attrs: { d: "M5.6 7.6A17.5 17.5 0 002.5 12S6 18 12 18c1.2 0 2.3-.2 3.3-.5" } }
      ];
    case "columnsMinus":
      return [
        { tag: "rect", attrs: { x: "3", y: "5", width: "7", height: "14", rx: "1.5" } },
        { tag: "rect", attrs: { x: "14", y: "5", width: "7", height: "14", rx: "1.5" } },
        { tag: "path", attrs: { d: "M8 12h8" } }
      ];
    case "columnsPlus":
      return [
        { tag: "rect", attrs: { x: "3", y: "5", width: "5", height: "14", rx: "1.2" } },
        { tag: "rect", attrs: { x: "9.5", y: "5", width: "5", height: "14", rx: "1.2" } },
        { tag: "rect", attrs: { x: "16", y: "5", width: "5", height: "14", rx: "1.2" } },
        { tag: "path", attrs: { d: "M12 9v6M9 12h6" } }
      ];
    case "sortShuffle":
      return [
        { tag: "path", attrs: { d: "M7 4v16" } },
        { tag: "path", attrs: { d: "M4 7l3-3 3 3" } },
        { tag: "path", attrs: { d: "M17 20V4" } },
        { tag: "path", attrs: { d: "M14 17l3 3 3-3" } }
      ];
    case "sortDesc":
      return [
        { tag: "path", attrs: { d: "M5 6h14" } },
        { tag: "path", attrs: { d: "M7 12h10" } },
        { tag: "path", attrs: { d: "M9 18h6" } },
        { tag: "path", attrs: { d: "M19 14l-2 4-2-4" } }
      ];
    case "sortAsc":
      return [
        { tag: "path", attrs: { d: "M9 6h6" } },
        { tag: "path", attrs: { d: "M7 12h10" } },
        { tag: "path", attrs: { d: "M5 18h14" } },
        { tag: "path", attrs: { d: "M15 10l2-4 2 4" } }
      ];
    case "checklist":
      return [
        { tag: "path", attrs: { d: "M4 6.5l2 2 3-4" } },
        { tag: "path", attrs: { d: "M4 13.5l2 2 3-4" } },
        { tag: "path", attrs: { d: "M4 20.5l2 2 3-4" } },
        { tag: "path", attrs: { d: "M12 6h8" } },
        { tag: "path", attrs: { d: "M12 13h8" } },
        { tag: "path", attrs: { d: "M12 20h8" } }
      ];
    case "plus":
      return [
        { tag: "path", attrs: { d: "M12 5v14" } },
        { tag: "path", attrs: { d: "M5 12h14" } }
      ];
    case "pencil":
      return [
        { tag: "path", attrs: { d: "M12 20h9" } },
        { tag: "path", attrs: { d: "M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z" } }
      ];
    case "trash":
      return [
        { tag: "path", attrs: { d: "M3 6h18" } },
        { tag: "path", attrs: { d: "M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" } },
        { tag: "path", attrs: { d: "M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" } },
        { tag: "path", attrs: { d: "M10 11v6" } },
        { tag: "path", attrs: { d: "M14 11v6" } }
      ];
    default:
      return [{ tag: "circle", attrs: { cx: "12", cy: "12", r: "8" } }];
  }
}

// packages/ui-web/src/components/bottomNav.ts
function renderBottomNav(ctx, el) {
  const nav = el.createDiv();
  nav.style.display = "flex";
  nav.style.alignItems = "center";
  nav.style.gap = "6px";
  nav.style.padding = "6px 10px";
  nav.style.borderRadius = "999px";
  nav.style.background = "var(--background-primary)";
  nav.style.border = "1px solid var(--background-modifier-border)";
  nav.style.boxShadow = "0 8px 24px rgba(0,0,0,0.18)";
  nav.style.backdropFilter = "saturate(180%) blur(10px)";
  nav.style.webkitBackdropFilter = "saturate(180%) blur(10px)";
  nav.style.position = "fixed";
  nav.style.right = "20px";
  nav.style.bottom = "20px";
  nav.style.width = "max-content";
  nav.style.zIndex = "20";
  renderNavButton(ctx, nav, "home", ctx.tr("home"), "home");
  renderNavButton(ctx, nav, "funds", "\u8D44\u91D1", "funds");
  renderNavButton(ctx, nav, "assets", "\u8D44\u4EA7", "assets");
  renderNavButton(ctx, nav, "assetStats", "\u8D44\u4EA7\u56FE\u8868", "chart");
  renderNavButton(ctx, nav, "wishlist", ctx.tr("wishlist"), "heart");
  renderSettingsNavButton(ctx, nav);
}
function renderNavButton(ctx, parent, key, label, icon) {
  const active = ctx.currentPage === key;
  const button = parent.createEl("button");
  button.ariaLabel = label;
  button.title = label;
  button.style.width = "36px";
  button.style.height = "36px";
  button.style.border = "0";
  button.style.borderRadius = "10px";
  button.style.padding = "0";
  button.style.cursor = "pointer";
  button.style.background = "transparent";
  button.style.color = active ? "var(--interactive-accent)" : "var(--text-muted)";
  button.style.display = "flex";
  button.style.alignItems = "center";
  button.style.justifyContent = "center";
  button.style.transition = "color 0.15s, transform 0.15s";
  button.style.opacity = active ? "1" : "0.72";
  button.appendChild(createNavIcon(icon, active ? 24 : 22));
  button.onmouseenter = () => {
    button.style.opacity = "1";
    button.style.transform = "translateY(-1px)";
  };
  button.onmouseleave = () => {
    button.style.opacity = active ? "1" : "0.72";
    button.style.transform = "translateY(0)";
  };
  button.onclick = () => {
    ctx.currentPage = key;
    ctx.render();
  };
}
function renderSettingsNavButton(ctx, parent) {
  const settingsButton = parent.createEl("button");
  settingsButton.ariaLabel = ctx.tr("settings");
  settingsButton.title = ctx.tr("settings");
  settingsButton.style.width = "36px";
  settingsButton.style.height = "36px";
  settingsButton.style.border = "0";
  settingsButton.style.borderRadius = "10px";
  settingsButton.style.padding = "0";
  settingsButton.style.cursor = "pointer";
  settingsButton.style.background = "transparent";
  settingsButton.style.color = "var(--text-muted)";
  settingsButton.style.display = "flex";
  settingsButton.style.alignItems = "center";
  settingsButton.style.justifyContent = "center";
  settingsButton.style.opacity = "0.72";
  settingsButton.style.transition = "color 0.15s, transform 0.15s, opacity 0.15s";
  settingsButton.appendChild(createNavIcon("settings", 22));
  settingsButton.onmouseenter = () => {
    settingsButton.style.opacity = "1";
    settingsButton.style.transform = "translateY(-1px)";
  };
  settingsButton.onmouseleave = () => {
    settingsButton.style.opacity = "0.72";
    settingsButton.style.transform = "translateY(0)";
  };
  settingsButton.onclick = () => {
    ctx.app.setting.open();
    ctx.app.setting.openTabById(ctx.plugin.manifest.id);
  };
}

// packages/ui-web/src/components/header.ts
function renderHeader(ctx, el) {
  const header = el.createDiv();
  header.style.display = "flex";
  header.style.justifyContent = "space-between";
  header.style.alignItems = "center";
  header.style.marginBottom = "12px";
  header.createEl("h2", { text: ctx.tr("appTitle") });
  const control = header.createDiv();
  control.style.display = "flex";
  control.style.alignItems = "center";
  control.style.gap = "8px";
  createPrivacyToggleButton(ctx, control);
  if (ctx.currentPage === "assets") {
    createHomeColumnButton(ctx, control, "-", 1);
    createHomeColumnButton(ctx, control, "+", -1);
  } else if (ctx.currentPage === "assetStats") {
    createStatsTrendColumnButton(ctx, control, "-", 2);
    createStatsTrendColumnButton(ctx, control, "+", 1);
  }
}
function createPrivacyToggleButton(ctx, parent) {
  const button = parent.createEl("button");
  button.title = ctx.hideMoney ? "\u663E\u793A\u91D1\u989D" : "\u9690\u85CF\u91D1\u989D";
  button.ariaLabel = button.title;
  button.style.border = "0";
  button.style.borderRadius = "10px";
  button.style.width = "34px";
  button.style.height = "34px";
  button.style.padding = "0";
  button.style.cursor = "pointer";
  button.style.background = "transparent";
  button.style.color = "var(--text-muted)";
  button.style.display = "flex";
  button.style.alignItems = "center";
  button.style.justifyContent = "center";
  button.style.opacity = "0.82";
  button.style.transition = "opacity 0.15s, transform 0.15s";
  button.appendChild(createNavIcon(ctx.hideMoney ? "eyeOff" : "eye", 22));
  button.onmouseenter = () => {
    button.style.opacity = "1";
    button.style.transform = "translateY(-1px)";
  };
  button.onmouseleave = () => {
    button.style.opacity = "0.82";
    button.style.transform = "translateY(0)";
  };
  button.onclick = () => {
    ctx.hideMoney = !ctx.hideMoney;
    ctx.render();
  };
}
function createHomeColumnButton(ctx, parent, text, delta) {
  const button = parent.createEl("button", { text });
  button.title = delta < 0 ? "\u653E\u5927\u4E3B\u9875\u5361\u7247" : "\u7F29\u5C0F\u4E3B\u9875\u5361\u7247";
  button.onclick = () => {
    ctx.cols = Math.min(4, Math.max(1, ctx.cols + delta));
    ctx.render();
  };
}
function createStatsTrendColumnButton(ctx, parent, text, cols) {
  const button = parent.createEl("button", { text });
  button.title = cols === 1 ? "\u653E\u5927\u8D8B\u52BF\u5361\u7247\u4E3A\u4E00\u884C\u4E00\u4E2A" : "\u7F29\u5C0F\u8D8B\u52BF\u5361\u7247\u4E3A\u4E00\u884C\u4E24\u4E2A";
  button.onclick = () => {
    ctx.statsTrendCols = cols;
    ctx.render();
  };
}

// packages/ui-web/src/charts/lineChart.ts
function renderStatsLineChart(ctx, parent, slots) {
  const hasData = slots.some((s) => s.value !== null);
  if (!hasData || slots.length === 0) {
    ctx.renderEmptyChart(parent);
    return;
  }
  parent.style.position = "relative";
  const width = 620;
  const height = 240;
  const leftPadding = 64;
  const rightPadding = 24;
  const topPadding = 24;
  const bottomPadding = 44;
  const values = slots.map((s) => s.value).filter((v) => v !== null);
  const rawMax = Math.max(...values, 1);
  const rawMin = Math.min(...values);
  const span = rawMax - rawMin;
  let yMin;
  let yMax;
  if (span <= 0) {
    const v = rawMax;
    const pad = Math.max(Math.abs(v) * 0.1, 1);
    yMin = v - pad;
    yMax = v + pad;
  } else {
    const pad = span * 0.08;
    yMax = rawMax + pad;
    yMin = rawMin - pad;
    if (rawMin > 0 && rawMin < span * 0.2) {
      yMin = 0;
    }
  }
  const yRange = yMax - yMin || 1;
  const plotWidth = width - leftPadding - rightPadding;
  const plotHeight = height - topPadding - bottomPadding;
  const yForValue = (value) => topPadding + (1 - (value - yMin) / yRange) * plotHeight;
  const xForIndex = (index) => slots.length <= 1 ? leftPadding + plotWidth / 2 : leftPadding + index / (slots.length - 1) * plotWidth;
  const daysInMonth = (yyyyMm) => {
    const [y, m] = yyyyMm.split("-").map((s) => parseInt(s, 10));
    if (!y || !m) return 30;
    return new Date(y, m, 0).getDate();
  };
  const stepWidth = slots.length > 1 ? plotWidth / (slots.length - 1) : 0;
  const xForSlot = (index) => {
    const baseX = xForIndex(index);
    const slot = slots[index];
    if (!slot.actualDate) return baseX;
    const parts = slot.actualDate.split("-");
    const day = parseInt(parts[2], 10);
    if (!day || Number.isNaN(day)) return baseX;
    const frac = Math.min(1, Math.max(0, (day - 1) / Math.max(1, daysInMonth(slot.date))));
    const offset = stepWidth * frac;
    return Math.min(width - rightPadding, baseX + offset);
  };
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", String(height));
  const tickCount = 5;
  const yTicks = Array.from({ length: tickCount }, (_, i) => yMin + yRange * i / (tickCount - 1));
  yTicks.forEach((value, tickIndex) => {
    const y = yForValue(value);
    if (tickIndex > 0) {
      const grid = document.createElementNS("http://www.w3.org/2000/svg", "line");
      grid.setAttribute("x1", String(leftPadding));
      grid.setAttribute("y1", String(y));
      grid.setAttribute("x2", String(width - rightPadding));
      grid.setAttribute("y2", String(y));
      grid.setAttribute("stroke", "var(--background-modifier-border)");
      grid.setAttribute("stroke-dasharray", "5 5");
      svg.appendChild(grid);
    }
    const tick = document.createElementNS("http://www.w3.org/2000/svg", "line");
    tick.setAttribute("x1", String(leftPadding - 4));
    tick.setAttribute("y1", String(y));
    tick.setAttribute("x2", String(leftPadding));
    tick.setAttribute("y2", String(y));
    tick.setAttribute("stroke", "var(--background-modifier-border)");
    tick.setAttribute("stroke-width", "2");
    svg.appendChild(tick);
    const tickLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    tickLabel.textContent = formatAxisValue(value);
    tickLabel.setAttribute("x", String(leftPadding - 8));
    tickLabel.setAttribute("y", String(y + 5));
    tickLabel.setAttribute("fill", "var(--text-muted)");
    tickLabel.setAttribute("font-size", "14");
    tickLabel.setAttribute("font-weight", "900");
    tickLabel.setAttribute("text-anchor", "end");
    svg.appendChild(tickLabel);
  });
  const gridStride = Math.max(1, Math.ceil(slots.length / 12));
  slots.forEach((slot, index) => {
    const x = xForIndex(index);
    if (index > 0 && index < slots.length - 1 && index % gridStride === 0) {
      const grid = document.createElementNS("http://www.w3.org/2000/svg", "line");
      grid.setAttribute("x1", String(x));
      grid.setAttribute("y1", String(topPadding));
      grid.setAttribute("x2", String(x));
      grid.setAttribute("y2", String(height - bottomPadding));
      grid.setAttribute("stroke", "var(--background-modifier-border)");
      grid.setAttribute("stroke-dasharray", "3 5");
      grid.setAttribute("opacity", "0.6");
      svg.appendChild(grid);
    }
    const tick = document.createElementNS("http://www.w3.org/2000/svg", "line");
    tick.setAttribute("x1", String(x));
    tick.setAttribute("y1", String(height - bottomPadding));
    tick.setAttribute("x2", String(x));
    tick.setAttribute("y2", String(height - bottomPadding + 4));
    tick.setAttribute("stroke", "var(--background-modifier-border)");
    tick.setAttribute("stroke-width", "2");
    svg.appendChild(tick);
    const labelStride = Math.max(1, Math.ceil(slots.length / 13));
    if (index % labelStride === 0 || index === slots.length - 1) {
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.textContent = slot.label;
      label.setAttribute("x", String(x));
      label.setAttribute("y", String(height - bottomPadding + 22));
      label.setAttribute("fill", "var(--text-muted)");
      label.setAttribute("font-size", "13");
      label.setAttribute("font-weight", "900");
      label.setAttribute("text-anchor", "middle");
      svg.appendChild(label);
    }
  });
  const axis = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  axis.setAttribute(
    "points",
    `${leftPadding},${topPadding} ${leftPadding},${height - bottomPadding} ${width - rightPadding},${height - bottomPadding}`
  );
  axis.setAttribute("fill", "none");
  axis.setAttribute("stroke", "var(--background-modifier-border)");
  axis.setAttribute("stroke-width", "2");
  svg.appendChild(axis);
  let pathData = "";
  let penDown = false;
  slots.forEach((slot, index) => {
    if (slot.value === null) {
      penDown = false;
      return;
    }
    const x = xForSlot(index);
    const y = yForValue(slot.value);
    pathData += `${penDown ? "L" : "M"} ${x} ${y} `;
    penDown = true;
  });
  if (pathData) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
    line.setAttribute("d", pathData.trim());
    line.setAttribute("fill", "none");
    line.setAttribute("stroke", "#60a5fa");
    line.setAttribute("stroke-width", "4");
    line.setAttribute("stroke-linecap", "round");
    line.setAttribute("stroke-linejoin", "round");
    svg.appendChild(line);
  }
  if (ctx.plugin.settings.showChartDots) {
    slots.forEach((slot, index) => {
      if (slot.value === null) return;
      const marker = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      marker.setAttribute("cx", String(xForSlot(index)));
      marker.setAttribute("cy", String(yForValue(slot.value)));
      marker.setAttribute("r", "4");
      marker.setAttribute("fill", "var(--background-primary)");
      marker.setAttribute("stroke", "#60a5fa");
      marker.setAttribute("stroke-width", "3");
      svg.appendChild(marker);
    });
  }
  const guide = document.createElementNS("http://www.w3.org/2000/svg", "line");
  guide.setAttribute("y1", String(topPadding));
  guide.setAttribute("y2", String(height - bottomPadding));
  guide.setAttribute("stroke", "var(--text-muted)");
  guide.setAttribute("stroke-width", "1");
  guide.setAttribute("stroke-dasharray", "4 4");
  guide.setAttribute("opacity", "0");
  guide.setAttribute("pointer-events", "none");
  svg.appendChild(guide);
  const hoverDot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  hoverDot.setAttribute("r", "5");
  hoverDot.setAttribute("fill", "#60a5fa");
  hoverDot.setAttribute("stroke", "var(--background-primary)");
  hoverDot.setAttribute("stroke-width", "2");
  hoverDot.setAttribute("opacity", "0");
  hoverDot.setAttribute("pointer-events", "none");
  svg.appendChild(hoverDot);
  const tooltip = parent.createDiv();
  tooltip.style.position = "absolute";
  tooltip.style.display = "none";
  tooltip.style.pointerEvents = "none";
  tooltip.style.padding = "9px 11px";
  tooltip.style.borderRadius = "12px";
  tooltip.style.background = "var(--background-primary)";
  tooltip.style.border = "1px solid var(--background-modifier-border)";
  tooltip.style.boxShadow = "0 12px 28px rgba(0,0,0,0.2)";
  tooltip.style.fontSize = "13px";
  tooltip.style.fontWeight = "900";
  tooltip.style.zIndex = "2";
  tooltip.style.lineHeight = "1.5";
  tooltip.style.whiteSpace = "nowrap";
  const formatSlotLabel = (slot) => {
    const iso = slot.actualDate ?? slot.date;
    const parts = iso.split("-");
    if (parts.length >= 3) {
      const y = parts[0];
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      if (!isNaN(m) && !isNaN(d)) return `${y}\u5E74${m}\u6708${d}\u65E5`;
    }
    if (parts.length >= 2) {
      const y = parts[0];
      const m = parseInt(parts[1], 10);
      if (!isNaN(m)) return `${y}\u5E74${m}\u6708`;
    }
    return iso;
  };
  const findPrevValueIndex = (index) => {
    for (let i = index - 1; i >= 0; i--) {
      if (slots[i].value !== null) return i;
    }
    return -1;
  };
  const hideHover = () => {
    guide.setAttribute("opacity", "0");
    hoverDot.setAttribute("opacity", "0");
    tooltip.style.display = "none";
  };
  slots.forEach((slot, index) => {
    const x = xForSlot(index);
    const prevX = index > 0 ? xForSlot(index - 1) : leftPadding;
    const nextX = index < slots.length - 1 ? xForSlot(index + 1) : width - rightPadding;
    const hitX = index === 0 ? leftPadding : (prevX + x) / 2;
    const hitWidth = index === slots.length - 1 ? width - rightPadding - hitX : (x + nextX) / 2 - hitX;
    const hit = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    hit.setAttribute("x", String(hitX));
    hit.setAttribute("y", String(topPadding));
    hit.setAttribute("width", String(Math.max(hitWidth, 4)));
    hit.setAttribute("height", String(plotHeight));
    hit.setAttribute("fill", "transparent");
    hit.setAttribute("pointer-events", "all");
    hit.style.cursor = "pointer";
    const showHover = () => {
      guide.setAttribute("x1", String(x));
      guide.setAttribute("x2", String(x));
      guide.setAttribute("opacity", "1");
      tooltip.empty();
      const monthText = tooltip.createDiv({ text: formatSlotLabel(slot) });
      monthText.style.color = "var(--text-muted)";
      monthText.style.fontSize = "11px";
      monthText.style.fontWeight = "700";
      monthText.style.marginBottom = "2px";
      if (slot.value === null) {
        hoverDot.setAttribute("opacity", "0");
        const none = tooltip.createDiv({ text: "\u2014" });
        none.style.color = "var(--text-muted)";
      } else {
        hoverDot.setAttribute("cx", String(x));
        hoverDot.setAttribute("cy", String(yForValue(slot.value)));
        hoverDot.setAttribute("opacity", "1");
        const valueText = tooltip.createDiv({ text: ctx.displayCurrency(slot.value) });
        valueText.style.fontSize = "14px";
        valueText.style.fontWeight = "900";
        valueText.style.color = "var(--text-normal)";
        const prevIdx = findPrevValueIndex(index);
        if (prevIdx >= 0) {
          const prev = slots[prevIdx].value;
          const delta = slot.value - prev;
          const sign = delta > 0 ? "+" : delta < 0 ? "-" : "\xB1";
          const color = delta > 0 ? "#22c55e" : delta < 0 ? "#ef4444" : "var(--text-muted)";
          const deltaText = tooltip.createDiv({
            text: `${sign}${ctx.displayCurrency(Math.abs(delta))}`
          });
          deltaText.style.fontSize = "12px";
          deltaText.style.fontWeight = "800";
          deltaText.style.color = color;
          deltaText.style.marginTop = "2px";
          const hint = tooltip.createDiv({ text: "\u8F83\u4E0A\u671F" });
          hint.style.fontSize = "10px";
          hint.style.fontWeight = "600";
          hint.style.color = "var(--text-faint)";
        }
      }
      const parentWidth = parent.clientWidth || width;
      const anchorY = slot.value !== null ? yForValue(slot.value) : topPadding;
      const pxPerUnitY = (parent.clientHeight || height) / height;
      tooltip.style.left = `${Math.min(
        Math.max(x / width * parentWidth - 72, 8),
        Math.max(parentWidth - 160, 8)
      )}px`;
      tooltip.style.top = `${Math.max(anchorY * pxPerUnitY - 56, 8)}px`;
      tooltip.style.display = "block";
    };
    hit.onmouseenter = showHover;
    hit.onmousemove = showHover;
    hit.onmouseleave = hideHover;
    svg.appendChild(hit);
  });
  parent.appendChild(svg);
}

// packages/ui-web/src/charts/barChart.ts
function renderFundNetAssetBarCard(ctx, parent) {
  const card = ctx.createFundStatsCard(parent, "\u8D44\u91D1\u8D1F\u503A\u5BF9\u6BD4");
  const asset = ctx.getFundAssetTotal();
  const liability = ctx.getFundLiabilityTotal();
  const netAsset = asset - liability;
  const total = asset + liability;
  if (total <= 0) {
    ctx.renderEmptyChart(card);
    return;
  }
  const topRow = card.createDiv();
  topRow.style.display = "flex";
  topRow.style.alignItems = "baseline";
  topRow.style.justifyContent = "space-between";
  topRow.style.gap = "10px";
  topRow.style.marginBottom = "10px";
  topRow.style.flexWrap = "wrap";
  const assetLabel = topRow.createDiv();
  assetLabel.style.display = "flex";
  assetLabel.style.alignItems = "baseline";
  assetLabel.style.gap = "6px";
  const assetName = assetLabel.createSpan({ text: "\u8D44\u91D1" });
  assetName.style.fontSize = "14px";
  assetName.style.fontWeight = "900";
  assetName.style.color = "var(--text-muted)";
  const assetValue = assetLabel.createSpan();
  assetValue.style.fontSize = "20px";
  assetValue.style.fontWeight = "950";
  assetValue.style.color = "#3b82f6";
  assetValue.style.display = "inline-flex";
  ctx.renderSlotNumber(assetValue.createSpan(), ctx.displayCurrency(asset));
  const liabilityLabel = topRow.createDiv();
  liabilityLabel.style.display = "flex";
  liabilityLabel.style.alignItems = "baseline";
  liabilityLabel.style.gap = "6px";
  const liabilityName = liabilityLabel.createSpan({ text: "\u8D1F\u503A" });
  liabilityName.style.fontSize = "14px";
  liabilityName.style.fontWeight = "900";
  liabilityName.style.color = "var(--text-muted)";
  const liabilityValue = liabilityLabel.createSpan();
  liabilityValue.style.fontSize = "20px";
  liabilityValue.style.fontWeight = "950";
  liabilityValue.style.color = "#ef4444";
  liabilityValue.style.display = "inline-flex";
  ctx.renderSlotNumber(liabilityValue.createSpan(), ctx.displayCurrency(liability));
  const bar = card.createDiv();
  bar.style.display = "flex";
  bar.style.width = "100%";
  bar.style.height = "32px";
  bar.style.borderRadius = "999px";
  bar.style.overflow = "hidden";
  bar.style.border = "1px solid var(--background-modifier-border)";
  bar.style.background = "var(--background-primary)";
  const assetSeg = bar.createDiv();
  assetSeg.style.flex = `${asset}`;
  assetSeg.style.background = "linear-gradient(90deg, #60a5fa, #3b82f6)";
  const liabilitySeg = bar.createDiv();
  liabilitySeg.style.flex = `${liability}`;
  liabilitySeg.style.background = "linear-gradient(90deg, #f87171, #ef4444)";
  const footer = card.createDiv();
  footer.style.display = "flex";
  footer.style.justifyContent = "flex-end";
  footer.style.marginTop = "12px";
  const footerInner = footer.createDiv();
  footerInner.style.display = "flex";
  footerInner.style.flexDirection = "column";
  footerInner.style.alignItems = "flex-start";
  footerInner.style.gap = "2px";
  footerInner.style.textAlign = "left";
  const net = footerInner.createDiv();
  net.style.display = "flex";
  net.style.alignItems = "baseline";
  net.style.gap = "4px";
  const netName = net.createSpan({ text: "\u51C0\u8D44\u91D1" });
  netName.style.fontSize = "14px";
  netName.style.fontWeight = "800";
  netName.style.color = "var(--text-muted)";
  const netValue = net.createSpan();
  netValue.style.fontSize = "17px";
  netValue.style.fontWeight = "900";
  netValue.style.color = netAsset < 0 ? "#ef4444" : "var(--text-normal)";
  netValue.style.display = "inline-flex";
  ctx.renderSlotNumber(netValue.createSpan(), ctx.displayCurrency(netAsset));
  const ratioText = asset > 0 ? `${(liability / asset * 100).toFixed(1)}%` : "\u2014";
  const ratio = footerInner.createDiv();
  ratio.style.display = "flex";
  ratio.style.alignItems = "baseline";
  ratio.style.gap = "4px";
  const ratioName = ratio.createSpan({ text: "\u8D44\u91D1\u8D1F\u503A\u7387" });
  ratioName.style.fontSize = "14px";
  ratioName.style.fontWeight = "800";
  ratioName.style.color = "var(--text-muted)";
  const ratioValue = ratio.createSpan();
  ratioValue.style.fontSize = "17px";
  ratioValue.style.fontWeight = "900";
  ratioValue.style.color = "var(--text-normal)";
  ratioValue.style.display = "inline-flex";
  ctx.renderSlotNumber(ratioValue.createSpan(), ratioText);
}

// packages/ui-web/src/view/viewStyles.ts
function applyCardStyle(card) {
  card.style.position = "relative";
  card.style.display = "flex";
  card.style.alignItems = "center";
  card.style.justifyContent = "space-between";
  card.style.gap = "24px";
  card.style.padding = "18px 21px";
  card.style.minHeight = "132px";
  card.style.borderRadius = "21px";
  card.style.background = "var(--background-secondary)";
  card.style.border = "1px solid var(--background-modifier-border)";
  card.style.boxShadow = "0 4px 14px rgba(0,0,0,0.08)";
  card.style.cursor = "pointer";
}
function applyGridStyle2(ctx, grid) {
  grid.style.display = "grid";
  grid.style.gridTemplateColumns = `repeat(${ctx.cols}, minmax(660px, 1fr))`;
  grid.style.rowGap = "16px";
  grid.style.columnGap = "12px";
}
function applyStickyTop(card) {
  card.style.position = "sticky";
  card.style.top = "0";
  card.style.zIndex = "5";
}
function createStatsHeroCard(el, title) {
  const card = el.createDiv();
  card.style.padding = "24px";
  card.style.marginBottom = "18px";
  card.style.borderRadius = "24px";
  card.style.background = "linear-gradient(145deg, var(--background-secondary), var(--background-primary))";
  card.style.border = "1px solid var(--background-modifier-border)";
  card.style.boxShadow = "0 16px 38px rgba(0,0,0,0.14)";
  card.style.width = "100%";
  card.style.boxSizing = "border-box";
  card.style.overflow = "hidden";
  const titleEl = card.createDiv();
  titleEl.innerText = title;
  titleEl.style.fontSize = "22px";
  titleEl.style.fontWeight = "950";
  titleEl.style.letterSpacing = "0.01em";
  titleEl.style.color = "var(--text-normal)";
  titleEl.style.marginBottom = "18px";
  return card;
}
function createStatsCard(ctx, el, title) {
  const card = el.createDiv();
  card.style.padding = "22px";
  card.style.marginBottom = "18px";
  card.style.borderRadius = "22px";
  card.style.background = "linear-gradient(145deg, var(--background-secondary), var(--background-primary))";
  card.style.border = "1px solid var(--background-modifier-border)";
  card.style.boxShadow = "0 14px 34px rgba(0,0,0,0.12)";
  card.style.alignSelf = "stretch";
  card.style.height = "100%";
  card.style.boxSizing = "border-box";
  card.style.overflow = "hidden";
  const header = card.createDiv();
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.justifyContent = "space-between";
  header.style.cursor = "pointer";
  header.style.gap = "14px";
  const titleEl = header.createDiv();
  titleEl.innerText = title;
  titleEl.style.fontSize = "22px";
  titleEl.style.fontWeight = "900";
  titleEl.style.letterSpacing = "0.01em";
  titleEl.style.color = "var(--text-normal)";
  const collapsed = ctx.collapsedStatsCards.has(title);
  const toggle = header.createDiv();
  toggle.innerText = collapsed ? "\u25B8" : "\u25BE";
  toggle.style.color = "var(--text-muted)";
  toggle.style.fontSize = "22px";
  toggle.style.fontWeight = "900";
  const body = card.createDiv();
  body.style.marginTop = "18px";
  body.style.display = collapsed ? "none" : "block";
  body.style.height = collapsed ? "auto" : "calc(100% - 48px)";
  header.onclick = () => {
    if (ctx.collapsedStatsCards.has(title)) {
      ctx.collapsedStatsCards.delete(title);
    } else {
      ctx.collapsedStatsCards.add(title);
    }
    ctx.render();
  };
  return body;
}
function createFundStatsCard(ctx, el, title) {
  const card = el.createDiv();
  card.style.padding = "8px 2px 10px";
  card.style.marginBottom = "12px";
  card.style.alignSelf = "stretch";
  card.style.height = "100%";
  card.style.boxSizing = "border-box";
  const header = card.createDiv();
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.justifyContent = "space-between";
  header.style.cursor = "pointer";
  header.style.gap = "14px";
  header.style.padding = "0 2px";
  const titleEl = header.createDiv();
  titleEl.innerText = title;
  titleEl.style.fontSize = "23px";
  titleEl.style.fontWeight = "950";
  titleEl.style.letterSpacing = "0.01em";
  titleEl.style.color = "var(--text-normal)";
  const rightGroup = header.createDiv();
  rightGroup.style.display = "flex";
  rightGroup.style.alignItems = "center";
  rightGroup.style.gap = "8px";
  const extraSlot = rightGroup.createDiv();
  extraSlot.style.display = "flex";
  extraSlot.style.alignItems = "center";
  extraSlot.style.gap = "8px";
  const collapsed = ctx.collapsedStatsCards.has(title);
  const toggle = rightGroup.createDiv();
  toggle.innerText = collapsed ? "\u25B8" : "\u25BE";
  toggle.style.color = "var(--text-muted)";
  toggle.style.fontSize = "22px";
  toggle.style.fontWeight = "900";
  const body = card.createDiv();
  body.style.marginTop = "14px";
  body.style.display = collapsed ? "none" : "block";
  body.style.height = collapsed ? "auto" : "auto";
  header.onclick = () => {
    if (ctx.collapsedStatsCards.has(title)) {
      ctx.collapsedStatsCards.delete(title);
    } else {
      ctx.collapsedStatsCards.add(title);
    }
    ctx.render();
  };
  body.__cardHeader = header;
  body.__cardExtraSlot = extraSlot;
  return body;
}
function mountFundStatsHeaderExtra(body, el) {
  const slot = body.__cardExtraSlot;
  if (!slot) {
    return false;
  }
  el.addEventListener("click", (event) => event.stopPropagation());
  el.addEventListener("mousedown", (event) => event.stopPropagation());
  slot.appendChild(el);
  return true;
}
function createActionButton(parent, text, title, onClick, danger = false) {
  const button = parent.createDiv({ text });
  button.title = title;
  button.style.width = "30px";
  button.style.height = "30px";
  button.style.display = "flex";
  button.style.alignItems = "center";
  button.style.justifyContent = "center";
  button.style.borderRadius = "999px";
  button.style.border = "1px solid var(--background-modifier-border)";
  button.style.background = danger ? "#fee2e2" : "var(--background-primary)";
  button.style.color = danger ? "#dc2626" : "var(--text-normal)";
  button.style.cursor = "pointer";
  button.style.fontSize = "17px";
  button.style.fontWeight = "950";
  button.style.opacity = "0.86";
  button.style.boxShadow = "0 6px 14px rgba(0,0,0,0.14)";
  button.onmouseover = () => {
    button.style.opacity = "1";
    button.style.transform = "translateY(-1px)";
  };
  button.onmouseout = () => {
    button.style.opacity = "0.86";
    button.style.transform = "";
  };
  button.onclick = async (event) => {
    event.stopPropagation();
    await onClick();
  };
  return button;
}
function applyToolbarBtnStyle(btn, style, disabled = false) {
  btn.style.display = "inline-flex";
  btn.style.alignItems = "center";
  btn.style.justifyContent = "center";
  btn.style.gap = "6px";
  btn.style.height = "34px";
  btn.style.minWidth = "34px";
  btn.style.padding = btn.childElementCount > 0 ? "0 10px" : "0 14px";
  btn.style.borderRadius = "10px";
  btn.style.fontSize = "13px";
  btn.style.fontWeight = "900";
  btn.style.cursor = disabled ? "not-allowed" : "pointer";
  btn.style.transition = "background 0.15s, color 0.15s, transform 0.15s, border-color 0.15s";
  btn.style.boxShadow = "none";
  if (style === "accent") {
    btn.style.border = "1px solid var(--interactive-accent)";
    btn.style.background = "var(--interactive-accent)";
    btn.style.color = "var(--text-on-accent)";
  } else if (style === "danger") {
    btn.style.border = `1px solid ${disabled ? "var(--background-modifier-border)" : "#ef4444"}`;
    btn.style.background = disabled ? "var(--background-primary)" : "#ef4444";
    btn.style.color = disabled ? "var(--text-muted)" : "#fff";
  } else {
    btn.style.border = "1px solid var(--background-modifier-border)";
    btn.style.background = "var(--background-primary)";
    btn.style.color = "var(--text-normal)";
  }
}
function createFundToolbarButton(parent, iconName, tip, style) {
  const btn = parent.createEl("button");
  btn.title = tip;
  btn.ariaLabel = tip;
  btn.appendChild(createNavIcon(iconName, 18));
  applyToolbarBtnStyle(btn, style);
  return btn;
}
function renderEmptyChart(ctx, parent) {
  const empty = parent.createDiv();
  empty.innerText = ctx.tr("emptyChart");
  empty.style.height = "160px";
  empty.style.display = "flex";
  empty.style.alignItems = "center";
  empty.style.justifyContent = "center";
  empty.style.color = "var(--text-muted)";
  empty.style.fontSize = "16px";
  empty.style.fontWeight = "900";
  empty.style.borderRadius = "18px";
  empty.style.background = "var(--background-primary)";
  empty.style.border = "1px solid var(--background-modifier-border)";
}
function renderStatsGranularityToggle(ctx, body) {
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.title = "\u5207\u6362\u6C47\u603B / \u8BE6\u7EC6";
  applyFundStatsPillStyle(toggle);
  const syncLabel = () => {
    toggle.innerText = ctx.statsGranularity === "item" ? "\u8BE6\u7EC6" : "\u6C47\u603B";
  };
  syncLabel();
  toggle.onclick = (event) => {
    event.stopPropagation();
    ctx.statsGranularity = ctx.statsGranularity === "item" ? "category" : "item";
    ctx.render();
  };
  if (mountFundStatsHeaderExtra(body, toggle)) {
    return toggle;
  }
  const bar = body.createDiv();
  bar.style.display = "flex";
  bar.style.justifyContent = "flex-end";
  bar.style.alignItems = "center";
  bar.style.marginBottom = "6px";
  bar.appendChild(toggle);
  return bar;
}
function applyFundStatsPillStyle(el) {
  el.style.display = "inline-flex";
  el.style.alignItems = "center";
  el.style.justifyContent = "center";
  el.style.height = "32px";
  el.style.minWidth = "66px";
  el.style.boxSizing = "border-box";
  el.style.margin = "0";
  el.style.padding = "0 12px";
  el.style.fontSize = "14px";
  el.style.fontWeight = "900";
  el.style.lineHeight = "1";
  el.style.borderRadius = "6px";
  el.style.border = "1px solid var(--background-modifier-border)";
  el.style.background = "var(--background-primary)";
  el.style.color = "var(--text-normal)";
  el.style.cursor = "pointer";
  el.style.userSelect = "none";
  el.style.whiteSpace = "nowrap";
  el.style.boxShadow = "none";
  el.style.outline = "none";
}

// packages/ui-web/src/charts/donutChart.ts
function appendDonutSlices(svg, items, total) {
  let startAngle = -90;
  items.forEach((item) => {
    const angle = item.value / total * 360;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", describeDonutSlice(120, 120, 108, 66, startAngle, startAngle + angle));
    path.setAttribute("fill", item.color);
    svg.appendChild(path);
    startAngle += angle;
  });
}
function appendLegendRow(ctx, legend, item, percent, showValue = true) {
  const row = legend.createDiv();
  row.style.display = "grid";
  row.style.gridTemplateColumns = showValue ? "12px minmax(0, 120px) 52px minmax(0, 1fr)" : "12px minmax(0, 120px) 52px";
  row.style.alignItems = "center";
  row.style.columnGap = "4px";
  row.style.padding = "0";
  row.style.background = "transparent";
  row.style.border = "0";
  row.style.boxShadow = "none";
  row.style.width = "100%";
  const dot = row.createSpan();
  dot.style.width = "10px";
  dot.style.height = "10px";
  dot.style.borderRadius = "999px";
  dot.style.background = item.color;
  dot.style.flexShrink = "0";
  const nameEl = row.createDiv({ text: item.name });
  nameEl.style.fontSize = "16px";
  nameEl.style.fontWeight = "900";
  nameEl.style.color = "var(--text-normal)";
  nameEl.style.overflow = "hidden";
  nameEl.style.textOverflow = "ellipsis";
  nameEl.style.whiteSpace = "nowrap";
  nameEl.style.textAlign = "left";
  nameEl.style.minWidth = "0";
  const percentEl = row.createDiv();
  percentEl.style.fontSize = "15px";
  percentEl.style.fontWeight = "900";
  percentEl.style.color = "var(--text-muted)";
  percentEl.style.textAlign = "left";
  percentEl.style.whiteSpace = "nowrap";
  percentEl.style.display = "flex";
  percentEl.style.justifyContent = "flex-start";
  ctx.renderSlotNumber(percentEl.createDiv(), `${percent}%`);
  if (!showValue) {
    return;
  }
  const valueEl = row.createDiv();
  valueEl.style.fontSize = "15px";
  valueEl.style.fontWeight = "900";
  valueEl.style.color = "var(--text-normal)";
  valueEl.style.textAlign = "right";
  valueEl.style.display = "flex";
  valueEl.style.justifyContent = "flex-end";
  valueEl.style.whiteSpace = "nowrap";
  ctx.renderSlotNumber(valueEl.createDiv(), ctx.displayCurrency(item.value));
}
function createDonutLayout(card) {
  const wrap = card.createDiv();
  wrap.style.display = "grid";
  wrap.style.gridTemplateColumns = "minmax(320px, 1fr) minmax(220px, 1fr)";
  wrap.style.alignItems = "center";
  wrap.style.gap = "14px";
  wrap.style.minHeight = "340px";
  const chartWrap = wrap.createDiv();
  chartWrap.style.display = "flex";
  chartWrap.style.alignItems = "center";
  chartWrap.style.justifyContent = "center";
  chartWrap.style.minHeight = "320px";
  const legend = wrap.createDiv();
  legend.style.display = "flex";
  legend.style.flexDirection = "column";
  legend.style.alignSelf = "center";
  legend.style.gap = "8px";
  legend.style.width = "100%";
  legend.style.minWidth = "0";
  return { wrap, chartWrap, legend };
}
function createDonutSvg() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 240 240");
  svg.setAttribute("width", "320");
  svg.setAttribute("height", "320");
  svg.style.maxWidth = "100%";
  svg.style.display = "block";
  return svg;
}
function renderFundPieCard(ctx, parent, tab, label, totalValue) {
  const card = ctx.createFundStatsCard(parent, `${label}\u5206\u5E03`);
  if (tab !== "netAsset") {
    renderStatsGranularityToggle(ctx, card);
  }
  const items = ctx.getFundRanking(
    tab,
    tab === "netAsset" ? "category" : ctx.statsGranularity
  );
  const absTotal = items.reduce((sum, item) => sum + item.value, 0);
  if (items.length === 0 || absTotal <= 0) {
    ctx.renderEmptyChart(card);
    return;
  }
  const { chartWrap, legend } = createDonutLayout(card);
  const chartInner = chartWrap.createDiv();
  chartInner.style.position = "relative";
  chartInner.style.width = "320px";
  chartInner.style.height = "320px";
  chartInner.style.maxWidth = "100%";
  const svg = createDonutSvg();
  appendDonutSlices(svg, items, absTotal);
  chartInner.appendChild(svg);
  const centerOverlay = chartInner.createDiv();
  centerOverlay.style.position = "absolute";
  centerOverlay.style.inset = "0";
  centerOverlay.style.display = "flex";
  centerOverlay.style.flexDirection = "column";
  centerOverlay.style.alignItems = "center";
  centerOverlay.style.justifyContent = "center";
  centerOverlay.style.pointerEvents = "none";
  centerOverlay.style.gap = "6px";
  const centerLabel = centerOverlay.createDiv({ text: label });
  centerLabel.style.fontSize = "12px";
  centerLabel.style.fontWeight = "800";
  centerLabel.style.color = "var(--text-muted)";
  const centerValue = centerOverlay.createDiv();
  centerValue.style.fontSize = "18px";
  centerValue.style.fontWeight = "950";
  centerValue.style.color = tab === "liability" ? "#ef4444" : "var(--text-normal)";
  centerValue.style.display = "flex";
  centerValue.style.maxWidth = "170px";
  centerValue.style.overflow = "hidden";
  ctx.renderSlotNumber(centerValue.createDiv(), ctx.displayCurrency(totalValue));
  items.forEach((item) => {
    const percent = Math.round(item.value / absTotal * 100);
    appendLegendRow(ctx, legend, item, percent, false);
  });
}
function renderCategoryPieCard(ctx, el, assets) {
  const card = ctx.createStatsCard(el, ctx.tr("categoryDistribution"));
  const totalValue = assets.reduce((sum, asset) => sum + getNetAssetCost(asset), 0);
  if (totalValue <= 0 || assets.length === 0) {
    ctx.renderEmptyChart(card);
    return;
  }
  const { chartWrap, legend } = createDonutLayout(card);
  const categories = ctx.getCategoryStats(assets);
  const items = categories.map((category) => ({
    name: ctx.getCategoryLabel(category.category),
    value: category.value,
    color: ctx.getCategoryColor(category.category)
  }));
  if (items.length === 0) {
    ctx.renderEmptyChart(card);
    return;
  }
  const svg = createDonutSvg();
  appendDonutSlices(svg, items, totalValue);
  const centerCount = document.createElementNS("http://www.w3.org/2000/svg", "text");
  centerCount.textContent = String(assets.length);
  centerCount.setAttribute("x", "120");
  centerCount.setAttribute("y", "115");
  centerCount.setAttribute("text-anchor", "middle");
  centerCount.setAttribute("fill", "var(--text-normal)");
  centerCount.setAttribute("font-size", "44");
  centerCount.setAttribute("font-weight", "950");
  svg.appendChild(centerCount);
  const centerLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
  centerLabel.textContent = ctx.tr("totalCount");
  centerLabel.setAttribute("x", "120");
  centerLabel.setAttribute("y", "150");
  centerLabel.setAttribute("text-anchor", "middle");
  centerLabel.setAttribute("fill", "var(--text-muted)");
  centerLabel.setAttribute("font-size", "17");
  centerLabel.setAttribute("font-weight", "900");
  svg.appendChild(centerLabel);
  chartWrap.appendChild(svg);
  items.forEach((item) => {
    const percent = totalValue > 0 ? Math.round(item.value / totalValue * 100) : 0;
    appendLegendRow(ctx, legend, item, percent);
  });
}

// packages/ui-web/src/fund/fundReorder.ts
async function persistFundReorder(plugin, orderedIds) {
  const idSet = new Set(orderedIds);
  const remaining = [...orderedIds];
  const next = [];
  for (const fund of plugin.funds) {
    if (idSet.has(fund.id)) {
      const nextId = remaining.shift();
      if (!nextId) continue;
      const picked = plugin.funds.find((f) => f.id === nextId);
      if (picked) next.push(picked);
    } else {
      next.push(fund);
    }
  }
  plugin.funds = next;
  await plugin.saveFunds();
}
var LONG_PRESS_MS_DEFAULT = 250;
function attachLongPressDrag(opts) {
  const longPressMs = opts.longPressMs ?? LONG_PRESS_MS_DEFAULT;
  const { row, list, fundId, ownerOrderedIds, onReorder } = opts;
  let pressTimer = null;
  let dragging = false;
  let ghost = null;
  let indicator = null;
  let dropIndex = null;
  let startX = 0;
  let startY = 0;
  const cleanup = () => {
    if (pressTimer !== null) {
      window.clearTimeout(pressTimer);
      pressTimer = null;
    }
    if (ghost) {
      ghost.remove();
      ghost = null;
    }
    if (indicator) {
      indicator.remove();
      indicator = null;
    }
    row.style.opacity = "";
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
    dragging = false;
    dropIndex = null;
  };
  const beginDrag = (clientX, clientY) => {
    dragging = true;
    row.style.opacity = "0.35";
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
    ghost = document.body.createDiv();
    ghost.style.position = "fixed";
    ghost.style.pointerEvents = "none";
    ghost.style.zIndex = "9999";
    ghost.style.background = "var(--background-secondary)";
    ghost.style.border = "1px solid var(--background-modifier-border)";
    ghost.style.borderRadius = "10px";
    ghost.style.padding = "8px 12px";
    ghost.style.boxShadow = "0 8px 24px rgba(0,0,0,0.25)";
    ghost.style.fontSize = "14px";
    ghost.style.fontWeight = "800";
    ghost.style.color = "var(--text-normal)";
    ghost.style.minWidth = "160px";
    ghost.innerText = row.innerText.trim().split("\n")[0] || "\u62D6\u62FD\u4E2D";
    positionGhost(clientX, clientY);
    indicator = document.createElement("div");
    indicator.style.height = "3px";
    indicator.style.background = "var(--interactive-accent)";
    indicator.style.borderRadius = "2px";
    indicator.style.margin = "0";
    indicator.style.pointerEvents = "none";
    updateDropTarget(clientY);
  };
  const positionGhost = (clientX, clientY) => {
    if (!ghost) return;
    ghost.style.left = `${clientX + 12}px`;
    ghost.style.top = `${clientY + 12}px`;
  };
  const rowsFromList = () => {
    const children = [];
    for (let i = 0; i < list.children.length; i++) {
      const el = list.children[i];
      if (el instanceof HTMLElement && el !== indicator) {
        children.push(el);
      }
    }
    return children;
  };
  const updateDropTarget = (clientY) => {
    if (!indicator) return;
    const rows = rowsFromList();
    let newIndex = rows.length;
    for (let i = 0; i < rows.length; i++) {
      const rect = rows[i].getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) {
        newIndex = i;
        break;
      }
    }
    dropIndex = newIndex;
    if (newIndex >= rows.length) {
      list.appendChild(indicator);
    } else {
      list.insertBefore(indicator, rows[newIndex]);
    }
  };
  const onMove = (ev) => {
    if (!dragging) {
      const dx = Math.abs(ev.clientX - startX);
      const dy = Math.abs(ev.clientY - startY);
      if (dx > 6 || dy > 6) {
        cleanup();
      }
      return;
    }
    ev.preventDefault();
    positionGhost(ev.clientX, ev.clientY);
    updateDropTarget(ev.clientY);
  };
  const onUp = () => {
    if (!dragging) {
      cleanup();
      return;
    }
    const targetIndex = dropIndex;
    const sourceIndex = ownerOrderedIds.indexOf(fundId);
    cleanup();
    const swallow = (e) => {
      e.stopPropagation();
      e.preventDefault();
      row.removeEventListener("click", swallow, true);
    };
    row.addEventListener("click", swallow, true);
    window.setTimeout(() => row.removeEventListener("click", swallow, true), 50);
    if (sourceIndex < 0 || targetIndex === null) return;
    const next = [...ownerOrderedIds];
    const [moved] = next.splice(sourceIndex, 1);
    const insertAt = targetIndex > sourceIndex ? targetIndex - 1 : targetIndex;
    next.splice(insertAt, 0, moved);
    if (next.join("|") !== ownerOrderedIds.join("|")) {
      onReorder(next);
    }
  };
  row.addEventListener("pointerdown", (ev) => {
    if (ev.button !== 0) return;
    startX = ev.clientX;
    startY = ev.clientY;
    pressTimer = window.setTimeout(() => {
      pressTimer = null;
      beginDrag(ev.clientX, ev.clientY);
    }, longPressMs);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  });
}

// packages/ui-web/src/modals/fundCategoryPickerModal.ts
var import_obsidian5 = require("obsidian");
var FundCategoryPickerModal = class extends import_obsidian5.Modal {
  constructor(app, onPick) {
    super(app);
    this.onPick = onPick;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    const title = contentEl.createEl("h2", { text: "\u9009\u62E9\u8D44\u4EA7\u7C7B\u578B" });
    title.style.margin = "0 0 16px";
    title.style.fontSize = "22px";
    title.style.fontWeight = "900";
    const grid = contentEl.createDiv();
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
    grid.style.gap = "12px";
    FUND_CATEGORIES.forEach((category) => {
      const item = grid.createDiv();
      item.style.padding = "14px 16px";
      item.style.borderRadius = "16px";
      item.style.border = "1px solid var(--background-modifier-border)";
      item.style.background = "var(--background-secondary)";
      item.style.cursor = "pointer";
      item.style.transition = "transform 0.12s, box-shadow 0.12s";
      const header = item.createDiv();
      header.style.display = "flex";
      header.style.alignItems = "center";
      header.style.justifyContent = "space-between";
      header.style.gap = "10px";
      const name = header.createSpan({ text: category.name });
      name.style.fontSize = "17px";
      name.style.fontWeight = "900";
      name.style.color = "var(--text-normal)";
      const tag = header.createSpan({ text: category.type === "liability" ? "\u8D1F\u503A" : "\u8D44\u4EA7" });
      tag.style.fontSize = "11px";
      tag.style.fontWeight = "900";
      tag.style.padding = "2px 8px";
      tag.style.borderRadius = "999px";
      tag.style.background = category.type === "liability" ? "#fee2e2" : "#dcfce7";
      tag.style.color = category.type === "liability" ? "#dc2626" : "#16a34a";
      if (category.examples) {
        const examples = item.createDiv({ text: category.examples });
        examples.style.marginTop = "8px";
        examples.style.fontSize = "12px";
        examples.style.fontWeight = "700";
        examples.style.color = "var(--text-muted)";
        examples.style.overflow = "hidden";
        examples.style.textOverflow = "ellipsis";
        examples.style.whiteSpace = "nowrap";
      }
      item.onmouseenter = () => {
        item.style.transform = "translateY(-2px)";
        item.style.boxShadow = "0 10px 24px rgba(0,0,0,0.12)";
      };
      item.onmouseleave = () => {
        item.style.transform = "";
        item.style.boxShadow = "";
      };
      item.onclick = () => {
        this.close();
        this.onPick(category.id);
      };
    });
  }
};

// packages/ui-web/src/modals/fundDetailModal.ts
var import_obsidian9 = require("obsidian");

// packages/ui-web/src/modals/fundModal.ts
var import_obsidian8 = require("obsidian");

// packages/ui-web/src/modals/shared/modalButtons.ts
function createIconButton(parent, options) {
  const button = parent.createEl("button");
  button.ariaLabel = options.ariaLabel;
  const size = options.size ?? 34;
  if (options.corner === "top-right") {
    button.style.position = "absolute";
    button.style.top = "0";
    button.style.right = "0";
  }
  button.style.width = `${size}px`;
  button.style.height = `${size}px`;
  button.style.borderRadius = "999px";
  button.style.padding = "0";
  button.style.cursor = "pointer";
  button.style.display = "flex";
  button.style.alignItems = "center";
  button.style.justifyContent = "center";
  if (typeof options.content === "string") {
    button.setText(options.content);
    button.style.fontSize = "16px";
  } else {
    button.appendChild(options.content);
    button.style.color = options.color ?? "var(--text-muted)";
  }
  return button;
}
function createPillButton(parent, options) {
  const button = parent.createEl("button", { text: options.text });
  const variant = options.variant ?? "primary";
  button.style.padding = options.padding ?? "7px 16px";
  button.style.borderRadius = "999px";
  button.style.cursor = "pointer";
  button.style.whiteSpace = "nowrap";
  if (variant === "primary") {
    button.style.border = "1px solid var(--interactive-accent)";
    button.style.background = "var(--interactive-accent)";
    button.style.color = "var(--text-on-accent)";
    button.style.fontWeight = "900";
  }
  return button;
}
function createFullWidthDeleteButton(parent, options) {
  const wrapper = parent.createDiv();
  wrapper.style.marginTop = `${options.marginTop ?? 18}px`;
  const button = wrapper.createEl("button");
  button.ariaLabel = options.ariaLabel;
  button.style.width = "100%";
  button.style.padding = "10px 14px";
  button.style.borderRadius = "12px";
  button.style.cursor = "pointer";
  button.style.background = "var(--background-modifier-error)";
  button.style.color = "var(--text-on-accent)";
  if (options.plainText !== void 0) {
    button.setText(options.plainText);
    button.style.fontSize = options.fontSize ?? "18px";
    return button;
  }
  button.style.fontSize = options.fontSize ?? "15px";
  button.style.fontWeight = "900";
  button.style.display = "flex";
  button.style.alignItems = "center";
  button.style.justifyContent = "center";
  button.style.gap = "8px";
  if (options.icon) {
    options.icon.setAttribute("stroke", "currentColor");
    button.appendChild(options.icon);
  }
  if (options.text !== void 0) {
    const span = button.createSpan({ text: options.text });
    span.style.lineHeight = "1";
  }
  return button;
}
function createCircleAddButton(parent, options) {
  const button = parent.createEl("button");
  button.ariaLabel = options.ariaLabel;
  const size = options.size ?? 26;
  const iconSize = options.iconSize ?? 16;
  button.style.width = `${size}px`;
  button.style.height = `${size}px`;
  button.style.borderRadius = "999px";
  button.style.padding = "0";
  button.style.cursor = "pointer";
  button.style.display = "flex";
  button.style.alignItems = "center";
  button.style.justifyContent = "center";
  button.style.border = "1px solid var(--background-modifier-border)";
  button.style.background = "var(--background-secondary)";
  button.style.color = "var(--text-normal)";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", String(iconSize));
  svg.setAttribute("height", String(iconSize));
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  ["M12 5v14", "M5 12h14"].forEach((d) => {
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", d);
    svg.appendChild(p);
  });
  button.appendChild(svg);
  return button;
}

// packages/ui-web/src/modals/shared/fundBankDropdown.ts
var import_obsidian7 = require("obsidian");

// packages/ui-web/src/fund/bankLogoByName.ts
var BANK_LOGO_KEY_MAP = {
  "\u5DE5\u5546\u94F6\u884C": "icbc",
  "\u5EFA\u8BBE\u94F6\u884C": "ccb",
  "\u519C\u4E1A\u94F6\u884C": "abc",
  "\u4E2D\u56FD\u94F6\u884C": "boc",
  "\u62DB\u5546\u94F6\u884C": "cmb",
  "\u4EA4\u901A\u94F6\u884C": "bocom",
  "\u90AE\u653F\u94F6\u884C": "psbc",
  "\u90AE\u50A8\u94F6\u884C": "psbc",
  "\u4E2D\u4FE1\u94F6\u884C": "citic_bank",
  "\u4F17\u5B89\u94F6\u884C": "zhongan_bank",
  "\u5317\u4EAC\u94F6\u884C": "bob",
  "\u6C47\u4E30\u94F6\u884C": "hsbc",
  "\u6CB3\u5357\u519C\u6751\u4FE1\u7528\u793E": "henan_rcc",
  "\u652F\u4ED8\u5B9D": "alipay",
  "\u5FAE\u4FE1": "wechat",
  "\u8682\u8681\u82B1\u5457": "huabei",
  "\u82B1\u5457": "huabei",
  "\u4EAC\u4E1C\u767D\u6761": "jd_baitiao",
  "\u767D\u6761": "jd_baitiao"
};
function resolveBankLogoKey(bank) {
  if (!bank) return null;
  if (BANK_LOGO_KEY_MAP[bank]) return BANK_LOGO_KEY_MAP[bank];
  for (const zh of Object.keys(BANK_LOGO_KEY_MAP)) {
    if (bank.includes(zh)) return BANK_LOGO_KEY_MAP[zh];
  }
  return null;
}
async function resolveBankIconDataUrl(plugin, bank) {
  const key = resolveBankLogoKey(bank);
  if (!key) return null;
  const store = host().store;
  const dir = getPluginAssetDir(plugin);
  const svgPath = `${dir}/assets/logo/${key}.svg`;
  try {
    if (!await store.exists(svgPath)) {
      return null;
    }
    const raw = await store.read(svgPath);
    const normalized = normalizeSvgContent(raw, 64).replace(/\s+/g, " ").trim();
    return `data:image/svg+xml;utf8,${encodeURIComponent(normalized)}`;
  } catch {
    return null;
  }
}
function applyLogoBoxStyle(el, size, borderRadius = 5) {
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.display = "flex";
  el.style.alignItems = "center";
  el.style.justifyContent = "center";
  el.style.overflow = "hidden";
  el.style.flexShrink = "0";
  el.style.borderRadius = `${borderRadius}px`;
  el.style.background = "transparent";
}
function renderBankLogoByName(plugin, container, bank, size) {
  container.empty();
  const key = resolveBankLogoKey(bank);
  const fallback = () => {
    container.empty();
    container.innerText = bank.charAt(0);
    container.style.fontSize = `${Math.floor(size * 0.6)}px`;
    container.style.fontWeight = "900";
    container.style.color = "var(--text-muted)";
  };
  if (!key) {
    fallback();
    return;
  }
  const store = host().store;
  const resources = host().resources;
  const dir = getPluginAssetDir(plugin);
  const svgPath = `${dir}/assets/logo/${key}.svg`;
  const pngPath = `${dir}/assets/logo/${key}.png`;
  fallback();
  (async () => {
    try {
      if (await store.exists(svgPath)) {
        const text = await store.read(svgPath);
        if (!container.isConnected) return;
        container.empty();
        container.innerHTML = normalizeSvgContent(text, size);
        return;
      }
      if (await store.exists(pngPath)) {
        if (!container.isConnected) return;
        container.empty();
        const img = container.createEl("img");
        img.src = resources.resolveUrl(pngPath);
        img.alt = key;
        img.style.width = `${size}px`;
        img.style.height = `${size}px`;
        img.style.objectFit = "contain";
      }
    } catch {
    }
  })();
}

// packages/ui-web/src/modals/promptModal.ts
var import_obsidian6 = require("obsidian");
var PromptModal = class extends import_obsidian6.Modal {
  constructor(app, options, resolve) {
    super(app);
    this.options = options;
    this.resolve = resolve;
    this.settled = false;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    const title = contentEl.createEl("h3", { text: this.options.title });
    title.style.margin = "0 0 14px";
    title.style.fontSize = "16px";
    title.style.fontWeight = "900";
    const input = contentEl.createEl("input");
    input.type = this.options.type ?? "text";
    input.placeholder = this.options.placeholder ?? "";
    input.value = this.options.defaultValue ?? "";
    if (this.options.type === "date" && this.options.maxDate) {
      input.max = this.options.maxDate;
    }
    input.style.width = "100%";
    input.style.padding = "9px 12px";
    input.style.fontSize = "15px";
    input.style.borderRadius = "10px";
    input.style.border = "1px solid var(--background-modifier-border)";
    input.style.background = "var(--background-primary)";
    input.style.color = "var(--text-normal)";
    input.style.boxSizing = "border-box";
    this.input = input;
    const buttons = contentEl.createDiv();
    buttons.style.display = "flex";
    buttons.style.justifyContent = "flex-end";
    buttons.style.gap = "10px";
    buttons.style.marginTop = "16px";
    const cancelBtn = buttons.createEl("button", { text: "\u53D6\u6D88" });
    cancelBtn.style.padding = "7px 16px";
    cancelBtn.style.borderRadius = "999px";
    cancelBtn.style.cursor = "pointer";
    const confirmBtn = buttons.createEl("button", { text: "\u786E\u5B9A" });
    confirmBtn.style.padding = "7px 16px";
    confirmBtn.style.borderRadius = "999px";
    confirmBtn.style.background = "var(--interactive-accent)";
    confirmBtn.style.color = "var(--text-on-accent)";
    confirmBtn.style.border = "1px solid var(--interactive-accent)";
    confirmBtn.style.fontWeight = "900";
    confirmBtn.style.cursor = "pointer";
    cancelBtn.onclick = () => {
      this.settled = true;
      this.resolve(null);
      this.close();
    };
    confirmBtn.onclick = () => {
      this.settled = true;
      this.resolve(this.input.value);
      this.close();
    };
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        this.settled = true;
        this.resolve(this.input.value);
        this.close();
      } else if (event.key === "Escape") {
        event.preventDefault();
        this.settled = true;
        this.resolve(null);
        this.close();
      }
    });
    setTimeout(() => {
      input.focus();
      input.select();
    }, 20);
  }
  onClose() {
    if (!this.settled) {
      this.resolve(null);
    }
    this.contentEl.empty();
  }
};
function openPromptModal(app, options) {
  return new Promise((resolve) => {
    new PromptModal(app, options, resolve).open();
  });
}

// packages/ui-web/src/modals/shared/fundBankDropdown.ts
function renderFundBankDropdown(contentEl, options) {
  const { app, plugin } = options;
  const setting = new import_obsidian7.Setting(contentEl).setName(options.label);
  setting.controlEl.empty();
  setting.controlEl.style.flex = "1 1 auto";
  const wrap = setting.controlEl.createDiv();
  wrap.style.position = "relative";
  wrap.style.width = "100%";
  wrap.style.maxWidth = "320px";
  wrap.style.marginLeft = "auto";
  const trigger = wrap.createDiv();
  trigger.style.display = "flex";
  trigger.style.alignItems = "center";
  trigger.style.gap = "10px";
  trigger.style.padding = "8px 12px";
  trigger.style.borderRadius = "10px";
  trigger.style.border = "1px solid var(--background-modifier-border)";
  trigger.style.background = "var(--background-primary)";
  trigger.style.cursor = "pointer";
  trigger.style.userSelect = "none";
  trigger.style.minHeight = "40px";
  const triggerLogo = trigger.createDiv();
  applyLogoBoxStyle(triggerLogo, 24, 5);
  const triggerLabel = trigger.createDiv({ text: options.initialValue || options.placeholder });
  triggerLabel.style.flex = "1 1 auto";
  triggerLabel.style.fontSize = "14px";
  triggerLabel.style.fontWeight = "800";
  triggerLabel.style.color = options.initialValue ? "var(--text-normal)" : "var(--text-muted)";
  triggerLabel.style.overflow = "hidden";
  triggerLabel.style.textOverflow = "ellipsis";
  triggerLabel.style.whiteSpace = "nowrap";
  const caret = trigger.createDiv({ text: "\u25BE" });
  caret.style.fontSize = "13px";
  caret.style.color = "var(--text-muted)";
  caret.style.flexShrink = "0";
  if (options.initialValue) {
    renderBankLogoByName(plugin, triggerLogo, options.initialValue, 22);
  }
  const menu = wrap.createDiv();
  menu.style.position = "absolute";
  menu.style.top = "calc(100% + 6px)";
  menu.style.left = "0";
  menu.style.right = "0";
  menu.style.maxHeight = "300px";
  menu.style.overflowY = "auto";
  menu.style.borderRadius = "10px";
  menu.style.border = "1px solid var(--background-modifier-border)";
  menu.style.background = "var(--background-primary)";
  menu.style.boxShadow = "0 12px 28px rgba(0,0,0,0.18)";
  menu.style.zIndex = "20";
  menu.style.display = "none";
  menu.style.padding = "6px";
  let menuOpen = false;
  const openMenu = () => {
    menu.style.display = "block";
    menuOpen = true;
  };
  const closeMenu = () => {
    menu.style.display = "none";
    menuOpen = false;
  };
  trigger.onclick = (e) => {
    e.stopPropagation();
    if (menuOpen) closeMenu();
    else openMenu();
  };
  const updateTriggerDisplay = (name) => {
    triggerLabel.innerText = name;
    triggerLabel.style.color = "var(--text-normal)";
    triggerLogo.empty();
    renderBankLogoByName(plugin, triggerLogo, name, 22);
  };
  const handlePick = async (value) => {
    if (value === "\u5176\u4ED6") {
      closeMenu();
      const custom = await openPromptModal(app, {
        title: options.customPromptTitle,
        placeholder: options.customPromptTitle,
        type: "text"
      });
      if (custom === null) return;
      const trimmed = (custom || "").trim();
      if (!trimmed) {
        notify("\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A");
        return;
      }
      options.onPick(trimmed);
      updateTriggerDisplay(trimmed);
      return;
    }
    options.onPick(value);
    updateTriggerDisplay(value);
    closeMenu();
  };
  options.options.forEach((opt) => {
    const row = menu.createDiv();
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.gap = "10px";
    row.style.padding = "7px 10px";
    row.style.borderRadius = "8px";
    row.style.cursor = "pointer";
    row.style.transition = "background 0.12s";
    const optLogo = row.createDiv();
    applyLogoBoxStyle(optLogo, 22, 5);
    if (opt !== "\u5176\u4ED6") {
      renderBankLogoByName(plugin, optLogo, opt, 20);
    } else {
      optLogo.innerText = "\u2022";
      optLogo.style.color = "var(--text-muted)";
      optLogo.style.fontSize = "15px";
      optLogo.style.fontWeight = "900";
    }
    const nameEl = row.createDiv({ text: opt });
    nameEl.style.fontSize = "14px";
    nameEl.style.fontWeight = "800";
    nameEl.style.color = "var(--text-normal)";
    nameEl.style.flex = "1 1 auto";
    row.onmouseenter = () => {
      row.style.background = "var(--background-modifier-hover)";
    };
    row.onmouseleave = () => {
      row.style.background = "";
    };
    row.onclick = (e) => {
      e.stopPropagation();
      void handlePick(opt);
    };
  });
  const outsideHandler = (e) => {
    if (!menuOpen) return;
    const target = e.target;
    if (!trigger.contains(target) && !menu.contains(target)) {
      closeMenu();
    }
  };
  document.addEventListener("click", outsideHandler);
  return {
    teardown() {
      document.removeEventListener("click", outsideHandler);
    }
  };
}

// packages/ui-web/src/modals/shared/historyPoint.ts
function upsertHistoryPoint(history, amount, date) {
  const next = [...history];
  const index = next.findIndex((point) => point.date === date);
  const entry2 = {
    id: index >= 0 ? next[index].id : crypto.randomUUID(),
    amount,
    date
  };
  if (index >= 0) {
    next[index] = entry2;
  } else {
    next.push(entry2);
  }
  return next.sort((a, b) => a.date.localeCompare(b.date));
}
function getLatestHistoryPoint(history) {
  if (!history || history.length === 0) {
    return void 0;
  }
  let latest = history[0];
  for (let i = 1; i < history.length; i++) {
    if (history[i].date.localeCompare(latest.date) > 0) {
      latest = history[i];
    }
  }
  return latest;
}

// packages/ui-web/src/modals/fundModal.ts
var AUTO_DEFAULT_ICON_IDS = /* @__PURE__ */ new Set([
  CASH_BANKNOTE_ICON,
  CREDIT_CARD_ICON,
  BANK_ICON,
  VIRTUAL_ACCOUNT_DEFAULT_ICON,
  INVESTMENT_DEFAULT_ICON,
  INVESTMENT_STOCK_ICON,
  INVESTMENT_FUND_ICON,
  LIABILITY_DEFAULT_ICON,
  LIABILITY_LOAN_ICON,
  LIABILITY_BORROW_ICON,
  CLAIM_DEFAULT_ICON,
  SOCIAL_SECURITY_DEFAULT_ICON,
  SOCIAL_SECURITY_HOUSING_FUND_ICON,
  SOCIAL_SECURITY_MEDICAL_ICON,
  CUSTOM_ASSET_DEFAULT_ICON
]);
var FundModal = class extends import_obsidian8.Modal {
  constructor(app, plugin, fund, defaults = DEFAULT_FUND_CATEGORY_ID, onBack) {
    super(app);
    this.plugin = plugin;
    this.fund = fund;
    /**
     * True when `state.icon` was filled automatically by us (cash banknote,
     * credit-card stock SVG, or a bank logo). A manual selection via the
     * icon picker flips this to false so subsequent auto defaults won't
     * overwrite the user's choice.
     */
    this.iconIsAutoDefault = false;
    this.defaults = typeof defaults === "string" ? { category: defaults } : defaults ?? {};
    this.onBack = onBack;
    this.state = fund ? {
      id: fund.id,
      name: fund.name,
      amount: fund.amount,
      date: fund.date,
      category: fund.category ?? DEFAULT_FUND_CATEGORY_ID,
      history: [...fund.history ?? [{ id: crypto.randomUUID(), amount: fund.amount, date: fund.date }]],
      bank: fund.bank ?? "",
      card_number: fund.card_number ?? "",
      remark: fund.remark ?? "",
      city: fund.city ?? "",
      icon: fund.icon ?? ""
    } : {
      id: crypto.randomUUID(),
      name: this.defaults.name ?? "",
      amount: 0,
      date: getTodayISODate(),
      category: this.defaults.category ?? DEFAULT_FUND_CATEGORY_ID,
      history: [],
      bank: this.defaults.bank ?? "",
      card_number: this.defaults.card_number ?? "",
      remark: "",
      city: "",
      icon: ""
    };
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    const isCard = this.state.category === "debit_card" || this.state.category === "credit_card";
    const isCash = this.state.category === "cash";
    const isVirtual = this.state.category === "virtual_account";
    const isLiability = this.state.category === "liability";
    const isInvestment = this.state.category === "investment";
    const isClaim = this.state.category === "claim";
    const isSocialSecurity = this.state.category === "social_security";
    const isCustomAsset = this.state.category === "custom_asset";
    const isCategoryPreset = isCard || isCash || isVirtual || isLiability || isInvestment || isClaim || isSocialSecurity || isCustomAsset;
    contentEl.createEl("h2", {
      text: this.fund ? "\u7F16\u8F91\u8D44\u91D1" : isCard ? this.state.category === "debit_card" ? "\u65B0\u589E\u501F\u8BB0\u5361" : "\u65B0\u589E\u4FE1\u7528\u5361" : isCash ? "\u65B0\u589E\u73B0\u91D1" : isVirtual ? "\u65B0\u589E\u865A\u62DF\u8D26\u6237" : isLiability ? "\u65B0\u589E\u8D1F\u503A" : isInvestment ? "\u65B0\u589E\u6295\u8D44\u8D26\u6237" : isClaim ? "\u65B0\u589E\u503A\u6743" : isSocialSecurity ? "\u65B0\u589E\u4E94\u9669\u4E00\u91D1" : isCustomAsset ? "\u65B0\u589E\u81EA\u5B9A\u4E49\u8D44\u4EA7" : "\u65B0\u589E\u8D44\u91D1"
    });
    if (isCash && !this.state.name) {
      this.state.name = "\u73B0\u91D1";
    }
    if (!this.fund && !this.state.icon) {
      const fallback = this.getDefaultIconForCategory();
      if (fallback) {
        this.state.icon = fallback;
        this.iconIsAutoDefault = true;
      }
    }
    if (this.fund && this.iconLooksLikeSystemDefault(this.state.icon)) {
      this.iconIsAutoDefault = true;
    }
    if (isCard) {
      const cardOptions = this.state.category === "credit_card" ? COMMON_CREDIT_CARD_ISSUERS : COMMON_BANKS;
      this.dropdownHandle = renderFundBankDropdown(contentEl, {
        app: this.app,
        plugin: this.plugin,
        label: this.state.category === "credit_card" ? "\u53D1\u5361\u673A\u6784" : "\u94F6\u884C",
        placeholder: this.state.category === "credit_card" ? "\u8BF7\u9009\u62E9\u53D1\u5361\u673A\u6784" : "\u8BF7\u9009\u62E9\u94F6\u884C",
        customPromptTitle: this.state.category === "credit_card" ? "\u8BF7\u8F93\u5165\u53D1\u5361\u673A\u6784\u540D\u79F0" : "\u8BF7\u8F93\u5165\u94F6\u884C\u540D\u79F0",
        options: cardOptions,
        initialValue: this.state.bank,
        onPick: (bank) => this.applyBankName(bank)
      });
      if (this.state.bank && this.iconIsAutoDefault) {
        this.maybeApplyBankIcon(this.state.bank);
      }
      addTextField(contentEl, {
        name: "\u5361\u53F7",
        placeholder: "\u53EF\u53EA\u586B\u672B\u56DB\u4F4D",
        value: this.state.card_number,
        onChange: (value) => {
          this.state.card_number = value.trim();
        }
      });
    } else if (isVirtual) {
      this.dropdownHandle = renderFundBankDropdown(contentEl, {
        app: this.app,
        plugin: this.plugin,
        label: "\u8D26\u6237",
        placeholder: "\u8BF7\u9009\u62E9\u8D26\u6237",
        customPromptTitle: "\u8BF7\u8F93\u5165\u8D26\u6237\u540D\u79F0",
        options: COMMON_VIRTUAL_ACCOUNTS,
        initialValue: this.state.bank,
        onPick: (picked) => this.applyOptionName(picked, COMMON_VIRTUAL_ACCOUNTS)
      });
    } else if (isLiability) {
      this.dropdownHandle = renderFundBankDropdown(contentEl, {
        app: this.app,
        plugin: this.plugin,
        label: "\u8D1F\u503A",
        placeholder: "\u8BF7\u9009\u62E9\u8D1F\u503A",
        customPromptTitle: "\u8BF7\u8F93\u5165\u8D1F\u503A\u540D\u79F0",
        options: COMMON_LIABILITIES,
        initialValue: this.state.bank,
        onPick: (picked) => this.applyOptionName(picked, COMMON_LIABILITIES)
      });
    } else if (isInvestment) {
      this.dropdownHandle = renderFundBankDropdown(contentEl, {
        app: this.app,
        plugin: this.plugin,
        label: "\u6295\u8D44\u7C7B\u578B",
        placeholder: "\u8BF7\u9009\u62E9\u6295\u8D44\u7C7B\u578B",
        customPromptTitle: "\u8BF7\u8F93\u5165\u6295\u8D44\u7C7B\u578B\u540D\u79F0",
        options: COMMON_INVESTMENTS,
        initialValue: this.state.bank,
        onPick: (picked) => this.applyOptionName(picked, COMMON_INVESTMENTS)
      });
    } else if (isClaim) {
      addTextField(contentEl, {
        name: "\u540D\u79F0",
        value: this.state.name,
        onChange: (value) => {
          this.state.name = value;
        }
      });
    } else if (isSocialSecurity) {
      this.dropdownHandle = renderFundBankDropdown(contentEl, {
        app: this.app,
        plugin: this.plugin,
        label: "\u9879\u76EE",
        placeholder: "\u8BF7\u9009\u62E9\u9879\u76EE",
        customPromptTitle: "\u8BF7\u8F93\u5165\u9879\u76EE\u540D\u79F0",
        options: COMMON_SOCIAL_SECURITY,
        initialValue: this.state.bank,
        onPick: (picked) => this.applyOptionName(picked, COMMON_SOCIAL_SECURITY)
      });
      addTextField(contentEl, {
        name: "\u57CE\u5E02",
        value: this.state.city,
        onChange: (value) => {
          this.state.city = value.trim();
        }
      });
    } else if (isCustomAsset) {
      addTextField(contentEl, {
        name: "\u540D\u79F0",
        value: this.state.name,
        onChange: (value) => {
          this.state.name = value;
        }
      });
    } else if (isCash) {
    } else {
      addTextField(contentEl, {
        name: "\u540D\u79F0",
        value: this.state.name,
        onChange: (value) => {
          this.state.name = value;
        }
      });
      if (!isCategoryPreset) {
        addDropdownField(contentEl, {
          name: "\u5206\u7C7B",
          value: this.state.category,
          options: FUND_CATEGORIES.map((category) => ({
            value: category.id,
            label: category.examples ? `${category.name} \xB7 ${category.examples}` : category.name
          })),
          onChange: (value) => {
            this.state.category = value;
          }
        });
      }
    }
    this.renderIconSetting(contentEl);
    addNumberField(contentEl, {
      name: this.state.category === "credit_card" || this.state.category === "liability" ? "\u6B20\u6B3E\u91D1\u989D" : "\u4F59\u989D",
      value: this.state.amount,
      onChange: (value) => {
        this.state.amount = value;
      }
    });
    if (isCard || isCash || isVirtual || isLiability || isInvestment || isClaim || isSocialSecurity || isCustomAsset) {
      addTextField(contentEl, {
        name: "\u5907\u6CE8",
        placeholder: "\u53EF\u9009",
        value: this.state.remark,
        onChange: (value) => {
          this.state.remark = value;
        }
      });
    }
    addDateField(contentEl, {
      name: "\u65E5\u671F",
      value: this.state.date,
      max: "today",
      onChange: (value) => {
        this.state.date = value;
      }
    });
    const hint = contentEl.createDiv({ text: "\u4FDD\u5B58\u65F6\u4F1A\u628A\u672C\u6B21\u91D1\u989D\u8BB0\u5F55\u5230\u5386\u53F2\uFF0C\u7528\u4E8E\u8D44\u91D1\u8D8B\u52BF\u56FE\u3002" });
    hint.style.margin = "10px 0 0";
    hint.style.color = "var(--text-muted)";
    hint.style.fontSize = "13px";
    hint.style.fontWeight = "800";
    const actionRow = new import_obsidian8.Setting(contentEl);
    actionRow.settingEl.style.borderTop = "none";
    actionRow.infoEl.remove();
    actionRow.controlEl.style.display = "flex";
    actionRow.controlEl.style.gap = "10px";
    actionRow.controlEl.style.justifyContent = "flex-end";
    if (!this.fund && this.onBack) {
      const backButton = createPillButton(actionRow.controlEl, {
        text: "\u8FD4\u56DE",
        variant: "ghost",
        padding: "8px 18px"
      });
      backButton.onclick = () => this.goBack();
    }
    const saveButton = createPillButton(actionRow.controlEl, {
      text: "\u4FDD\u5B58",
      variant: "primary",
      padding: "8px 22px"
    });
    saveButton.onclick = () => this.save();
  }
  onClose() {
    this.dropdownHandle?.teardown();
    this.dropdownHandle = void 0;
    super.onClose?.();
  }
  /**
   * Close the current modal and invoke `onBack` — caller decides what to
   * re-open (typically the FundCategoryPickerModal).
   */
  goBack() {
    const back = this.onBack;
    this.close();
    back?.();
  }
  /**
   * Bank-card flavour: default name is `${bank}储蓄卡/信用卡`, but only
   * overwrite when the user hasn't typed a custom name (empty, or still the
   * previously-auto-generated `*卡` name).
   *
   * 信用卡的发卡机构可能是"蚂蚁花呗 / 京东白条"这种非银行，此时 name
   * 直接用机构名本身，不拼"信用卡"后缀。
   */
  applyBankName(bank) {
    this.state.bank = bank;
    const isCreditCardLikeInstitution = this.state.category === "credit_card" && (bank === "\u8682\u8681\u82B1\u5457" || bank === "\u4EAC\u4E1C\u767D\u6761" || bank === "\u82B1\u5457" || bank === "\u767D\u6761");
    const suffix = this.state.category === "debit_card" ? "\u50A8\u84C4\u5361" : "\u4FE1\u7528\u5361";
    if (!this.state.name || this.looksLikeAutoName(this.state.name)) {
      this.state.name = isCreditCardLikeInstitution ? bank : `${bank}${suffix}`;
    }
    if (this.iconIsAutoDefault) {
      void this.maybeApplyBankIcon(bank);
    }
  }
  /**
   * 也供编辑场景使用：仅当 icon 未被用户手动改过时写入。
   * 读失败 / 无 SVG 时保持原有默认 icon。
   */
  async maybeApplyBankIcon(bank) {
    const dataUrl = await resolveBankIconDataUrl(this.plugin, bank);
    if (!dataUrl) return;
    if (!this.iconIsAutoDefault) return;
    this.state.icon = dataUrl;
    this.renderSelectedIconPreview();
    this.iconSettingButton?.setButtonText("\u66F4\u6362\u56FE\u6807");
  }
  /**
   * 集合了所有"由本插件主动赋默认值时用到的"图标 id 与 logo 前缀。
   * 编辑现有资金时，若 icon 命中其中之一，则视作"用户从未亲手选过图标"，
   * 后续下拉子选项变动可以自动联动更新默认图标。
   *
   * 不在此集合中的 icon（例如用户从图标选择器挑的"小猪存钱罐"、本地裁剪
   * 上传的 `obsiwealth:icons/xxx.png`）一律视作"用户的明确选择"，
   * 联动逻辑不会去覆盖它们。
   */
  iconLooksLikeSystemDefault(icon) {
    if (!icon) return true;
    if (icon.startsWith("data:image/svg+xml")) return true;
    return AUTO_DEFAULT_ICON_IDS.has(icon);
  }
  /**
   * Per-category default icon used when the user hasn't explicitly picked
   * one yet. `applyOptionName` further refines this once the user picks a
   * sub-option (e.g. 股票 → 金色"股"字 SVG).
   */
  getDefaultIconForCategory() {
    switch (this.state.category) {
      case "cash":
        return CASH_BANKNOTE_ICON;
      case "debit_card":
        return CREDIT_CARD_ICON;
      case "credit_card":
        return BANK_ICON;
      case "virtual_account":
        return VIRTUAL_ACCOUNT_DEFAULT_ICON;
      case "investment":
        return INVESTMENT_DEFAULT_ICON;
      case "liability":
        return LIABILITY_DEFAULT_ICON;
      case "claim":
        return CLAIM_DEFAULT_ICON;
      case "social_security":
        return SOCIAL_SECURITY_DEFAULT_ICON;
      case "custom_asset":
        return CUSTOM_ASSET_DEFAULT_ICON;
      default:
        return null;
    }
  }
  /** Per-sub-option icon override. Falls back to null if none. */
  getIconForSubOption(picked) {
    if (this.state.category === "investment") {
      if (picked === "\u80A1\u7968") return INVESTMENT_STOCK_ICON;
      if (picked === "\u57FA\u91D1") return INVESTMENT_FUND_ICON;
      return INVESTMENT_DEFAULT_ICON;
    }
    if (this.state.category === "liability") {
      if (picked === "\u8D37\u6B3E") return LIABILITY_LOAN_ICON;
      if (picked === "\u501F\u5165") return LIABILITY_BORROW_ICON;
      return LIABILITY_DEFAULT_ICON;
    }
    if (this.state.category === "social_security") {
      if (picked === "\u4F4F\u623F\u516C\u79EF\u91D1") return SOCIAL_SECURITY_HOUSING_FUND_ICON;
      if (picked === "\u533B\u7597\u4FDD\u9669") return SOCIAL_SECURITY_MEDICAL_ICON;
      return SOCIAL_SECURITY_DEFAULT_ICON;
    }
    return null;
  }
  /**
   * Virtual-account / liability flavour: default name follows the picked item
   * verbatim unless the user has already typed something unrelated.
   */
  applyOptionName(picked, options) {
    this.state.bank = picked;
    if (!this.state.name || this.state.name === "\u73B0\u91D1" || this.looksLikeAutoName(this.state.name) || options.indexOf(this.state.name) >= 0) {
      this.state.name = picked;
    }
    if (this.iconIsAutoDefault) {
      const next = this.getIconForSubOption(picked);
      if (next) {
        this.state.icon = next;
        this.renderSelectedIconPreview();
        this.iconSettingButton?.setButtonText("\u66F4\u6362\u56FE\u6807");
      }
    }
  }
  // 判断 name 是否是"银行+储蓄卡/信用卡"自动生成名，若是则允许换行覆盖
  looksLikeAutoName(name) {
    return /储蓄卡$|信用卡$/.test(name);
  }
  renderIconSetting(contentEl) {
    const iconSetting = new import_obsidian8.Setting(contentEl).setName("\u56FE\u6807").addButton((button) => {
      this.iconSettingButton = button;
      button.setButtonText(this.state.icon ? "\u66F4\u6362\u56FE\u6807" : "\u9009\u62E9\u56FE\u6807");
      button.onClick(() => {
        openIconPicker(this.app, (icon) => {
          this.state.icon = icon.id;
          this.iconIsAutoDefault = false;
          button.setButtonText("\u66F4\u6362\u56FE\u6807");
          this.renderSelectedIconPreview();
        }, "money");
      });
    });
    iconSetting.settingEl.querySelector(".setting-item-description")?.remove();
    if (this.state.icon) {
      iconSetting.addExtraButton((button) => {
        button.setIcon("cross");
        button.setTooltip("\u6E05\u9664\u81EA\u5B9A\u4E49\u56FE\u6807");
        button.onClick(() => {
          this.state.icon = "";
          this.onOpen();
        });
      });
    }
    this.iconSettingControlEl = iconSetting.controlEl;
    this.renderSelectedIconPreview();
  }
  renderSelectedIconPreview(controlEl) {
    const host2 = controlEl ?? this.iconSettingControlEl;
    if (!host2) return;
    host2.find(".obsiwealth-selected-icon")?.remove();
    const preview = host2.createDiv("obsiwealth-selected-icon");
    preview.style.display = "flex";
    preview.style.alignItems = "center";
    preview.style.justifyContent = "center";
    preview.style.width = "36px";
    preview.style.height = "36px";
    preview.style.borderRadius = "8px";
    preview.style.background = "var(--background-modifier-hover)";
    preview.style.overflow = "hidden";
    preview.style.marginRight = "8px";
    preview.style.order = "-1";
    const icon = findIcon(this.state.icon);
    if (!icon) {
      preview.setText("\u{1F3E6}");
      return;
    }
    const img = preview.createEl("img");
    img.src = getIconPath(icon.id);
    img.alt = icon.name;
    img.style.width = "32px";
    img.style.height = "32px";
    img.style.objectFit = "contain";
  }
  async save() {
    const isCard = this.state.category === "debit_card" || this.state.category === "credit_card";
    const isCash = this.state.category === "cash";
    const isVirtual = this.state.category === "virtual_account";
    const isLiability = this.state.category === "liability";
    const isInvestment = this.state.category === "investment";
    const isSocialSecurity = this.state.category === "social_security";
    if (isCard && !this.state.bank) {
      notify("\u8BF7\u9009\u62E9\u94F6\u884C");
      return;
    }
    if (isVirtual && !this.state.bank) {
      notify("\u8BF7\u9009\u62E9\u8D26\u6237");
      return;
    }
    if (isLiability && !this.state.bank) {
      notify("\u8BF7\u9009\u62E9\u8D1F\u503A");
      return;
    }
    if (isInvestment && !this.state.bank) {
      notify("\u8BF7\u9009\u62E9\u6295\u8D44\u7C7B\u578B");
      return;
    }
    if (isSocialSecurity && !this.state.bank) {
      notify("\u8BF7\u9009\u62E9\u9879\u76EE");
      return;
    }
    const name = (this.state.name || "").trim() || (isCard ? `${this.state.bank}${this.state.category === "debit_card" ? "\u50A8\u84C4\u5361" : "\u4FE1\u7528\u5361"}` : "") || (isVirtual ? this.state.bank : "") || (isLiability ? this.state.bank : "") || (isInvestment ? this.state.bank : "") || (isSocialSecurity ? this.state.bank : "") || (isCash ? "\u73B0\u91D1" : "");
    if (!name) {
      notify("\u8BF7\u8F93\u5165\u8D44\u91D1\u540D\u79F0");
      return;
    }
    const history = upsertHistoryPoint(this.state.history, this.state.amount, this.state.date);
    const latest = history.length > 0 ? history.reduce((a, b) => a.date.localeCompare(b.date) >= 0 ? a : b) : void 0;
    const item = {
      id: this.state.id,
      name,
      // 当前余额始终按历史中最新日期的记录
      amount: latest ? latest.amount : this.state.amount,
      date: latest ? latest.date : this.state.date,
      category: this.state.category,
      history
    };
    if (this.state.bank) {
      item.bank = this.state.bank;
    }
    if (this.state.card_number) {
      item.card_number = this.state.card_number;
    }
    if (this.state.remark && this.state.remark.trim()) {
      item.remark = this.state.remark.trim();
    }
    if (this.state.city && this.state.city.trim()) {
      item.city = this.state.city.trim();
    }
    if (this.state.icon) {
      item.icon = this.state.icon;
    }
    if (this.fund) {
      await this.plugin.updateFund(item);
      notify("\u5DF2\u66F4\u65B0\u8D44\u91D1");
    } else {
      await this.plugin.addFund(item);
      notify("\u5DF2\u6DFB\u52A0\u8D44\u91D1");
    }
    this.close();
  }
};

// packages/ui-web/src/view/formatters.ts
function formatCurrency(plugin, value) {
  const amount = value.toLocaleString(void 0, {
    minimumFractionDigits: plugin.settings.decimalPlaces,
    maximumFractionDigits: plugin.settings.decimalPlaces,
    useGrouping: plugin.settings.useThousandsSeparator
  });
  return `${plugin.settings.currencySymbol} ${amount}`;
}
function displayCurrency(plugin, value, hideMoney) {
  return hideMoney ? "****" : formatCurrency(plugin, value);
}
var CATEGORY_PALETTE = ["#60a5fa", "#4ade80", "#f59e0b", "#f472b6", "#a78bfa", "#22d3ee"];
function getCategoryColor(plugin, category) {
  const categories = plugin.settings.categories.map((item) => item.id);
  const categoryIndex = categories.indexOf(category);
  const index = categoryIndex >= 0 ? categoryIndex : Math.abs(Array.from(category).reduce((hash, char) => hash + char.charCodeAt(0), 0));
  return CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];
}
function getCategoryLabel(plugin, value) {
  return plugin.settings.categories.find((category) => category.id === value)?.name ?? defaultCategoryLabel(plugin.settings.language, value);
}
function getCategoryStats(assets) {
  const map = /* @__PURE__ */ new Map();
  assets.forEach((asset) => {
    map.set(asset.category, (map.get(asset.category) ?? 0) + getNetAssetCost(asset));
  });
  return Array.from(map.entries()).map(([category, value]) => ({ category, value }));
}
function getStatusColor(plugin, status) {
  return plugin.settings.statusColors[status];
}
function getStatusShadowColor(plugin, status) {
  return `${getStatusColor(plugin, status)}33`;
}
function getStatusLabel(plugin, status) {
  const labels = {
    active: statusLabel(plugin.settings.language, "active"),
    retired: statusLabel(plugin.settings.language, "retired"),
    sold: statusLabel(plugin.settings.language, "sold")
  };
  return labels[status];
}
function getAssetUsageText(plugin, asset) {
  const tr = (key) => t(plugin.settings.language, key);
  if (plugin.settings.durationDisplayMode === "days") {
    return `${getUsedDays(asset)}${tr("days")}`;
  }
  const duration = getUsageDuration(asset);
  const parts = [
    duration.years > 0 ? `${duration.years}${tr("years")}` : "",
    duration.months > 0 ? `${duration.months}${tr("months")}` : "",
    duration.days > 0 ? `${duration.days}${tr("days")}` : ""
  ].filter(Boolean);
  return parts.length > 0 ? parts.join("") : `0${tr("days")}`;
}
function getVisibleAssetTotal(assets) {
  return assets.filter((asset) => !asset.flags?.exclude_total).reduce((sum, asset) => sum + getNetAssetCost(asset), 0);
}

// packages/ui-web/src/modals/shared/datePicker.ts
var __obsiwealthDateCssInjected = false;
function ensureObsiwealthDateCss() {
  if (__obsiwealthDateCssInjected) return;
  __obsiwealthDateCssInjected = true;
  const style = document.createElement("style");
  style.setAttribute("data-obsiwealth-date-css", "1");
  style.textContent = `
input.obsiwealth-date-input {
  appearance: none !important;
  -webkit-appearance: none !important;
  -moz-appearance: textfield !important;
  background-image: none !important;
  font-variant-numeric: tabular-nums;
}
input.obsiwealth-date-input::-webkit-calendar-picker-indicator {
  display: none !important;
  -webkit-appearance: none !important;
  appearance: none !important;
  opacity: 0 !important;
  width: 0 !important;
  height: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
  pointer-events: none !important;
}
input.obsiwealth-date-input::-webkit-inner-spin-button,
input.obsiwealth-date-input::-webkit-clear-button {
  display: none !important;
  -webkit-appearance: none !important;
}
.obsiwealth-date-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}
.obsiwealth-date-wrap .obsiwealth-date-icon {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  cursor: pointer;
  pointer-events: auto;
}
`;
  document.head.appendChild(style);
}
function createDatePickerField(options) {
  ensureObsiwealthDateCss();
  const wrap = document.createElement("div");
  wrap.className = "obsiwealth-date-wrap";
  const input = document.createElement("input");
  input.type = "date";
  input.classList.add("obsiwealth-date-input");
  if (options?.value) input.value = options.value;
  if (options?.max) input.max = options.max;
  wrap.appendChild(input);
  const iconSize = options?.iconSize ?? 16;
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("width", String(iconSize));
  icon.setAttribute("height", String(iconSize));
  icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", "currentColor");
  icon.setAttribute("stroke-width", "1.8");
  icon.setAttribute("stroke-linecap", "round");
  icon.setAttribute("stroke-linejoin", "round");
  icon.classList.add("obsiwealth-date-icon");
  [
    "M3 6a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2z",
    "M3 10h18",
    "M8 2v4",
    "M16 2v4"
  ].forEach((d) => {
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", d);
    icon.appendChild(p);
  });
  icon.addEventListener("click", (e) => {
    e.stopPropagation();
    const anyInput = input;
    try {
      if (typeof anyInput.showPicker === "function") {
        anyInput.showPicker();
        return;
      }
    } catch {
    }
    input.focus();
    input.click();
  });
  wrap.appendChild(icon);
  return { wrap, input };
}

// packages/ui-web/src/modals/shared/modalLayout.ts
function createSurfaceCard(parent, options) {
  const card = parent.createDiv();
  card.style.padding = options?.padding ?? "10px 12px";
  card.style.borderRadius = options?.borderRadius ?? "12px";
  card.style.background = options?.background ?? "var(--background-secondary)";
  card.style.border = options?.border ?? "1px solid var(--background-modifier-border)";
  if (options?.style) {
    Object.assign(card.style, options.style);
  }
  return card;
}
function createSection(contentEl, title) {
  const titleEl = contentEl.createDiv();
  titleEl.innerText = title;
  titleEl.style.fontSize = "13px";
  titleEl.style.fontWeight = "700";
  titleEl.style.color = "var(--text-muted)";
  titleEl.style.margin = "18px 0 8px";
  return contentEl.createDiv();
}
function createSectionHeaderWithCount(contentEl, options) {
  const header = contentEl.createDiv();
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.justifyContent = "space-between";
  header.style.margin = options.margin ?? "6px 0 8px";
  const titleWrap = header.createDiv();
  titleWrap.style.display = "flex";
  titleWrap.style.alignItems = "baseline";
  titleWrap.style.gap = "6px";
  const title = titleWrap.createDiv({ text: options.title });
  title.style.fontSize = "13px";
  title.style.fontWeight = "800";
  title.style.color = "var(--text-muted)";
  if (options.count !== void 0) {
    const countEl = titleWrap.createDiv({ text: options.count });
    countEl.style.fontSize = "12px";
    countEl.style.fontWeight = "800";
    countEl.style.color = "var(--text-muted)";
    countEl.style.opacity = "0.7";
    countEl.style.fontVariantNumeric = "tabular-nums";
  }
  return header;
}
function createLabelValueCard(parent, options) {
  const item = createSurfaceCard(parent);
  const labelEl = item.createDiv();
  labelEl.innerText = options.label;
  labelEl.style.fontSize = "12px";
  labelEl.style.color = "var(--text-muted)";
  labelEl.style.marginBottom = "6px";
  const valueEl = item.createDiv();
  valueEl.innerText = options.value;
  valueEl.style.fontSize = options.valueFontSize ?? "14px";
  valueEl.style.fontWeight = options.valueFontWeight ?? "600";
  if (options.valueColor) {
    valueEl.style.color = options.valueColor;
  } else if (options.valueFontSize === "16px") {
    valueEl.style.color = "var(--text-normal)";
  }
  return item;
}

// packages/ui-web/src/modals/fundDetailModal.ts
var FundDetailModal = class extends import_obsidian9.Modal {
  constructor(app, plugin, fund) {
    super(app);
    this.plugin = plugin;
    this.fundRef = fund;
  }
  onOpen() {
    this.refresh();
  }
  refresh() {
    const latest = this.plugin.funds.find((item) => item.id === this.fundRef.id);
    if (latest) {
      this.fundRef = latest;
    }
    const latestPoint = this.getLatestHistoryPoint(this.fundRef.history ?? []);
    if (latestPoint) {
      this.fundRef = {
        ...this.fundRef,
        amount: latestPoint.amount,
        date: latestPoint.date
      };
    }
    const { contentEl } = this;
    contentEl.empty();
    contentEl.style.position = "relative";
    this.renderEditButton(contentEl);
    this.renderHero(contentEl);
    this.renderBalanceBar(contentEl);
    this.renderHistorySection(contentEl);
    this.renderDeleteButton(contentEl);
  }
  renderEditButton(contentEl) {
    const button = createIconButton(contentEl, {
      ariaLabel: "\u7F16\u8F91",
      content: this.createSvgIcon("pencil", 18),
      corner: "top-right"
    });
    button.onclick = () => {
      this.close();
      new FundModal(this.app, this.plugin, this.fundRef).open();
    };
  }
  renderHero(contentEl) {
    const hero = contentEl.createDiv();
    hero.style.display = "grid";
    hero.style.gridTemplateColumns = "64px 1fr";
    hero.style.alignItems = "center";
    hero.style.gap = "14px";
    hero.style.margin = "6px 40px 18px 0";
    const logo = hero.createDiv();
    logo.style.width = "64px";
    logo.style.height = "64px";
    logo.style.display = "flex";
    logo.style.alignItems = "center";
    logo.style.justifyContent = "center";
    logo.style.borderRadius = "14px";
    logo.style.background = "var(--background-secondary)";
    logo.style.border = "1px solid var(--background-modifier-border)";
    logo.style.fontSize = "26px";
    logo.style.fontWeight = "900";
    logo.style.color = "var(--text-muted)";
    logo.style.overflow = "hidden";
    this.renderLogoInto(logo, 48);
    const info = hero.createDiv();
    info.style.display = "flex";
    info.style.flexDirection = "column";
    info.style.gap = "4px";
    info.style.minWidth = "0";
    const primary = info.createEl("h2", { text: this.getPrimaryLabel() });
    primary.style.margin = "0";
    primary.style.fontSize = "22px";
    primary.style.fontWeight = "900";
    primary.style.color = "var(--text-normal)";
    primary.style.overflow = "hidden";
    primary.style.textOverflow = "ellipsis";
    primary.style.whiteSpace = "nowrap";
    const secondary = info.createDiv({ text: this.getSecondaryLabel() });
    secondary.style.fontSize = "13px";
    secondary.style.fontWeight = "700";
    secondary.style.color = "var(--text-muted)";
    secondary.style.overflow = "hidden";
    secondary.style.textOverflow = "ellipsis";
    secondary.style.whiteSpace = "nowrap";
  }
  renderBalanceBar(contentEl) {
    const bar = createSurfaceCard(contentEl, {
      padding: "14px 16px",
      borderRadius: "14px",
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "14px",
        marginBottom: "16px"
      }
    });
    const left = bar.createDiv();
    left.style.display = "flex";
    left.style.flexDirection = "column";
    left.style.gap = "4px";
    left.style.minWidth = "0";
    const label = left.createDiv({ text: "\u5F53\u524D\u4F59\u989D" });
    label.style.fontSize = "12px";
    label.style.fontWeight = "800";
    label.style.color = "var(--text-muted)";
    const valueEl = left.createDiv({ text: this.formatCurrencyWithSign(this.fundRef.amount) });
    valueEl.style.fontSize = "26px";
    valueEl.style.fontWeight = "950";
    valueEl.style.lineHeight = "1.1";
    valueEl.style.color = this.getCategory().type === "liability" ? "#ef4444" : "var(--text-normal)";
    const button = createPillButton(bar, {
      text: "\u66F4\u65B0\u4F59\u989D",
      variant: "primary",
      padding: "9px 16px"
    });
    button.style.fontSize = "14px";
    button.onclick = () => this.promptUpdateBalance();
  }
  async promptUpdateBalance() {
    const input = await openPromptModal(this.app, {
      title: "\u66F4\u65B0\u4F59\u989D",
      placeholder: "\u8BF7\u8F93\u5165\u4F59\u989D",
      defaultValue: String(this.fundRef.amount ?? 0),
      type: "number"
    });
    if (input === null) {
      return;
    }
    const trimmed = input.trim();
    if (!trimmed) {
      notify("\u8BF7\u8F93\u5165\u6709\u6548\u91D1\u989D");
      return;
    }
    const amount = Number(trimmed);
    if (!Number.isFinite(amount)) {
      notify("\u8BF7\u8F93\u5165\u6709\u6548\u91D1\u989D");
      return;
    }
    const date = getTodayISODate();
    const history = this.upsertHistoryPoint(this.fundRef.history ?? [], amount, date);
    const latest = this.getLatestHistoryPoint(history);
    const updated = {
      ...this.fundRef,
      amount: latest ? latest.amount : amount,
      date: latest ? latest.date : date,
      history
    };
    await this.plugin.updateFund(updated);
    this.fundRef = updated;
    notify("\u5DF2\u66F4\u65B0\u4F59\u989D");
    this.refresh();
  }
  renderHistorySection(contentEl) {
    const historyCountPreview = (this.fundRef.history ?? []).length;
    const header = createSectionHeaderWithCount(contentEl, {
      title: "\u64CD\u4F5C\u8BB0\u5F55",
      count: `${historyCountPreview} \u6761`
    });
    const addBtn = createCircleAddButton(header, {
      ariaLabel: "\u65B0\u589E\u8BB0\u5F55"
    });
    addBtn.onclick = () => this.promptAddHistoryPoint();
    const history = [...this.fundRef.history ?? []].sort((a, b) => b.date.localeCompare(a.date));
    if (history.length === 0) {
      const empty = contentEl.createDiv({ text: "\u6682\u65E0\u64CD\u4F5C\u8BB0\u5F55" });
      empty.style.padding = "12px 2px";
      empty.style.color = "var(--text-muted)";
      empty.style.fontSize = "13px";
      empty.style.fontWeight = "700";
      return;
    }
    const list = contentEl.createDiv();
    list.style.display = "flex";
    list.style.flexDirection = "column";
    let amountColChars = 0;
    history.forEach((point) => {
      const formatted = this.formatCurrency(point.amount);
      if (formatted.length > amountColChars) amountColChars = formatted.length;
    });
    history.forEach((point, index) => {
      this.renderHistoryRow(list, point, index === history.length - 1, amountColChars);
    });
  }
  async promptAddHistoryPoint() {
    const result = await this.openAddHistoryPointModal();
    if (!result) return;
    const { date, amount } = result;
    const history = this.upsertHistoryPoint(this.fundRef.history ?? [], amount, date);
    const latest = this.getLatestHistoryPoint(history);
    const updated = {
      ...this.fundRef,
      amount: latest ? latest.amount : amount,
      date: latest ? latest.date : date,
      history
    };
    await this.plugin.updateFund(updated);
    this.fundRef = updated;
    notify("\u5DF2\u65B0\u589E\u8BB0\u5F55");
    this.refresh();
  }
  // 新增操作记录弹窗：日期 + 金额同一个页面
  openAddHistoryPointModal() {
    return new Promise((resolve) => {
      const modal = new import_obsidian9.Modal(this.app);
      let settled = false;
      modal.onOpen = () => {
        const { contentEl } = modal;
        contentEl.empty();
        const title = contentEl.createEl("h3", { text: "\u65B0\u589E\u64CD\u4F5C\u8BB0\u5F55" });
        title.style.margin = "0 0 14px";
        title.style.fontSize = "16px";
        title.style.fontWeight = "900";
        const dateRow = contentEl.createDiv();
        dateRow.style.display = "flex";
        dateRow.style.alignItems = "center";
        dateRow.style.gap = "10px";
        dateRow.style.marginBottom = "12px";
        const dateLabel = dateRow.createDiv({ text: "\u65E5\u671F" });
        dateLabel.style.fontSize = "13px";
        dateLabel.style.fontWeight = "800";
        dateLabel.style.color = "var(--text-muted)";
        dateLabel.style.width = "48px";
        dateLabel.style.flexShrink = "0";
        const dateField = createDatePickerField({
          value: getTodayISODate(),
          max: getTodayISODate(),
          iconSize: 16
        });
        const dateInput = dateField.input;
        dateField.wrap.style.flex = "1 1 auto";
        dateField.wrap.style.display = "flex";
        dateInput.style.flex = "1 1 auto";
        dateInput.style.width = "100%";
        dateInput.style.padding = "8px 12px";
        dateInput.style.paddingRight = "32px";
        dateInput.style.fontSize = "14px";
        dateInput.style.borderRadius = "10px";
        dateInput.style.border = "1px solid var(--background-modifier-border)";
        dateInput.style.background = "var(--background-primary)";
        dateInput.style.color = "var(--text-normal)";
        dateInput.style.boxSizing = "border-box";
        dateRow.appendChild(dateField.wrap);
        const amountRow = contentEl.createDiv();
        amountRow.style.display = "flex";
        amountRow.style.alignItems = "center";
        amountRow.style.gap = "10px";
        amountRow.style.marginBottom = "4px";
        const amountLabel = amountRow.createDiv({ text: "\u91D1\u989D" });
        amountLabel.style.fontSize = "13px";
        amountLabel.style.fontWeight = "800";
        amountLabel.style.color = "var(--text-muted)";
        amountLabel.style.width = "48px";
        amountLabel.style.flexShrink = "0";
        const amountInput = amountRow.createEl("input");
        amountInput.type = "number";
        amountInput.placeholder = "\u8BF7\u8F93\u5165\u4F59\u989D";
        amountInput.value = String(this.fundRef.amount ?? 0);
        amountInput.style.flex = "1 1 auto";
        amountInput.style.padding = "8px 12px";
        amountInput.style.fontSize = "14px";
        amountInput.style.borderRadius = "10px";
        amountInput.style.border = "1px solid var(--background-modifier-border)";
        amountInput.style.background = "var(--background-primary)";
        amountInput.style.color = "var(--text-normal)";
        amountInput.style.boxSizing = "border-box";
        const btnRow = contentEl.createDiv();
        btnRow.style.display = "flex";
        btnRow.style.justifyContent = "flex-end";
        btnRow.style.gap = "10px";
        btnRow.style.marginTop = "16px";
        const cancelBtn = createPillButton(btnRow, {
          text: "\u53D6\u6D88",
          variant: "ghost"
        });
        const confirmBtn = createPillButton(btnRow, {
          text: "\u786E\u5B9A",
          variant: "primary"
        });
        const submit = () => {
          const date = (dateInput.value || "").trim();
          if (!date) {
            notify("\u8BF7\u9009\u62E9\u65E5\u671F");
            return;
          }
          const amount = Number((amountInput.value || "").trim());
          if (!Number.isFinite(amount)) {
            notify("\u8BF7\u8F93\u5165\u6709\u6548\u91D1\u989D");
            return;
          }
          settled = true;
          resolve({ date, amount });
          modal.close();
        };
        cancelBtn.onclick = () => {
          settled = true;
          resolve(null);
          modal.close();
        };
        confirmBtn.onclick = submit;
        const handleKey = (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            settled = true;
            resolve(null);
            modal.close();
          }
        };
        dateInput.addEventListener("keydown", handleKey);
        amountInput.addEventListener("keydown", handleKey);
        setTimeout(() => amountInput.focus(), 30);
      };
      modal.onClose = () => {
        if (!settled) {
          resolve(null);
        }
        modal.contentEl.empty();
      };
      modal.open();
    });
  }
  renderHistoryRow(parent, point, isLast, amountColChars = 0) {
    const row = parent.createDiv();
    row.style.padding = "10px 2px";
    if (!isLast) {
      row.style.borderBottom = "1px solid var(--background-modifier-border)";
    }
    const summary = row.createDiv();
    summary.style.display = "flex";
    summary.style.alignItems = "center";
    summary.style.cursor = "pointer";
    summary.style.gap = "0";
    const labelEl = summary.createDiv({ text: "\u8C03\u6574\u4F59\u989D\u4E3A" });
    labelEl.style.fontSize = "13px";
    labelEl.style.fontWeight = "800";
    labelEl.style.color = "var(--text-normal)";
    labelEl.style.whiteSpace = "nowrap";
    labelEl.style.marginRight = "6px";
    const amountEl = summary.createDiv({ text: this.formatCurrency(point.amount) });
    amountEl.style.fontSize = "13px";
    amountEl.style.fontWeight = "800";
    amountEl.style.color = "var(--text-normal)";
    amountEl.style.fontVariantNumeric = "tabular-nums";
    amountEl.style.whiteSpace = "nowrap";
    amountEl.style.display = "inline-block";
    amountEl.style.textAlign = "right";
    if (amountColChars > 0) {
      amountEl.style.minWidth = `${amountColChars}ch`;
    }
    const spacer = summary.createDiv();
    spacer.style.flex = "1 1 auto";
    const { year, month, day } = this.splitDateParts(point.date);
    const dateWrap = summary.createDiv();
    dateWrap.style.display = "flex";
    dateWrap.style.alignItems = "center";
    dateWrap.style.gap = "0";
    dateWrap.style.whiteSpace = "nowrap";
    dateWrap.style.fontVariantNumeric = "tabular-nums";
    const yearEl = dateWrap.createDiv({ text: `${year}\u5E74` });
    const monthEl = dateWrap.createDiv({ text: `${month}\u6708` });
    const dayEl = dateWrap.createDiv({ text: `${day}\u65E5` });
    [yearEl, monthEl, dayEl].forEach((el) => {
      el.style.fontSize = "12px";
      el.style.fontWeight = "700";
      el.style.color = "var(--text-muted)";
      el.style.whiteSpace = "nowrap";
      el.style.fontVariantNumeric = "tabular-nums";
    });
    const editor = row.createDiv();
    editor.style.display = "none";
    editor.style.marginTop = "10px";
    editor.style.gap = "6px";
    editor.style.alignItems = "center";
    editor.style.flexWrap = "nowrap";
    const amountInput = editor.createEl("input");
    amountInput.type = "number";
    amountInput.value = String(point.amount);
    amountInput.style.flex = "0 0 75px";
    amountInput.style.width = "75px";
    amountInput.style.minWidth = "0";
    amountInput.style.padding = "6px 8px";
    amountInput.style.borderRadius = "8px";
    amountInput.style.border = "1px solid var(--background-modifier-border)";
    amountInput.style.background = "var(--background-primary)";
    amountInput.style.color = "var(--text-normal)";
    amountInput.style.fontSize = "13px";
    amountInput.style.boxSizing = "border-box";
    const dateField = createDatePickerField({
      value: point.date,
      max: getTodayISODate(),
      iconSize: 14
    });
    const dateInput = dateField.input;
    dateField.wrap.style.flex = "1 1 auto";
    dateField.wrap.style.minWidth = "0";
    dateField.wrap.style.display = "flex";
    dateInput.style.flex = "1 1 auto";
    dateInput.style.width = "100%";
    dateInput.style.minWidth = "0";
    dateInput.style.padding = "6px 10px";
    dateInput.style.paddingRight = "28px";
    dateInput.style.borderRadius = "8px";
    dateInput.style.border = "1px solid var(--background-modifier-border)";
    dateInput.style.background = "var(--background-primary)";
    dateInput.style.color = "var(--text-normal)";
    dateInput.style.fontSize = "13px";
    dateInput.style.boxSizing = "border-box";
    editor.appendChild(dateField.wrap);
    const actionBtnStyle = (btn, color) => {
      btn.style.padding = "4px";
      btn.style.border = "none";
      btn.style.background = "transparent";
      btn.style.color = color;
      btn.style.cursor = "pointer";
      btn.style.display = "inline-flex";
      btn.style.alignItems = "center";
      btn.style.justifyContent = "center";
      btn.style.flexShrink = "0";
      btn.style.lineHeight = "0";
      btn.style.borderRadius = "6px";
      btn.style.boxShadow = "none";
    };
    const saveBtn = editor.createEl("button");
    saveBtn.ariaLabel = "\u4FDD\u5B58";
    actionBtnStyle(saveBtn, "var(--interactive-accent)");
    saveBtn.appendChild(this.createSvgIcon("check", 16));
    const cancelBtn = editor.createEl("button");
    cancelBtn.ariaLabel = "\u53D6\u6D88";
    actionBtnStyle(cancelBtn, "var(--text-muted)");
    cancelBtn.appendChild(this.createSvgIcon("close", 16));
    const deleteBtn = editor.createEl("button");
    deleteBtn.ariaLabel = "\u5220\u9664";
    actionBtnStyle(deleteBtn, "#ef4444");
    deleteBtn.appendChild(this.createSvgIcon("trash", 16));
    summary.onclick = () => {
      editor.style.display = editor.style.display === "none" ? "flex" : "none";
    };
    saveBtn.onclick = async (event) => {
      event.stopPropagation();
      const nextAmount = Number(amountInput.value);
      if (!Number.isFinite(nextAmount)) {
        notify("\u8BF7\u8F93\u5165\u6709\u6548\u91D1\u989D");
        return;
      }
      const nextDate = dateInput.value || point.date;
      await this.updateHistoryPoint(point, nextAmount, nextDate);
    };
    cancelBtn.onclick = (event) => {
      event.stopPropagation();
      amountInput.value = String(point.amount);
      dateInput.value = point.date;
      editor.style.display = "none";
    };
    deleteBtn.onclick = async (event) => {
      event.stopPropagation();
      if (!confirm("\u786E\u5B9A\u5220\u9664\u8FD9\u6761\u64CD\u4F5C\u8BB0\u5F55\uFF1F")) {
        return;
      }
      await this.deleteHistoryPoint(point);
    };
  }
  async updateHistoryPoint(original, amount, date) {
    const history = (this.fundRef.history ?? []).map(
      (point) => point.id === original.id ? { ...point, amount, date } : point
    ).sort((a, b) => a.date.localeCompare(b.date));
    const latest = this.getLatestHistoryPoint(history);
    const updated = {
      ...this.fundRef,
      history,
      amount: latest ? latest.amount : this.fundRef.amount,
      date: latest ? latest.date : this.fundRef.date
    };
    await this.plugin.updateFund(updated);
    this.fundRef = updated;
    notify("\u5DF2\u66F4\u65B0\u8BB0\u5F55");
    this.refresh();
  }
  async deleteHistoryPoint(original) {
    const history = (this.fundRef.history ?? []).filter((point) => point.id !== original.id);
    const latest = this.getLatestHistoryPoint(history);
    const updated = {
      ...this.fundRef,
      history,
      amount: latest ? latest.amount : this.fundRef.amount,
      date: latest ? latest.date : this.fundRef.date
    };
    await this.plugin.updateFund(updated);
    this.fundRef = updated;
    notify("\u5DF2\u5220\u9664\u8BB0\u5F55");
    this.refresh();
  }
  getLatestHistoryPoint(history) {
    return getLatestHistoryPoint(history);
  }
  upsertHistoryPoint(history, amount, date) {
    return upsertHistoryPoint(history, amount, date);
  }
  renderDeleteButton(contentEl) {
    const button = createFullWidthDeleteButton(contentEl, {
      ariaLabel: "\u5220\u9664",
      icon: this.createSvgIcon("trash", 18),
      text: "\u5220\u9664\u6B64\u8D26\u6237"
    });
    button.onclick = async () => {
      if (!confirm(`\u786E\u5B9A\u5220\u9664"${this.getPrimaryLabel()}"\uFF1F`)) {
        return;
      }
      await this.plugin.deleteFund(this.fundRef.id);
      notify("\u5DF2\u5220\u9664");
      this.close();
    };
  }
  getPrimaryLabel() {
    if (this.fundRef.bank) {
      const tail = this.getCardTail(this.fundRef.card_number);
      return tail ? `${this.fundRef.bank}\uFF08${tail}\uFF09` : this.fundRef.bank;
    }
    return this.fundRef.name || this.getCategory().name;
  }
  getSecondaryLabel() {
    if (this.fundRef.category === "social_security" && this.fundRef.city && this.fundRef.city.trim()) {
      const city = this.fundRef.city.trim();
      const remark = this.fundRef.remark?.trim();
      return remark ? `${city}\uFF08${remark}\uFF09` : city;
    }
    if (this.fundRef.remark && this.fundRef.remark.trim()) {
      return this.fundRef.remark.trim();
    }
    if (this.fundRef.bank) {
      const category = this.getCategory();
      const defaultName = `${this.fundRef.bank}${category.id === "debit_card" ? "\u50A8\u84C4\u5361" : "\u4FE1\u7528\u5361"}`;
      if (this.fundRef.name && this.fundRef.name !== defaultName) {
        return this.fundRef.name;
      }
      return category.name;
    }
    return this.getCategory().name;
  }
  getLogoPlaceholder() {
    if (this.fundRef.bank) {
      return this.fundRef.bank.charAt(0);
    }
    const map = {
      cash: "\u{1F4B5}",
      virtual_account: "\u25C9",
      investment: "\u{1F4C8}",
      claim: "\u21A9",
      liability: "\u26A0",
      social_security: "\u{1F6E1}",
      custom_asset: "\u2605"
    };
    return map[this.getCategory().id] ?? "\u2022";
  }
  getLogoKey() {
    const bankKeyMap = {
      "\u5DE5\u5546\u94F6\u884C": "icbc",
      "\u5EFA\u8BBE\u94F6\u884C": "ccb",
      "\u519C\u4E1A\u94F6\u884C": "abc",
      "\u4E2D\u56FD\u94F6\u884C": "boc",
      "\u62DB\u5546\u94F6\u884C": "cmb",
      "\u4EA4\u901A\u94F6\u884C": "bocom",
      "\u90AE\u653F\u94F6\u884C": "psbc",
      "\u90AE\u50A8\u94F6\u884C": "psbc",
      "\u4E2D\u4FE1\u94F6\u884C": "citic_bank",
      "\u4F17\u5B89\u94F6\u884C": "zhongan_bank",
      "\u5317\u4EAC\u94F6\u884C": "bob",
      "\u6C47\u4E30\u94F6\u884C": "hsbc",
      "\u6CB3\u5357\u519C\u6751\u4FE1\u7528\u793E": "henan_rcc",
      "\u652F\u4ED8\u5B9D": "alipay",
      "\u5FAE\u4FE1": "wechat",
      "\u8682\u8681\u82B1\u5457": "huabei",
      "\u82B1\u5457": "huabei",
      "\u4EAC\u4E1C\u767D\u6761": "jd_baitiao",
      "\u767D\u6761": "jd_baitiao"
    };
    if (this.fundRef.bank) {
      if (bankKeyMap[this.fundRef.bank]) return bankKeyMap[this.fundRef.bank];
      for (const zh of Object.keys(bankKeyMap)) {
        if (this.fundRef.bank.includes(zh)) return bankKeyMap[zh];
      }
    }
    const source = this.fundRef.name ?? "";
    for (const zh of Object.keys(bankKeyMap)) {
      if (source.includes(zh)) return bankKeyMap[zh];
    }
    return null;
  }
  getPluginAssetDir() {
    return getPluginAssetDir(this.plugin);
  }
  normalizeSvg(text, size) {
    return normalizeSvgContent(text, size);
  }
  renderLogoInto(container, size) {
    container.empty();
    const key = this.getLogoKey();
    const fallback = () => {
      container.empty();
      if (this.renderCategoryIconInto(container, this.getCategory().id, size)) {
        return;
      }
      container.innerText = this.getLogoPlaceholder();
    };
    if (!key) {
      fallback();
      return;
    }
    const store = host().store;
    const resources = host().resources;
    const svgPath = `${this.getPluginAssetDir()}/assets/logo/${key}.svg`;
    const pngPath = `${this.getPluginAssetDir()}/assets/logo/${key}.png`;
    fallback();
    (async () => {
      try {
        if (await store.exists(svgPath)) {
          const text = await store.read(svgPath);
          if (!container.isConnected) return;
          container.empty();
          container.innerHTML = this.normalizeSvg(text, size);
          return;
        }
        if (await store.exists(pngPath)) {
          if (!container.isConnected) return;
          container.empty();
          const img = container.createEl("img");
          img.src = resources.resolveUrl(pngPath);
          img.alt = key;
          img.style.width = `${size}px`;
          img.style.height = `${size}px`;
          img.style.objectFit = "contain";
        }
      } catch {
      }
    })();
  }
  // 为特定分类渲染内嵌矢量图标；成功返回 true
  renderCategoryIconInto(container, categoryId, size) {
    if (categoryId !== "cash") return false;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", String(size));
    svg.setAttribute("height", String(size));
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "#16a34a");
    svg.setAttribute("stroke-width", "1.6");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    const paths = [
      "M3 7h18v10H3z",
      "M12 9.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z",
      "M6 10v4",
      "M18 10v4"
    ];
    paths.forEach((d) => {
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("d", d);
      svg.appendChild(p);
    });
    container.appendChild(svg);
    return true;
  }
  getCardTail(cardNumber) {
    if (!cardNumber) {
      return "";
    }
    const digits = cardNumber.replace(/\D/g, "");
    if (!digits) {
      return cardNumber.trim();
    }
    return digits.slice(-4);
  }
  getCategory() {
    return FUND_CATEGORIES.find((c) => c.id === this.fundRef.category) ?? FUND_CATEGORIES[0];
  }
  formatCurrency(value) {
    return formatCurrency(this.plugin, value);
  }
  formatCurrencyWithSign(value) {
    const formatted = this.formatCurrency(value);
    if (this.getCategory().type === "liability" && value > 0) {
      return `-${formatted}`;
    }
    return formatted;
  }
  // 拆分 ISO 日期为年/月/日，便于对齐显示（月/日统一补零为两位，保证跨行按列对齐）
  splitDateParts(dateStr) {
    if (!dateStr) return { year: "\u2014", month: "\u2014", day: "\u2014" };
    const parts = dateStr.split("-");
    if (parts.length !== 3) return { year: dateStr, month: "", day: "" };
    const pad2 = (s) => {
      const n = Number(s);
      if (!Number.isFinite(n)) return s;
      return n < 10 ? `0${n}` : String(n);
    };
    return {
      year: parts[0],
      month: pad2(parts[1]),
      day: pad2(parts[2])
    };
  }
  // 统一的线性 SVG 图标（lucide 风格），与其他页面保持一致
  createSvgIcon(name, size = 18) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", String(size));
    svg.setAttribute("height", String(size));
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.8");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    const ds = (() => {
      switch (name) {
        case "pencil":
          return [
            "M12 20h9",
            "M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z"
          ];
        case "trash":
          return [
            "M3 6h18",
            "M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2",
            "M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6",
            "M10 11v6",
            "M14 11v6"
          ];
        case "check":
          return ["M5 12l5 5L20 7"];
        case "close":
          return ["M6 6l12 12", "M18 6l-12 12"];
      }
    })();
    ds.forEach((d) => {
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("d", d);
      svg.appendChild(p);
    });
    return svg;
  }
};

// packages/ui-web/src/pages/fundsPage.ts
function renderFundsPage(ctx, el) {
  el.style.overflow = "hidden";
  el.style.paddingBottom = "0";
  el.style.display = "flex";
  el.style.flexDirection = "column";
  el.style.minHeight = "0";
  const assetTotal = getFundAssetTotal(ctx.plugin);
  const liabilityTotal = getFundLiabilityTotal(ctx.plugin);
  const netAsset = assetTotal - liabilityTotal;
  renderFundNetSummaryCard(ctx, el, { netAsset, assetTotal, liabilityTotal });
  const columns = el.createDiv();
  columns.style.display = "grid";
  columns.style.gridTemplateColumns = "minmax(0, 1fr) 1px minmax(0, 1fr)";
  columns.style.gap = "18px";
  columns.style.alignItems = "stretch";
  columns.style.flex = "1 1 auto";
  columns.style.minHeight = "0";
  columns.style.overflow = "hidden";
  columns.style.paddingBottom = "80px";
  const leftCol = columns.createDiv();
  leftCol.style.minWidth = "0";
  leftCol.style.minHeight = "0";
  leftCol.style.overflowY = "auto";
  leftCol.style.overflowX = "hidden";
  leftCol.style.paddingRight = "4px";
  leftCol.style.overscrollBehavior = "contain";
  const divider = columns.createDiv();
  divider.style.alignSelf = "stretch";
  divider.style.width = "0";
  divider.style.borderLeft = "1px dashed var(--background-modifier-border)";
  const rightCol = columns.createDiv();
  rightCol.style.minWidth = "0";
  rightCol.style.minHeight = "0";
  rightCol.style.overflowY = "auto";
  rightCol.style.overflowX = "hidden";
  rightCol.style.paddingRight = "4px";
  rightCol.style.overscrollBehavior = "contain";
  renderFundSortToolbar(ctx, leftCol);
  const sectionWrap = leftCol.createDiv();
  sectionWrap.style.display = "grid";
  sectionWrap.style.gridTemplateColumns = "1fr";
  sectionWrap.style.gap = "10px";
  if (ctx.fundSortMode === "grouped") {
    FUND_CATEGORIES.forEach((category) => renderFundCategorySection(ctx, sectionWrap, category));
  } else {
    renderFundFlatList(ctx, sectionWrap);
  }
  renderFundStatsInline(ctx, rightCol);
}
function renderFundStatsInline(ctx, parent) {
  renderFundStatsTabs(ctx, parent);
  const tab = ctx.fundStatsTab;
  const heroTitle = tab === "asset" ? "\u8D44\u91D1" : tab === "liability" ? "\u8D1F\u503A" : "\u51C0\u8D44\u91D1";
  const statsGrid = parent.createDiv();
  statsGrid.style.display = "grid";
  statsGrid.style.gridTemplateColumns = "minmax(0, 1fr)";
  statsGrid.style.gap = "0";
  statsGrid.style.marginTop = "12px";
  statsGrid.style.alignItems = "stretch";
  const addDivider = () => {
    const div = statsGrid.createDiv();
    div.style.borderTop = "1px dashed var(--background-modifier-border)";
    div.style.margin = "6px 2px";
  };
  if (tab === "netAsset") {
    const trendCard2 = ctx.createFundStatsCard(statsGrid, `${heroTitle}\u8D8B\u52BF`);
    renderFundTrendWithRangePicker(ctx, trendCard2, tab);
    addDivider();
    renderFundNetAssetBarCard(ctx, statsGrid);
    return;
  }
  const heroValue = tab === "asset" ? getFundAssetTotal(ctx.plugin) : getFundLiabilityTotal(ctx.plugin);
  const trendCard = ctx.createFundStatsCard(statsGrid, `${heroTitle}\u8D8B\u52BF`);
  renderFundTrendWithRangePicker(ctx, trendCard, tab);
  addDivider();
  renderFundPieCard(ctx, statsGrid, tab, heroTitle, heroValue);
  addDivider();
  renderFundRankingCard(ctx, statsGrid, tab, heroTitle);
}
function renderFundTrendWithRangePicker(ctx, body, tab) {
  const years = getAvailableFundYears(ctx.plugin, tab);
  const select = document.createElement("select");
  applyFundStatsPillStyle(select);
  select.style.appearance = "none";
  select.style.webkitAppearance = "none";
  select.style.mozAppearance = "none";
  select.style.paddingRight = "10px";
  select.style.backgroundImage = "none";
  select.style.textAlignLast = "center";
  const addOption = (value, label) => {
    const opt = document.createElement("option");
    opt.textContent = label;
    opt.value = value;
    select.appendChild(opt);
    return opt;
  };
  addOption("recent", "\u6700\u8FD1");
  addOption("all", "\u5168\u90E8");
  [...years].reverse().forEach((year) => addOption(year, `${year}\u5E74`));
  const valid = ctx.fundTrendRange === "recent" || ctx.fundTrendRange === "all" || years.indexOf(ctx.fundTrendRange) !== -1;
  if (!valid) {
    ctx.fundTrendRange = "recent";
  }
  select.value = ctx.fundTrendRange;
  select.onchange = () => {
    ctx.fundTrendRange = select.value;
    ctx.render();
  };
  if (!mountFundStatsHeaderExtra(body, select)) {
    const picker = body.createDiv();
    picker.style.display = "flex";
    picker.style.justifyContent = "flex-end";
    picker.style.alignItems = "center";
    picker.style.gap = "8px";
    picker.style.marginBottom = "6px";
    picker.style.paddingRight = "2px";
    picker.appendChild(select);
  }
  const chartHost = body.createDiv();
  renderStatsLineChart(ctx, chartHost, getFundMonthlySeries(ctx.plugin, tab, ctx.fundTrendRange));
}
function renderFundNetSummaryCard(ctx, parent, totals) {
  const card = parent.createDiv();
  card.style.padding = "22px 24px";
  card.style.marginBottom = "18px";
  card.style.borderRadius = "24px";
  card.style.background = "linear-gradient(145deg, var(--background-secondary), var(--background-primary))";
  card.style.border = "1px solid var(--background-modifier-border)";
  card.style.boxShadow = "0 16px 38px rgba(0,0,0,0.14)";
  card.style.width = "100%";
  card.style.boxSizing = "border-box";
  card.style.flex = "0 0 auto";
  card.style.display = "flex";
  card.style.alignItems = "center";
  card.style.gap = "24px";
  const netSeg = card.createDiv();
  netSeg.style.display = "flex";
  netSeg.style.flexDirection = "column";
  netSeg.style.alignItems = "flex-start";
  netSeg.style.gap = "4px";
  netSeg.style.flex = "1 1 0";
  netSeg.style.minWidth = "0";
  const netLabel = netSeg.createDiv({ text: "\u51C0\u8D44\u91D1" });
  netLabel.style.fontSize = "16px";
  netLabel.style.fontWeight = "800";
  netLabel.style.color = "var(--text-muted)";
  netLabel.style.letterSpacing = "0.04em";
  const netValue = netSeg.createDiv();
  netValue.style.fontSize = "38px";
  netValue.style.fontWeight = "950";
  netValue.style.lineHeight = "1.05";
  netValue.style.color = "var(--text-normal)";
  netValue.style.display = "flex";
  netValue.style.alignItems = "baseline";
  ctx.renderSlotNumber(netValue.createSpan(), ctx.displayCurrency(totals.netAsset));
  const accountsSeg = card.createDiv();
  accountsSeg.style.flex = "1 1 0";
  accountsSeg.style.display = "flex";
  accountsSeg.style.flexDirection = "column";
  accountsSeg.style.alignItems = "center";
  accountsSeg.style.justifyContent = "center";
  accountsSeg.style.gap = "2px";
  accountsSeg.style.color = "var(--text-muted)";
  accountsSeg.style.fontWeight = "800";
  accountsSeg.style.minWidth = "0";
  if (ctx.plugin.funds.length <= 0) {
    const empty = accountsSeg.createDiv({ text: "\u6682\u65E0\u8D44\u91D1\u8D26\u6237" });
    empty.style.fontSize = "16px";
  } else {
    const count = accountsSeg.createDiv();
    count.style.fontSize = "30px";
    count.style.fontWeight = "950";
    count.style.lineHeight = "1.05";
    count.style.color = "var(--text-normal)";
    count.style.display = "flex";
    count.style.justifyContent = "center";
    ctx.renderSlotNumber(count.createSpan(), String(ctx.plugin.funds.length));
    const label = accountsSeg.createDiv({ text: "\u4E2A\u8D44\u91D1\u8D26\u6237" });
    label.style.fontSize = "15px";
    label.style.fontWeight = "700";
    label.style.letterSpacing = "0.04em";
  }
  const rightSeg = card.createDiv();
  rightSeg.style.display = "grid";
  rightSeg.style.gridTemplateColumns = "1fr 1px 1fr";
  rightSeg.style.alignItems = "center";
  rightSeg.style.gap = "16px";
  rightSeg.style.flex = "1 1 0";
  rightSeg.style.minWidth = "0";
  renderFundInlineMetric(ctx, rightSeg, "\u8D44\u91D1", ctx.displayCurrency(totals.assetTotal), false);
  const divider = rightSeg.createDiv();
  divider.style.alignSelf = "stretch";
  divider.style.width = "0";
  divider.style.borderLeft = "2px dashed var(--background-modifier-border)";
  divider.style.margin = "6px 0";
  renderFundInlineMetric(ctx, rightSeg, "\u8D1F\u503A", ctx.displayCurrency(totals.liabilityTotal), true);
}
function renderFundInlineMetric(ctx, parent, label, value, liability) {
  const wrap = parent.createDiv();
  wrap.style.display = "flex";
  wrap.style.flexDirection = "column";
  wrap.style.alignItems = "center";
  wrap.style.gap = "4px";
  wrap.style.minWidth = "0";
  const labelEl = wrap.createDiv({ text: label });
  labelEl.style.fontSize = "16px";
  labelEl.style.fontWeight = "800";
  labelEl.style.color = "var(--text-muted)";
  labelEl.style.letterSpacing = "0.04em";
  const valueEl = wrap.createDiv();
  valueEl.style.fontSize = "26px";
  valueEl.style.fontWeight = "950";
  valueEl.style.lineHeight = "1.1";
  valueEl.style.color = liability ? "#ef4444" : "var(--text-normal)";
  valueEl.style.display = "flex";
  valueEl.style.justifyContent = "center";
  valueEl.style.maxWidth = "100%";
  valueEl.style.overflow = "hidden";
  valueEl.style.textOverflow = "ellipsis";
  valueEl.style.whiteSpace = "nowrap";
  ctx.renderSlotNumber(valueEl.createSpan(), value);
}
function renderFundSortToolbar(ctx, el) {
  const bar = el.createDiv();
  bar.style.display = "flex";
  bar.style.justifyContent = "flex-end";
  bar.style.alignItems = "center";
  bar.style.gap = "8px";
  bar.style.marginBottom = "10px";
  bar.style.padding = "6px 4px";
  bar.style.background = "var(--background-primary)";
  bar.style.position = "sticky";
  bar.style.top = "0";
  bar.style.zIndex = "3";
  if (ctx.fundBulkMode) {
    const count = ctx.selectedFundIds.size;
    const deleteBtn = bar.createEl("button", { text: `\u5220\u9664\u6240\u9009${count > 0 ? `\uFF08${count}\uFF09` : ""}` });
    deleteBtn.title = "\u5220\u9664\u6240\u9009\u8D44\u91D1\u8D26\u6237";
    deleteBtn.disabled = count === 0;
    ctx.applyToolbarBtnStyle(deleteBtn, "danger", count === 0);
    deleteBtn.onclick = () => handleBulkDelete(ctx);
    const cancelBtn = bar.createEl("button", { text: "\u53D6\u6D88" });
    cancelBtn.title = "\u9000\u51FA\u6279\u91CF\u9009\u62E9";
    ctx.applyToolbarBtnStyle(cancelBtn, "ghost");
    cancelBtn.onclick = () => {
      ctx.fundBulkMode = false;
      ctx.selectedFundIds.clear();
      ctx.render();
    };
    return;
  }
  const sortMap = {
    grouped: { icon: "sortShuffle", tip: "\u5206\u7C7B\u6392\u5217\uFF08\u70B9\u51FB\u5207\u6362\u4E3A\u964D\u5E8F\uFF09" },
    desc: { icon: "sortDesc", tip: "\u964D\u5E8F\uFF08\u70B9\u51FB\u5207\u6362\u4E3A\u5347\u5E8F\uFF09" },
    asc: { icon: "sortAsc", tip: "\u5347\u5E8F\uFF08\u70B9\u51FB\u6062\u590D\u5206\u7C7B\uFF09" }
  };
  const current = sortMap[ctx.fundSortMode];
  const sortButton = ctx.createFundToolbarButton(bar, current.icon, current.tip, "ghost");
  sortButton.onclick = () => {
    const order = ["grouped", "desc", "asc"];
    const next = order[(order.indexOf(ctx.fundSortMode) + 1) % order.length];
    ctx.fundSortMode = next;
    ctx.render();
  };
  const bulkButton = ctx.createFundToolbarButton(bar, "checklist", "\u6279\u91CF\u9009\u62E9\u5220\u9664", "ghost");
  bulkButton.onclick = () => {
    ctx.fundBulkMode = true;
    ctx.selectedFundIds.clear();
    ctx.render();
  };
  const addButton = ctx.createFundToolbarButton(bar, "plus", "\u6DFB\u52A0\u8D44\u91D1", "accent");
  addButton.onclick = () => startAddFundFlow(ctx);
}
async function handleBulkDelete(ctx) {
  const ids = Array.from(ctx.selectedFundIds);
  if (ids.length === 0) {
    return;
  }
  if (!confirm(`\u786E\u5B9A\u5220\u9664\u9009\u4E2D\u7684 ${ids.length} \u4E2A\u8D44\u91D1\u8D26\u6237\uFF1F`)) {
    return;
  }
  for (const id of ids) {
    await ctx.plugin.deleteFund(id);
  }
  ctx.selectedFundIds.clear();
  ctx.fundBulkMode = false;
  notify(`\u5DF2\u5220\u9664 ${ids.length} \u4E2A\u8D26\u6237`);
  ctx.render();
}
function renderFundFlatList(ctx, parent) {
  const signed = (fund) => {
    const isLiab = getFundCategory(fund).type === "liability";
    const amt = getFundEffectiveAmount(fund);
    return isLiab ? -amt : amt;
  };
  const liabilityRank = (fund) => getFundCategory(fund).type === "liability" ? 1 : 0;
  const funds = [...ctx.plugin.funds].sort((a, b) => {
    const va = signed(a);
    const vb = signed(b);
    if (va !== vb) {
      return ctx.fundSortMode === "asc" ? va - vb : vb - va;
    }
    const la = liabilityRank(a);
    const lb = liabilityRank(b);
    if (la !== lb) {
      return ctx.fundSortMode === "asc" ? lb - la : la - lb;
    }
    return 0;
  });
  if (funds.length === 0) {
    return;
  }
  const container = parent.createDiv();
  renderFundCompactList(ctx, container, funds);
}
function renderFundCategorySection(ctx, parent, category) {
  const funds = ctx.plugin.funds.filter((fund) => getFundCategory(fund).id === category.id);
  if (funds.length === 0) {
    return;
  }
  const total = funds.reduce((sum, fund) => sum + getFundEffectiveAmount(fund), 0);
  const section = parent.createDiv();
  section.style.padding = "4px 2px 10px";
  const header = section.createDiv();
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.justifyContent = "space-between";
  header.style.gap = "10px";
  header.style.marginBottom = "4px";
  header.style.padding = "0 4px";
  const title = header.createDiv({ text: category.name });
  title.style.fontSize = "12px";
  title.style.fontWeight = "700";
  title.style.color = "var(--text-muted)";
  title.style.letterSpacing = "0.02em";
  const totalEl = header.createDiv();
  totalEl.style.fontSize = "12px";
  totalEl.style.fontWeight = "700";
  totalEl.style.color = "var(--text-muted)";
  totalEl.style.whiteSpace = "nowrap";
  totalEl.style.display = "inline-flex";
  ctx.renderSlotNumber(totalEl.createSpan(), ctx.displayCurrency(total));
  renderFundCompactList(ctx, section, funds, true);
}
function renderFundCompactList(ctx, section, funds, draggable = false) {
  const list = section.createDiv();
  list.style.display = "flex";
  list.style.flexDirection = "column";
  list.style.gap = "2px";
  funds.forEach((fund) => {
    const row = list.createDiv();
    const bulk = ctx.fundBulkMode;
    const selected = bulk && ctx.selectedFundIds.has(fund.id);
    row.style.display = "grid";
    row.style.gridTemplateColumns = bulk ? "28px 52px 1fr auto" : "52px 1fr auto";
    row.style.alignItems = "center";
    row.style.gap = "14px";
    row.style.padding = "12px 8px";
    row.style.borderRadius = "10px";
    row.style.cursor = "pointer";
    row.style.transition = "background 0.12s";
    row.style.background = selected ? "var(--background-modifier-hover)" : "";
    if (bulk) {
      const checkbox = row.createDiv();
      checkbox.style.width = "20px";
      checkbox.style.height = "20px";
      checkbox.style.borderRadius = "6px";
      checkbox.style.border = selected ? "0" : "2px solid var(--background-modifier-border)";
      checkbox.style.background = selected ? "var(--interactive-accent)" : "var(--background-primary)";
      checkbox.style.color = "var(--text-on-accent)";
      checkbox.style.display = "flex";
      checkbox.style.alignItems = "center";
      checkbox.style.justifyContent = "center";
      checkbox.style.fontSize = "14px";
      checkbox.style.fontWeight = "900";
      checkbox.style.lineHeight = "1";
      checkbox.innerText = selected ? "\u2713" : "";
    }
    const logo = row.createDiv();
    logo.style.width = "44px";
    logo.style.height = "44px";
    logo.style.display = "flex";
    logo.style.alignItems = "center";
    logo.style.justifyContent = "center";
    logo.style.borderRadius = "10px";
    logo.style.background = "transparent";
    logo.style.border = "0";
    logo.style.fontSize = "20px";
    logo.style.fontWeight = "900";
    logo.style.color = "var(--text-muted)";
    logo.style.overflow = "hidden";
    renderFundLogoInto(ctx.bankLogoLoader, logo, fund, 40);
    const info = row.createDiv();
    info.style.display = "flex";
    info.style.flexDirection = "column";
    info.style.gap = "3px";
    info.style.minWidth = "0";
    const primary = info.createDiv({ text: getFundPrimaryLabel(fund) });
    primary.style.fontSize = "19px";
    primary.style.fontWeight = "900";
    primary.style.color = "var(--text-normal)";
    primary.style.overflow = "hidden";
    primary.style.textOverflow = "ellipsis";
    primary.style.whiteSpace = "nowrap";
    const secondaryText = getFundSecondaryLabel(fund);
    if (secondaryText) {
      const secondary = info.createDiv({ text: secondaryText });
      secondary.style.fontSize = "13px";
      secondary.style.fontWeight = "400";
      secondary.style.color = "var(--text-faint)";
      secondary.style.overflow = "hidden";
      secondary.style.textOverflow = "ellipsis";
      secondary.style.whiteSpace = "nowrap";
    }
    const balance = row.createDiv();
    balance.style.fontSize = "20px";
    balance.style.fontWeight = "900";
    const isLiab = getFundCategory(fund).type === "liability";
    balance.style.color = isLiab ? "#ef4444" : "var(--text-normal)";
    balance.style.whiteSpace = "nowrap";
    balance.style.display = "inline-flex";
    balance.style.alignItems = "baseline";
    balance.style.paddingLeft = "8px";
    const effectiveAmount = getFundEffectiveAmount(fund);
    const amountStr = ctx.displayCurrency(effectiveAmount);
    const shown = isLiab && !ctx.hideMoney && effectiveAmount > 0 ? `-${amountStr}` : amountStr;
    ctx.renderSlotNumber(balance.createSpan(), shown);
    row.onmouseenter = () => {
      if (!selected) {
        row.style.background = "var(--background-modifier-hover)";
      }
    };
    row.onmouseleave = () => {
      row.style.background = selected ? "var(--background-modifier-hover)" : "";
    };
    row.onclick = () => {
      if (ctx.fundBulkMode) {
        if (ctx.selectedFundIds.has(fund.id)) {
          ctx.selectedFundIds.delete(fund.id);
        } else {
          ctx.selectedFundIds.add(fund.id);
        }
        ctx.render();
        return;
      }
      new FundDetailModal(ctx.app, ctx.plugin, fund).open();
    };
    if (draggable && !bulk) {
      row.style.touchAction = "none";
      attachLongPressDrag({
        row,
        list,
        fundId: fund.id,
        ownerOrderedIds: funds.map((f) => f.id),
        onReorder: async (nextIds) => {
          await persistFundReorder(ctx.plugin, nextIds);
          ctx.render();
        }
      });
    }
  });
}
function startAddFundFlow(ctx) {
  const reopenPicker = () => startAddFundFlow(ctx);
  new FundCategoryPickerModal(ctx.app, (categoryId) => {
    new FundModal(ctx.app, ctx.plugin, void 0, { category: categoryId }, reopenPicker).open();
  }).open();
}
function renderFundStatsTabs(ctx, parent) {
  const tabs = parent.createDiv();
  tabs.style.display = "grid";
  tabs.style.gridTemplateColumns = "1fr 1px 1fr 1px 1fr";
  tabs.style.alignItems = "center";
  tabs.style.gap = "0";
  tabs.style.marginTop = "4px";
  tabs.style.padding = "8px 0";
  tabs.style.background = "var(--background-primary)";
  tabs.style.border = "0";
  tabs.style.position = "sticky";
  tabs.style.top = "0";
  tabs.style.zIndex = "3";
  const items = [
    { key: "asset", label: ctx.tr("fundAssetChart") },
    { key: "liability", label: ctx.tr("fundLiabilityChart") },
    { key: "netAsset", label: ctx.tr("netAssetChart") }
  ];
  items.forEach((item, index) => {
    if (index > 0) {
      const divider = tabs.createDiv();
      divider.style.alignSelf = "stretch";
      divider.style.borderLeft = "1px solid var(--background-modifier-border)";
      divider.style.height = "20px";
      divider.style.margin = "auto 0";
    }
    const active = ctx.fundStatsTab === item.key;
    const button = tabs.createEl("button", { text: item.label });
    button.style.padding = "12px 4px";
    button.style.border = "0";
    button.style.borderRadius = "0";
    button.style.cursor = "pointer";
    button.style.fontSize = "20px";
    button.style.fontWeight = active ? "950" : "900";
    button.style.background = "transparent";
    button.style.color = active ? "var(--interactive-accent)" : "var(--text-muted)";
    button.style.boxShadow = "none";
    button.style.transition = "color 0.15s, font-weight 0.15s";
    button.style.textAlign = "center";
    button.onclick = () => {
      ctx.fundStatsTab = item.key;
      ctx.render();
    };
  });
}
function renderFundRankingCard(ctx, parent, tab, label) {
  const card = ctx.createFundStatsCard(parent, `${label}\u6392\u884C\u699C`);
  if (tab !== "netAsset") {
    renderStatsGranularityToggle(ctx, card);
  }
  const items = ctx.getFundRanking(
    tab,
    tab === "netAsset" ? "category" : ctx.statsGranularity
  );
  if (items.length === 0) {
    ctx.renderEmptyChart(card);
    return;
  }
  const maxValue = Math.max(...items.map((item) => item.value), 1);
  const totalValue = items.reduce((sum, item) => sum + item.value, 0);
  const wrap = card.createDiv();
  wrap.style.display = "flex";
  wrap.style.flexDirection = "column";
  wrap.style.gap = "14px";
  items.forEach((item, index) => {
    const row = wrap.createDiv();
    row.style.display = "grid";
    row.style.gridTemplateColumns = "32px 1fr";
    row.style.alignItems = "center";
    row.style.gap = "12px";
    const rank = row.createDiv();
    rank.style.fontSize = "18px";
    rank.style.fontWeight = "950";
    rank.style.color = index < 3 ? "var(--text-normal)" : "var(--text-muted)";
    rank.style.textAlign = "center";
    rank.style.display = "flex";
    rank.style.justifyContent = "center";
    ctx.renderSlotNumber(rank.createSpan(), String(index + 1));
    const content = row.createDiv();
    content.style.display = "flex";
    content.style.flexDirection = "column";
    content.style.gap = "6px";
    const header = content.createDiv();
    header.style.display = "flex";
    header.style.justifyContent = "flex-start";
    header.style.alignItems = "baseline";
    header.style.gap = "10px";
    const nameEl = header.createSpan({ text: item.name });
    nameEl.style.fontSize = "15px";
    nameEl.style.fontWeight = "900";
    nameEl.style.color = "var(--text-normal)";
    nameEl.style.overflow = "hidden";
    nameEl.style.textOverflow = "ellipsis";
    nameEl.style.whiteSpace = "nowrap";
    nameEl.style.flexShrink = "1";
    nameEl.style.minWidth = "0";
    const percent = totalValue > 0 ? item.value / totalValue * 100 : 0;
    const percentEl = header.createSpan({ text: `${percent.toFixed(1)}%` });
    percentEl.style.fontSize = "13px";
    percentEl.style.fontWeight = "800";
    percentEl.style.color = "var(--text-muted)";
    percentEl.style.whiteSpace = "nowrap";
    percentEl.style.flexShrink = "0";
    const track = content.createDiv();
    track.style.height = "14px";
    track.style.borderRadius = "999px";
    track.style.background = "var(--background-modifier-border)";
    track.style.overflow = "hidden";
    const bar = track.createDiv();
    bar.style.width = `${Math.max(4, item.value / maxValue * 100)}%`;
    bar.style.height = "100%";
    bar.style.borderRadius = "999px";
    bar.style.background = item.color;
    bar.style.boxShadow = "0 6px 14px rgba(0,0,0,0.14)";
    const footer = content.createDiv();
    footer.style.display = "flex";
    footer.style.justifyContent = "flex-end";
    const amountEl = footer.createSpan();
    amountEl.style.fontSize = "16px";
    amountEl.style.fontWeight = "950";
    amountEl.style.color = tab === "liability" ? "#ef4444" : "var(--text-normal)";
    amountEl.style.whiteSpace = "nowrap";
    amountEl.style.display = "inline-flex";
    ctx.renderSlotNumber(amountEl.createSpan(), ctx.displayCurrency(item.value));
  });
}

// packages/ui-web/src/modals/sortModal.ts
var import_obsidian10 = require("obsidian");
var SortModal = class extends import_obsidian10.Modal {
  constructor(app, field, direction, onApply) {
    super(app);
    this.onApply = onApply;
    this.field = field;
    this.direction = direction;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "\u6392\u5E8F" });
    new import_obsidian10.Setting(contentEl).setName("\u6392\u5E8F\u4F9D\u636E").addDropdown((dropdown) => {
      dropdown.addOption("manual", "\u624B\u52A8\u62D6\u62FD\u987A\u5E8F").addOption("buyDate", "\u8D2D\u4E70\u65F6\u95F4").addOption("dailyCost", "\u65E5\u5747\u6210\u672C").addOption("status", "\u7269\u54C1\u72B6\u6001").addOption("serviceTime", "\u670D\u5F79\u65F6\u957F").addOption("value", "\u7269\u54C1\u4EF7\u503C").setValue(this.field).onChange((value) => {
        this.field = value;
      });
    });
    new import_obsidian10.Setting(contentEl).setName("\u6392\u5E8F\u65B9\u5411").addDropdown((dropdown) => {
      dropdown.addOption("asc", "\u6B63\u5E8F").addOption("desc", "\u5012\u5E8F").setValue(this.direction).onChange((value) => {
        this.direction = value;
      });
    });
    const actions = contentEl.createDiv();
    actions.style.display = "flex";
    actions.style.justifyContent = "flex-end";
    actions.style.gap = "8px";
    actions.style.marginTop = "18px";
    const cancel = actions.createEl("button", { text: "\u53D6\u6D88" });
    cancel.onclick = () => this.close();
    const apply = actions.createEl("button", { text: "\u5E94\u7528" });
    apply.addClass("mod-cta");
    apply.onclick = () => {
      this.onApply(this.field, this.direction);
      this.close();
    };
  }
};

// packages/ui-web/src/components/filters.ts
function renderFilters(ctx, el) {
  const wrapper = el.createDiv();
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.gap = "10px";
  wrapper.style.margin = "0 0 12px";
  wrapper.style.background = "var(--background-primary)";
  renderCategoryFilterRow(ctx, wrapper);
  renderFilterRow(
    ctx,
    wrapper,
    ["all", "active", "sold", "retired", "appreciated"],
    ctx.statusFilter,
    (value) => {
      ctx.statusFilter = value;
      ctx.render();
    },
    true
  );
}
function renderCategoryFilterRow(ctx, parent) {
  const row = parent.createDiv();
  row.style.display = "flex";
  row.style.flexWrap = "wrap";
  row.style.gap = "16px";
  row.style.alignItems = "center";
  row.style.marginBottom = "2px";
  getCategoryFilters(ctx).forEach((value) => {
    const active = value === "all" ? ctx.selectedCategoryFilters.size === 0 : ctx.selectedCategoryFilters.has(value);
    renderCategoryFilterButton(ctx, row, value, active, () => {
      if (value === "all") {
        ctx.selectedCategoryFilters.clear();
      } else if (ctx.selectedCategoryFilters.has(value)) {
        ctx.selectedCategoryFilters.delete(value);
      } else {
        ctx.selectedCategoryFilters.add(value);
      }
      ctx.categoryFilter = ctx.selectedCategoryFilters.size === 0 ? "all" : Array.from(ctx.selectedCategoryFilters)[0];
      ctx.render();
    });
  });
}
function renderFilterRow(ctx, parent, values, activeValue, onSelect, showSort = false) {
  const row = parent.createDiv();
  row.style.display = "flex";
  row.style.flexWrap = "wrap";
  row.style.gap = "8px";
  row.style.alignItems = "center";
  values.forEach((value) => {
    renderFilterButton(ctx, row, value, value === activeValue, () => onSelect(value));
  });
  if (showSort) {
    const spacer = row.createDiv();
    spacer.style.flex = "1 1 auto";
    const sortBtn = ctx.createFundToolbarButton(row, "sortShuffle", "\u6392\u5E8F", "ghost");
    sortBtn.onclick = () => {
      new SortModal(ctx.app, ctx.sortField, ctx.sortDirection, (field, direction) => {
        ctx.sortField = field;
        ctx.sortDirection = direction;
        ctx.render();
      }).open();
    };
    const bulkBtn = ctx.createFundToolbarButton(row, "checklist", ctx.tr("bulkEdit"), "ghost");
    bulkBtn.onclick = () => {
      ctx.bulkSelectionMode = !ctx.bulkSelectionMode;
      ctx.selectedAssetIds.clear();
      ctx.render();
    };
  }
}
function renderCategoryFilterButton(ctx, parent, value, active, onClick) {
  const button = parent.createEl("button", { text: getFilterLabel(ctx, value) });
  button.style.border = "0";
  button.style.borderBottom = active ? "3px solid var(--interactive-accent)" : "3px solid transparent";
  button.style.borderRadius = "0";
  button.style.padding = "3px 2px 7px";
  button.style.cursor = "pointer";
  button.style.fontSize = active ? "20px" : "18px";
  button.style.lineHeight = "1.1";
  button.style.background = "transparent";
  button.style.color = active ? "var(--text-normal)" : "var(--text-muted)";
  button.style.fontWeight = active ? "950" : "850";
  button.style.boxShadow = "none";
  button.onclick = onClick;
}
function renderFilterButton(ctx, parent, value, active, onClick) {
  const button = parent.createEl("button", { text: getFilterLabel(ctx, value) });
  button.style.border = active ? "1px solid var(--interactive-accent)" : "1px solid var(--background-modifier-border)";
  button.style.borderRadius = "999px";
  button.style.padding = "7px 16px";
  button.style.cursor = "pointer";
  button.style.fontSize = "14px";
  button.style.lineHeight = "1";
  button.style.background = active ? "var(--interactive-accent)" : "var(--background-primary)";
  button.style.color = active ? "var(--text-on-accent)" : "var(--text-normal)";
  button.style.fontWeight = active ? "900" : "800";
  button.style.boxShadow = active ? "0 8px 18px rgba(0,0,0,0.14)" : "0 4px 12px rgba(0,0,0,0.06)";
  button.onclick = onClick;
}
function getCategoryFilters(ctx) {
  const categories = /* @__PURE__ */ new Set();
  ctx.plugin.settings.categories.forEach((category) => categories.add(category.id));
  ctx.plugin.assets.forEach((asset) => {
    if (asset.category) {
      categories.add(asset.category);
    }
  });
  return ["all", ...Array.from(categories)];
}
function getFilterLabel(ctx, value) {
  const labels = {
    all: ctx.tr("all"),
    active: ctx.tr("active"),
    retired: ctx.tr("retired"),
    sold: ctx.tr("sold"),
    appreciated: "\u5DF2\u5347\u503C"
  };
  const category = ctx.plugin.settings.categories.find((item) => item.id === value);
  return labels[value] ?? category?.name ?? defaultCategoryLabel(ctx.plugin.settings.language, value);
}

// packages/ui-web/src/modals/bulkCategoryModal.ts
var import_obsidian11 = require("obsidian");
var BulkCategoryModal = class extends import_obsidian11.Modal {
  constructor(app, plugin, selectedIds, onDone) {
    super(app);
    this.plugin = plugin;
    this.selectedIds = selectedIds;
    this.onDone = onDone;
    this.categoryId = plugin.settings.categories[0]?.id ?? "other";
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "\u6279\u91CF\u4FEE\u6539\u5206\u7C7B" });
    const summary = contentEl.createDiv({ text: `\u5DF2\u9009\u8D44\u4EA7: ${this.selectedIds.length}` });
    summary.style.margin = "8px 0 16px";
    summary.style.color = "var(--text-muted)";
    summary.style.fontWeight = "800";
    new import_obsidian11.Setting(contentEl).setName("\u76EE\u6807\u5206\u7C7B").addDropdown((dropdown) => {
      this.plugin.settings.categories.forEach((category) => {
        dropdown.addOption(category.id, category.name);
      });
      dropdown.setValue(this.categoryId).onChange((value) => {
        this.categoryId = value;
      });
    });
    const actions = contentEl.createDiv();
    actions.style.display = "flex";
    actions.style.justifyContent = "flex-end";
    actions.style.gap = "8px";
    actions.style.marginTop = "18px";
    const cancel = actions.createEl("button", { text: "\u53D6\u6D88" });
    cancel.onclick = () => this.close();
    const apply = actions.createEl("button", { text: "\u5E94\u7528" });
    apply.addClass("mod-cta");
    apply.onclick = async () => this.apply();
  }
  async apply() {
    if (this.selectedIds.length === 0) {
      notify("\u6CA1\u6709\u53EF\u4FEE\u6539\u7684\u8D44\u4EA7");
      return;
    }
    const selected = new Set(this.selectedIds);
    this.plugin.assets = this.plugin.assets.map((asset) => selected.has(asset.id) ? { ...asset, category: this.categoryId } : asset);
    await this.plugin.saveAssets();
    this.plugin.refreshViews();
    this.onDone();
    notify("\u5DF2\u66F4\u65B0");
    this.close();
  }
};

// packages/ui-web/src/components/bulkBar.ts
function renderBulkSelectionBar(ctx, el, assets) {
  if (!ctx.bulkSelectionMode) {
    return;
  }
  const bar = el.createDiv();
  bar.style.display = "flex";
  bar.style.flexWrap = "wrap";
  bar.style.alignItems = "center";
  bar.style.gap = "8px";
  bar.style.margin = "0 0 14px";
  bar.style.padding = "12px";
  bar.style.borderRadius = "16px";
  bar.style.background = "var(--background-secondary)";
  bar.style.border = "1px solid var(--background-modifier-border)";
  const summary = bar.createSpan({ text: `${ctx.tr("selectedAssets")}: ${ctx.selectedAssetIds.size}` });
  summary.style.fontSize = "14px";
  summary.style.fontWeight = "900";
  summary.style.color = "var(--text-muted)";
  createBulkBarButton(bar, "\u5168\u9009", () => {
    assets.forEach((asset) => ctx.selectedAssetIds.add(asset.id));
    ctx.render();
  });
  createBulkBarButton(bar, "\u53D6\u6D88", () => {
    ctx.bulkSelectionMode = false;
    ctx.selectedAssetIds.clear();
    ctx.render();
  });
  createBulkBarButton(bar, ctx.tr("delete"), async () => {
    await deleteSelectedAssets(ctx);
  }, true);
  createBulkBarButton(bar, "\u4FEE\u6539\u5206\u7C7B", () => {
    new BulkCategoryModal(ctx.app, ctx.plugin, Array.from(ctx.selectedAssetIds), () => {
      ctx.bulkSelectionMode = false;
      ctx.selectedAssetIds.clear();
      ctx.render();
    }).open();
  });
}
function createBulkBarButton(parent, text, onClick, danger = false) {
  const button = parent.createEl("button", { text });
  button.style.border = "1px solid var(--background-modifier-border)";
  button.style.borderRadius = "999px";
  button.style.padding = "7px 14px";
  button.style.cursor = "pointer";
  button.style.fontSize = "13px";
  button.style.fontWeight = "900";
  button.style.background = danger ? "#ef4444" : "var(--background-primary)";
  button.style.color = danger ? "#fff" : "var(--text-normal)";
  button.onclick = async () => {
    await onClick();
  };
}
async function deleteSelectedAssets(ctx) {
  if (ctx.selectedAssetIds.size === 0) {
    notify(ctx.tr("noAssetsToEdit"));
    return;
  }
  if (!confirm(`\u5220\u9664 ${ctx.selectedAssetIds.size} \u4E2A\u8D44\u4EA7\uFF1F`)) {
    return;
  }
  const selectedIds = new Set(ctx.selectedAssetIds);
  ctx.plugin.assets = ctx.plugin.assets.filter((asset) => !selectedIds.has(asset.id));
  await ctx.plugin.saveAssets();
  ctx.bulkSelectionMode = false;
  ctx.selectedAssetIds.clear();
  ctx.plugin.refreshViews();
  notify(ctx.tr("updated"));
}

// packages/ui-web/src/modals/assetDetailModal.ts
var import_obsidian13 = require("obsidian");

// packages/ui-web/src/modals/assetModal.ts
var import_obsidian12 = require("obsidian");
var AssetModal = class extends import_obsidian12.Modal {
  constructor(app, plugin, asset) {
    super(app);
    this.plugin = plugin;
    this.asset = asset;
    this.state = createAssetFormState(asset);
    if (!this.plugin.settings.categories.some((category) => category.id === this.state.category)) {
      this.state.category = this.plugin.settings.categories[0]?.id ?? "other";
    }
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: this.tr(this.asset ? "editAsset" : "addAsset") });
    this.renderIconSetting(contentEl);
    this.renderNameSetting(contentEl);
    this.renderPriceSetting(contentEl);
    this.renderBuyDateSetting(contentEl);
    this.renderAccessoriesSection(contentEl);
    this.renderCategorySetting(contentEl);
    this.renderStatusSetting(contentEl);
    this.renderRetiredSettings(contentEl);
    this.renderSoldSettings(contentEl);
    this.renderSaveButton(contentEl);
  }
  renderIconSetting(contentEl) {
    const iconSetting = new import_obsidian12.Setting(contentEl).setName(this.tr("icon")).setDesc(this.getIconDescription()).addButton((button) => {
      button.setButtonText(this.tr("chooseIcon"));
      button.onClick(() => {
        openIconPicker(this.app, (icon) => {
          this.state.icon = icon.id;
          iconSetting.setDesc(this.getIconDescription());
          this.renderSelectedIconPreview(iconSetting.controlEl);
        });
      });
    });
    this.renderSelectedIconPreview(iconSetting.controlEl);
  }
  renderSelectedIconPreview(controlEl) {
    controlEl.find(".obsiwealth-selected-icon")?.remove();
    const preview = controlEl.createDiv("obsiwealth-selected-icon");
    preview.style.display = "flex";
    preview.style.alignItems = "center";
    preview.style.justifyContent = "center";
    preview.style.width = "36px";
    preview.style.height = "36px";
    preview.style.borderRadius = "8px";
    preview.style.background = "var(--background-modifier-hover)";
    preview.style.overflow = "hidden";
    preview.style.marginRight = "8px";
    preview.style.order = "-1";
    const icon = findIcon(this.state.icon);
    if (!icon) {
      preview.setText("\u{1F4E6}");
      return;
    }
    const img = preview.createEl("img");
    img.src = getIconPath(icon.id);
    img.alt = icon.name;
    img.style.width = "32px";
    img.style.height = "32px";
    img.style.objectFit = "contain";
  }
  getIconDescription() {
    const icon = findIcon(this.state.icon);
    return `${this.tr("current")}: ${icon?.name ?? (this.state.icon || this.tr("notFilled"))}`;
  }
  renderNameSetting(contentEl) {
    addTextField(contentEl, {
      name: this.tr("name"),
      value: this.state.name,
      onChange: (value) => {
        this.state.name = value;
      }
    });
  }
  renderPriceSetting(contentEl) {
    addNumberField(contentEl, {
      name: this.tr("price"),
      value: this.state.price,
      onChange: (value) => {
        this.state.price = value;
      }
    });
  }
  renderBuyDateSetting(contentEl) {
    addDateField(contentEl, {
      name: this.tr("buyDate"),
      value: this.state.buy_date,
      max: "today",
      onChange: (value) => {
        this.state.buy_date = value;
      }
    });
  }
  renderAccessoriesSection(contentEl) {
    const title = contentEl.createEl("h3", { text: "\u9644\u52A0\u7269\u54C1" });
    title.style.margin = "18px 0 10px";
    const grid = contentEl.createDiv();
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(auto-fill, minmax(210px, 1fr))";
    grid.style.gap = "10px";
    this.state.accessories.forEach((accessory) => this.renderAccessoryCard(grid, accessory));
    this.renderAddAccessoryCard(grid);
  }
  renderAccessoryCard(parent, accessory) {
    const card = parent.createDiv();
    card.style.display = "grid";
    card.style.gridTemplateColumns = "46px 1fr auto";
    card.style.gap = "10px";
    card.style.alignItems = "center";
    card.style.padding = "10px";
    card.style.borderRadius = "14px";
    card.style.background = "var(--background-secondary)";
    card.style.border = "1px solid var(--background-modifier-border)";
    const iconWrap = card.createDiv();
    iconWrap.style.width = "46px";
    iconWrap.style.height = "46px";
    iconWrap.style.display = "flex";
    iconWrap.style.alignItems = "center";
    iconWrap.style.justifyContent = "center";
    iconWrap.style.overflow = "hidden";
    const icon = findIcon(accessory.icon);
    if (!icon) {
      iconWrap.setText("\u{1F4E6}");
      iconWrap.style.fontSize = "28px";
    } else {
      const img = iconWrap.createEl("img");
      img.src = getIconPath(icon.id);
      img.alt = icon.name;
      img.style.width = "42px";
      img.style.height = "42px";
      img.style.objectFit = "contain";
    }
    const info = card.createDiv();
    info.style.display = "flex";
    info.style.flexDirection = "column";
    info.style.gap = "3px";
    info.style.minWidth = "0";
    const name = info.createDiv({ text: accessory.name });
    name.style.fontSize = "14px";
    name.style.fontWeight = "850";
    name.style.whiteSpace = "nowrap";
    name.style.overflow = "hidden";
    name.style.textOverflow = "ellipsis";
    const price = info.createDiv({ text: `${this.plugin.settings.currencySymbol} ${accessory.price}` });
    price.style.fontSize = "13px";
    price.style.fontWeight = "750";
    price.style.color = accessory.include_total ? "var(--text-normal)" : "var(--text-muted)";
    const date = info.createDiv({ text: accessory.buy_date });
    date.style.fontSize = "12px";
    date.style.color = "var(--text-muted)";
    const actions = card.createDiv();
    actions.style.display = "flex";
    actions.style.flexDirection = "column";
    actions.style.gap = "6px";
    this.createAccessoryActionButton(actions, "\u270E", "\u4FEE\u6539", () => this.editAccessory(accessory));
    this.createAccessoryActionButton(actions, "\u232B", "\u5220\u9664", () => this.deleteAccessory(accessory.id), true);
  }
  renderAddAccessoryCard(parent) {
    const card = parent.createDiv({ text: "+" });
    card.title = "\u6DFB\u52A0\u9644\u52A0\u7269\u54C1";
    card.style.minHeight = "68px";
    card.style.display = "flex";
    card.style.alignItems = "center";
    card.style.justifyContent = "center";
    card.style.borderRadius = "14px";
    card.style.border = "1px dashed var(--background-modifier-border)";
    card.style.background = "var(--background-primary)";
    card.style.color = "var(--text-muted)";
    card.style.fontSize = "34px";
    card.style.fontWeight = "850";
    card.style.cursor = "pointer";
    card.onclick = () => this.editAccessory();
  }
  createAccessoryActionButton(parent, text, title, onClick, danger = false) {
    const button = parent.createEl("button", { text });
    button.type = "button";
    button.title = title;
    button.style.width = "28px";
    button.style.height = "28px";
    button.style.padding = "0";
    button.style.borderRadius = "999px";
    button.style.border = "1px solid var(--background-modifier-border)";
    button.style.background = danger ? "#fee2e2" : "var(--background-primary)";
    button.style.color = danger ? "#dc2626" : "var(--text-normal)";
    button.style.cursor = "pointer";
    button.onclick = onClick;
  }
  editAccessory(accessory) {
    new AccessoryModal(this.app, accessory, (nextAccessory) => {
      const index = this.state.accessories.findIndex((item) => item.id === nextAccessory.id);
      if (index === -1) {
        this.state.accessories.push(nextAccessory);
      } else {
        this.state.accessories[index] = nextAccessory;
      }
      this.onOpen();
    }, this.state.buy_date || getTodayISODate()).open();
  }
  deleteAccessory(id) {
    const accessory = this.state.accessories.find((item) => item.id === id);
    const accessoryName = accessory?.name ? `\u300C${accessory.name}\u300D` : "\u8BE5\u9644\u52A0\u7269\u54C1";
    if (!confirm(`\u786E\u8BA4\u5220\u9664${accessoryName}\u5417\uFF1F`)) {
      return;
    }
    this.state.accessories = this.state.accessories.filter((item) => item.id !== id);
    this.onOpen();
  }
  renderCategorySetting(contentEl) {
    const selectedCategory = this.plugin.settings.categories.some((category) => category.id === this.state.category) ? this.state.category : this.plugin.settings.categories[0]?.id ?? "other";
    addDropdownField(contentEl, {
      name: this.tr("category"),
      value: selectedCategory,
      options: this.plugin.settings.categories.map((category) => ({ value: category.id, label: category.name })),
      onChange: (value) => {
        this.state.category = value;
      }
    });
  }
  renderStatusSetting(contentEl) {
    addDropdownField(contentEl, {
      name: this.tr("status"),
      value: this.getSelectedStatus() === "active" ? "active" : "retired",
      options: [
        { value: "active", label: this.tr("active") },
        { value: "retired", label: this.tr("retired") }
      ],
      onChange: (value) => {
        this.setSelectedStatus(value);
        this.onOpen();
      }
    });
  }
  renderSoldSettings(contentEl) {
    if (!this.state.retired) {
      return;
    }
    addToggleField(contentEl, {
      name: this.tr("sold"),
      value: this.state.sold,
      onChange: (value) => {
        this.state.sold = value;
        if (value && !this.state.sold_date) {
          this.state.sold_date = this.state.retired_date || getTodayISODate();
        }
        if (!value) {
          this.state.sold_date = "";
          this.state.sold_price = 0;
        }
        this.onOpen();
      }
    });
    if (!this.state.sold) {
      return;
    }
    addDateField(contentEl, {
      name: this.tr("soldDate"),
      value: this.state.sold_date,
      max: "today",
      min: this.state.buy_date,
      onChange: (value) => {
        this.state.sold_date = value;
      }
    });
    addNumberField(contentEl, {
      name: this.tr("soldPrice"),
      value: this.state.sold_price,
      min: 0,
      onChange: (value) => {
        this.state.sold_price = value;
      }
    });
  }
  renderRetiredSettings(contentEl) {
    if (!this.state.retired) {
      return;
    }
    addDateField(contentEl, {
      name: this.tr("retiredDate"),
      value: this.state.retired_date,
      max: "today",
      min: this.state.buy_date,
      onChange: (value) => {
        this.state.retired_date = value;
      }
    });
  }
  getSelectedStatus() {
    if (this.state.sold) return "sold";
    if (this.state.retired) return "retired";
    return "active";
  }
  setSelectedStatus(status) {
    this.state.retired = status === "retired";
    if (status === "active") {
      this.state.sold = false;
      this.state.sold_date = "";
      this.state.sold_price = 0;
      this.state.retired_date = "";
      return;
    }
    if (!this.state.retired_date) {
      this.state.retired_date = getTodayISODate();
    }
  }
  renderSaveButton(contentEl) {
    new import_obsidian12.Setting(contentEl).addButton((button) => {
      button.setButtonText(this.tr("save"));
      button.setCta();
      button.onClick(() => this.save());
    });
  }
  async save() {
    if (!this.state.name.trim()) {
      notify(this.tr("inputAssetName"));
      return;
    }
    if (this.state.sold) {
      this.state.retired = true;
      if (!this.state.retired_date) {
        this.state.retired_date = this.state.sold_date || getTodayISODate();
      }
    }
    if (this.state.sold && !this.state.sold_date) {
      notify(this.tr("selectSoldDate"));
      return;
    }
    if (this.state.sold && this.state.sold_price <= 0) {
      notify(this.tr("inputSoldPrice"));
      return;
    }
    if (this.state.sold && this.state.sold_date < this.state.buy_date) {
      notify(this.tr("soldDateBeforeBuyDate"));
      return;
    }
    if (this.state.retired && !this.state.retired_date) {
      notify(this.tr("selectRetiredDate"));
      return;
    }
    if (this.state.retired && this.state.retired_date < this.state.buy_date) {
      notify(this.tr("retiredDateBeforeBuyDate"));
      return;
    }
    if (this.asset) {
      await this.plugin.updateAsset(formStateToAsset(this.state, this.asset.id));
      notify(this.tr("assetUpdated"));
    } else {
      await this.plugin.addAsset(formStateToAsset(this.state));
      notify(this.tr("assetAdded"));
    }
    this.close();
  }
  tr(key) {
    return t(this.plugin.settings.language, key);
  }
};

// packages/ui-web/src/modals/assetDetailModal.ts
var AssetDetailModal = class extends import_obsidian13.Modal {
  constructor(app, plugin, asset) {
    super(app);
    this.plugin = plugin;
    this.asset = asset;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.style.position = "relative";
    this.renderEditButton(contentEl);
    this.renderHero(contentEl);
    this.renderChart(contentEl);
    this.renderBasicSection(contentEl);
    this.renderAccessoriesSection(contentEl);
    this.renderLifecycleSection(contentEl);
    this.renderDeleteButton(contentEl);
  }
  renderEditButton(contentEl) {
    const button = createIconButton(contentEl, {
      ariaLabel: t(this.plugin.settings.language, "edit"),
      content: "\u270F\uFE0F",
      corner: "top-right"
    });
    button.onclick = () => {
      this.close();
      new AssetModal(this.app, this.plugin, this.asset).open();
    };
  }
  renderHero(contentEl) {
    const hero = contentEl.createDiv();
    hero.style.display = "flex";
    hero.style.flexDirection = "column";
    hero.style.alignItems = "center";
    hero.style.textAlign = "center";
    hero.style.margin = "8px 0 22px";
    hero.style.padding = "8px 72px 0";
    const imageWrap = hero.createDiv();
    imageWrap.style.width = "140px";
    imageWrap.style.height = "140px";
    imageWrap.style.display = "flex";
    imageWrap.style.alignItems = "center";
    imageWrap.style.justifyContent = "center";
    imageWrap.style.borderRadius = "28px";
    imageWrap.style.background = "transparent";
    imageWrap.style.overflow = "hidden";
    imageWrap.style.marginBottom = "16px";
    const icon = findIcon(this.asset.icon);
    if (!icon) {
      imageWrap.setText("\u{1F4E6}");
      imageWrap.style.fontSize = "82px";
    } else {
      const img = imageWrap.createEl("img");
      img.src = getIconPath(icon.id);
      img.alt = icon.name;
      img.style.width = "132px";
      img.style.height = "132px";
      img.style.objectFit = "contain";
    }
    const name = hero.createEl("h2", { text: this.asset.name });
    name.style.margin = "0 0 8px";
    name.style.fontSize = "24px";
    name.style.fontWeight = "800";
    const price = hero.createDiv();
    price.style.display = "flex";
    price.style.alignItems = "center";
    price.style.justifyContent = "center";
    price.style.gap = "10px";
    price.style.fontSize = "28px";
    price.style.fontWeight = "800";
    price.style.color = "var(--text-normal)";
    price.style.marginBottom = "16px";
    this.renderAssetCost(price);
    const metrics = hero.createDiv();
    metrics.style.display = "grid";
    metrics.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
    metrics.style.gap = "10px";
    metrics.style.width = "100%";
    metrics.style.maxWidth = "420px";
    this.renderMetric(metrics, t(this.plugin.settings.language, "dailyCost"), `${this.formatCurrency(getDailyCost(this.asset))} / ${t(this.plugin.settings.language, "perDay")}`);
    this.renderMetric(metrics, t(this.plugin.settings.language, "used"), this.getUsageDurationText());
  }
  renderAssetCost(parent) {
    const totalCost = getAssetTotalCost(this.asset);
    if (getAssetStatus(this.asset) !== "sold") {
      parent.createSpan({ text: this.formatCurrency(totalCost) });
      return;
    }
    const original = parent.createSpan({ text: this.formatCurrency(totalCost) });
    original.style.textDecoration = "line-through";
    original.style.opacity = "0.62";
    const net = parent.createSpan({ text: this.formatCurrency(getNetAssetCost(this.asset)) });
    net.style.fontWeight = "850";
  }
  renderMetric(parent, label, value) {
    createLabelValueCard(parent, {
      label,
      value,
      valueFontSize: "16px",
      valueFontWeight: "700"
    });
  }
  renderChart(contentEl) {
    const section = this.createSection(contentEl, t(this.plugin.settings.language, "dailyCostTrend"));
    const chart = section.createDiv();
    chart.style.position = "relative";
    chart.style.height = "220px";
    chart.style.borderRadius = "14px";
    chart.style.background = "var(--background-secondary)";
    chart.style.border = "1px solid var(--background-modifier-border)";
    chart.style.padding = "12px";
    const points = this.getChartPoints();
    if (points.length < 2) {
      chart.setText(t(this.plugin.settings.language, "emptyChart"));
      chart.style.display = "flex";
      chart.style.alignItems = "center";
      chart.style.justifyContent = "center";
      chart.style.color = "var(--text-muted)";
      return;
    }
    const width = 620;
    const height = 180;
    const leftPadding = 86;
    const rightPadding = 20;
    const topPadding = 24;
    const bottomPadding = 18;
    const values = points.map((point) => Math.max(point.value, 0.01));
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values, minValue * 1.01);
    const tickValues = this.getLogTickValues(minValue, maxValue);
    const minTick = Math.min(...tickValues);
    const maxTick = Math.max(...tickValues);
    const domainMin = Math.min(minValue, minTick);
    const domainMax = Math.max(maxValue, maxTick);
    const logMin = Math.log10(domainMin);
    const logMax = Math.log10(domainMax);
    const logRange = Math.max(logMax - logMin, 1e-4);
    const plotWidth = width - leftPadding - rightPadding;
    const plotHeight = height - topPadding - bottomPadding;
    const yForValue = (value) => {
      const safeValue = Math.max(value, 0.01);
      return topPadding + (1 - (Math.log10(safeValue) - logMin) / logRange) * plotHeight;
    };
    const pointPositions = points.map((point, index) => ({
      point,
      x: leftPadding + index / (points.length - 1) * plotWidth,
      y: yForValue(point.value)
    }));
    const polylinePoints = pointPositions.map((position) => `${position.x},${position.y}`).join(" ");
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "180");
    const title = document.createElementNS("http://www.w3.org/2000/svg", "text");
    title.textContent = "\u65E5\u5747\u6210\u672C";
    title.setAttribute("x", String(-(topPadding + plotHeight / 2)));
    title.setAttribute("y", "18");
    title.setAttribute("transform", "rotate(-90)");
    title.setAttribute("fill", "var(--text-muted)");
    title.setAttribute("font-size", "17");
    title.setAttribute("font-weight", "800");
    title.setAttribute("text-anchor", "middle");
    title.setAttribute("dominant-baseline", "middle");
    svg.appendChild(title);
    tickValues.forEach((value) => {
      const y = yForValue(value);
      const gridLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      gridLine.setAttribute("x1", String(leftPadding));
      gridLine.setAttribute("y1", String(y));
      gridLine.setAttribute("x2", String(width - rightPadding));
      gridLine.setAttribute("y2", String(y));
      gridLine.setAttribute("stroke", "var(--background-modifier-border)");
      gridLine.setAttribute("stroke-width", "1.2");
      gridLine.setAttribute("stroke-dasharray", "5 5");
      svg.appendChild(gridLine);
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.textContent = String(value);
      label.setAttribute("x", String(leftPadding - 8));
      label.setAttribute("y", String(y + 4));
      label.setAttribute("fill", "var(--text-muted)");
      label.setAttribute("font-size", "11");
      label.setAttribute("text-anchor", "end");
      svg.appendChild(label);
    });
    const axis = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    axis.setAttribute("points", `${leftPadding},${topPadding} ${leftPadding},${height - bottomPadding} ${width - rightPadding},${height - bottomPadding}`);
    axis.setAttribute("fill", "none");
    axis.setAttribute("stroke", "var(--background-modifier-border)");
    axis.setAttribute("stroke-width", "2");
    svg.appendChild(axis);
    const line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    line.setAttribute("points", polylinePoints);
    line.setAttribute("fill", "none");
    line.setAttribute("stroke", "#60a5fa");
    line.setAttribute("stroke-width", "6");
    line.setAttribute("stroke-linecap", "round");
    line.setAttribute("stroke-linejoin", "round");
    svg.appendChild(line);
    const startLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    startLabel.textContent = this.asset.buy_date;
    startLabel.setAttribute("x", String(leftPadding));
    startLabel.setAttribute("y", String(height - 4));
    startLabel.setAttribute("fill", "var(--text-muted)");
    startLabel.setAttribute("font-size", "11");
    startLabel.setAttribute("text-anchor", "start");
    svg.appendChild(startLabel);
    const endLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    endLabel.textContent = points[points.length - 1].date;
    endLabel.setAttribute("x", String(width - rightPadding));
    endLabel.setAttribute("y", String(height - 4));
    endLabel.setAttribute("fill", "var(--text-muted)");
    endLabel.setAttribute("font-size", "11");
    endLabel.setAttribute("text-anchor", "end");
    svg.appendChild(endLabel);
    const tooltip = chart.createDiv();
    tooltip.style.position = "absolute";
    tooltip.style.display = "none";
    tooltip.style.pointerEvents = "none";
    tooltip.style.padding = "6px 8px";
    tooltip.style.borderRadius = "8px";
    tooltip.style.background = "var(--background-primary)";
    tooltip.style.border = "1px solid var(--background-modifier-border)";
    tooltip.style.boxShadow = "0 8px 18px rgba(0,0,0,0.14)";
    tooltip.style.fontSize = "12px";
    tooltip.style.fontWeight = "600";
    tooltip.style.zIndex = "2";
    const hoverLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    hoverLine.setAttribute("y1", String(topPadding));
    hoverLine.setAttribute("y2", String(height - bottomPadding));
    hoverLine.setAttribute("stroke", "var(--text-muted)");
    hoverLine.setAttribute("stroke-width", "1.2");
    hoverLine.setAttribute("stroke-dasharray", "4 4");
    hoverLine.setAttribute("opacity", "0");
    svg.appendChild(hoverLine);
    const hoverDot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    hoverDot.setAttribute("r", "5");
    hoverDot.setAttribute("fill", "#60a5fa");
    hoverDot.setAttribute("stroke", "var(--background-primary)");
    hoverDot.setAttribute("stroke-width", "2");
    hoverDot.setAttribute("opacity", "0");
    svg.appendChild(hoverDot);
    const hoverArea = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    hoverArea.setAttribute("x", String(leftPadding));
    hoverArea.setAttribute("y", String(topPadding));
    hoverArea.setAttribute("width", String(plotWidth));
    hoverArea.setAttribute("height", String(plotHeight));
    hoverArea.setAttribute("fill", "transparent");
    hoverArea.onmousemove = (event) => {
      const svgRect = svg.getBoundingClientRect();
      const chartRect = chart.getBoundingClientRect();
      const mouseX = (event.clientX - svgRect.left) / svgRect.width * width;
      const nearest = pointPositions.reduce((closest, position) => {
        return Math.abs(position.x - mouseX) < Math.abs(closest.x - mouseX) ? position : closest;
      });
      hoverLine.setAttribute("x1", String(nearest.x));
      hoverLine.setAttribute("x2", String(nearest.x));
      hoverLine.setAttribute("opacity", "0.65");
      hoverDot.setAttribute("cx", String(nearest.x));
      hoverDot.setAttribute("cy", String(nearest.y));
      hoverDot.setAttribute("opacity", "1");
      tooltip.innerText = `${nearest.point.label}
${this.formatCurrency(nearest.point.value)} / ${t(this.plugin.settings.language, "perDay")}`;
      tooltip.style.display = "block";
      tooltip.style.left = `${event.clientX - chartRect.left + 12}px`;
      tooltip.style.top = `${event.clientY - chartRect.top - 12}px`;
    };
    hoverArea.onmouseleave = () => {
      hoverLine.setAttribute("opacity", "0");
      hoverDot.setAttribute("opacity", "0");
      tooltip.style.display = "none";
    };
    svg.appendChild(hoverArea);
    chart.appendChild(svg);
  }
  renderBasicSection(contentEl) {
    const section = this.createSection(contentEl, t(this.plugin.settings.language, "assetInfo"));
    section.style.display = "grid";
    section.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
    section.style.gap = "10px";
    this.renderDetailItem(section, t(this.plugin.settings.language, "unitPrice"), this.formatCurrency(getAssetTotalCost(this.asset)));
    this.renderDetailItem(section, t(this.plugin.settings.language, "buyDate"), this.asset.buy_date);
    this.renderDetailItem(section, t(this.plugin.settings.language, "category"), this.getCategoryLabel(this.asset.category));
  }
  renderAccessoriesSection(contentEl) {
    const accessories = this.asset.accessories ?? [];
    if (accessories.length === 0) {
      return;
    }
    const section = this.createSection(contentEl, "\u9644\u52A0\u7269\u54C1");
    section.style.display = "grid";
    section.style.gridTemplateColumns = "repeat(auto-fill, minmax(210px, 1fr))";
    section.style.gap = "10px";
    accessories.forEach((accessory) => {
      const card = createSurfaceCard(section, {
        padding: "10px",
        borderRadius: "14px",
        style: {
          display: "grid",
          gridTemplateColumns: "46px 1fr",
          gap: "10px",
          alignItems: "center"
        }
      });
      const iconWrap = card.createDiv();
      iconWrap.style.width = "46px";
      iconWrap.style.height = "46px";
      iconWrap.style.display = "flex";
      iconWrap.style.alignItems = "center";
      iconWrap.style.justifyContent = "center";
      iconWrap.style.overflow = "hidden";
      const icon = findIcon(accessory.icon);
      if (!icon) {
        iconWrap.setText("\u{1F4E6}");
        iconWrap.style.fontSize = "28px";
      } else {
        const img = iconWrap.createEl("img");
        img.src = getIconPath(icon.id);
        img.alt = icon.name;
        img.style.width = "42px";
        img.style.height = "42px";
        img.style.objectFit = "contain";
      }
      const info = card.createDiv();
      info.style.display = "flex";
      info.style.flexDirection = "column";
      info.style.gap = "3px";
      info.style.minWidth = "0";
      const name = info.createDiv({ text: accessory.name });
      name.style.fontSize = "14px";
      name.style.fontWeight = "850";
      name.style.whiteSpace = "nowrap";
      name.style.overflow = "hidden";
      name.style.textOverflow = "ellipsis";
      const price = info.createDiv({ text: this.formatCurrency(accessory.price) });
      price.style.fontSize = "13px";
      price.style.fontWeight = "750";
      price.style.color = accessory.include_total ? "var(--text-normal)" : "var(--text-muted)";
      const date = info.createDiv({ text: accessory.buy_date });
      date.style.fontSize = "12px";
      date.style.color = "var(--text-muted)";
    });
  }
  renderLifecycleSection(contentEl) {
    const status = getAssetStatus(this.asset);
    if (status === "active") {
      return;
    }
    const section = this.createSection(contentEl, t(this.plugin.settings.language, "statusInfo"));
    section.style.display = "grid";
    section.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
    section.style.gap = "10px";
    if (status === "retired") {
      this.renderDetailItem(section, t(this.plugin.settings.language, "status"), statusLabel(this.plugin.settings.language, "retired"));
      this.renderDetailItem(section, t(this.plugin.settings.language, "date"), this.asset.lifecycle?.retired_date || t(this.plugin.settings.language, "notFilled"));
      return;
    }
    this.renderDetailItem(section, t(this.plugin.settings.language, "status"), statusLabel(this.plugin.settings.language, "sold"));
    this.renderDetailItem(section, t(this.plugin.settings.language, "soldDate"), this.asset.lifecycle?.sold_date || t(this.plugin.settings.language, "notFilled"));
    this.renderDetailItem(section, t(this.plugin.settings.language, "soldPrice"), this.formatCurrency(this.asset.lifecycle?.sold_price ?? 0));
  }
  createSection(contentEl, title) {
    return createSection(contentEl, title);
  }
  renderDetailItem(parent, label, value) {
    createLabelValueCard(parent, { label, value });
  }
  renderDeleteButton(contentEl) {
    const button = createFullWidthDeleteButton(contentEl, {
      ariaLabel: t(this.plugin.settings.language, "delete"),
      plainText: "\u{1F5D1}\uFE0F",
      marginTop: 20
    });
    button.onclick = async () => {
      if (!confirm(t(this.plugin.settings.language, "deleteConfirm", { name: this.asset.name }))) {
        return;
      }
      await this.plugin.deleteAsset(this.asset.id);
      this.close();
    };
  }
  getUsageDurationText() {
    if (this.plugin.settings.durationDisplayMode === "days") {
      return `${getUsedDays(this.asset)}${t(this.plugin.settings.language, "days")}`;
    }
    const duration = getUsageDuration(this.asset);
    const language = this.plugin.settings.language;
    const parts = [
      duration.years > 0 ? `${duration.years}${t(language, "years")}` : "",
      duration.months > 0 ? `${duration.months}${t(language, "months")}` : "",
      duration.days > 0 ? `${duration.days}${t(language, "days")}` : ""
    ].filter(Boolean);
    return parts.length > 0 ? parts.join("") : `0${t(language, "days")}`;
  }
  getCategoryLabel(value) {
    return this.plugin.settings.categories.find((category) => category.id === value)?.name ?? defaultCategoryLabel(this.plugin.settings.language, value);
  }
  getChartPoints() {
    const start = parseLocalDate(this.asset.buy_date);
    const end = parseLocalDate(getAssetEndDateValue(this.asset));
    if (!start || !end || start.getTime() > end.getTime()) {
      return [];
    }
    const points = [];
    const firstDate = formatLocalDate(start);
    points.push({
      date: firstDate,
      label: this.getYearMonthLabel(firstDate),
      value: getDailyCostOnDate(this.asset, firstDate)
    });
    const cursor = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    while (cursor.getTime() < end.getTime()) {
      const date = formatLocalDate(cursor);
      points.push({
        date,
        label: this.getYearMonthLabel(date),
        value: getDailyCostOnDate(this.asset, date)
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    const endDate = formatLocalDate(end);
    if (points[points.length - 1]?.date !== endDate) {
      points.push({
        date: endDate,
        label: this.getYearMonthLabel(endDate),
        value: getDailyCostOnDate(this.asset, endDate)
      });
    }
    return points;
  }
  getLogTickValues(minValue, maxValue) {
    const minPower = Math.floor(Math.log10(Math.max(minValue, 0.01)));
    const maxPower = Math.ceil(Math.log10(Math.max(maxValue, 1)));
    const ticks = [];
    for (let power = minPower; power <= maxPower; power += 1) {
      const value = 10 ** power;
      if (value >= 1) {
        ticks.push(value);
      }
    }
    return ticks.length > 0 ? ticks : [1, 10];
  }
  getYearMonthLabel(dateValue) {
    return dateValue.slice(0, 7);
  }
  formatCurrency(value) {
    return formatCurrency(this.plugin, value);
  }
};

// packages/ui-web/src/pages/assetsPage.ts
function renderAssetsPage(ctx, el) {
  const assets = sortAssets(getFilteredAssets(ctx), ctx.sortField, ctx.sortDirection);
  const topBar = el.createDiv();
  topBar.style.position = "sticky";
  topBar.style.top = "0";
  topBar.style.zIndex = "5";
  topBar.style.background = "var(--background-primary)";
  topBar.style.paddingBottom = "2px";
  renderOverviewCard(ctx, topBar, assets);
  renderFilters(ctx, topBar);
  renderBulkSelectionBar(ctx, topBar, assets);
  const grid = el.createDiv();
  ctx.applyGridStyle(grid);
  assets.forEach((asset) => renderAssetCard(ctx, grid, asset));
  if (!ctx.bulkSelectionMode) {
    renderAddCard(ctx, grid);
  }
}
function getFilteredAssets(ctx) {
  return ctx.plugin.assets.filter((asset) => {
    const matchCategory = ctx.selectedCategoryFilters.size === 0 || ctx.selectedCategoryFilters.has(asset.category);
    const matchStatus = ctx.statusFilter === "all" || (ctx.statusFilter === "appreciated" ? isAssetAppreciated(asset) : getAssetStatus(asset) === ctx.statusFilter);
    return matchCategory && matchStatus;
  });
}
function renderOverviewCard(ctx, el, assets) {
  const totalValue = assets.filter((asset) => !asset.flags?.exclude_total).reduce((sum, asset) => sum + getNetAssetCost(asset), 0);
  const dailyCost = assets.filter((asset) => !asset.flags?.exclude_daily).reduce((sum, asset) => sum + getDailyCost(asset), 0);
  const activeCount = assets.filter((asset) => getAssetStatus(asset) === "active").length;
  const retiredCount = assets.filter((asset) => getAssetStatus(asset) === "retired").length;
  const soldCount = assets.filter((asset) => getAssetStatus(asset) === "sold").length;
  const card = el.createDiv();
  card.style.padding = "24px";
  card.style.marginBottom = "18px";
  card.style.borderRadius = "24px";
  card.style.background = "linear-gradient(145deg, var(--background-secondary), var(--background-primary))";
  card.style.border = "1px solid var(--background-modifier-border)";
  card.style.boxShadow = "0 16px 38px rgba(0,0,0,0.14)";
  card.style.width = "100%";
  card.style.boxSizing = "border-box";
  card.style.overflow = "hidden";
  const title = card.createDiv();
  title.innerText = ctx.tr("overview");
  title.style.fontSize = "22px";
  title.style.fontWeight = "950";
  title.style.letterSpacing = "0.01em";
  title.style.marginBottom = "18px";
  title.style.color = "var(--text-normal)";
  const metrics = card.createDiv();
  metrics.style.display = "grid";
  metrics.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
  metrics.style.gap = "14px";
  metrics.style.marginBottom = "20px";
  renderOverviewMetric(ctx, metrics, ctx.tr("totalAssets"), ctx.displayCurrency(totalValue), true);
  renderOverviewMetric(
    ctx,
    metrics,
    ctx.tr("dailyCost"),
    `${ctx.displayCurrency(dailyCost)} / ${ctx.tr("perDay")}`,
    true
  );
  const bars = card.createDiv();
  bars.style.display = "grid";
  bars.style.gridTemplateColumns = "repeat(3, minmax(0, 1fr))";
  bars.style.gap = "12px";
  renderOverviewBar(ctx, bars, ctx.getStatusLabel("active"), activeCount, assets.length, ctx.getStatusColor("active"));
  renderOverviewBar(ctx, bars, ctx.getStatusLabel("sold"), soldCount, assets.length, ctx.getStatusColor("sold"));
  renderOverviewBar(ctx, bars, ctx.getStatusLabel("retired"), retiredCount, assets.length, ctx.getStatusColor("retired"));
  return card;
}
function renderOverviewMetric(ctx, parent, label, value, animate = false) {
  const item = parent.createDiv();
  item.style.padding = "16px 18px";
  item.style.borderRadius = "18px";
  item.style.background = "var(--background-primary)";
  item.style.border = "1px solid var(--background-modifier-border)";
  item.style.boxShadow = "0 8px 18px rgba(0,0,0,0.08)";
  const labelEl = item.createDiv();
  labelEl.innerText = label;
  labelEl.style.fontSize = "15px";
  labelEl.style.fontWeight = "900";
  labelEl.style.color = "var(--text-muted)";
  labelEl.style.marginBottom = "10px";
  const valueEl = item.createDiv();
  valueEl.style.fontSize = "34px";
  valueEl.style.fontWeight = "950";
  valueEl.style.lineHeight = "1.05";
  valueEl.style.color = "var(--text-normal)";
  if (animate) {
    ctx.renderSlotNumber(valueEl, value);
    return;
  }
  valueEl.innerText = value;
}
function renderOverviewBar(ctx, parent, label, count, total, color) {
  const percent = total > 0 ? Math.round(count / total * 100) : 0;
  const item = parent.createDiv();
  const header = item.createDiv();
  header.style.display = "flex";
  header.style.justifyContent = "space-between";
  header.style.alignItems = "center";
  header.style.marginBottom = "8px";
  const labelEl = header.createSpan();
  labelEl.style.fontSize = "15px";
  labelEl.style.fontWeight = "900";
  labelEl.style.color = "var(--text-normal)";
  labelEl.style.display = "inline-flex";
  ctx.renderSlotNumber(labelEl.createSpan(), `${label} ${count}`);
  const valueEl = header.createSpan();
  valueEl.style.fontSize = "15px";
  valueEl.style.fontWeight = "950";
  valueEl.style.color = "var(--text-normal)";
  valueEl.style.display = "inline-flex";
  ctx.renderSlotNumber(valueEl.createSpan(), `${percent}%`);
  const track = item.createDiv();
  track.style.height = "10px";
  track.style.borderRadius = "999px";
  track.style.background = "var(--background-modifier-border)";
  track.style.overflow = "hidden";
  const bar = track.createDiv();
  bar.style.width = `${percent}%`;
  bar.style.height = "100%";
  bar.style.borderRadius = "999px";
  bar.style.background = color;
}
function renderAssetCard(ctx, grid, asset) {
  const card = grid.createDiv();
  ctx.applyCardStyle(card);
  card.dataset.assetId = asset.id;
  card.onclick = () => {
    if (ctx.bulkSelectionMode) {
      toggleSelectedAsset(ctx, asset.id);
      return;
    }
    new AssetDetailModal(ctx.app, ctx.plugin, asset).open();
  };
  card.ondragover = (event) => {
    event.preventDefault();
    card.style.outline = "2px solid var(--interactive-accent)";
  };
  card.ondragleave = () => {
    card.style.outline = "";
  };
  card.ondrop = async (event) => {
    event.preventDefault();
    card.style.outline = "";
    const draggedId = event.dataTransfer?.getData("text/plain");
    if (draggedId && draggedId !== asset.id) {
      await moveAssetBefore(ctx, draggedId, asset.id);
    }
  };
  renderDragHandle(ctx, card, asset);
  renderSelectionCheckbox(ctx, card, asset);
  renderActions(ctx, card, asset);
  renderIcon(ctx, card, asset);
  renderAssetInfo(ctx, card, asset);
  renderStatus(ctx, card, asset);
}
function renderDragHandle(ctx, card, asset) {
  const handle = card.createDiv({ text: "\u283F" });
  handle.title = "\u62D6\u52A8\u6392\u5E8F";
  handle.style.position = "absolute";
  handle.style.left = "8px";
  handle.style.top = "8px";
  handle.style.width = "30px";
  handle.style.height = "30px";
  handle.style.display = "flex";
  handle.style.alignItems = "center";
  handle.style.justifyContent = "center";
  handle.style.borderRadius = "10px";
  handle.style.background = "var(--background-primary)";
  handle.style.border = "1px solid var(--background-modifier-border)";
  handle.style.color = "var(--text-muted)";
  handle.style.fontSize = "18px";
  handle.style.fontWeight = "950";
  handle.style.cursor = "grab";
  handle.style.zIndex = "2";
  handle.style.opacity = "0";
  handle.style.transition = "opacity 0.15s";
  card.addEventListener("mouseenter", () => {
    handle.style.opacity = "1";
  });
  card.addEventListener("mouseleave", () => {
    handle.style.opacity = "0";
  });
  handle.draggable = true;
  handle.onclick = (event) => event.stopPropagation();
  handle.ondragstart = (event) => {
    event.stopPropagation();
    card.style.opacity = "0.55";
    event.dataTransfer?.setData("text/plain", asset.id);
    event.dataTransfer?.setDragImage(card, 20, 20);
  };
  handle.ondragend = () => {
    card.style.opacity = "1";
  };
  void ctx;
}
function renderSelectionCheckbox(ctx, card, asset) {
  if (!ctx.bulkSelectionMode) {
    return;
  }
  const checkbox = card.createEl("input");
  checkbox.type = "checkbox";
  checkbox.checked = ctx.selectedAssetIds.has(asset.id);
  checkbox.style.position = "absolute";
  checkbox.style.left = "10px";
  checkbox.style.bottom = "10px";
  checkbox.style.width = "22px";
  checkbox.style.height = "22px";
  checkbox.style.zIndex = "3";
  checkbox.onclick = (event) => {
    event.stopPropagation();
    toggleSelectedAsset(ctx, asset.id);
  };
}
function toggleSelectedAsset(ctx, id) {
  if (ctx.selectedAssetIds.has(id)) {
    ctx.selectedAssetIds.delete(id);
  } else {
    ctx.selectedAssetIds.add(id);
  }
  ctx.render();
}
async function moveAssetBefore(ctx, draggedId, targetId) {
  const draggedIndex = ctx.plugin.assets.findIndex((asset) => asset.id === draggedId);
  const targetIndex = ctx.plugin.assets.findIndex((asset) => asset.id === targetId);
  if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
    return;
  }
  const nextAssets = [...ctx.plugin.assets];
  const [dragged] = nextAssets.splice(draggedIndex, 1);
  const nextTargetIndex = nextAssets.findIndex((asset) => asset.id === targetId);
  nextAssets.splice(nextTargetIndex, 0, dragged);
  ctx.plugin.assets = nextAssets;
  ctx.sortField = "manual";
  await ctx.plugin.saveAssets();
  ctx.plugin.refreshViews();
}
function renderActions(ctx, card, asset) {
  const actions = card.createDiv();
  actions.style.position = "absolute";
  actions.style.top = "6px";
  actions.style.right = "6px";
  actions.style.display = "flex";
  actions.style.gap = "6px";
  actions.style.opacity = "0";
  actions.style.transition = "opacity 0.15s";
  card.addEventListener("mouseenter", () => {
    actions.style.opacity = "1";
  });
  card.addEventListener("mouseleave", () => {
    actions.style.opacity = "0";
  });
  ctx.createActionButton(actions, "\u270E", ctx.tr("edit"), () => {
    new AssetModal(ctx.app, ctx.plugin, asset).open();
  });
  ctx.createActionButton(actions, "\u232B", ctx.tr("delete"), async () => {
    if (confirm(ctx.tr("deleteConfirm", { name: asset.name }))) {
      await ctx.plugin.deleteAsset(asset.id);
    }
  }, true);
}
function renderIcon(ctx, card, asset) {
  const iconWrap = card.createDiv();
  iconWrap.style.display = "flex";
  iconWrap.style.alignItems = "center";
  iconWrap.style.justifyContent = "center";
  iconWrap.style.width = "96px";
  iconWrap.style.height = "96px";
  iconWrap.style.flexShrink = "0";
  iconWrap.style.overflow = "visible";
  const icon = findIcon(asset.icon);
  if (!icon) {
    iconWrap.setText("\u{1F4E6}");
    iconWrap.style.fontSize = "69px";
    iconWrap.style.lineHeight = "1";
    return;
  }
  const img = iconWrap.createEl("img");
  img.src = getIconPath(icon.id);
  img.alt = icon.name;
  img.style.width = "93px";
  img.style.height = "93px";
  img.style.maxWidth = "93px";
  img.style.maxHeight = "93px";
  img.style.objectFit = "contain";
  img.style.display = "block";
}
function renderAssetInfo(ctx, card, asset) {
  const center = card.createDiv();
  center.style.flex = "1";
  center.style.display = "flex";
  center.style.flexDirection = "column";
  center.style.justifyContent = "center";
  center.style.gap = "6px";
  center.style.marginLeft = "6px";
  const title = center.createDiv();
  title.innerText = asset.name;
  title.style.fontSize = "21px";
  title.style.fontWeight = "650";
  title.style.color = "var(--text-normal)";
  title.style.whiteSpace = "nowrap";
  title.style.overflow = "hidden";
  title.style.textOverflow = "ellipsis";
  const row2 = center.createDiv();
  row2.style.display = "flex";
  row2.style.alignItems = "center";
  row2.style.flexWrap = "nowrap";
  row2.style.whiteSpace = "nowrap";
  row2.style.gap = "6px";
  row2.style.fontSize = "18px";
  row2.style.color = "var(--text-muted)";
  renderAssetCost(ctx, row2, asset);
  row2.createSpan({ text: `\uFF5C ${ctx.tr("used")} ` });
  const usageSpan = row2.createSpan();
  usageSpan.style.display = "inline-flex";
  ctx.renderSlotNumber(usageSpan, ctx.getAssetUsageText(asset));
  const row3 = center.createDiv();
  row3.style.fontSize = "22px";
  row3.style.fontWeight = "750";
  row3.style.color = "var(--text-normal)";
  row3.style.display = "flex";
  row3.style.flexWrap = "nowrap";
  row3.style.whiteSpace = "nowrap";
  ctx.renderSlotNumber(
    row3.createSpan(),
    `${ctx.displayCurrency(getDailyCost(asset))} / ${ctx.tr("perDay")}`,
    false
  );
}
function renderAssetCost(ctx, parent, asset) {
  const totalCost = getAssetTotalCost(asset);
  if (getAssetStatus(asset) !== "sold") {
    const span = parent.createSpan();
    span.style.display = "inline-flex";
    ctx.renderSlotNumber(span, ctx.displayCurrency(totalCost), false);
    return;
  }
  const original = parent.createSpan();
  original.style.textDecoration = "line-through";
  original.style.opacity = "0.62";
  original.style.display = "inline-flex";
  ctx.renderSlotNumber(original, ctx.displayCurrency(totalCost), false);
  const net = parent.createSpan();
  net.style.color = "var(--text-normal)";
  net.style.fontWeight = "850";
  net.style.display = "inline-flex";
  ctx.renderSlotNumber(net, ctx.displayCurrency(getNetAssetCost(asset)), false);
}
function renderStatus(ctx, card, asset) {
  const status = card.createDiv();
  const state = getAssetStatus(asset);
  status.style.display = "flex";
  status.style.alignItems = "center";
  status.style.gap = "9px";
  status.style.flexShrink = "0";
  status.style.padding = "9px 15px";
  status.style.borderRadius = "15px";
  status.style.background = "var(--background-primary)";
  status.style.border = "1px solid var(--background-modifier-border)";
  status.style.color = "var(--text-muted)";
  status.style.fontSize = "18px";
  status.style.fontWeight = "750";
  status.style.whiteSpace = "nowrap";
  const dot = status.createSpan();
  dot.style.width = "14px";
  dot.style.height = "14px";
  dot.style.borderRadius = "999px";
  dot.style.background = ctx.getStatusColor(state);
  dot.style.boxShadow = `0 0 0 3px ${ctx.getStatusShadowColor(state)}`;
  const label = status.createSpan();
  label.innerText = ctx.getStatusLabel(state);
}
function renderAddCard(ctx, grid) {
  const addCard = grid.createDiv();
  addCard.style.border = "2px dashed var(--background-modifier-border)";
  addCard.style.borderRadius = "14px";
  addCard.style.display = "flex";
  addCard.style.alignItems = "center";
  addCard.style.justifyContent = "center";
  addCard.style.cursor = "pointer";
  addCard.style.minHeight = "120px";
  addCard.innerHTML = `<div style="font-size:32px;opacity:0.5">+</div>`;
  addCard.onclick = () => {
    new AssetModal(ctx.app, ctx.plugin).open();
  };
}

// packages/ui-web/src/charts/areaChart.ts
function renderStatsAreaChart(ctx, parent, points) {
  if (points.length < 2) {
    ctx.renderEmptyChart(parent);
    return;
  }
  parent.style.position = "relative";
  const width = 620;
  const height = 220;
  const leftPadding = 28;
  const rightPadding = 24;
  const topPadding = 24;
  const bottomPadding = 38;
  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const plotWidth = width - leftPadding - rightPadding;
  const plotHeight = height - topPadding - bottomPadding;
  const yForValue = (value) => topPadding + (1 - value / maxValue) * plotHeight;
  const dateTimes = points.map((point) => parseLocalDate(point.date)?.getTime() ?? 0);
  const minTime = Math.min(...dateTimes);
  const maxTime = Math.max(...dateTimes);
  const xForTime = (time) => minTime === maxTime ? leftPadding + plotWidth / 2 : leftPadding + (time - minTime) / (maxTime - minTime) * plotWidth;
  const positions = points.map((point, index) => ({
    point,
    x: xForTime(dateTimes[index]),
    y: yForValue(point.value)
  }));
  const curvePath = createSmoothPath(positions);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", String(height));
  [maxValue, maxValue / 2].forEach((value) => {
    const y = yForValue(value);
    const grid = document.createElementNS("http://www.w3.org/2000/svg", "line");
    grid.setAttribute("x1", String(leftPadding));
    grid.setAttribute("y1", String(y));
    grid.setAttribute("x2", String(width - rightPadding));
    grid.setAttribute("y2", String(y));
    grid.setAttribute("stroke", "var(--background-modifier-border)");
    grid.setAttribute("stroke-dasharray", "5 5");
    svg.appendChild(grid);
  });
  const axis = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  axis.setAttribute(
    "points",
    `${leftPadding},${topPadding} ${leftPadding},${height - bottomPadding} ${width - rightPadding},${height - bottomPadding}`
  );
  axis.setAttribute("fill", "none");
  axis.setAttribute("stroke", "var(--background-modifier-border)");
  axis.setAttribute("stroke-width", "2");
  svg.appendChild(axis);
  const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
  line.setAttribute("d", curvePath);
  line.setAttribute("fill", "none");
  line.setAttribute("stroke", "#60a5fa");
  line.setAttribute("stroke-width", "7");
  line.setAttribute("stroke-linecap", "round");
  line.setAttribute("stroke-linejoin", "round");
  svg.appendChild(line);
  const start = document.createElementNS("http://www.w3.org/2000/svg", "text");
  start.textContent = points[0].date;
  start.setAttribute("x", String(leftPadding));
  start.setAttribute("y", String(height - 10));
  start.setAttribute("fill", "var(--text-muted)");
  start.setAttribute("font-size", "16");
  start.setAttribute("font-weight", "800");
  svg.appendChild(start);
  const end = document.createElementNS("http://www.w3.org/2000/svg", "text");
  end.textContent = points[points.length - 1].date;
  end.setAttribute("x", String(width - rightPadding));
  end.setAttribute("y", String(height - 10));
  end.setAttribute("fill", "var(--text-muted)");
  end.setAttribute("font-size", "16");
  end.setAttribute("font-weight", "800");
  end.setAttribute("text-anchor", "end");
  svg.appendChild(end);
  positions.forEach((position) => {
    if (!ctx.plugin.settings.showChartDots) return;
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    marker.setAttribute("cx", String(position.x));
    marker.setAttribute("cy", String(position.y));
    marker.setAttribute("r", "5");
    marker.setAttribute("fill", "var(--background-primary)");
    marker.setAttribute("stroke", "#60a5fa");
    marker.setAttribute("stroke-width", "4");
    svg.appendChild(marker);
  });
  const tooltip = parent.createDiv();
  tooltip.style.position = "absolute";
  tooltip.style.display = "none";
  tooltip.style.pointerEvents = "none";
  tooltip.style.padding = "9px 11px";
  tooltip.style.borderRadius = "12px";
  tooltip.style.background = "var(--background-primary)";
  tooltip.style.border = "1px solid var(--background-modifier-border)";
  tooltip.style.boxShadow = "0 12px 28px rgba(0,0,0,0.2)";
  tooltip.style.fontSize = "13px";
  tooltip.style.fontWeight = "900";
  tooltip.style.zIndex = "2";
  positions.forEach((position, index) => {
    const hitArea = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    const nextX = positions[index + 1]?.x ?? width - rightPadding;
    const prevX = positions[index - 1]?.x ?? leftPadding;
    const hitX = index === 0 ? leftPadding : (prevX + position.x) / 2;
    const hitWidth = index === positions.length - 1 ? width - rightPadding - hitX : (position.x + nextX) / 2 - hitX;
    hitArea.setAttribute("x", String(hitX));
    hitArea.setAttribute("y", String(topPadding));
    hitArea.setAttribute("width", String(Math.max(hitWidth, 16)));
    hitArea.setAttribute("height", String(plotHeight));
    hitArea.setAttribute("fill", "transparent");
    hitArea.setAttribute("pointer-events", "all");
    hitArea.style.cursor = "pointer";
    hitArea.onmouseenter = () => {
      tooltip.empty();
      tooltip.createDiv({ text: position.point.date });
      tooltip.createDiv({ text: ctx.displayCurrency(position.point.value) });
      tooltip.style.left = `${Math.min(Math.max(position.x / width * parent.clientWidth - 72, 8), Math.max(parent.clientWidth - 160, 8))}px`;
      tooltip.style.top = `${Math.max(position.y - 56, 8)}px`;
      tooltip.style.display = "block";
    };
    hitArea.onmouseleave = () => {
      tooltip.style.display = "none";
    };
    svg.appendChild(hitArea);
  });
  parent.appendChild(svg);
}

// packages/ui-web/src/pages/statsPage.ts
function renderStatsPage(ctx, el) {
  const assets = ctx.plugin.assets;
  const summaryCard = renderStatsSummaryCard(ctx, el, assets);
  ctx.applyStickyTop(summaryCard);
  const statsGrid = el.createDiv();
  statsGrid.style.display = "grid";
  statsGrid.style.gridTemplateColumns = `repeat(${ctx.statsTrendCols}, minmax(640px, 1fr))`;
  statsGrid.style.gap = "18px";
  statsGrid.style.alignItems = "stretch";
  renderAssetValueTrendCard(ctx, statsGrid, assets);
  renderDailyCostTrendCard(ctx, statsGrid, assets);
  renderCategoryPieCard(ctx, statsGrid, assets);
  renderCategoryAverageUsageCard(ctx, statsGrid, assets);
}
function renderStatsSummaryCard(ctx, el, assets) {
  const totalValue = assets.reduce((sum, asset) => sum + getNetAssetCost(asset), 0);
  const card = ctx.createStatsHeroCard(el, ctx.tr("assetTotalValue"));
  const value = card.createDiv();
  value.style.fontSize = "42px";
  value.style.fontWeight = "950";
  value.style.lineHeight = "1.05";
  value.style.marginBottom = "16px";
  value.style.display = "flex";
  ctx.renderSlotNumber(value.createDiv(), ctx.displayCurrency(totalValue));
  renderStatusValuePill(ctx, card, assets, totalValue);
  const rows = card.createDiv();
  rows.style.display = "grid";
  rows.style.gridTemplateColumns = "repeat(3, minmax(0, 1fr))";
  rows.style.gap = "14px";
  ["active", "sold", "retired"].forEach((status) => {
    const statusAssets = assets.filter((asset) => getAssetStatus(asset) === status);
    const statusValue = statusAssets.reduce((sum, asset) => sum + getNetAssetCost(asset), 0);
    const percent = totalValue > 0 ? Math.round(statusValue / totalValue * 100) : 0;
    const item = rows.createDiv();
    item.style.padding = "18px";
    item.style.borderRadius = "20px";
    item.style.background = "var(--background-primary)";
    item.style.border = `3px solid ${ctx.getStatusColor(status)}`;
    item.style.boxShadow = "0 10px 24px rgba(0,0,0,0.1)";
    const header = item.createDiv();
    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.justifyContent = "space-between";
    header.style.gap = "10px";
    header.style.color = "var(--text-normal)";
    const statusWrap = header.createDiv();
    statusWrap.style.display = "flex";
    statusWrap.style.alignItems = "center";
    statusWrap.style.gap = "8px";
    statusWrap.style.minWidth = "0";
    const dot = statusWrap.createSpan();
    dot.style.width = "12px";
    dot.style.height = "12px";
    dot.style.borderRadius = "999px";
    dot.style.background = ctx.getStatusColor(status);
    dot.style.flexShrink = "0";
    const label = statusWrap.createSpan({ text: ctx.getStatusLabel(status) });
    label.style.color = "var(--text-normal)";
    label.style.fontSize = "15px";
    label.style.fontWeight = "900";
    label.style.overflow = "hidden";
    label.style.textOverflow = "ellipsis";
    label.style.whiteSpace = "nowrap";
    const percentEl = header.createSpan();
    percentEl.style.fontSize = "16px";
    percentEl.style.fontWeight = "950";
    percentEl.style.color = "var(--text-normal)";
    percentEl.style.whiteSpace = "nowrap";
    percentEl.style.display = "inline-flex";
    ctx.renderSlotNumber(percentEl.createSpan(), `${percent}%`);
    const valueEl = item.createDiv();
    valueEl.style.marginTop = "12px";
    valueEl.style.fontSize = "28px";
    valueEl.style.fontWeight = "950";
    valueEl.style.lineHeight = "1.05";
    valueEl.style.color = "var(--text-normal)";
    valueEl.style.display = "flex";
    ctx.renderSlotNumber(valueEl.createDiv(), ctx.displayCurrency(statusValue));
    const count = item.createDiv();
    count.style.marginTop = "10px";
    count.style.fontSize = "15px";
    count.style.fontWeight = "800";
    count.style.color = "var(--text-normal)";
    count.style.display = "flex";
    ctx.renderSlotNumber(count.createSpan(), `${statusAssets.length}/${assets.length}`);
  });
  return card;
}
function renderStatusValuePill(ctx, parent, assets, totalValue) {
  const pill = parent.createDiv();
  pill.style.display = "flex";
  pill.style.width = "100%";
  pill.style.height = "26px";
  pill.style.margin = "0 0 20px";
  pill.style.borderRadius = "999px";
  pill.style.overflow = "hidden";
  pill.style.background = "var(--background-primary)";
  pill.style.border = "1px solid var(--background-modifier-border)";
  pill.style.boxShadow = "inset 0 1px 5px rgba(0,0,0,0.1)";
  ["active", "sold", "retired"].forEach((status) => {
    const statusValue = assets.filter((asset) => getAssetStatus(asset) === status).reduce((sum, asset) => sum + getNetAssetCost(asset), 0);
    const width = totalValue > 0 ? statusValue / totalValue * 100 : 0;
    if (width <= 0) {
      return;
    }
    const segment = pill.createDiv();
    segment.style.width = `${width}%`;
    segment.style.height = "100%";
    segment.style.background = ctx.getStatusColor(status);
    segment.title = `${ctx.getStatusLabel(status)} ${Math.round(width)}%`;
  });
}
function renderAssetValueTrendCard(ctx, el, assets) {
  const card = ctx.createStatsCard(el, ctx.tr("assetValueTrend"));
  renderTrendCurrentValue(ctx, card, ctx.displayCurrency(getTotalAssetValueOnDate(assets, getTodayISODate())));
  renderStatsAreaChart(ctx, card, getStatsTrendPoints(assets, "value"));
}
function renderDailyCostTrendCard(ctx, el, assets) {
  const card = ctx.createStatsCard(el, ctx.tr("dailyCostTrend"));
  renderTrendCurrentValue(
    ctx,
    card,
    `${ctx.displayCurrency(getTotalDailyCostOnDate(assets, getTodayISODate()))} / ${ctx.tr("perDay")}`
  );
  renderStatsAreaChart(ctx, card, getStatsTrendPoints(assets, "daily"));
}
function renderTrendCurrentValue(ctx, parent, value) {
  const current = parent.createDiv();
  current.style.margin = "-4px 0 14px";
  current.style.fontSize = "31px";
  current.style.fontWeight = "950";
  current.style.lineHeight = "1.05";
  current.style.color = "var(--text-normal)";
  current.style.display = "flex";
  ctx.renderSlotNumber(current.createDiv(), value);
}
function renderCategoryAverageUsageCard(ctx, el, assets) {
  const card = ctx.createStatsCard(el, ctx.tr("averageUsageByCategory"));
  const stats = getCategoryAverageUsageStats(assets);
  if (stats.length === 0) {
    ctx.renderEmptyChart(card);
    return;
  }
  const maxDays = Math.max(...stats.map((stat) => stat.averageDays), 1);
  const wrap = card.createDiv();
  wrap.style.display = "flex";
  wrap.style.flexDirection = "column";
  wrap.style.gap = "16px";
  stats.forEach((stat) => {
    const item = wrap.createDiv();
    item.style.display = "grid";
    item.style.gridTemplateColumns = "minmax(120px, 1fr) max-content";
    item.style.alignItems = "center";
    item.style.gap = "14px";
    const barWrap = item.createDiv();
    barWrap.style.height = "38px";
    barWrap.style.display = "flex";
    barWrap.style.alignItems = "stretch";
    const bar = barWrap.createDiv();
    bar.style.width = `${Math.max(14, stat.averageDays / maxDays * 100)}%`;
    bar.style.height = "100%";
    bar.style.borderRadius = "6px";
    bar.style.background = ctx.getCategoryColor(stat.category);
    bar.style.boxShadow = "0 10px 22px rgba(0,0,0,0.16)";
    const label = item.createDiv();
    label.style.display = "flex";
    label.style.flexDirection = "column";
    label.style.gap = "4px";
    label.style.minWidth = "82px";
    const category = label.createDiv({ text: ctx.getCategoryLabel(stat.category) });
    category.style.fontSize = "19px";
    category.style.fontWeight = "950";
    category.style.lineHeight = "1.1";
    category.style.color = "var(--text-normal)";
    const days = label.createDiv();
    days.style.fontSize = "22px";
    days.style.fontWeight = "950";
    days.style.lineHeight = "1.05";
    days.style.color = "var(--text-normal)";
    days.style.display = "flex";
    ctx.renderSlotNumber(days.createSpan(), `${stat.averageDays}\u5929`);
  });
}
function getStatsTrendPoints(assets, mode) {
  const todayDate = parseLocalDate(getTodayISODate());
  if (!todayDate) {
    return [];
  }
  const dateSet = /* @__PURE__ */ new Set();
  assets.forEach((asset) => {
    addTrendDate(dateSet, asset.buy_date, todayDate);
  });
  return Array.from(dateSet).sort((a, b) => (parseLocalDate(a)?.getTime() ?? 0) - (parseLocalDate(b)?.getTime() ?? 0)).map((date) => ({
    date,
    value: mode === "value" ? getTotalAssetValueOnDate(assets, date) : getTotalDailyCostOnDate(assets, date)
  }));
}
function addTrendDate(dateSet, dateValue, today) {
  if (!dateValue) {
    return;
  }
  const date = parseLocalDate(dateValue);
  if (!date || date.getTime() > today.getTime()) {
    return;
  }
  dateSet.add(formatLocalDate(date));
}
function getAssetTotalCostOnDate(asset, date) {
  const accessoryTotal = (asset.accessories ?? []).filter((accessory) => {
    const buyDate = parseLocalDate(accessory.buy_date);
    return accessory.include_total && buyDate && buyDate.getTime() <= date.getTime();
  }).reduce((sum, accessory) => sum + accessory.price, 0);
  return asset.price + accessoryTotal;
}
function getAssetNetCostOnDate(asset, date) {
  return getAssetStatus(asset) === "sold" ? getAssetTotalCostOnDate(asset, date) - (asset.lifecycle?.sold_price ?? 0) : getAssetTotalCostOnDate(asset, date);
}
function getTotalAssetValueOnDate(assets, dateValue) {
  const date = parseLocalDate(dateValue);
  if (!date) {
    return 0;
  }
  return assets.reduce((sum, asset) => {
    const buyDate = parseLocalDate(asset.buy_date);
    const endDate = parseLocalDate(getAssetEndDateValue(asset));
    if (!buyDate || !endDate || buyDate.getTime() > date.getTime() || date.getTime() > endDate.getTime()) {
      return sum;
    }
    return sum + (date.getTime() >= endDate.getTime() ? getAssetNetCostOnDate(asset, date) : getAssetTotalCostOnDate(asset, date));
  }, 0);
}
function getTotalDailyCostOnDate(assets, dateValue) {
  const date = parseLocalDate(dateValue);
  if (!date) {
    return 0;
  }
  return assets.reduce((sum, asset) => {
    const buyDate = parseLocalDate(asset.buy_date);
    const endDate = parseLocalDate(getAssetEndDateValue(asset));
    if (!buyDate || !endDate || buyDate.getTime() > date.getTime() || date.getTime() > endDate.getTime()) {
      return sum;
    }
    const effectiveEndDate = date.getTime() > endDate.getTime() ? endDate : date;
    const days = Math.max(1, Math.floor((effectiveEndDate.getTime() - buyDate.getTime()) / (1e3 * 3600 * 24)) + 1);
    const cost = date.getTime() >= endDate.getTime() ? getAssetNetCostOnDate(asset, date) : getAssetTotalCostOnDate(asset, date);
    return sum + cost / days;
  }, 0);
}
function getCategoryAverageUsageStats(assets) {
  const map = /* @__PURE__ */ new Map();
  assets.forEach((asset) => {
    const current = map.get(asset.category) ?? { totalDays: 0, count: 0 };
    current.totalDays += getUsedDays(asset);
    current.count += 1;
    map.set(asset.category, current);
  });
  return Array.from(map.entries()).map(([category, value]) => ({
    category,
    averageDays: value.count > 0 ? Math.round(value.totalDays / value.count) : 0
  })).sort((a, b) => b.averageDays - a.averageDays);
}

// packages/ui-web/src/view/themeMode.ts
var LIGHT_PALETTE = {
  pageBg: "#f6f7fb",
  primary: "#ffffff",
  secondary: "#f1f4fa",
  border: "#dfe4ee",
  hover: "#e6eaf3",
  textNormal: "#0f172a",
  textMuted: "#64748b",
  accent: "#3b82f6"
};
var DARK_PALETTE = {
  pageBg: "#1a1f2b",
  primary: "#222834",
  secondary: "#2a3142",
  border: "#3a4256",
  hover: "#333b4e",
  textNormal: "#e6e9ef",
  textMuted: "#9aa3b5",
  accent: "#3b82f6"
};
function applyPalette(el, palette, dark) {
  const style = el.style;
  style.colorScheme = dark ? "dark" : "light";
  style.background = palette.pageBg;
  style.color = palette.textNormal;
  style.setProperty("--background-primary", palette.primary);
  style.setProperty("--background-secondary", palette.secondary);
  style.setProperty("--background-modifier-border", palette.border);
  style.setProperty("--background-modifier-hover", palette.hover);
  style.setProperty("--text-normal", palette.textNormal);
  style.setProperty("--text-muted", palette.textMuted);
  style.setProperty("--text-on-accent", "#ffffff");
  style.setProperty("--interactive-accent", palette.accent);
}
function isObsidianDark() {
  try {
    const body = document.body;
    if (!body) return false;
    if (body.classList.contains("theme-dark")) return true;
    if (body.classList.contains("theme-light")) return false;
    return typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}
function detachSystemWatcher(el) {
  if (el.__obsiwealthThemeObserver) {
    el.__obsiwealthThemeObserver.disconnect();
    el.__obsiwealthThemeObserver = void 0;
  }
  if (el.__obsiwealthMediaQuery && el.__obsiwealthMediaListener) {
    try {
      el.__obsiwealthMediaQuery.removeEventListener("change", el.__obsiwealthMediaListener);
    } catch {
      el.__obsiwealthMediaQuery.removeListener?.(el.__obsiwealthMediaListener);
    }
    el.__obsiwealthMediaQuery = void 0;
    el.__obsiwealthMediaListener = void 0;
  }
}
function attachSystemWatcher(el) {
  detachSystemWatcher(el);
  try {
    const observer = new MutationObserver(() => {
      const dark = isObsidianDark();
      applyPalette(el, dark ? DARK_PALETTE : LIGHT_PALETTE, dark);
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    el.__obsiwealthThemeObserver = observer;
  } catch {
  }
  try {
    if (typeof window !== "undefined" && window.matchMedia) {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = () => {
        const dark = isObsidianDark();
        applyPalette(el, dark ? DARK_PALETTE : LIGHT_PALETTE, dark);
      };
      try {
        mq.addEventListener("change", listener);
      } catch {
        mq.addListener?.(listener);
      }
      el.__obsiwealthMediaQuery = mq;
      el.__obsiwealthMediaListener = listener;
    }
  } catch {
  }
}
function applyThemeMode(el, mode) {
  const themed = el;
  if (mode === "system") {
    const dark2 = isObsidianDark();
    applyPalette(themed, dark2 ? DARK_PALETTE : LIGHT_PALETTE, dark2);
    attachSystemWatcher(themed);
    return;
  }
  detachSystemWatcher(themed);
  const dark = mode === "dark";
  applyPalette(themed, dark ? DARK_PALETTE : LIGHT_PALETTE, dark);
}
function teardownThemeWatcher(el) {
  detachSystemWatcher(el);
}

// apps/obsidian/src/mainView.ts
var ObsiWealthMainView = class extends import_obsidian14.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.statsTrendCols = 2;
    this.fundStatsTab = "asset";
    this.fundTrendRange = "recent";
    // "recent" | "all" | YYYY
    this.statsGranularity = "category";
    this.fundSortMode = "grouped";
    this.fundBulkMode = false;
    this.selectedFundIds = /* @__PURE__ */ new Set();
    this.categoryFilter = "all";
    this.selectedCategoryFilters = /* @__PURE__ */ new Set();
    this.statusFilter = "all";
    this.currentPage = "home";
    this.bulkSelectionMode = false;
    this.selectedAssetIds = /* @__PURE__ */ new Set();
    this.collapsedStatsCards = /* @__PURE__ */ new Set();
    this.hideMoney = false;
    this.unlocked = false;
    this.idleWatermark = null;
    // 页面自适应缩放控制器：窗口窄于基准宽度时给 page 容器加上 CSS zoom
    // 避免卡片/图表换行，整体等比例缩小。
    this.responsiveZoom = null;
    // 银行 / 机构 logo 的 SVG 缓存 / 懒加载管理器
    this.bankLogoLoader = new BankLogoLoader(this.plugin);
    this.applyDefaultViewSettings();
  }
  applyDefaultViewSettings() {
    this.cols = this.plugin.settings.defaultCardColumns;
    this.sortField = this.plugin.settings.defaultSortField;
    this.sortDirection = this.plugin.settings.defaultSortDirection;
  }
  getViewType() {
    return VIEW_TYPE;
  }
  getDisplayText() {
    return "ObsiWealth";
  }
  async onOpen() {
    this.render();
  }
  async onClose() {
    this.idleWatermark?.teardown();
    this.responsiveZoom?.teardown();
    this.responsiveZoom = null;
    teardownThemeWatcher(this.containerEl);
  }
  render() {
    const el = this.containerEl;
    el.empty();
    el.style.height = "100%";
    el.style.display = "flex";
    el.style.flexDirection = "column";
    el.style.minHeight = "0";
    el.style.overflow = "hidden";
    applyThemeMode(el, this.plugin.settings.themeMode);
    if (!this.renderLockGateIfNeeded(el)) {
      return;
    }
    const ctx = this.buildContext();
    renderHeader(ctx, el);
    const page = el.createDiv();
    page.style.flex = "1 1 auto";
    page.style.minHeight = "0";
    page.style.overflowY = "auto";
    page.style.overflowX = "hidden";
    page.style.scrollBehavior = "smooth";
    if (this.currentPage === "home") {
      renderHomePage(ctx, page);
    } else if (this.currentPage === "funds") {
      renderFundsPage(ctx, page);
    } else if (this.currentPage === "assets") {
      renderAssetsPage(ctx, page);
    } else if (this.currentPage === "assetStats") {
      renderStatsPage(ctx, page);
    } else {
      renderWishlistPage(ctx, page);
    }
    const bottomSafeArea = el.createDiv();
    bottomSafeArea.style.flex = "0 0 auto";
    bottomSafeArea.style.height = "80px";
    bottomSafeArea.style.pointerEvents = "none";
    renderBottomNav(ctx, el);
    this.setupIdleWatermark(el);
    this.setupResponsiveZoom(el, page);
  }
  renderLockGateIfNeeded(el) {
    if (!this.plugin.settings.passwordEnabled || this.unlocked) {
      return true;
    }
    renderPasswordGate(
      {
        plugin: this.plugin,
        tr: (key, replacements) => t(this.plugin.settings.language, key, replacements),
        onUnlock: () => {
          this.unlocked = true;
          this.render();
        }
      },
      el
    );
    return false;
  }
  setupIdleWatermark(host2) {
    if (!this.idleWatermark) {
      this.idleWatermark = new IdleWatermarkController({
        plugin: this.plugin,
        host: host2,
        getCurrentPage: () => this.currentPage,
        createNavIcon: (name, size) => createNavIcon(name, size)
      });
    }
    this.idleWatermark.setup();
  }
  /**
   * Observe the (unscaled) view container's width and apply CSS zoom to the
   * current `page` so cards / charts shrink proportionally instead of
   * wrapping when the pane is narrower than the baseline.
   *
   * Baseline is derived from the current grid column count so that users
   * who pick more columns also implicitly raise the baseline width — a
   * 4-column pane needs more horizontal room than a 1-column one before
   * everything is laid out comfortably.
   *
   * Each `render()` rebuilds `page`, so we tear down and re-attach the
   * observer every call.
   */
  setupResponsiveZoom(host2, page) {
    this.responsiveZoom?.teardown();
    const getBaseline = () => {
      const pagePadding = 24;
      const assetsNeed = this.cols * 660 + Math.max(0, this.cols - 1) * 12 + pagePadding;
      const statsNeed = this.statsTrendCols * 640 + Math.max(0, this.statsTrendCols - 1) * 18 + pagePadding;
      const fundsNeed = 320 + 18 + 640 + pagePadding;
      return Math.max(780, assetsNeed, statsNeed, fundsNeed);
    };
    this.responsiveZoom = new ResponsiveZoomController(host2, page, getBaseline, 0.35);
    this.responsiveZoom.setup();
  }
  /**
   * Build the `MainViewContext` facade given to every page / component /
   * chart module. State fields are shared by reference via the object
   * literal, so mutations from handlers flow directly back to `this`.
   */
  buildContext() {
    const view = this;
    const plugin = this.plugin;
    const ctx = {
      // Obsidian handles
      app: this.app,
      plugin,
      // Proxy state fields (getters/setters so scalars stay in sync with view)
      get currentPage() {
        return view.currentPage;
      },
      set currentPage(v) {
        view.currentPage = v;
      },
      get cols() {
        return view.cols;
      },
      set cols(v) {
        view.cols = v;
      },
      get statsTrendCols() {
        return view.statsTrendCols;
      },
      set statsTrendCols(v) {
        view.statsTrendCols = v;
      },
      get hideMoney() {
        return view.hideMoney;
      },
      set hideMoney(v) {
        view.hideMoney = v;
      },
      get statusFilter() {
        return view.statusFilter;
      },
      set statusFilter(v) {
        view.statusFilter = v;
      },
      get categoryFilter() {
        return view.categoryFilter;
      },
      set categoryFilter(v) {
        view.categoryFilter = v;
      },
      get sortField() {
        return view.sortField;
      },
      set sortField(v) {
        view.sortField = v;
      },
      get sortDirection() {
        return view.sortDirection;
      },
      set sortDirection(v) {
        view.sortDirection = v;
      },
      get bulkSelectionMode() {
        return view.bulkSelectionMode;
      },
      set bulkSelectionMode(v) {
        view.bulkSelectionMode = v;
      },
      get fundSortMode() {
        return view.fundSortMode;
      },
      set fundSortMode(v) {
        view.fundSortMode = v;
      },
      get fundBulkMode() {
        return view.fundBulkMode;
      },
      set fundBulkMode(v) {
        view.fundBulkMode = v;
      },
      get fundStatsTab() {
        return view.fundStatsTab;
      },
      set fundStatsTab(v) {
        view.fundStatsTab = v;
      },
      get fundTrendRange() {
        return view.fundTrendRange;
      },
      set fundTrendRange(v) {
        view.fundTrendRange = v;
      },
      get statsGranularity() {
        return view.statsGranularity;
      },
      set statsGranularity(v) {
        view.statsGranularity = v;
      },
      // Shared reference fields (Set / object — mutations naturally flow back)
      selectedCategoryFilters: this.selectedCategoryFilters,
      selectedAssetIds: this.selectedAssetIds,
      selectedFundIds: this.selectedFundIds,
      collapsedStatsCards: this.collapsedStatsCards,
      bankLogoLoader: this.bankLogoLoader,
      // Lifecycle
      render: () => view.render(),
      tr: (key, replacements) => t(plugin.settings.language, key, replacements),
      // Formatters
      formatCurrency: (v) => formatCurrency(plugin, v),
      displayCurrency: (v) => displayCurrency(plugin, v, view.hideMoney),
      // Card / layout styles
      applyCardStyle,
      applyStickyTop,
      applyGridStyle: (grid) => applyGridStyle2(ctx, grid),
      createStatsHeroCard,
      createStatsCard: (el, title) => createStatsCard(ctx, el, title),
      createFundStatsCard: (el, title) => createFundStatsCard(ctx, el, title),
      createActionButton,
      createFundToolbarButton,
      applyToolbarBtnStyle,
      renderSlotNumber,
      renderEmptyChart: (parent) => renderEmptyChart(ctx, parent),
      // Fund aggregates
      getFundTotal: () => getFundTotal(plugin),
      getFundAssetTotal: () => getFundAssetTotal(plugin),
      getFundLiabilityTotal: () => getFundLiabilityTotal(plugin),
      getFundRanking: (tab, granularity) => getFundRanking(plugin, tab, granularity, (fund) => {
        if (fund.bank) {
          return fund.bank;
        }
        if (fund.name && fund.name.trim()) {
          return fund.name.trim();
        }
        return getFundCategory(fund).name;
      }),
      getFundCategory,
      // Asset aggregates / labels
      getVisibleAssetTotal,
      getCategoryStats,
      getCategoryColor: (c) => getCategoryColor(plugin, c),
      getCategoryLabel: (v) => getCategoryLabel(plugin, v),
      // Asset status
      getStatusColor: (s) => getStatusColor(plugin, s),
      getStatusShadowColor: (s) => getStatusShadowColor(plugin, s),
      getStatusLabel: (s) => getStatusLabel(plugin, s),
      getAssetUsageText: (a) => getAssetUsageText(plugin, a),
      // Wishlist
      getWishlistCurrentPrice,
      getWishlistAccessoriesTotal
    };
    return ctx;
  }
};

// apps/obsidian/src/storage/obsidianHost.ts
var import_obsidian15 = require("obsidian");
var ObsidianKVStore = class {
  constructor(app) {
    this.app = app;
  }
  exists(path) {
    return this.app.vault.adapter.exists(path);
  }
  read(path) {
    return this.app.vault.adapter.read(path);
  }
  readBinary(path) {
    return this.app.vault.adapter.readBinary(path);
  }
  write(path, data) {
    return this.app.vault.adapter.write(path, data);
  }
  writeBinary(path, data) {
    return this.app.vault.adapter.writeBinary(path, data);
  }
  mkdir(path) {
    return this.app.vault.adapter.mkdir(path);
  }
  async list(path) {
    const exists = await this.app.vault.adapter.exists(path);
    if (!exists) return { files: [], folders: [] };
    const res = await this.app.vault.adapter.list(path) ?? { files: [], folders: [] };
    return { files: res.files ?? [], folders: res.folders ?? [] };
  }
  async remove(path) {
    try {
      if (await this.app.vault.adapter.exists(path)) {
        await this.app.vault.adapter.remove(path);
      }
    } catch {
    }
  }
};
var OBSIDIAN_NOTIFIER = {
  notify(message) {
    new import_obsidian15.Notice(message);
  }
};
var ObsidianResourceResolver = class {
  constructor(app) {
    this.app = app;
  }
  resolveUrl(path) {
    return this.app.vault.adapter.getResourcePath(path);
  }
};
var ObsidianModalHost = class {
  constructor(app) {
    this.app = app;
  }
  openModal(render) {
    const app = this.app;
    let modal;
    class AdHocModal extends import_obsidian15.Modal {
      constructor() {
        super(app);
      }
      onOpen() {
        this.contentEl.empty();
        void render(this.contentEl, { close: () => this.close() });
      }
      onClose() {
        this.contentEl.empty();
      }
    }
    modal = new AdHocModal();
    modal.open();
    return { close: () => modal.close() };
  }
};
function createObsidianHost(app) {
  return {
    store: new ObsidianKVStore(app),
    notifier: OBSIDIAN_NOTIFIER,
    resources: new ObsidianResourceResolver(app),
    modals: new ObsidianModalHost(app)
  };
}

// apps/obsidian/src/storage/migrateInlineIcons.ts
async function migrateIconField(item) {
  if (!item.icon) return false;
  if (isInlinePngDataUrl(item.icon)) {
    try {
      const ref = await saveCustomImageFromDataUrl(item.icon);
      item.icon = ref;
      return true;
    } catch (err) {
      console.warn("[obsiwealth] icon migration failed", err);
      return false;
    }
  }
  if (isCustomImageRef(item.icon)) {
    const body = customImageRefBody(item.icon);
    if (!body) return false;
    const canonical = bodyToCustomImageRef(body);
    if (canonical !== item.icon) {
      item.icon = canonical;
      return true;
    }
  }
  return false;
}
async function migrateInlineIconsToFiles(t2) {
  let assetChanged = false;
  for (const a of t2.assets) {
    if (await migrateIconField(a)) assetChanged = true;
    const accessories = a.accessories;
    if (Array.isArray(accessories)) {
      for (const acc of accessories) {
        if (await migrateIconField(acc)) assetChanged = true;
      }
    }
  }
  if (assetChanged) await t2.saveAssets();
  let fundChanged = false;
  for (const f of t2.funds) {
    if (await migrateIconField(f)) fundChanged = true;
  }
  if (fundChanged) await t2.saveFunds();
  let wishChanged = false;
  for (const w of t2.wishlist) {
    if (await migrateIconField(w)) wishChanged = true;
  }
  if (wishChanged) await t2.saveWishlist();
}

// apps/obsidian/src/settings/settingsTab.ts
var import_obsidian17 = require("obsidian");

// apps/obsidian/src/settings/backup.ts
var import_obsidian16 = require("obsidian");
function renderBackupSection(containerEl, plugin) {
  const desc = containerEl.createEl("p", {
    text: "\u5C06\u6574\u4E2A .obsiwealth \u76EE\u5F55\uFF08\u8D44\u91D1 / \u8D44\u4EA7 / \u5FC3\u613F / \u8BBE\u7F6E / \u56FE\u7247\uFF09\u6253\u5305\u4E3A tar \u5907\u4EFD\uFF1B\u5BFC\u5165\u4F1A\u7528 tar \u5185\u5BB9\u5B8C\u5168\u66FF\u6362\u5F53\u524D\u76EE\u5F55\uFF0C\u8BF7\u8C28\u614E\u64CD\u4F5C"
  });
  desc.style.fontSize = "13px";
  desc.style.color = "var(--text-muted)";
  desc.style.margin = "4px 0 12px";
  const setting = new import_obsidian16.Setting(containerEl).setName("\u5168\u90E8\u6570\u636E").setDesc("\u5BFC\u51FA / \u5BFC\u5165 .obsiwealth \u76EE\u5F55\u7684 tar \u5907\u4EFD\u5305");
  setting.addButton((button) => {
    button.setButtonText("\u5BFC\u51FA");
    button.onClick(() => exportBackup(plugin));
  });
  setting.addButton((button) => {
    button.setButtonText("\u5BFC\u5165");
    button.onClick(() => importBackup(plugin));
  });
}
async function exportBackup(plugin) {
  try {
    await Promise.all([plugin.saveFunds(), plugin.saveAssets(), plugin.saveWishlist()]);
    const entries = await collectEntries(DATA_DIR);
    if (entries.length === 0) {
      notify("\u672A\u627E\u5230\u53EF\u5907\u4EFD\u7684\u6570\u636E");
      return;
    }
    const buffer = tarEncode(entries);
    const fileName = buildBackupFileName();
    triggerDownload(fileName, buffer);
    notify(`\u5DF2\u5BFC\u51FA\uFF1A${fileName}`);
  } catch (err) {
    console.error(err);
    notify("\u5BFC\u51FA\u5931\u8D25");
  }
}
async function collectEntries(root) {
  const store = host().store;
  const entries = [];
  const walk = async (dir) => {
    const { files, folders } = await store.list(dir);
    const filesSorted = [...files].sort();
    const foldersSorted = [...folders].sort();
    if (dir !== root) {
      entries.push({ name: toArchivePath(dir, root, "dir"), type: "dir" });
    }
    for (const file of filesSorted) {
      const buf = await store.readBinary(file);
      entries.push({
        name: toArchivePath(file, root, "file"),
        type: "file",
        data: new Uint8Array(buf)
      });
    }
    for (const sub of foldersSorted) {
      await walk(sub);
    }
  };
  await walk(root);
  return entries;
}
function toArchivePath(vaultPath, root, type) {
  const rel = vaultPath.startsWith(`${root}/`) ? vaultPath.slice(root.length + 1) : vaultPath === root ? "" : vaultPath;
  const base = `obsiwealth/${rel}`.replace(/\\/g, "/").replace(/\/+$/, "");
  return type === "dir" ? `${base}/` : base;
}
function buildBackupFileName() {
  const d = /* @__PURE__ */ new Date();
  const pad = (n) => n.toString().padStart(2, "0");
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
  return `obsiwealth-backup-${stamp}.tar`;
}
function triggerDownload(fileName, bytes) {
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
async function importBackup(plugin) {
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
        notify("\u5BFC\u5165\u5931\u8D25\uFF1Atar \u5305\u5185\u5BB9\u4E3A\u7A7A");
        return;
      }
      if (!confirm("\u786E\u5B9A\u7528\u8BE5 tar \u5305\u5B8C\u5168\u66FF\u6362\u5F53\u524D .obsiwealth \u76EE\u5F55\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500")) {
        return;
      }
      await applyBackup(plugin, payload);
      notify(`\u5DF2\u5BFC\u5165 ${payload.filter((e) => e.type === "file").length} \u4E2A\u6587\u4EF6`);
    } catch (err) {
      console.error(err);
      notify("\u5BFC\u5165\u5931\u8D25\uFF1A\u65E0\u6CD5\u89E3\u6790 tar \u5305");
    }
  };
  input.click();
}
function stripArchiveRoot(entries) {
  const stripped = [];
  for (const entry2 of entries) {
    const name = entry2.name.replace(/^\.?\/+/, "");
    const withoutRoot = name.replace(/^obsiwealth\//, "");
    if (!withoutRoot || withoutRoot === "/") continue;
    stripped.push({ ...entry2, name: withoutRoot });
  }
  return stripped;
}
async function applyBackup(plugin, entries) {
  const store = host().store;
  await wipeDirectory(DATA_DIR);
  await store.mkdir(DATA_DIR);
  const dirs = /* @__PURE__ */ new Set();
  for (const entry2 of entries) {
    if (entry2.type === "dir") dirs.add(entry2.name.replace(/\/+$/, ""));
    const parent = parentOf(entry2.name);
    if (parent) dirs.add(parent);
  }
  const orderedDirs = [...dirs].filter(Boolean).sort((a, b) => a.length - b.length);
  for (const dir of orderedDirs) {
    await store.mkdir(`${DATA_DIR}/${dir}`);
  }
  for (const entry2 of entries) {
    if (entry2.type !== "file" || !entry2.data) continue;
    const target = `${DATA_DIR}/${entry2.name}`;
    if (isTextPath(entry2.name)) {
      await store.write(target, bytesToUtf8(entry2.data));
    } else {
      await store.writeBinary(target, toFreshArrayBuffer(entry2.data));
    }
  }
  await plugin.loadFunds();
  await plugin.loadAssets();
  await plugin.loadWishlist();
  await plugin.loadSettings();
  plugin.refreshViews();
}
async function wipeDirectory(dir) {
  const store = host().store;
  if (!await store.exists(dir)) return;
  const { files, folders } = await store.list(dir);
  for (const file of files) {
    await store.remove(file);
  }
  for (const sub of folders) {
    await wipeDirectory(sub);
  }
}
function parentOf(path) {
  const idx = path.lastIndexOf("/");
  return idx <= 0 ? null : path.slice(0, idx);
}
function isTextPath(name) {
  const lower = name.toLowerCase();
  return lower.endsWith(".yaml") || lower.endsWith(".yml") || lower.endsWith(".json") || lower.endsWith(".md") || lower.endsWith(".txt");
}
function bytesToUtf8(bytes) {
  const TD = globalThis.TextDecoder;
  if (TD) return new TD("utf-8").decode(bytes);
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += String.fromCharCode(bytes[i]);
  return out;
}
function toFreshArrayBuffer(bytes) {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

// apps/obsidian/src/settings/settingsTab.ts
var STATUS_COLOR_PRESETS = [
  { color: "#60a5fa" },
  { color: "#a3a3a3" },
  { color: "#4ade80" },
  { color: "#ef4444" },
  { color: "#f59e0b" },
  { color: "#a78bfa" },
  { color: "#f472b6" },
  { color: "#22d3ee" }
];
var STATUS_LABELS = {
  active: "\u670D\u5F79\u4E2D",
  retired: "\u5DF2\u9000\u5F79",
  sold: "\u5DF2\u5356\u51FA"
};
var SORT_FIELD_LABELS = {
  manual: "\u624B\u52A8\u62D6\u62FD\u987A\u5E8F",
  buyDate: "\u8D2D\u4E70\u65F6\u95F4",
  dailyCost: "\u65E5\u5747\u6210\u672C",
  status: "\u7269\u54C1\u72B6\u6001",
  serviceTime: "\u670D\u5F79\u65F6\u957F",
  value: "\u7269\u54C1\u4EF7\u503C"
};
var SORT_DIRECTION_LABELS = {
  asc: "\u6B63\u5E8F",
  desc: "\u5012\u5E8F"
};
var ObsiWealthSettingTab = class extends import_obsidian17.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "ObsiWealth \u8BBE\u7F6E" });
    this.renderGroupHeader(containerEl, "\u901A\u7528");
    containerEl.createEl("h3", { text: "\u8D27\u5E01" });
    this.renderCurrencySetting(containerEl);
    containerEl.createEl("h3", { text: "\u663E\u793A\u504F\u597D" });
    this.renderCommonDisplayPreferences(containerEl);
    containerEl.createEl("h3", { text: "\u8BED\u8A00" });
    this.renderLanguageSetting(containerEl);
    containerEl.createEl("h3", { text: "\u4E3B\u9898\u989C\u8272" });
    this.renderThemeModeSetting(containerEl);
    containerEl.createEl("h3", { text: "\u5BC6\u7801\u4E0E\u5B89\u5168" });
    this.renderPasswordSettings(containerEl);
    containerEl.createEl("h3", { text: "\u95F2\u7F6E\u6C34\u5370" });
    this.renderIdleWatermarkSettings(containerEl);
    this.renderGroupHeader(containerEl, "\u8D44\u91D1");
    const fundNote = containerEl.createEl("p", {
      text: "\u6682\u65E0\u8D44\u91D1\u4E13\u5C5E\u7684\u72EC\u7ACB\u8BBE\u7F6E\uFF0C\u8D44\u91D1\u5206\u7C7B\u548C\u6392\u5E8F\u7531\u8D44\u91D1\u9875\u5DE5\u5177\u680F\u63A7\u5236\u3002"
    });
    fundNote.style.color = "var(--text-muted)";
    fundNote.style.fontSize = "13px";
    fundNote.style.margin = "8px 0 16px";
    this.renderGroupHeader(containerEl, "\u8D44\u4EA7");
    containerEl.createEl("h3", { text: "\u8D44\u4EA7\u663E\u793A\u504F\u597D" });
    this.renderAssetDisplayPreferences(containerEl);
    containerEl.createEl("h3", { text: "\u5206\u7C7B\u7BA1\u7406" });
    this.renderCategoryManager(containerEl);
    containerEl.createEl("h3", { text: "\u72B6\u6001\u989C\u8272" });
    this.renderStatusColorSettings(containerEl);
    this.renderGroupHeader(containerEl, "\u5176\u4ED6");
    containerEl.createEl("h3", { text: "\u56FE\u8868" });
    this.renderChartSettings(containerEl);
    containerEl.createEl("h3", { text: "\u56FE\u7247" });
    this.renderImageSettings(containerEl);
    containerEl.createEl("h3", { text: "\u6570\u636E\u5907\u4EFD" });
    renderBackupSection(containerEl, this.plugin);
  }
  /** Render a large "group" banner that visually separates top-level sections. */
  renderGroupHeader(containerEl, title) {
    const banner = containerEl.createDiv();
    banner.style.margin = "22px 0 10px";
    banner.style.padding = "10px 14px";
    banner.style.borderRadius = "10px";
    banner.style.background = "var(--background-secondary)";
    banner.style.borderLeft = "4px solid var(--interactive-accent)";
    banner.style.display = "flex";
    banner.style.alignItems = "center";
    banner.style.gap = "10px";
    const text = banner.createSpan({ text: title });
    text.style.fontSize = "18px";
    text.style.fontWeight = "900";
    text.style.color = "var(--text-normal)";
    text.style.letterSpacing = "0.02em";
  }
  // --------------- individual setting blocks ---------------
  renderCurrencySetting(containerEl) {
    new import_obsidian17.Setting(containerEl).setName("\u91D1\u94B1\u7B26\u53F7 + \u8D27\u5E01\u5355\u4F4D").setDesc("\u9009\u62E9\u8D44\u4EA7\u91D1\u989D\u5C55\u793A\u65F6\u4F7F\u7528\u7684\u8D27\u5E01\u7B26\u53F7\u548C\u5355\u4F4D").addDropdown((dropdown) => {
      CURRENCY_OPTIONS.forEach((option) => {
        dropdown.addOption(option.code, `${option.symbol} ${option.code} \xB7 ${option.name}`);
      });
      dropdown.setValue(this.plugin.settings.currencyCode).onChange(async (value) => {
        const selected = CURRENCY_OPTIONS.find((option) => option.code === value) ?? CURRENCY_OPTIONS[0];
        await this.plugin.updateSettings({
          ...this.plugin.settings,
          currencyCode: selected.code,
          currencySymbol: selected.symbol
        });
      });
    });
  }
  renderCommonDisplayPreferences(containerEl) {
    new import_obsidian17.Setting(containerEl).setName("\u5C0F\u6570\u70B9\u504F\u597D").setDesc("\u63A7\u5236\u91D1\u989D\u5C55\u793A\u7684\u5C0F\u6570\u4F4D\u6570").addDropdown((dropdown) => {
      dropdown.addOption("0", "\u4E0D\u4FDD\u7559").addOption("1", "\u4FDD\u7559 1 \u4F4D").addOption("2", "\u4FDD\u7559 2 \u4F4D").setValue(String(this.plugin.settings.decimalPlaces)).onChange(async (value) => {
        await this.plugin.updateSettings({
          ...this.plugin.settings,
          decimalPlaces: Number(value)
        });
      });
    });
    new import_obsidian17.Setting(containerEl).setName("\u4F7F\u7528\u5343\u5206\u4F4D\u5206\u9694\u7B26").setDesc("\u5F00\u542F\u540E\u91D1\u989D\u4F1A\u663E\u793A\u4E3A 1,234 \u8FD9\u6837\u7684\u683C\u5F0F").addToggle((toggle) => {
      toggle.setValue(this.plugin.settings.useThousandsSeparator).onChange(async (value) => {
        await this.plugin.updateSettings({
          ...this.plugin.settings,
          useThousandsSeparator: value
        });
      });
    });
    new import_obsidian17.Setting(containerEl).setName("\u9ED8\u8BA4\u5361\u7247\u5217\u6570").setDesc("\u6253\u5F00\u4E3B\u9875\u65F6\u9ED8\u8BA4\u663E\u793A\u7684\u5361\u7247\u5217\u6570").addDropdown((dropdown) => {
      dropdown.addOption("1", "1 \u5217").addOption("2", "2 \u5217").addOption("3", "3 \u5217").addOption("4", "4 \u5217").setValue(String(this.plugin.settings.defaultCardColumns)).onChange(async (value) => {
        await this.plugin.updateSettings({
          ...this.plugin.settings,
          defaultCardColumns: Number(value)
        });
      });
    });
  }
  renderAssetDisplayPreferences(containerEl) {
    new import_obsidian17.Setting(containerEl).setName("\u65F6\u957F\u663E\u793A").setDesc("\u9009\u62E9\u5DF2\u4F7F\u7528\u65F6\u957F\u663E\u793A\u6210\u65E5\u671F\u683C\u5F0F\u6216\u603B\u5929\u6570").addDropdown((dropdown) => {
      dropdown.addOption("date", "\u65E5\u671F").addOption("days", "\u5929\u6570").setValue(this.plugin.settings.durationDisplayMode).onChange(async (value) => {
        await this.plugin.updateSettings({
          ...this.plugin.settings,
          durationDisplayMode: value
        });
      });
    });
    new import_obsidian17.Setting(containerEl).setName("\u9ED8\u8BA4\u6392\u5E8F\u65B9\u5F0F").setDesc("\u6253\u5F00\u4E3B\u9875\u65F6\u9ED8\u8BA4\u4F7F\u7528\u7684\u6392\u5E8F\u4F9D\u636E").addDropdown((dropdown) => {
      Object.keys(SORT_FIELD_LABELS).forEach((field) => {
        dropdown.addOption(field, SORT_FIELD_LABELS[field]);
      });
      dropdown.setValue(this.plugin.settings.defaultSortField).onChange(async (value) => {
        await this.plugin.updateSettings({
          ...this.plugin.settings,
          defaultSortField: value
        });
      });
    });
    new import_obsidian17.Setting(containerEl).setName("\u9ED8\u8BA4\u6392\u5E8F\u65B9\u5411").setDesc("\u6253\u5F00\u4E3B\u9875\u65F6\u9ED8\u8BA4\u4F7F\u7528\u6B63\u5E8F\u6216\u5012\u5E8F").addDropdown((dropdown) => {
      Object.keys(SORT_DIRECTION_LABELS).forEach((direction) => {
        dropdown.addOption(direction, SORT_DIRECTION_LABELS[direction]);
      });
      dropdown.setValue(this.plugin.settings.defaultSortDirection).onChange(async (value) => {
        await this.plugin.updateSettings({
          ...this.plugin.settings,
          defaultSortDirection: value
        });
      });
    });
  }
  renderDisplayPreferences(containerEl) {
    this.renderCommonDisplayPreferences(containerEl);
    this.renderAssetDisplayPreferences(containerEl);
  }
  renderLanguageSetting(containerEl) {
    new import_obsidian17.Setting(containerEl).setName("\u754C\u9762\u8BED\u8A00").setDesc("\u9009\u62E9\u5E38\u7528\u8BED\u8A00\u504F\u597D").addDropdown((dropdown) => {
      LANGUAGE_OPTIONS.forEach((option) => {
        dropdown.addOption(option.code, option.name);
      });
      dropdown.setValue(this.plugin.settings.language).onChange(async (value) => {
        await this.plugin.updateSettings({
          ...this.plugin.settings,
          language: value
        });
      });
    });
  }
  renderPasswordSettings(containerEl) {
    new import_obsidian17.Setting(containerEl).setName("\u8FDB\u5165\u9875\u9762\u9700\u8981\u5BC6\u7801").setDesc("\u5F00\u542F\u540E\u4FDD\u5B58\u5BC6\u7801\u504F\u597D\uFF0C\u540E\u7EED\u53EF\u7528\u4E8E\u8FDB\u5165\u9875\u9762\u524D\u9A8C\u8BC1").addToggle((toggle) => {
      toggle.setValue(this.plugin.settings.passwordEnabled).onChange(async (value) => {
        await this.plugin.updateSettings({
          ...this.plugin.settings,
          passwordEnabled: value
        });
        this.display();
      });
    });
    if (this.plugin.settings.passwordEnabled) {
      new import_obsidian17.Setting(containerEl).setName("\u9875\u9762\u5BC6\u7801").setDesc("\u7528\u4E8E\u8FDB\u5165 ObsiWealth \u9875\u9762\u65F6\u9A8C\u8BC1").addText((text) => {
        text.inputEl.type = "password";
        text.setPlaceholder("\u8BF7\u8F93\u5165\u5BC6\u7801");
        text.setValue(this.plugin.settings.password);
        text.onChange(async (value) => {
          await this.plugin.updateSettings({
            ...this.plugin.settings,
            password: value
          });
        });
      });
    }
  }
  renderThemeModeSetting(containerEl) {
    new import_obsidian17.Setting(containerEl).setName("\u4E3B\u9898\u6A21\u5F0F").setDesc("\u9009\u62E9\u9ED1\u8272\u3001\u767D\u8272\u6216\u8DDF\u968F\u7CFB\u7EDF").addDropdown((dropdown) => {
      dropdown.addOption("system", "\u8DDF\u968F\u7CFB\u7EDF").addOption("light", "\u767D\u8272").addOption("dark", "\u9ED1\u8272").setValue(this.plugin.settings.themeMode).onChange(async (value) => {
        await this.plugin.updateSettings({
          ...this.plugin.settings,
          themeMode: value
        });
      });
    });
  }
  renderIdleWatermarkSettings(containerEl) {
    new import_obsidian17.Setting(containerEl).setName("\u542F\u7528\u95F2\u7F6E\u6C34\u5370").setDesc(
      "\u4E00\u6BB5\u65F6\u95F4\u65E0\u64CD\u4F5C\u540E\u906E\u6321\u9875\u9762\u5185\u5BB9\uFF0C\u663E\u793A\u4E0E\u5F53\u524D\u9875\u9762\u5BF9\u5E94\u7684\u6C34\u5370\uFF08\u4E3B\u9875\u5B57\u6BCD / \u8D44\u91D1\u7F8E\u5143 / \u8D44\u4EA7\u7269\u54C1 / \u5FC3\u613F\u7231\u5FC3\uFF09\u3002\u663E\u793A\u540E\u9700\u5355\u51FB\u4EFB\u610F\u4F4D\u7F6E\u5173\u95ED"
    ).addToggle((toggle) => {
      toggle.setValue(this.plugin.settings.idleWatermarkEnabled).onChange(async (value) => {
        await this.plugin.updateSettings({
          ...this.plugin.settings,
          idleWatermarkEnabled: value
        });
        this.display();
      });
    });
    if (this.plugin.settings.idleWatermarkEnabled) {
      new import_obsidian17.Setting(containerEl).setName("\u89E6\u53D1\u65F6\u95F4\uFF08\u79D2\uFF09").setDesc("\u65E0\u64CD\u4F5C\u591A\u5C11\u79D2\u540E\u663E\u793A\u6C34\u5370\uFF0C\u8303\u56F4 5 - 3600").addText((text) => {
        text.inputEl.type = "number";
        text.inputEl.min = "5";
        text.inputEl.max = "3600";
        text.setValue(String(this.plugin.settings.idleWatermarkTimeoutSec));
        text.onChange(async (value) => {
          const num = Math.max(5, Math.min(3600, Number(value) || 5));
          await this.plugin.updateSettings({
            ...this.plugin.settings,
            idleWatermarkTimeoutSec: num
          });
        });
      });
    }
  }
  renderChartSettings(containerEl) {
    new import_obsidian17.Setting(containerEl).setName("\u6298\u7EBF\u56FE\u663E\u793A\u6570\u636E\u70B9").setDesc("\u5173\u95ED\u540E\uFF0C\u8D44\u91D1/\u8D44\u4EA7\u8D8B\u52BF\u6298\u7EBF\u56FE\u4E0A\u4E0D\u518D\u663E\u793A\u5706\u70B9\u6807\u8BB0").addToggle((toggle) => {
      toggle.setValue(this.plugin.settings.showChartDots).onChange(async (value) => {
        await this.plugin.updateSettings({
          ...this.plugin.settings,
          showChartDots: value
        });
      });
    });
  }
  renderImageSettings(containerEl) {
    new import_obsidian17.Setting(containerEl).setName("\u81EA\u5B9A\u4E49\u56FE\u7247\u9ED8\u8BA4\u5C3A\u5BF8").setDesc("\u4E0A\u4F20\u672C\u5730\u56FE\u7247\u540E\uFF0C\u88C1\u526A\u5668\u8F93\u51FA\u5206\u8FA8\u7387\u7684\u9ED8\u8BA4\u6863\u4F4D\uFF1B\u8D8A\u5927\u8D8A\u6E05\u6670\uFF0C\u6587\u4EF6\u4E5F\u8D8A\u5927").addDropdown((dropdown) => {
      CUSTOM_ICON_SIZE_STEPS.forEach((px) => {
        dropdown.addOption(String(px), `${px} px`);
      });
      dropdown.setValue(String(this.plugin.settings.customIconDefaultSize)).onChange(async (value) => {
        const next = Number(value);
        if (!Number.isFinite(next) || next <= 0) return;
        await this.plugin.updateSettings({
          ...this.plugin.settings,
          customIconDefaultSize: next
        });
      });
    });
  }
  renderStatusColorSettings(containerEl) {
    ["active", "retired", "sold"].forEach((status) => {
      const setting = new import_obsidian17.Setting(containerEl).setName(STATUS_LABELS[status]).addText((text) => {
        text.inputEl.type = "color";
        text.setValue(this.plugin.settings.statusColors[status]);
        text.onChange(async (value) => {
          await this.updateStatusColor(status, value);
        });
      }).addText((text) => {
        text.setPlaceholder("#60a5fa");
        text.setValue(this.plugin.settings.statusColors[status]);
        text.onChange(async (value) => {
          if (/^#[0-9a-fA-F]{6}$/.test(value)) {
            await this.updateStatusColor(status, value);
            this.display();
          }
        });
      });
      this.renderStatusColorDropdown(setting.controlEl, status);
    });
  }
  // --------------- helpers for status color dropdown / category manager ---------------
  renderStatusColorDropdown(parent, status) {
    const wrapper = parent.createDiv();
    wrapper.style.position = "relative";
    const button = wrapper.createEl("button");
    button.type = "button";
    button.style.display = "inline-flex";
    button.style.alignItems = "center";
    button.style.gap = "8px";
    button.style.minWidth = "120px";
    button.style.height = "32px";
    button.style.padding = "0 10px";
    button.style.borderRadius = "8px";
    button.style.border = "1px solid var(--background-modifier-border)";
    button.style.background = "var(--background-primary)";
    button.style.cursor = "pointer";
    const selectedSwatch = button.createSpan();
    selectedSwatch.style.width = "16px";
    selectedSwatch.style.height = "16px";
    selectedSwatch.style.borderRadius = "4px";
    selectedSwatch.style.background = this.plugin.settings.statusColors[status];
    selectedSwatch.style.boxShadow = "0 0 0 1px rgba(0,0,0,0.18)";
    selectedSwatch.style.flexShrink = "0";
    const selectedText = button.createSpan({ text: this.plugin.settings.statusColors[status] });
    selectedText.style.fontSize = "12px";
    selectedText.style.fontWeight = "800";
    const arrow = button.createSpan({ text: "\u2304" });
    arrow.style.marginLeft = "auto";
    arrow.style.color = "var(--text-muted)";
    const menu = wrapper.createDiv();
    menu.style.position = "absolute";
    menu.style.right = "0";
    menu.style.top = "36px";
    menu.style.display = "none";
    menu.style.flexDirection = "column";
    menu.style.gap = "4px";
    menu.style.minWidth = "140px";
    menu.style.padding = "6px";
    menu.style.borderRadius = "10px";
    menu.style.background = "var(--background-primary)";
    menu.style.border = "1px solid var(--background-modifier-border)";
    menu.style.boxShadow = "0 12px 28px rgba(0,0,0,0.18)";
    menu.style.zIndex = "50";
    STATUS_COLOR_PRESETS.forEach((preset) => {
      const option = menu.createEl("button");
      option.type = "button";
      option.style.display = "flex";
      option.style.alignItems = "center";
      option.style.gap = "8px";
      option.style.width = "100%";
      option.style.padding = "6px 8px";
      option.style.border = "0";
      option.style.borderRadius = "8px";
      option.style.background = preset.color.toLowerCase() === this.plugin.settings.statusColors[status].toLowerCase() ? "var(--background-secondary)" : "transparent";
      option.style.cursor = "pointer";
      const swatch = option.createSpan();
      swatch.style.width = "16px";
      swatch.style.height = "16px";
      swatch.style.borderRadius = "4px";
      swatch.style.background = preset.color;
      swatch.style.boxShadow = "0 0 0 1px rgba(0,0,0,0.18)";
      swatch.style.flexShrink = "0";
      const code = option.createSpan({ text: preset.color });
      code.style.fontSize = "12px";
      code.style.fontWeight = "800";
      option.onclick = async () => {
        await this.updateStatusColor(status, preset.color);
        this.display();
      };
    });
    button.onclick = () => {
      menu.style.display = menu.style.display === "none" ? "flex" : "none";
    };
  }
  renderCategoryManager(containerEl) {
    this.plugin.settings.categories.forEach((category) => {
      new import_obsidian17.Setting(containerEl).setName(category.name).addText((text) => {
        text.setValue(category.name);
        text.onChange(async (value) => {
          await this.updateCategory(category.id, value);
        });
      }).addButton((button) => {
        button.setButtonText("\u5220\u9664");
        button.onClick(async () => {
          await this.deleteCategory(category.id);
        });
      });
    });
    let pendingCategoryName = "";
    new import_obsidian17.Setting(containerEl).setName("\u65B0\u589E\u5206\u7C7B").setDesc("\u8F93\u5165\u5206\u7C7B\u540D\u79F0\u540E\u6DFB\u52A0").addText((text) => {
      text.setPlaceholder("\u4F8B\u5982\uFF1A\u8FD0\u52A8");
      text.onChange((value) => {
        pendingCategoryName = value;
      });
    }).addButton((button) => {
      button.setButtonText("\u6DFB\u52A0");
      button.onClick(async () => {
        const name = pendingCategoryName.trim();
        if (!name) {
          notify("\u8BF7\u8F93\u5165\u5206\u7C7B\u540D\u79F0");
          return;
        }
        await this.addCategory(name);
      });
    });
  }
  async addCategory(name) {
    const id = this.createCategoryId(name);
    const exists = this.plugin.settings.categories.some(
      (category) => category.id === id || category.name === name
    );
    if (exists) {
      notify("\u5206\u7C7B\u5DF2\u5B58\u5728");
      return;
    }
    await this.plugin.updateSettings({
      ...this.plugin.settings,
      categories: [...this.plugin.settings.categories, { id, name }]
    });
    this.display();
  }
  async updateCategory(id, name) {
    const nextName = name.trim();
    if (!nextName) return;
    await this.plugin.updateSettings({
      ...this.plugin.settings,
      categories: this.plugin.settings.categories.map(
        (category) => category.id === id ? { ...category, name: nextName } : category
      )
    });
  }
  async deleteCategory(id) {
    if (this.plugin.settings.categories.length <= 1) {
      notify("\u81F3\u5C11\u4FDD\u7559\u4E00\u4E2A\u5206\u7C7B");
      return;
    }
    await this.plugin.updateSettings({
      ...this.plugin.settings,
      categories: this.plugin.settings.categories.filter((category) => category.id !== id)
    });
    this.display();
  }
  createCategoryId(name) {
    return name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\u4e00-\u9fa5_-]/g, "") || crypto.randomUUID();
  }
  async updateStatusColor(status, color) {
    await this.plugin.updateSettings({
      ...this.plugin.settings,
      statusColors: {
        ...this.plugin.settings.statusColors,
        [status]: color
      }
    });
  }
};

// apps/obsidian/src/main.ts
var ObsiWealthPlugin = class extends import_obsidian18.Plugin {
  constructor() {
    super(...arguments);
    this.settings = { ...DEFAULT_SETTINGS };
    // ---- custom-icon garbage collection ------------------------------------
    /**
     * Coalesced orphan-icon cleanup. Every save / delete that might have
     * freed a PNG schedules a pass; multiple rapid edits collapse into a
     * single run on the next tick. Failures are swallowed — GC is an
     * optimisation, never a correctness requirement.
     */
    this.iconGcTimer = null;
  }
  // ---- legacy array accessors used across the codebase ----
  get assets() {
    return this.assetsRepo?.items ?? [];
  }
  set assets(value) {
    if (this.assetsRepo) this.assetsRepo.items = value;
  }
  get wishlist() {
    return this.wishlistRepo?.items ?? [];
  }
  set wishlist(value) {
    if (this.wishlistRepo) this.wishlistRepo.items = value;
  }
  get funds() {
    return this.fundsRepo?.items ?? [];
  }
  set funds(value) {
    if (this.fundsRepo) this.fundsRepo.items = value;
  }
  async onload() {
    this.buildRepositories();
    await this.assetsRepo.load();
    await this.wishlistRepo.load();
    await this.fundsRepo.load();
    await this.loadSettings();
    try {
      await migrateInlineIconsToFiles({
        assets: this.assets,
        funds: this.funds,
        wishlist: this.wishlist,
        saveAssets: () => this.saveAssets(),
        saveFunds: () => this.saveFunds(),
        saveWishlist: () => this.saveWishlist()
      });
    } catch (err) {
      console.warn("[obsiwealth] inline icon migration failed", err);
    }
    try {
      await preloadCustomImagesFromItems([this.assets, this.funds, this.wishlist]);
    } catch (err) {
      console.warn("[obsiwealth] custom image preload failed", err);
    }
    this.scheduleIconGc();
    this.registerMainView();
    this.registerCommands();
  }
  buildRepositories() {
    const refresh = () => this.refreshViews();
    this.host = createObsidianHost(this.app);
    setHost(this.host);
    this.assetsRepo = new JsonArrayRepository({
      store: this.host.store,
      notifier: this.host.notifier,
      path: DATA_PATH,
      getId: (item) => item.id,
      label: "\u8D44\u4EA7\u6570\u636E",
      afterChange: refresh
    });
    this.wishlistRepo = new JsonArrayRepository({
      store: this.host.store,
      notifier: this.host.notifier,
      path: WISHLIST_PATH,
      getId: (item) => item.id,
      label: "\u5FC3\u613F\u6570\u636E",
      afterChange: refresh
    });
    this.fundsRepo = new JsonArrayRepository({
      store: this.host.store,
      notifier: this.host.notifier,
      path: FUNDS_PATH,
      getId: (item) => item.id,
      label: "\u8D44\u91D1\u6570\u636E",
      afterChange: refresh,
      onLoad: healFundHistory
    });
  }
  async openMainPage() {
    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.setViewState({ type: VIEW_TYPE, active: true });
  }
  // ---- asset / wishlist / fund CRUD (thin wrappers over the repositories) ----
  async loadAssets() {
    await this.assetsRepo.load();
  }
  async saveAssets() {
    await this.assetsRepo.save();
    this.scheduleIconGc();
  }
  async addAsset(asset) {
    await this.assetsRepo.add(asset);
  }
  async updateAsset(asset) {
    await this.assetsRepo.update(asset);
  }
  async deleteAsset(id) {
    await this.assetsRepo.remove(id);
    this.scheduleIconGc();
    notify("\u5DF2\u5220\u9664");
  }
  async loadWishlist() {
    await this.wishlistRepo.load();
  }
  async saveWishlist() {
    await this.wishlistRepo.save();
    this.scheduleIconGc();
  }
  async addWishlistItem(item) {
    await this.wishlistRepo.add(item);
  }
  async updateWishlistItem(item) {
    await this.wishlistRepo.update(item);
  }
  async deleteWishlistItem(id) {
    await this.wishlistRepo.remove(id);
    this.scheduleIconGc();
    notify("\u5DF2\u5220\u9664");
  }
  async loadFunds() {
    await this.fundsRepo.load();
  }
  async saveFunds() {
    await this.fundsRepo.save();
    this.scheduleIconGc();
  }
  async addFund(item) {
    await this.fundsRepo.add(item);
  }
  async updateFund(item) {
    await this.fundsRepo.update(item);
  }
  async deleteFund(id) {
    await this.fundsRepo.remove(id);
    this.scheduleIconGc();
    notify("\u5DF2\u5220\u9664");
  }
  scheduleIconGc() {
    if (this.iconGcTimer !== null) return;
    this.iconGcTimer = window.setTimeout(() => {
      this.iconGcTimer = null;
      this.runIconGc().catch((err) => {
        console.warn("[obsiwealth] custom-icon GC failed", err);
      });
    }, 250);
  }
  async runIconGc() {
    const refsInUse = collectCustomImageRefs([this.assets, this.funds, this.wishlist]);
    await pruneOrphanCustomImages(refsInUse);
  }
  // ---- settings persistence (kept in main because it has custom normalization) ----
  async loadSettings() {
    try {
      if (!await this.host.store.exists(SETTINGS_PATH)) {
        this.settings = { ...DEFAULT_SETTINGS };
        setDefaultCustomIconSize(this.settings.customIconDefaultSize);
        return;
      }
      const data = await this.host.store.read(SETTINGS_PATH);
      this.settings = this.normalizeSettings(decodeSettings(data));
      setDefaultCustomIconSize(this.settings.customIconDefaultSize);
    } catch {
      this.settings = { ...DEFAULT_SETTINGS };
      setDefaultCustomIconSize(this.settings.customIconDefaultSize);
      notify("\u8BBE\u7F6E\u8BFB\u53D6\u5931\u8D25\uFF0C\u5DF2\u4F7F\u7528\u9ED8\u8BA4\u8BBE\u7F6E");
    }
  }
  async saveSettings() {
    if (!await this.host.store.exists(DATA_DIR)) {
      await this.host.store.mkdir(DATA_DIR);
    }
    await this.host.store.write(SETTINGS_PATH, yamlStringify(this.settings));
  }
  async updateSettings(settings) {
    const applyDefaultViewSettings = this.settings.defaultCardColumns !== settings.defaultCardColumns || this.settings.defaultSortField !== settings.defaultSortField || this.settings.defaultSortDirection !== settings.defaultSortDirection;
    this.settings = settings;
    await this.saveSettings();
    setDefaultCustomIconSize(this.settings.customIconDefaultSize);
    this.refreshViews(applyDefaultViewSettings);
  }
  refreshViews(applyDefaultViewSettings = false) {
    this.app.workspace.getLeavesOfType(VIEW_TYPE).forEach((leaf) => {
      const view = leaf.view;
      if (view instanceof ObsiWealthMainView) {
        if (applyDefaultViewSettings) {
          view.applyDefaultViewSettings();
        }
        view.render();
      }
    });
  }
  // ---- registration helpers ----
  registerMainView() {
    this.registerView(VIEW_TYPE, (leaf) => new ObsiWealthMainView(leaf, this));
    this.addRibbonIcon("wallet", "ObsiWealth", () => {
      this.openMainPage();
    });
    this.addSettingTab(new ObsiWealthSettingTab(this.app, this));
  }
  registerCommands() {
    this.addCommand({
      id: "open-obsiwealth",
      name: "Open ObsiWealth",
      callback: () => this.openMainPage()
    });
  }
  // ---- settings normalization ----
  normalizeSettings(settings) {
    const categories = Array.isArray(settings.categories) && settings.categories.length > 0 ? this.normalizeCategories(settings.categories) : DEFAULT_CATEGORIES;
    return {
      ...DEFAULT_SETTINGS,
      ...settings,
      decimalPlaces: this.normalizeDecimalPlaces(settings.decimalPlaces),
      defaultCardColumns: this.normalizeDefaultCardColumns(settings.defaultCardColumns),
      defaultSortField: this.normalizeDefaultSortField(settings.defaultSortField),
      defaultSortDirection: this.normalizeDefaultSortDirection(settings.defaultSortDirection),
      customIconDefaultSize: this.normalizeCustomIconDefaultSize(settings.customIconDefaultSize),
      categories,
      statusColors: {
        ...DEFAULT_SETTINGS.statusColors,
        ...settings.statusColors ?? {}
      }
    };
  }
  normalizeCategories(categories) {
    return categories.map((category) => {
      const defaultCategory = DEFAULT_CATEGORIES.find((item) => item.id === category.id);
      if (defaultCategory && (!category.name || category.name === category.id)) {
        return defaultCategory;
      }
      return category;
    });
  }
  normalizeDecimalPlaces(value) {
    return value === 0 || value === 1 || value === 2 ? value : DEFAULT_SETTINGS.decimalPlaces;
  }
  normalizeDefaultCardColumns(value) {
    return value === 1 || value === 2 || value === 3 || value === 4 ? value : DEFAULT_SETTINGS.defaultCardColumns;
  }
  normalizeDefaultSortField(value) {
    return typeof value === "string" && value in SORT_FIELD_LABELS ? value : DEFAULT_SETTINGS.defaultSortField;
  }
  normalizeDefaultSortDirection(value) {
    return value === "asc" || value === "desc" ? value : DEFAULT_SETTINGS.defaultSortDirection;
  }
  normalizeCustomIconDefaultSize(value) {
    const raw = typeof value === "number" && Number.isFinite(value) && value > 0 ? value : DEFAULT_SETTINGS.customIconDefaultSize;
    let best = CUSTOM_ICON_SIZE_STEPS[0];
    let bestDelta = Math.abs(CUSTOM_ICON_SIZE_STEPS[0] - raw);
    for (let i = 1; i < CUSTOM_ICON_SIZE_STEPS.length; i++) {
      const delta = Math.abs(CUSTOM_ICON_SIZE_STEPS[i] - raw);
      if (delta < bestDelta) {
        best = CUSTOM_ICON_SIZE_STEPS[i];
        bestDelta = delta;
      }
    }
    return best;
  }
};
function decodeSettings(source) {
  const trimmed = (source ?? "").trim();
  if (trimmed === "") return {};
  const parsed = yamlParse(trimmed);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
}
function healFundHistory(raw) {
  let mutated = false;
  const fixed = raw.map((fund) => {
    const history = fund.history ?? [];
    if (history.length === 0) return fund;
    let latest = history[0];
    for (let i = 1; i < history.length; i++) {
      if ((history[i].date || "").localeCompare(latest.date || "") > 0) {
        latest = history[i];
      }
    }
    if (fund.amount !== latest.amount || fund.date !== latest.date) {
      mutated = true;
      return { ...fund, amount: latest.amount, date: latest.date };
    }
    return fund;
  });
  return { items: fixed, mutated };
}
//# sourceMappingURL=main.js.map
