import type { FundHistoryPoint } from "@core/types";

/**
 * Insert a balance point on `date`, or overwrite the existing one for the same
 * date. Returns a new array sorted ascending by date.
 *
 * Extracted verbatim from the duplicated `FundModal.upsertHistoryPoint` /
 * `FundDetailModal.upsertHistoryPoint` private methods; keep the `crypto.randomUUID()`
 * id-generation for new entries and preserve ids for existing ones so history-
 * chart hover keys stay stable across edits.
 */
export function upsertHistoryPoint(
  history: FundHistoryPoint[],
  amount: number,
  date: string,
): FundHistoryPoint[] {
  const next = [...history];
  const index = next.findIndex((point) => point.date === date);
  const entry: FundHistoryPoint = {
    id: index >= 0 ? next[index].id : crypto.randomUUID(),
    amount,
    date,
  };

  if (index >= 0) {
    next[index] = entry;
  } else {
    next.push(entry);
  }

  return next.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Returns the history point with the latest (string-max) date, or `undefined`
 * when the history array is empty / nullish. ISO yyyy-MM-dd strings are
 * lexicographically orderable, so we avoid `new Date(...)` overhead.
 */
export function getLatestHistoryPoint(
  history: FundHistoryPoint[] | undefined | null,
): FundHistoryPoint | undefined {
  if (!history || history.length === 0) {
    return undefined;
  }
  let latest = history[0];
  for (let i = 1; i < history.length; i++) {
    if (history[i].date.localeCompare(latest.date) > 0) {
      latest = history[i];
    }
  }
  return latest;
}
