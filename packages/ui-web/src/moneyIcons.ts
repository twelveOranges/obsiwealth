import type { IconDefinition } from "@core/types";
import {
  CASH_BANKNOTE_ICON as LIB_CASH_BANKNOTE_ICON,
  CREDIT_CARD_ICON as LIB_CREDIT_CARD_ICON,
  getCategory,
} from "./iconLibrary";

/**
 * Back-compat shim: earlier revisions of this module kept the money icons
 * as inline SVG literals. They now live as real `.svg` files under
 * `assets/icons/flat/money/` and are wired through `iconLibrary.ts`; this
 * file simply re-exports the same symbols so downstream modules
 * (fundModal / iconPicker / …) keep compiling.
 */

export const CASH_BANKNOTE_ICON: string = LIB_CASH_BANKNOTE_ICON;
export const CREDIT_CARD_ICON: string = LIB_CREDIT_CARD_ICON;

export const MONEY_ICONS: IconDefinition[] = getCategory("2d", "money")?.icons ?? [];
