import type { AppModel } from "@ui/host/appModel";
import type { FundItem } from "@core/types";
import { PLUGIN_DIR } from "@core/storage/paths";
import { host } from "@core/storage/hostRegistry";
import { getFundCategory } from "@core/calc/fundCategory";
import { getIconPath } from "../iconResolver";
import { getBuiltInBankLogoSvg } from "./bankLogoRegistry";

/**
 * Rewrite an SVG text so that it:
 *  - strips `<?xml ... ?>` / `<!DOCTYPE ...>` prologues that browsers warn about
 *  - adds a unique suffix to every id / class so multiple instances on the
 *    same page never cross-paint each other's fills / gradients / masks
 *  - forces the root `<svg>` to use `width=size, height=size, preserveAspectRatio`
 *    and ensures a `viewBox` is present so the logo scales cleanly.
 *
 * Pure function, extracted verbatim from `ObsiWealthMainView.normalizeSvgContent`.
 */
export function normalizeSvgContent(svgText: string, size: number): string {
  let text = svgText.trim();
  // 去掉 <?xml ...?> 前缀（浏览器 innerHTML 可能报警告）
  text = text.replace(/<\?xml[^>]*\?>/g, "").trim();
  // 去掉 DOCTYPE
  text = text.replace(/<!DOCTYPE[^>]*>/gi, "").trim();

  // 关键：每个实例生成唯一后缀，给 id、class 和 <style> 内的 CSS 选择器统一加后缀
  // 彻底杜绝多实例挂在同一页面时 id / class 冲突导致的颜色串扰
  const uniqueSuffix = `-ul${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;

  // 1) id 加后缀
  const idRegex = /\bid\s*=\s*(["'])([^"']+)\1/g;
  const ids = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = idRegex.exec(text))) {
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

  // 2) class 加后缀（SVG 元素上 class="xxx yyy"），并同步 <style> 里的 .xxx 选择器
  const classNames = new Set<string>();
  const classAttrRegex = /\bclass\s*=\s*(["'])([^"']+)\1/g;
  let cm: RegExpExecArray | null;
  while ((cm = classAttrRegex.exec(text))) {
    cm[2].split(/\s+/).forEach((c) => {
      if (c) classNames.add(c);
    });
  }
  if (classNames.size > 0) {
    text = text.replace(classAttrRegex, (_m, q, val) => {
      const next = (val as string)
        .split(/\s+/)
        .filter(Boolean)
        .map((c) => `${c}${uniqueSuffix}`)
        .join(" ");
      return `class=${q}${next}${q}`;
    });

    text = text.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (_full, css: string) => {
      let next = css;
      classNames.forEach((cn) => {
        const esc = cn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp(`\\.${esc}(?![\\w-])`, "g");
        next = next.replace(re, `.${cn}${uniqueSuffix}`);
      });
      return `<style>${next}</style>`;
    });
  }

  // 3) 为 svg 根标签注入 width/height 并保留 viewBox；若源 svg 无 viewBox，则用原 width/height 兜底
  text = text.replace(/<svg\b([^>]*)>/i, (_match, attrs) => {
    let a: string = attrs;
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

/**
 * Return the plugin asset dir (vault-relative), falling back to the conventional
 * path when `manifest.dir` is unset.
 */
export function getPluginAssetDir(plugin: AppModel): string {
  const dir = plugin.manifest?.dir;
  if (dir) {
    return dir;
  }
  return PLUGIN_DIR;
}

/**
 * Cache + lazy loader for bank / institution logo SVGs.
 *
 * Each loader holds two maps:
 *  - `cache` : key -> SVG text OR null (null means "no svg on disk, try png later")
 *  - `inflight` : key -> in-progress load promise (coalesces concurrent callers)
 *
 * The view reads `cache.get(key)` / `cache.has(key)` synchronously on render,
 * so callers need direct read access; `get` / `has` proxy to the underlying map.
 */
export class BankLogoLoader {
  private readonly cache = new Map<string, string | null>();
  private readonly inflight = new Map<string, Promise<string | null>>();

  constructor(private readonly plugin: AppModel) {}

  has(key: string): boolean {
    return this.cache.has(key) || getBuiltInBankLogoSvg(key) != null;
  }

  get(key: string): string | null | undefined {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    // Synchronously surface built-in SVGs so first-paint doesn't flash
    // the placeholder glyph. We also seed the cache so subsequent calls
    // (including those inspecting `cache.get` directly) skip this branch.
    const builtIn = getBuiltInBankLogoSvg(key);
    if (builtIn) {
      this.cache.set(key, builtIn);
      return builtIn;
    }
    return undefined;
  }

  /** Vault-relative path to the plugin's logo asset folder. */
  private assetDir(): string {
    return getPluginAssetDir(this.plugin);
  }

  /** Host-agnostic resource URL for a specific logo file (default ext = svg). */
  resourceUrl(key: string, ext: string = "svg"): string {
    const path = `${this.assetDir()}/assets/logo/${key}.${ext}`;
    return host().resources.resolveUrl(path);
  }

  /** Async load the SVG text; resolves to null when the file doesn't exist. */
  async loadSvg(key: string): Promise<string | null> {
    if (this.cache.has(key)) {
      return this.cache.get(key) ?? null;
    }

    // Prefer the SVG baked into the release bundle — zero I/O, always available.
    const builtIn = getBuiltInBankLogoSvg(key);
    if (builtIn) {
      this.cache.set(key, builtIn);
      return builtIn;
    }

    const existing = this.inflight.get(key);
    if (existing) {
      return existing;
    }
    // Optional override hook: a user who ships their own vault-relative
    // `assets/logo/<key>.svg` still wins over the default. We keep the
    // read path so the mechanism stays extensible even though the default
    // install no longer relies on it.
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
  async pngExists(key: string): Promise<boolean> {
    const pngPath = `${this.assetDir()}/assets/logo/${key}.png`;
    try {
      return await host().store.exists(pngPath);
    } catch {
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// Fund item labels + logo rendering
// ---------------------------------------------------------------------------

/**
 * Fallback character/emoji shown when no bank logo is available.
 * Pure function (no DOM, no IO).
 */
export function getFundLogoPlaceholder(fund: FundItem): string {
  if (fund.bank) {
    return fund.bank.charAt(0);
  }

  const category = getFundCategory(fund);
  const map: Record<string, string> = {
    cash: "💵",
    virtual_account: "◉",
    investment: "📈",
    claim: "↩",
    liability: "⚠",
    social_security: "🛡",
    custom_asset: "★",
  };

  return map[category.id] ?? "•";
}

/**
 * For specific fund categories, render an inline vector icon instead of a
 * character placeholder. Returns `true` when an icon was drawn, allowing the
 * caller to fall back to the text placeholder when `false` is returned.
 *
 * Today the `cash` category has a dedicated lucide-banknote style icon.
 * Investment sub-types (stock / fund / other_investment) use inline
 * placeholder icons until real logo SVGs are dropped under `assets/logo/`.
 */
export function renderFundCategoryIconInto(
  container: HTMLElement,
  categoryId: string,
  size: number,
): boolean {
  if (categoryId === "cash") {
    return drawCashIcon(container, size);
  }
  return false;
}

function drawCashIcon(container: HTMLElement, size: number): boolean {
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

/**
 * Chinese bank / institution name → logo file key mapping.
 *
 * Priority:
 *   1. `fund.bank` exact match
 *   2. `fund.bank` partial match (substring)
 *   3. `fund.name` substring match
 */
export function getFundLogoKey(fund: FundItem): string | null {
  const bankKeyMap: Record<string, string> = {
    "工商银行": "icbc",
    "建设银行": "ccb",
    "农业银行": "abc",
    "中国银行": "boc",
    "招商银行": "cmb",
    "交通银行": "bocom",
    "邮政银行": "psbc",
    "邮储银行": "psbc",
    "中信银行": "citic_bank",
    "众安银行": "zhongan_bank",
    "北京银行": "bob",
    "汇丰银行": "hsbc",
    "河南农村信用社": "henan_rcc",
    "支付宝": "alipay",
    "微信": "wechat",
    "蚂蚁花呗": "huabei",
    "花呗": "huabei",
    "京东白条": "jd_baitiao",
    "白条": "jd_baitiao",
    "股票": "stock",
    "基金": "fund",
    "其他投资": "other_investment",
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

/**
 * Render a fund logo into `container`, falling back through cache → svg file
 * → png file → category icon → character placeholder.
 *
 * `loader` is used for sync cache reads and async file loads.
 */
export function renderFundLogoInto(
  loader: BankLogoLoader,
  container: HTMLElement,
  fund: FundItem,
  size: number,
): void {
  container.empty();

  // 用户自定义图标优先（可能是内置图标 id，或本地图片裁剪后的 dataURL）
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

/**
 * Try to render a `<key>.png` logo; if the PNG doesn't exist, invoke
 * `fallback()`.
 */
export function renderLogoFallbackImage(
  loader: BankLogoLoader,
  container: HTMLElement,
  key: string,
  size: number,
  fallback: () => void,
): void {
  loader.pngExists(key).then((ok: boolean) => {
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

/**
 * Last 4 digits of a card number, or the trimmed original if no digits
 * can be extracted (and empty string when `cardNumber` is falsy).
 */
export function getCardTail(cardNumber?: string): string {
  if (!cardNumber) {
    return "";
  }

  const digits = cardNumber.replace(/\D/g, "");

  if (!digits) {
    return cardNumber.trim();
  }

  return digits.slice(-4);
}

/**
 * Main label shown on a fund card: bank name + last 4 digits when available,
 * otherwise fund.name, otherwise the fund category name.
 */
export function getFundPrimaryLabel(fund: FundItem): string {
  if (fund.bank) {
    const tail = getCardTail(fund.card_number);
    return tail ? `${fund.bank}（${tail}）` : fund.bank;
  }

  return fund.name || getFundCategory(fund).name;
}

/**
 * Secondary (smaller) label on a fund card.
 *
 * Display priority:
 *   1. social_security with a city — show "城市" or "城市（备注）" so the
 *      user can distinguish multiple entries of the same item across cities.
 *   2. user remark — shown verbatim when present
 *   3. user-customised name — shown only when it differs from the auto
 *      "${bank}储蓄卡/信用卡" template
 *   4. otherwise empty string — caller should hide the row entirely so
 *      cards without extra info don't repeat the category name redundantly.
 */
export function getFundSecondaryLabel(fund: FundItem): string {
  if (fund.category === "social_security" && fund.city && fund.city.trim()) {
    const city = fund.city.trim();
    const remark = fund.remark?.trim();
    return remark ? `${city}（${remark}）` : city;
  }

  if (fund.remark && fund.remark.trim()) {
    return fund.remark.trim();
  }

  if (fund.bank) {
    const category = getFundCategory(fund);
    const defaultName = `${fund.bank}${category.id === "debit_card" ? "储蓄卡" : "信用卡"}`;

    if (fund.name && fund.name !== defaultName && fund.name !== fund.bank) {
      return fund.name;
    }
  }

  return "";
}
