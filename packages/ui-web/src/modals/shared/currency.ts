/**
 * Shared currency formatter re-exported for modal callers. Keeps one canonical
 * implementation in `view/formatters.ts`; modals import this module instead of
 * duplicating the `toLocaleString` options.
 */
export { formatCurrency } from "../../view/formatters";
