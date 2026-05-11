import type { SortDirection, SortField } from "../calc/sortTypes";

export type AssetCategory = string;
export type AssetStatus = "active" | "sold" | "retired";
export type CurrencyCode = "CNY" | "USD" | "EUR" | "JPY" | "GBP" | "HKD" | "TWD";
export type DecimalPreference = 0 | 1 | 2;
export type DurationDisplayMode = "date" | "days";
export type LanguageCode = "zh-CN" | "en-US" | "ja-JP" | "ko-KR" | "fr-FR" | "de-DE" | "es-ES";
export type ThemeMode = "system" | "light" | "dark";
export type DefaultCardColumns = 1 | 2 | 3 | 4;

export type StatusColorSettings = Record<AssetStatus, string>;
export type CurrencyOption = {
  code: CurrencyCode;
  symbol: string;
  name: string;
};

export type CategoryOption = {
  id: string;
  name: string;
};

export type LanguageOption = {
  code: LanguageCode;
  name: string;
};

export type ObsiWealthSettings = {
  currencyCode: CurrencyCode;
  currencySymbol: string;
  statusColors: StatusColorSettings;
  decimalPlaces: DecimalPreference;
  useThousandsSeparator: boolean;
  durationDisplayMode: DurationDisplayMode;
  defaultCardColumns: DefaultCardColumns;
  defaultSortField: SortField;
  defaultSortDirection: SortDirection;
  categories: CategoryOption[];
  language: LanguageCode;
  passwordEnabled: boolean;
  password: string;
  themeMode: ThemeMode;
  idleWatermarkEnabled: boolean;
  idleWatermarkTimeoutSec: number;
  showChartDots: boolean;
  /**
   * Default output resolution (in pixels, square) for newly uploaded
   * custom icons. Must be one of the {@link CUSTOM_ICON_SIZE_STEPS}.
   */
  customIconDefaultSize: number;
};

/** Allowed output resolutions for the custom-icon cropper slider. */
export const CUSTOM_ICON_SIZE_STEPS: readonly number[] = [96, 128, 192, 256, 384, 512];

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: "CNY", symbol: "¥", name: "人民币" },
  { code: "USD", symbol: "$", name: "美元" },
  { code: "EUR", symbol: "€", name: "欧元" },
  { code: "JPY", symbol: "¥", name: "日元" },
  { code: "GBP", symbol: "£", name: "英镑" },
  { code: "HKD", symbol: "HK$", name: "港币" },
  { code: "TWD", symbol: "NT$", name: "新台币" },
];

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "zh-CN", name: "简体中文" },
  { code: "en-US", name: "English" },
  { code: "ja-JP", name: "日本語" },
  { code: "ko-KR", name: "한국어" },
  { code: "fr-FR", name: "Français" },
  { code: "de-DE", name: "Deutsch" },
  { code: "es-ES", name: "Español" },
];

export const DEFAULT_CATEGORIES: CategoryOption[] = [
  { id: "tech", name: "数码" },
  { id: "clothes", name: "服饰" },
  { id: "home", name: "家居" },
  { id: "other", name: "其他" },
];

export const DEFAULT_SETTINGS: ObsiWealthSettings = {
  currencyCode: "CNY",
  currencySymbol: "¥",
  statusColors: {
    active: "#60a5fa",
    retired: "#a3a3a3",
    sold: "#4ade80",
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
  customIconDefaultSize: 256,
};

export type AssetFlags = {
  exclude_total: boolean;
  exclude_daily: boolean;
};

export type AssetLifecycle = {
  sold: boolean;
  retired: boolean;
  sold_date?: string;
  sold_price?: number;
  retired_date?: string;
};

export type AssetAccessory = {
  id: string;
  icon: string;
  name: string;
  price: number;
  buy_date: string;
  include_total: boolean;
};

export type Asset = {
  id: string;
  icon: string;
  name: string;
  price: number;
  buy_date: string;
  category: AssetCategory;
  flags: AssetFlags;
  lifecycle: AssetLifecycle;
  accessories?: AssetAccessory[];
};

export type WishlistPrice = {
  id: string;
  price: number;
  date: string;
};

export type WishlistItem = {
  id: string;
  icon: string;
  name: string;
  priceHistory: WishlistPrice[];
  accessories?: AssetAccessory[];
};

export type FundHistoryPoint = {
  id: string;
  amount: number;
  date: string;
};

export type FundCategoryType = "asset" | "liability";

export type FundCategory = {
  id: string;
  name: string;
  type: FundCategoryType;
  examples: string;
};

export const FUND_CATEGORIES: FundCategory[] = [
  { id: "cash", name: "现金", type: "asset", examples: "" },
  { id: "debit_card", name: "借记卡", type: "asset", examples: "" },
  { id: "credit_card", name: "信用卡", type: "liability", examples: "信用卡/蚂蚁花呗/京东白条" },
  { id: "virtual_account", name: "虚拟账户", type: "asset", examples: "微信/支付宝" },
  { id: "investment", name: "投资账户", type: "asset", examples: "股票/基金/P2P" },
  { id: "liability", name: "负债", type: "liability", examples: "贷款/借入" },
  { id: "claim", name: "债权", type: "asset", examples: "应收/借出" },
  { id: "social_security", name: "五险一金", type: "asset", examples: "社保/公积金" },
  { id: "custom_asset", name: "自定义资产", type: "asset", examples: "" },
];

export const DEFAULT_FUND_CATEGORY_ID = "custom_asset";

export type FundCategoryId = typeof FUND_CATEGORIES[number]["id"];

export type FundItem = {
  id: string;
  name: string;
  amount: number;
  date: string;
  category?: FundCategoryId;
  history?: FundHistoryPoint[];
  bank?: string;
  card_number?: string;
  remark?: string;
  /** 五险一金条目：参保城市（仅在 category === "social_security" 时使用）。 */
  city?: string;
  /** 用户自定义图标：可为内置图标 id，也可为本地图片裁剪后的 dataURL */
  icon?: string;
};

export const COMMON_BANKS: string[] = [
  "工商银行",
  "建设银行",
  "农业银行",
  "中国银行",
  "招商银行",
  "交通银行",
  "邮储银行",
  "浦发银行",
  "中信银行",
  "民生银行",
  "光大银行",
  "兴业银行",
  "平安银行",
  "华夏银行",
  "广发银行",
  "北京银行",
  "宁波银行",
  "河南农村信用社",
  "其他",
];

// 常见虚拟账户（新增虚拟账户时走下拉选择，与银行卡一致）
export const COMMON_VIRTUAL_ACCOUNTS: string[] = [
  "支付宝",
  "微信",
  "其他",
];

// 常见负债（新增负债时走下拉选择，与银行卡一致）
export const COMMON_LIABILITIES: string[] = [
  "贷款",
  "借入",
  "其他",
];

// 信用卡发卡机构下拉：标准银行之外，追加"蚂蚁花呗 / 京东白条"这类信贷消费类账户
export const COMMON_CREDIT_CARD_ISSUERS: string[] = [
  ...COMMON_BANKS.filter((b) => b !== "其他"),
  "蚂蚁花呗",
  "京东白条",
  "其他",
];

// 常见投资账户子类（新增投资账户时走下拉选择，逻辑同虚拟账户 / 负债）
export const COMMON_INVESTMENTS: string[] = [
  "股票",
  "基金",
  "其他",
];

// 五险一金常见子项（住房公积金 / 医疗保险 / 其他社保项）
export const COMMON_SOCIAL_SECURITY: string[] = [
  "住房公积金",
  "医疗保险",
  "养老保险",
  "失业保险",
  "工伤保险",
  "生育保险",
  "其他",
];

export type AssetFormState = {
  icon: string;
  name: string;
  price: number;
  buy_date: string;
  category: AssetCategory;
  accessories: AssetAccessory[];
  exclude_total: boolean;
  exclude_daily: boolean;
  sold: boolean;
  retired: boolean;
  sold_date: string;
  sold_price: number;
  retired_date: string;
};

export type IconDefinition = {
  id: string;
  name: string;
  src: string;
};
