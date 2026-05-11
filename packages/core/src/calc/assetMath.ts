import type { Asset, AssetFormState, AssetStatus } from "../types";

const MS_PER_DAY = 1000 * 3600 * 24;

export function getTodayISODate() {
  return formatLocalDate(new Date());
}

export function getUsedDays(asset: Asset) {
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

export function getAssetTotalCost(asset: Asset) {
  const accessoryTotal = (asset.accessories ?? [])
    .filter((accessory) => accessory.include_total)
    .reduce((sum, accessory) => sum + accessory.price, 0);

  return asset.price + accessoryTotal;
}

export function getNetAssetCost(asset: Asset) {
  const totalCost = getAssetTotalCost(asset);

  return getAssetStatus(asset) === "sold"
    ? totalCost - (asset.lifecycle?.sold_price ?? 0)
    : totalCost;
}

export function isAssetAppreciated(asset: Asset) {
  return getAssetStatus(asset) === "sold" && getNetAssetCost(asset) < 0;
}

export function getAssetEndDate(asset: Asset) {
  const status = getAssetStatus(asset);

  if (status === "sold" && asset.lifecycle?.sold_date) {
    return parseLocalDate(asset.lifecycle.sold_date);
  }

  if (status === "retired" && asset.lifecycle?.retired_date) {
    return parseLocalDate(asset.lifecycle.retired_date);
  }

  return parseLocalDate(getTodayISODate());
}

export function getAssetEndDateValue(asset: Asset) {
  const endDate = getAssetEndDate(asset);
  return endDate ? formatLocalDate(endDate) : getTodayISODate();
}

export function getDailyCost(asset: Asset) {
  const days = getUsedDays(asset);
  const cost = getNetAssetCost(asset);

  return days > 0 ? cost / days : 0;
}

export function getDailyCostOnDate(asset: Asset, dateValue: string) {
  const buyDate = parseLocalDate(asset.buy_date);
  const date = parseLocalDate(dateValue);

  if (!buyDate || !date || buyDate.getTime() > date.getTime()) {
    return 0;
  }

  const endDate = getAssetEndDate(asset);
  const effectiveEndDate = endDate && date.getTime() > endDate.getTime() ? endDate : date;
  const days = Math.max(1, Math.floor((effectiveEndDate.getTime() - buyDate.getTime()) / MS_PER_DAY) + 1);
  const cost = endDate && date.getTime() >= endDate.getTime()
    ? getNetAssetCost(asset)
    : getAssetTotalCost(asset);

  return cost / days;
}

export function getUsageDuration(asset: Asset) {
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

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = padTwoDigits(date.getMonth() + 1);
  const day = padTwoDigits(date.getDate());

  return `${year}-${month}-${day}`;
}

function padTwoDigits(value: number) {
  return value < 10 ? `0${value}` : String(value);
}

export function parseLocalDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

export function getAssetStatus(asset: Asset): AssetStatus {
  if (asset.lifecycle?.sold) return "sold";
  if (asset.lifecycle?.retired) return "retired";
  return "active";
}

export function createAssetFormState(asset?: Asset): AssetFormState {
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
      retired_date: "",
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
    retired_date: asset.lifecycle?.retired_date ?? "",
  };
}

export function formStateToAsset(state: AssetFormState, id: string = crypto.randomUUID()): Asset {
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
      exclude_daily: state.exclude_daily,
    },
    lifecycle: {
      sold: state.sold,
      retired: state.retired,
      sold_date: state.sold_date,
      sold_price: state.sold_price,
      retired_date: state.retired_date,
    },
  };
}
