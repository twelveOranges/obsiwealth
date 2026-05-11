import { DEFAULT_FUND_CATEGORY_ID, FUND_CATEGORIES } from "../types";
import type { FundCategory, FundItem } from "../types";

/**
 * Resolve a fund's configured category entry, with a safe default.
 *
 * Extracted verbatim from `ObsiWealthMainView.getFundCategory` so fund
 * statistics, logo rendering and the funds page can share the same rule
 * without going through the view class.
 */
export function getFundCategory(fund: FundItem): FundCategory {
  return (
    FUND_CATEGORIES.find((category) => category.id === fund.category)
    ?? FUND_CATEGORIES.find((category) => category.id === DEFAULT_FUND_CATEGORY_ID)
    ?? FUND_CATEGORIES[0]
  );
}
