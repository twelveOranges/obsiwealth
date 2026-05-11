import type { AssetStatus, LanguageCode } from "../types";

export type TranslationKey =
  | "appTitle"
  | "home"
  | "wishlist"
  | "stats"
  | "settings"
  | "overview"
  | "totalAssets"
  | "dailyCost"
  | "perDay"
  | "all"
  | "active"
  | "sold"
  | "retired"
  | "sort"
  | "bulkEdit"
  | "bulkEditStatus"
  | "targetStatus"
  | "apply"
  | "cancel"
  | "selectedAssets"
  | "noAssetsToEdit"
  | "updated"
  | "passwordSecurity"
  | "passwordPrompt"
  | "password"
  | "enter"
  | "wrongPassword"
  | "wishlistTotal"
  | "noWishlistData"
  | "assetTotalValue"
  | "assetValueTrend"
  | "dailyCostTrend"
  | "categoryDistribution"
  | "averageUsageByCategory"
  | "totalCount"
  | "emptyChart"
  | "assetInfo"
  | "unitPrice"
  | "buyDate"
  | "category"
  | "statusInfo"
  | "status"
  | "date"
  | "soldDate"
  | "soldPrice"
  | "notFilled"
  | "used"
  | "years"
  | "months"
  | "days"
  | "deleteConfirm"
  | "edit"
  | "delete"
  | "addAsset"
  | "editAsset"
  | "icon"
  | "chooseIcon"
  | "current"
  | "name"
  | "price"
  | "retiredDate"
  | "save"
  | "inputAssetName"
  | "selectSoldDate"
  | "inputSoldPrice"
  | "soldDateBeforeBuyDate"
  | "selectRetiredDate"
  | "retiredDateBeforeBuyDate"
  | "assetUpdated"
  | "assetAdded"
  | "tech"
  | "clothes"
  | "homeCategory"
  | "other"
  | "netAssetChart"
  | "fundAssetChart"
  | "fundLiabilityChart";

const translations: Record<LanguageCode, Record<TranslationKey, string>> = {
  "zh-CN": {
    appTitle: "ObsiWealth",
    home: "主页",
    wishlist: "心愿",
    stats: "数据统计",
    settings: "设置",
    overview: "资产总览",
    totalAssets: "总资产",
    dailyCost: "日均成本",
    perDay: "天",
    all: "全部",
    active: "服役中",
    sold: "已卖出",
    retired: "已退役",
    sort: "sort",
    bulkEdit: "批量修改",
    bulkEditStatus: "批量修改状态",
    targetStatus: "目标状态",
    apply: "应用",
    cancel: "取消",
    selectedAssets: "已选资产",
    noAssetsToEdit: "没有可修改的资产",
    updated: "已更新",
    passwordSecurity: "密码与安全",
    passwordPrompt: "请输入密码进入 ObsiWealth 页面",
    password: "密码",
    enter: "进入",
    wrongPassword: "密码不正确",
    wishlistTotal: "心愿总值",
    noWishlistData: "当前还没有心愿数据",
    assetTotalValue: "资产总值",
    assetValueTrend: "资产价值趋势",
    dailyCostTrend: "日均成本趋势",
    categoryDistribution: "类型分布",
    averageUsageByCategory: "各类型平均服役时长",
    totalCount: "总件数",
    emptyChart: "暂无足够数据绘制图表",
    assetInfo: "资产信息",
    unitPrice: "单价",
    buyDate: "购买日期",
    category: "类别",
    statusInfo: "状态信息",
    status: "状态",
    date: "日期",
    soldDate: "卖出日期",
    soldPrice: "卖出价格",
    notFilled: "未填写",
    used: "已使用",
    years: "年",
    months: "月",
    days: "天",
    deleteConfirm: "删除 {name} ?",
    edit: "修改",
    delete: "删除",
    addAsset: "新增资产",
    editAsset: "编辑资产",
    icon: "图标",
    chooseIcon: "选择图标",
    current: "当前",
    name: "名称",
    price: "价格",
    retiredDate: "退役日期",
    save: "保存",
    inputAssetName: "请输入资产名称",
    selectSoldDate: "请选择卖出日期",
    inputSoldPrice: "请输入卖出价格",
    soldDateBeforeBuyDate: "卖出日期不能早于购买日期",
    selectRetiredDate: "请选择退役日期",
    retiredDateBeforeBuyDate: "退役日期不能早于购买日期",
    assetUpdated: "已更新资产",
    assetAdded: "已添加资产",
    tech: "数码",
    clothes: "服饰",
    homeCategory: "家居",
    other: "其他",
    netAssetChart: "净资金",
    fundAssetChart: "资金",
    fundLiabilityChart: "负债",
  },
  "en-US": {
    appTitle: "ObsiWealth",
    home: "Home",
    wishlist: "Wishlist",
    stats: "Stats",
    settings: "Settings",
    overview: "Asset Overview",
    totalAssets: "Total Assets",
    dailyCost: "Daily Cost",
    perDay: "day",
    all: "All",
    active: "Active",
    sold: "Sold",
    retired: "Retired",
    sort: "sort",
    bulkEdit: "Bulk Edit",
    bulkEditStatus: "Bulk Edit Status",
    targetStatus: "Target Status",
    apply: "Apply",
    cancel: "Cancel",
    selectedAssets: "Selected assets",
    noAssetsToEdit: "No assets to edit",
    updated: "Updated",
    passwordSecurity: "Password & Security",
    passwordPrompt: "Enter the password to open ObsiWealth",
    password: "Password",
    enter: "Enter",
    wrongPassword: "Incorrect password",
    wishlistTotal: "Wishlist Total",
    noWishlistData: "No wishlist data yet",
    assetTotalValue: "Asset Total Value",
    assetValueTrend: "Asset Value Trend",
    dailyCostTrend: "Daily Cost Trend",
    categoryDistribution: "Category Distribution",
    averageUsageByCategory: "Average Service Time by Category",
    totalCount: "Total Count",
    emptyChart: "Not enough data to draw the chart",
    assetInfo: "Asset Info",
    unitPrice: "Unit Price",
    buyDate: "Purchase Date",
    category: "Category",
    statusInfo: "Status Info",
    status: "Status",
    date: "Date",
    soldDate: "Sold Date",
    soldPrice: "Sold Price",
    notFilled: "Not filled",
    used: "Used",
    years: "y",
    months: "m",
    days: "d",
    deleteConfirm: "Delete {name}?",
    edit: "Edit",
    delete: "Delete",
    addAsset: "Add Asset",
    editAsset: "Edit Asset",
    icon: "Icon",
    chooseIcon: "Choose Icon",
    current: "Current",
    name: "Name",
    price: "Price",
    retiredDate: "Retired Date",
    save: "Save",
    inputAssetName: "Please enter an asset name",
    selectSoldDate: "Please select a sold date",
    inputSoldPrice: "Please enter a sold price",
    soldDateBeforeBuyDate: "Sold date cannot be earlier than purchase date",
    selectRetiredDate: "Please select a retired date",
    retiredDateBeforeBuyDate: "Retired date cannot be earlier than purchase date",
    assetUpdated: "Asset updated",
    assetAdded: "Asset added",
    tech: "Tech",
    clothes: "Clothes",
    homeCategory: "Home",
    other: "Other",
    netAssetChart: "Net Worth",
    fundAssetChart: "Assets",
    fundLiabilityChart: "Liabilities",
  },
  "ja-JP": {
    appTitle: "ObsiWealth", home: "ホーム", wishlist: "欲しい物", stats: "統計", settings: "設定", overview: "資産概要", totalAssets: "総資産", dailyCost: "日割り費用", perDay: "日", all: "すべて", active: "使用中", sold: "売却済み", retired: "退役済み", sort: "sort", bulkEdit: "一括編集", bulkEditStatus: "状態を一括変更", targetStatus: "変更先", apply: "適用", cancel: "キャンセル", selectedAssets: "選択済み資産", noAssetsToEdit: "編集できる資産がありません", updated: "更新しました", passwordSecurity: "パスワードとセキュリティ", passwordPrompt: "ObsiWealth に入るにはパスワードを入力してください", password: "パスワード", enter: "入る", wrongPassword: "パスワードが違います", wishlistTotal: "欲しい物の合計", noWishlistData: "欲しい物データはまだありません", assetTotalValue: "資産総額", assetValueTrend: "資産価値の推移", dailyCostTrend: "日割り費用の推移", categoryDistribution: "カテゴリ分布", averageUsageByCategory: "カテゴリ別平均使用期間", totalCount: "合計数", emptyChart: "グラフを描画する十分なデータがありません", assetInfo: "資産情報", unitPrice: "単価", buyDate: "購入日", category: "カテゴリ", statusInfo: "状態情報", status: "状態", date: "日付", soldDate: "売却日", soldPrice: "売却価格", notFilled: "未入力", used: "使用済み", years: "年", months: "か月", days: "日", deleteConfirm: "{name} を削除しますか？", edit: "編集", delete: "削除", addAsset: "資産を追加", editAsset: "資産を編集", icon: "アイコン", chooseIcon: "アイコンを選択", current: "現在", name: "名前", price: "価格", retiredDate: "退役日", save: "保存", inputAssetName: "資産名を入力してください", selectSoldDate: "売却日を選択してください", inputSoldPrice: "売却価格を入力してください", soldDateBeforeBuyDate: "売却日は購入日より前にできません", selectRetiredDate: "退役日を選択してください", retiredDateBeforeBuyDate: "退役日は購入日より前にできません", assetUpdated: "資産を更新しました", assetAdded: "資産を追加しました", tech: "デジタル", clothes: "衣類", homeCategory: "ホーム", other: "その他", netAssetChart: "純資産", fundAssetChart: "資産", fundLiabilityChart: "負債"
  },
  "ko-KR": {
    appTitle: "ObsiWealth", home: "홈", wishlist: "위시", stats: "통계", settings: "설정", overview: "자산 개요", totalAssets: "총자산", dailyCost: "일일 비용", perDay: "일", all: "전체", active: "사용 중", sold: "판매됨", retired: "퇴역", sort: "sort", bulkEdit: "일괄 수정", bulkEditStatus: "상태 일괄 수정", targetStatus: "대상 상태", apply: "적용", cancel: "취소", selectedAssets: "선택된 자산", noAssetsToEdit: "수정할 자산이 없습니다", updated: "업데이트됨", passwordSecurity: "비밀번호 및 보안", passwordPrompt: "ObsiWealth에 들어가려면 비밀번호를 입력하세요", password: "비밀번호", enter: "입장", wrongPassword: "비밀번호가 올바르지 않습니다", wishlistTotal: "위시 총액", noWishlistData: "아직 위시 데이터가 없습니다", assetTotalValue: "자산 총액", assetValueTrend: "자산 가치 추세", dailyCostTrend: "일일 비용 추세", categoryDistribution: "카테고리 분포", averageUsageByCategory: "카테고리별 평균 사용 기간", totalCount: "총 개수", emptyChart: "차트를 그릴 데이터가 부족합니다", assetInfo: "자산 정보", unitPrice: "단가", buyDate: "구매일", category: "카테고리", statusInfo: "상태 정보", status: "상태", date: "날짜", soldDate: "판매일", soldPrice: "판매 가격", notFilled: "미입력", used: "사용", years: "년", months: "개월", days: "일", deleteConfirm: "{name}을(를) 삭제할까요?", edit: "수정", delete: "삭제", addAsset: "자산 추가", editAsset: "자산 수정", icon: "아이콘", chooseIcon: "아이콘 선택", current: "현재", name: "이름", price: "가격", retiredDate: "퇴역일", save: "저장", inputAssetName: "자산 이름을 입력하세요", selectSoldDate: "판매일을 선택하세요", inputSoldPrice: "판매 가격을 입력하세요", soldDateBeforeBuyDate: "판매일은 구매일보다 빠를 수 없습니다", selectRetiredDate: "퇴역일을 선택하세요", retiredDateBeforeBuyDate: "퇴역일은 구매일보다 빠를 수 없습니다", assetUpdated: "자산이 업데이트되었습니다", assetAdded: "자산이 추가되었습니다", tech: "디지털", clothes: "의류", homeCategory: "홈", other: "기타", netAssetChart: "순자산", fundAssetChart: "자산", fundLiabilityChart: "부채"
  },
  "fr-FR": {
    appTitle: "ObsiWealth", home: "Accueil", wishlist: "Envies", stats: "Stats", settings: "Réglages", overview: "Aperçu des actifs", totalAssets: "Actifs totaux", dailyCost: "Coût quotidien", perDay: "jour", all: "Tout", active: "En service", sold: "Vendu", retired: "Retiré", sort: "sort", bulkEdit: "Modification groupée", bulkEditStatus: "Modifier le statut", targetStatus: "Statut cible", apply: "Appliquer", cancel: "Annuler", selectedAssets: "Actifs sélectionnés", noAssetsToEdit: "Aucun actif à modifier", updated: "Mis à jour", passwordSecurity: "Mot de passe et sécurité", passwordPrompt: "Saisissez le mot de passe pour ouvrir ObsiWealth", password: "Mot de passe", enter: "Entrer", wrongPassword: "Mot de passe incorrect", wishlistTotal: "Total des envies", noWishlistData: "Aucune donnée d'envie", assetTotalValue: "Valeur totale", assetValueTrend: "Évolution de la valeur", dailyCostTrend: "Évolution du coût quotidien", categoryDistribution: "Répartition par catégorie", averageUsageByCategory: "Durée moyenne par catégorie", totalCount: "Total", emptyChart: "Données insuffisantes pour le graphique", assetInfo: "Infos actif", unitPrice: "Prix unitaire", buyDate: "Date d'achat", category: "Catégorie", statusInfo: "Infos statut", status: "Statut", date: "Date", soldDate: "Date de vente", soldPrice: "Prix de vente", notFilled: "Non renseigné", used: "Utilisé", years: "a", months: "m", days: "j", deleteConfirm: "Supprimer {name} ?", edit: "Modifier", delete: "Supprimer", addAsset: "Ajouter un actif", editAsset: "Modifier l'actif", icon: "Icône", chooseIcon: "Choisir une icône", current: "Actuel", name: "Nom", price: "Prix", retiredDate: "Date de retrait", save: "Enregistrer", inputAssetName: "Saisissez le nom de l'actif", selectSoldDate: "Sélectionnez la date de vente", inputSoldPrice: "Saisissez le prix de vente", soldDateBeforeBuyDate: "La date de vente ne peut pas précéder l'achat", selectRetiredDate: "Sélectionnez la date de retrait", retiredDateBeforeBuyDate: "La date de retrait ne peut pas précéder l'achat", assetUpdated: "Actif mis à jour", assetAdded: "Actif ajouté", tech: "Tech", clothes: "Vêtements", homeCategory: "Maison", other: "Autre", netAssetChart: "Patrimoine net", fundAssetChart: "Actifs", fundLiabilityChart: "Passifs"
  },
  "de-DE": {
    appTitle: "ObsiWealth", home: "Start", wishlist: "Wunschliste", stats: "Statistik", settings: "Einstellungen", overview: "Asset-Übersicht", totalAssets: "Gesamtvermögen", dailyCost: "Tageskosten", perDay: "Tag", all: "Alle", active: "Aktiv", sold: "Verkauft", retired: "Ausgemustert", sort: "sort", bulkEdit: "Stapelbearbeitung", bulkEditStatus: "Status stapelweise ändern", targetStatus: "Zielstatus", apply: "Anwenden", cancel: "Abbrechen", selectedAssets: "Ausgewählte Assets", noAssetsToEdit: "Keine Assets zum Bearbeiten", updated: "Aktualisiert", passwordSecurity: "Passwort & Sicherheit", passwordPrompt: "Passwort eingeben, um ObsiWealth zu öffnen", password: "Passwort", enter: "Öffnen", wrongPassword: "Falsches Passwort", wishlistTotal: "Wunschlistenwert", noWishlistData: "Noch keine Wunschdaten", assetTotalValue: "Gesamtwert", assetValueTrend: "Wertentwicklung", dailyCostTrend: "Tageskosten-Trend", categoryDistribution: "Kategorieverteilung", averageUsageByCategory: "Durchschnittliche Nutzung nach Kategorie", totalCount: "Gesamtzahl", emptyChart: "Nicht genügend Daten für das Diagramm", assetInfo: "Asset-Info", unitPrice: "Einzelpreis", buyDate: "Kaufdatum", category: "Kategorie", statusInfo: "Statusinfo", status: "Status", date: "Datum", soldDate: "Verkaufsdatum", soldPrice: "Verkaufspreis", notFilled: "Nicht ausgefüllt", used: "Genutzt", years: "J", months: "M", days: "T", deleteConfirm: "{name} löschen?", edit: "Bearbeiten", delete: "Löschen", addAsset: "Asset hinzufügen", editAsset: "Asset bearbeiten", icon: "Icon", chooseIcon: "Icon wählen", current: "Aktuell", name: "Name", price: "Preis", retiredDate: "Ausmusterungsdatum", save: "Speichern", inputAssetName: "Asset-Namen eingeben", selectSoldDate: "Verkaufsdatum wählen", inputSoldPrice: "Verkaufspreis eingeben", soldDateBeforeBuyDate: "Verkaufsdatum darf nicht vor Kaufdatum liegen", selectRetiredDate: "Ausmusterungsdatum wählen", retiredDateBeforeBuyDate: "Ausmusterungsdatum darf nicht vor Kaufdatum liegen", assetUpdated: "Asset aktualisiert", assetAdded: "Asset hinzugefügt", tech: "Technik", clothes: "Kleidung", homeCategory: "Zuhause", other: "Sonstiges", netAssetChart: "Nettovermögen", fundAssetChart: "Vermögenswerte", fundLiabilityChart: "Verbindlichkeiten"
  },
  "es-ES": {
    appTitle: "ObsiWealth", home: "Inicio", wishlist: "Deseos", stats: "Datos", settings: "Ajustes", overview: "Resumen de activos", totalAssets: "Activos totales", dailyCost: "Coste diario", perDay: "día", all: "Todo", active: "En uso", sold: "Vendido", retired: "Retirado", sort: "sort", bulkEdit: "Edición masiva", bulkEditStatus: "Modificar estado", targetStatus: "Estado destino", apply: "Aplicar", cancel: "Cancelar", selectedAssets: "Activos seleccionados", noAssetsToEdit: "No hay activos para editar", updated: "Actualizado", passwordSecurity: "Contraseña y seguridad", passwordPrompt: "Introduce la contraseña para abrir ObsiWealth", password: "Contraseña", enter: "Entrar", wrongPassword: "Contraseña incorrecta", wishlistTotal: "Total de deseos", noWishlistData: "Aún no hay datos de deseos", assetTotalValue: "Valor total", assetValueTrend: "Tendencia de valor", dailyCostTrend: "Tendencia de coste diario", categoryDistribution: "Distribución por categoría", averageUsageByCategory: "Uso medio por categoría", totalCount: "Total", emptyChart: "No hay suficientes datos para el gráfico", assetInfo: "Información", unitPrice: "Precio unitario", buyDate: "Fecha de compra", category: "Categoría", statusInfo: "Información de estado", status: "Estado", date: "Fecha", soldDate: "Fecha de venta", soldPrice: "Precio de venta", notFilled: "Sin completar", used: "Usado", years: "a", months: "m", days: "d", deleteConfirm: "¿Eliminar {name}?", edit: "Editar", delete: "Eliminar", addAsset: "Añadir activo", editAsset: "Editar activo", icon: "Icono", chooseIcon: "Elegir icono", current: "Actual", name: "Nombre", price: "Precio", retiredDate: "Fecha de retiro", save: "Guardar", inputAssetName: "Introduce el nombre del activo", selectSoldDate: "Selecciona la fecha de venta", inputSoldPrice: "Introduce el precio de venta", soldDateBeforeBuyDate: "La venta no puede ser anterior a la compra", selectRetiredDate: "Selecciona la fecha de retiro", retiredDateBeforeBuyDate: "El retiro no puede ser anterior a la compra", assetUpdated: "Activo actualizado", assetAdded: "Activo añadido", tech: "Tecnología", clothes: "Ropa", homeCategory: "Hogar", other: "Otro", netAssetChart: "Patrimonio neto", fundAssetChart: "Activos", fundLiabilityChart: "Pasivos"
  },
};

const defaultCategoryLabelKeys: Record<string, TranslationKey> = {
  tech: "tech",
  clothes: "clothes",
  home: "homeCategory",
  other: "other",
};

export function t(language: LanguageCode, key: TranslationKey, replacements?: Record<string, string>) {
  let text = translations[language]?.[key] ?? translations["zh-CN"][key] ?? key;
  const values = replacements ?? {};

  Object.keys(values).forEach((name) => {
    text = text.replace(`{${name}}`, values[name]);
  });

  return text;
}

export function statusLabel(language: LanguageCode, status: AssetStatus) {
  return t(language, status);
}

export function defaultCategoryLabel(language: LanguageCode, id: string) {
  const key = defaultCategoryLabelKeys[id];
  return key ? t(language, key) : id;
}
