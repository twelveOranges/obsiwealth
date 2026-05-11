import type { AppModel } from "@ui/host/appModel";
import { host } from "@core/storage/hostRegistry";
import { getPluginAssetDir, normalizeSvgContent } from "./fundLogo";

/**
 * Chinese bank / institution name → logo file key mapping.
 *
 * Canonical source of truth; `fundLogo.ts` keeps its own copy inside
 * `getFundLogoKey()` for legacy callers that match against a full `FundItem`.
 * Modals only have a bank *name* string, so they use this map directly.
 */
export const BANK_LOGO_KEY_MAP: Record<string, string> = {
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
};

/**
 * Resolve a bank/account display name to its logo file key. Exact match first,
 * then substring match. Returns null when nothing matches.
 */
export function resolveBankLogoKey(bank: string): string | null {
  if (!bank) return null;
  if (BANK_LOGO_KEY_MAP[bank]) return BANK_LOGO_KEY_MAP[bank];
  for (const zh of Object.keys(BANK_LOGO_KEY_MAP)) {
    if (bank.includes(zh)) return BANK_LOGO_KEY_MAP[zh];
  }
  return null;
}

/**
 * Read the `<key>.svg` file for the given bank name and return it as a
 * `data:image/svg+xml` dataURL so it can be persisted into `fund.icon`
 * and rendered everywhere via the existing icon-dataURL passthrough.
 *
 * Returns `null` when the bank has no known logo key or only a PNG file
 * exists (KVStore doesn't support binary reads today, so we can't inline
 * a PNG as a dataURL from here — the caller should fall back to a
 * built-in icon in that case).
 */
export async function resolveBankIconDataUrl(
  plugin: AppModel,
  bank: string,
): Promise<string | null> {
  const key = resolveBankLogoKey(bank);
  if (!key) return null;

  const store = host().store;
  const dir = getPluginAssetDir(plugin);
  const svgPath = `${dir}/assets/logo/${key}.svg`;

  try {
    if (!(await store.exists(svgPath))) {
      return null;
    }
    const raw = await store.read(svgPath);
    // 规范化 SVG（强制 width/height、去掉 <?xml?> 前缀），再 URL 编码成 dataURL
    const normalized = normalizeSvgContent(raw, 64).replace(/\s+/g, " ").trim();
    return `data:image/svg+xml;utf8,${encodeURIComponent(normalized)}`;
  } catch {
    return null;
  }
}

/**
 * Apply the shared square logo-box style: fixed size, centered content, hidden
 * overflow, transparent background, 5-6px rounded corners.
 */
export function applyLogoBoxStyle(
  el: HTMLElement,
  size: number,
  borderRadius: number = 5,
): void {
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

/**
 * Render a bank logo into `container`, with async fallback chain:
 *   svg on disk → png on disk → character fallback (first char of `bank`).
 *
 * Stateless: each call triggers its own `adapter.exists` + `adapter.read`.
 * Intended for modal use where instances are short-lived and cross-instance
 * caching would not pay off. Callers that render many logos in a view should
 * use `BankLogoLoader` from `./fundLogo` instead.
 *
 * Behaviour is intentionally identical to the previously duplicated
 * `renderBankLogoInto` private methods in fundModal / fundDetailModal /
 * bankPickerModal.
 */
export function renderBankLogoByName(
  plugin: AppModel,
  container: HTMLElement,
  bank: string,
  size: number,
): void {
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
      // keep fallback
    }
  })();
}
