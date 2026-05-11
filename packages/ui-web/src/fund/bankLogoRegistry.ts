// Bank / payment logos. Source SVGs live under `assets/logo/` and are
// inlined at build time via the esbuild `text` loader, so the final
// release bundle (main.js) is self-contained \u2014 no runtime disk I/O for
// these logos anymore.

import alipay from "../../../../assets/logo/alipay.svg";
import wechat from "../../../../assets/logo/wechat.svg";
import icbc from "../../../../assets/logo/icbc.svg";
import ccb from "../../../../assets/logo/ccb.svg";
import abc from "../../../../assets/logo/abc.svg";
import boc from "../../../../assets/logo/boc.svg";
import cmb from "../../../../assets/logo/cmb.svg";
import bocom from "../../../../assets/logo/bocom.svg";
import psbc from "../../../../assets/logo/psbc.svg";
import citic_bank from "../../../../assets/logo/citic_bank.svg";
import zhongan_bank from "../../../../assets/logo/zhongan_bank.svg";
import bob from "../../../../assets/logo/bob.svg";
import hsbc from "../../../../assets/logo/hsbc.svg";
import henan_rcc from "../../../../assets/logo/henan_rcc.svg";
import huabei from "../../../../assets/logo/huabei.svg";
import jd_baitiao from "../../../../assets/logo/jd_baitiao.svg";

/**
 * Built-in bank / payment logo registry keyed by the same short ids
 * that `getFundLogoKey` already returns (e.g. "alipay", "icbc", \u2026).
 *
 * Returns `null` when the key isn't a built-in logo \u2014 callers may then
 * fall back to a `.png` on disk or to the placeholder character.
 */
const BANK_LOGO_SVG: Record<string, string> = {
  alipay,
  wechat,
  icbc,
  ccb,
  abc,
  boc,
  cmb,
  bocom,
  psbc,
  citic_bank,
  zhongan_bank,
  bob,
  hsbc,
  henan_rcc,
  huabei,
  jd_baitiao,
};

export function getBuiltInBankLogoSvg(key: string): string | null {
  return BANK_LOGO_SVG[key] ?? null;
}

export function hasBuiltInBankLogo(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(BANK_LOGO_SVG, key);
}
