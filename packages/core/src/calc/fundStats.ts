import type { FundItem } from "../types";
import { getFundCategory } from "./fundCategory";

/**
 * Minimal shape the fund-stats helpers need from the host plugin.
 *
 * Keeping this as a structural type (rather than importing the concrete
 * `ObsiWealthPlugin` class) is what lets `@obsiwealth/core` live without a
 * dependency on the Obsidian-facing entry point.
 */
export interface FundHolder {
  readonly funds: FundItem[];
}

/**
 * Optional hook for the item-level ranking to produce a nicer label than
 * "category name". UI layers pass in `getFundPrimaryLabel` here.
 */
export type FundLabelFn = (fund: FundItem) => string;

/** A single point in a fund-type trend series. */
export interface FundTrendPoint {
  date: string;
  value: number;
}

/**
 * A single slot in a monthly series. `value` may be `null` meaning "no data
 * in this month" – the chart should break the line here instead of drawing a
 * zero.
 *
 * `label` is a display-ready short label for the x-axis (e.g. "1月", "2025-03").
 * `date` is the canonical `YYYY-MM` key identifying the slot.
 * `actualDate`, when present, is the concrete `YYYY-MM-DD` of the record
 * underlying this slot. Charts use it to place the data point at the real
 * day within the month (rather than the month centre), and to show the exact
 * date in tooltips.
 */
export interface FundMonthlySlot {
  date: string;
  value: number | null;
  label: string;
  actualDate?: string;
}

/**
 * Range selector for the monthly trend chart.
 * - `"recent"`: the most recent 12 months ending at the current month.
 * - `"all"`: every month from the earliest recorded month to now.
 * - `"YYYY"` (a 4-digit year string): all 12 months of that year.
 */
export type FundTrendRange = "recent" | "all" | string;

/** An entry in the fund pie / ranking card. */
export interface FundRankingEntry {
  name: string;
  value: number;
  color: string;
}

/**
 * The "current balance" of a fund item.
 *
 * If `history` contains at least one record we use the amount of the record
 * with the latest `date`. Otherwise we fall back to `fund.amount`.
 */
export function getFundEffectiveAmount(fund: FundItem): number {
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

/** Total of every fund categorised as `asset`. */
export function getFundAssetTotal(plugin: FundHolder): number {
  return plugin.funds
    .filter((fund) => getFundCategory(fund).type === "asset")
    .reduce((sum, fund) => sum + getFundEffectiveAmount(fund), 0);
}

/** Total of every fund categorised as `liability`. */
export function getFundLiabilityTotal(plugin: FundHolder): number {
  return plugin.funds
    .filter((fund) => getFundCategory(fund).type === "liability")
    .reduce((sum, fund) => sum + getFundEffectiveAmount(fund), 0);
}

/** Net asset = asset total - liability total. */
export function getFundNetAsset(plugin: FundHolder): number {
  return getFundAssetTotal(plugin) - getFundLiabilityTotal(plugin);
}

/** Alias kept for parity with the old view method. */
export function getFundTotal(plugin: FundHolder): number {
  return getFundNetAsset(plugin);
}

/** Balance of `fund` on (at or before) the given `date`, ISO yyyy-mm-dd. */
export function getFundAmountOnDate(fund: FundItem, date: string): number {
  const history = (fund.history ?? [{ id: fund.id, amount: fund.amount, date: fund.date }])
    .filter((point) => point.date <= date)
    .sort((a, b) => a.date.localeCompare(b.date));

  return history[history.length - 1]?.amount ?? 0;
}

/**
 * Collect every distinct date touched by any fund's history (union), sorted
 * ascending. Used as the x-axis for the overall fund trend chart.
 */
function collectFundDates(plugin: FundHolder): string[] {
  const dateSet = new Set<string>();

  plugin.funds.forEach((fund) => {
    (fund.history ?? [{ id: fund.id, amount: fund.amount, date: fund.date }]).forEach((point) => {
      if (point.date) {
        dateSet.add(point.date);
      }
    });
  });

  return Array.from(dateSet).sort((a, b) => a.localeCompare(b));
}

/**
 * Net-asset trend line: every dated balance change across all funds,
 * aggregated into `asset - liability` per date.
 */
export function getFundTrendPoints(plugin: FundHolder): FundTrendPoint[] {
  return collectFundDates(plugin).map((date) => ({
    date,
    value: plugin.funds.reduce((sum, fund) => {
      const amount = getFundAmountOnDate(fund, date);
      return sum + (getFundCategory(fund).type === "liability" ? -amount : amount);
    }, 0),
  }));
}

/**
 * Trend series filtered by the current Funds page tab.
 */
export function getFundTrendPointsByTab(
  plugin: FundHolder,
  tab: "asset" | "liability" | "netAsset",
): FundTrendPoint[] {
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
    }, 0),
  }));
}

/**
 * Internal: month-end reduction, returning a `Map<YYYY-MM, { date, value }>`
 * used as the raw data source for range-aware consumers. The preserved
 * `date` (actual YYYY-MM-DD of the latest record in that month) lets the
 * chart place points at their real day within the month and show the exact
 * date in tooltips.
 */
function buildFundMonthMap(
  plugin: FundHolder,
  tab: "asset" | "liability" | "netAsset",
): Map<string, { date: string; value: number }> {
  const daily = getFundTrendPointsByTab(plugin, tab);
  const monthMap = new Map<string, { date: string; value: number }>();

  daily.forEach((point) => {
    const month = point.date.slice(0, 7);
    const existing = monthMap.get(month);
    if (!existing || existing.date < point.date) {
      monthMap.set(month, { date: point.date, value: point.value });
    }
  });

  // Append "current month, live value" if we have no record for it yet – we
  // want the chart to show where the balance is right now.
  const today = new Date().toISOString().slice(0, 10);
  const todayMonth = today.slice(0, 7);
  if (!monthMap.has(todayMonth)) {
    const currentValue = tab === "asset"
      ? getFundAssetTotal(plugin)
      : tab === "liability"
        ? getFundLiabilityTotal(plugin)
        : getFundNetAsset(plugin);
    // Only append when there is at least some historical data – an
    // all-zeros series would otherwise get a misleading single point.
    if (monthMap.size > 0 || currentValue !== 0) {
      monthMap.set(todayMonth, { date: today, value: currentValue });
    }
  }

  return monthMap;
}

/** Return the distinct years (as "YYYY") that have at least one recorded point. */
export function getAvailableFundYears(
  plugin: FundHolder,
  tab: "asset" | "liability" | "netAsset",
): string[] {
  const months = buildFundMonthMap(plugin, tab);
  const years = new Set<string>();
  months.forEach((_, month) => {
    years.add(month.slice(0, 4));
  });
  return Array.from(years).sort();
}

/**
 * Monthly series, aligned to the requested {@link FundTrendRange}.
 *
 * Unlike {@link getFundMonthlyPoints}, months without data are kept as `null`
 * slots so the chart can render empty x-ticks (and break the line across
 * missing months instead of joining through zero).
 */
export function getFundMonthlySeries(
  plugin: FundHolder,
  tab: "asset" | "liability" | "netAsset",
  range: FundTrendRange,
): FundMonthlySlot[] {
  const months = buildFundMonthMap(plugin, tab);

  // Small helper: build a slot for a given YYYY-MM key + display label.
  const makeSlot = (key: string, label: string): FundMonthlySlot => {
    const info = months.get(key);
    if (!info) {
      return { date: key, value: null, label };
    }
    return { date: key, value: info.value, label, actualDate: info.date };
  };

  // "Specific year" – always 12 slots, Jan..Dec.
  if (/^\d{4}$/.test(range)) {
    const year = range;
    const slots: FundMonthlySlot[] = [];
    for (let i = 1; i <= 12; i++) {
      const mm = i < 10 ? `0${i}` : String(i);
      slots.push(makeSlot(`${year}-${mm}`, `${i}月`));
    }
    return slots;
  }

  // "recent" – last 12 months ending at the current month.
  if (range === "recent") {
    const now = new Date();
    const slots: FundMonthlySlot[] = [];
    for (let offset = 11; offset >= 0; offset--) {
      const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const mm = m < 10 ? `0${m}` : String(m);
      // When the window crosses a year boundary, include the year so it's
      // not ambiguous (e.g. "2025-12" vs "12月").
      const label = m === 1 || offset === 11 ? `${String(y).slice(2)}/${m}` : `${m}月`;
      slots.push(makeSlot(`${y}-${mm}`, label));
    }
    return slots;
  }

  // "all" – every month between the earliest and current month (inclusive).
  if (range === "all") {
    if (months.size === 0) return [];
    const sortedKeys = Array.from(months.keys()).sort();
    const firstKey = sortedKeys[0];
    const todayMonth = new Date().toISOString().slice(0, 7);
    const lastKey = sortedKeys[sortedKeys.length - 1] > todayMonth
      ? sortedKeys[sortedKeys.length - 1]
      : todayMonth;

    const [fy, fm] = firstKey.split("-").map((s) => parseInt(s, 10));
    const [ly, lm] = lastKey.split("-").map((s) => parseInt(s, 10));

    const slots: FundMonthlySlot[] = [];
    let y = fy;
    let m = fm;
    while (y < ly || (y === ly && m <= lm)) {
      const mm = m < 10 ? `0${m}` : String(m);
      const label = m === 1 ? `${String(y).slice(2)}/1` : `${m}月`;
      slots.push(makeSlot(`${y}-${mm}`, label));
      m++;
      if (m > 12) { m = 1; y++; }
    }
    return slots;
  }

  return [];
}

/**
 * Distribution of funds for the pie and ranking cards.
 *
 * - `netAsset` tab returns a 2-entry list (资金 vs 负债).
 * - `asset` / `liability` tabs produce either a category-aggregated list or
 *   a per-item list, depending on `granularity`:
 *     - `"category"`: every debit card collapses into a single "借记卡" entry
 *     - `"item"`: each fund account appears as its own slice
 */
export function getFundRanking(
  plugin: FundHolder,
  tab: "asset" | "liability" | "netAsset",
  granularity: "category" | "item" = "category",
  labelOf?: FundLabelFn,
): FundRankingEntry[] {
  if (tab === "netAsset") {
    const asset = getFundAssetTotal(plugin);
    const liability = getFundLiabilityTotal(plugin);
    const items: FundRankingEntry[] = [];
    if (asset > 0) items.push({ name: "资金", value: asset, color: "#60a5fa" });
    if (liability > 0) items.push({ name: "负债", value: liability, color: "#ef4444" });
    return items;
  }

  const targetType: "asset" | "liability" = tab;
  const palette = ["#60a5fa", "#4ade80", "#f59e0b", "#f472b6", "#a78bfa", "#22d3ee", "#fb7185", "#34d399"];

  if (granularity === "item") {
    // One slice per fund account, biggest first.
    const entries: Array<{ name: string; value: number }> = [];
    plugin.funds.forEach((fund) => {
      const cat = getFundCategory(fund);
      if (cat.type !== targetType) return;
      const value = getFundEffectiveAmount(fund);
      if (value <= 0) return;
      // Prefer the user-facing label (e.g. "招商银行 · 储蓄卡 ****1234").
      const name = (labelOf ? labelOf(fund) : "") || cat.name;
      entries.push({ name, value });
    });

    return entries
      .sort((a, b) => b.value - a.value)
      .map((entry, index) => ({
        name: entry.name,
        value: entry.value,
        color: palette[index % palette.length],
      }));
  }

  // 按类别聚合：同一 category 下的所有资金项合并为一条
  const categoryMap = new Map<string, { name: string; value: number }>();
  plugin.funds.forEach((fund) => {
    const cat = getFundCategory(fund);
    if (cat.type !== targetType) return;
    const value = getFundEffectiveAmount(fund);
    if (value <= 0) return;
    const entry = categoryMap.get(cat.id);
    if (entry) {
      entry.value += value;
    } else {
      categoryMap.set(cat.id, { name: cat.name, value });
    }
  });

  return Array.from(categoryMap.values())
    .sort((a, b) => b.value - a.value)
    .map((entry, index) => ({
      name: entry.name,
      value: entry.value,
      color: palette[index % palette.length],
    }));
}
