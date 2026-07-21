/**
 * lang.js — V1 語言切換系統（法文／英文／中文）
 *
 * 跟 V2 的做法一致：預設語言是法文（沒有 _en/_zh 對應欄位時自動退回法文），
 * TOUR_ITEMS／TEMPLE_INFO 的多語欄位靠 tItem()/tInfo() 讀取，
 * 跟資料無關的介面固定文字（按鈕、標題、提示訊息...）集中放在 UI_STRINGS，
 * 靠 tUi() 讀取，STATIC_UI_MAP 則是「HTML 元素 id → UI_STRINGS 的 key」對照表，
 * applyStaticUiStrings() 會依照這個表，把頁面上所有寫死的靜態文字換成目前語言。
 *
 * 這個檔案要在 script.js 之前載入（不依賴 TOUR_ITEMS/TEMPLE_INFO，隨時可以先載）。
 */

const LANG_ORDER = ["fr", "en", "zh"];
const LANG_SHORT_LABEL = { fr: "FR", en: "EN", zh: "中文" };

let CURRENT_LANG = localStorage.getItem("fgs_lang") || "fr";
if (LANG_ORDER.indexOf(CURRENT_LANG) === -1) CURRENT_LANG = "fr";

function setLang(lang) {
  CURRENT_LANG = lang;
  try {
    localStorage.setItem("fgs_lang", lang);
  } catch (e) {
    /* 存不了就算了，語言至少這次瀏覽還是會切換成功 */
  }
}

/** 取得 TOUR_ITEMS 某個項目在目前語言下的欄位，中／英文缺哪個就自動退回法文 */
function tItem(item, field) {
  if (CURRENT_LANG === "zh" && item[field + "_zh"] != null) return item[field + "_zh"];
  if (CURRENT_LANG === "en" && item[field + "_en"]) return item[field + "_en"];
  return item[field];
}

/** 取得 TEMPLE_INFO 裡某個欄位在目前語言下的內容（同樣退回法文保底） */
function tInfo(field) {
  if (CURRENT_LANG === "zh" && TEMPLE_INFO[field + "_zh"] != null) return TEMPLE_INFO[field + "_zh"];
  if (CURRENT_LANG === "en" && TEMPLE_INFO[field + "_en"]) return TEMPLE_INFO[field + "_en"];
  return TEMPLE_INFO[field];
}

// 分區名稱（item.area 欄位、AREAS 陣列本身維持法文原值當 key，純粹拿來比對分組用；
// 顯示時一律透過 tArea() 換成目前語言的文字）
const AREA_LABELS = {
  "Entrée et parvis": { fr: "Entrée et parvis", en: "Entrance and Forecourt", zh: "入口與前庭" },
  "Grande salle du Bouddha": { fr: "Grande salle du Bouddha", en: "Great Buddha Hall", zh: "大雄寶殿" },
  "Salle de Ksitigarbha": { fr: "Salle de Ksitigarbha", en: "Ksitigarbha Hall", zh: "地藏殿" },
};
function tArea(area) {
  const entry = AREA_LABELS[area];
  if (!entry) return area;
  return entry[CURRENT_LANG] || entry.fr;
}

// 「所有分區」篩選鈕內部用法文字串當識別值（activeAreaFilter 的比對邏輯不能換語言），
// 顯示文字另外透過 UI_STRINGS.allAreas 翻譯
const ALL_AREAS_KEY = "Toutes les zones";

// 跟資料無關的介面固定文字：按鈕、標題、提示訊息...
const UI_STRINGS = {
  skipLink: { fr: "Aller au contenu principal", en: "Skip to main content", zh: "跳至主要內容" },
  openNavMenu: { fr: "Ouvrir le menu de navigation", en: "Open navigation menu", zh: "開啟導覽選單" },
  navVisite: { fr: "Visite", en: "Tour", zh: "參觀導覽" },
  navAudioguide: { fr: "Audioguide", en: "Audio Guide", zh: "語音導覽" },
  sommaireTitle: { fr: "Sommaire de la visite", en: "Tour contents", zh: "導覽目錄" },
  closeSommaire: { fr: "Fermer le sommaire", en: "Close contents", zh: "關閉目錄" },
  heroEyebrow: { fr: "Visite numérique", en: "Digital tour", zh: "數位導覽" },
  startTour: { fr: "Commencer la visite", en: "Start the tour", zh: "開始導覽" },
  searchAnItem: { fr: "Rechercher un objet", en: "Search for an item", zh: "搜尋文物" },
  exploreTitle: { fr: "Trois façons d'explorer", en: "Three ways to explore", zh: "三種探索方式" },
  cardVisiteTitle: { fr: "Visite complète", en: "Full tour", zh: "完整導覽" },
  cardVisiteText: {
    fr: "Toutes les fiches, zone par zone, dans l'ordre de la visite.",
    en: "All the cards, area by area, in tour order.",
    zh: "依區域順序，完整呈現所有導覽卡片。",
  },
  cardParolesTitle: { fr: "Paroles du Dharma", en: "Words of the Dharma", zh: "法語法談" },
  cardParolesText: {
    fr: "Le texte de chaque fiche, présenté pour une lecture posée.",
    en: "The text of each card, presented for unhurried reading.",
    zh: "每張卡片的完整文字，適合靜心閱讀。",
  },
  cardAudioTitle: { fr: "Audioguide", en: "Audio Guide", zh: "語音導覽" },
  cardAudioText: {
    fr: "Écoutez les commentaires, fiche par fiche ou en continu.",
    en: "Listen to the commentary, card by card or continuously.",
    zh: "逐篇聆聽或連續播放語音解說。",
  },
  featuredTitle: { fr: "Quelques points de visite", en: "A few highlights", zh: "精選導覽重點" },
  howToTitle: { fr: "Comment utiliser ce guide", en: "How to use this guide", zh: "如何使用本導覽" },
  viewCardBtn: { fr: "Voir la fiche", en: "View the card", zh: "查看詳情" },
  listenShortBtn: { fr: "▶ Écouter", en: "▶ Listen", zh: "▶ 聆聽" },

  visiteH1: { fr: "Visite du temple", en: "Temple tour", zh: "寺院導覽" },
  visiteSubtitle: {
    fr: "Faites défiler la page dans l'ordre, ou choisissez un point de visite dans le sommaire.",
    en: "Scroll through in order, or pick a stop from the contents menu.",
    zh: "可依序捲動瀏覽，或從目錄選擇特定導覽項目。",
  },
  tocOpenBtn: { fr: "Sommaire", en: "Contents", zh: "目錄" },
  allAreas: { fr: "Toutes les zones", en: "All areas", zh: "所有分區" },
  backToOverview: { fr: "Revenir au début du sommaire", en: "Back to the top of the contents", zh: "回到目錄開頭" },

  tapToEnlarge: { fr: "Touchez l'image pour l'agrandir", en: "Tap the image to enlarge", zh: "點擊圖片可放大" },
  enlargeImageLabel: { fr: "Agrandir l'image : ", en: "Enlarge the image: ", zh: "放大圖片：" },
  listenBtn: { fr: "▶ Écouter le commentaire", en: "▶ Listen to the commentary", zh: "▶ 聆聽語音解說" },
  itemSommaireBtn: { fr: "Sommaire", en: "Contents", zh: "目錄" },
  prevItem: { fr: "← Précédent", en: "← Previous", zh: "← 上一則" },
  nextItem: { fr: "Suivant →", en: "Next →", zh: "下一則 →" },
  itemsCountOne: { fr: " élément", en: " item", zh: " 則" },
  itemsCountMany: { fr: " éléments", en: " items", zh: " 則" },

  parolesH1: { fr: "Paroles du Dharma", en: "Words of the Dharma", zh: "法語法談" },
  parolesSubtitle: {
    fr: "Le texte intégral de chaque fiche, présenté pour une lecture posée et l'agrandissement du texte.",
    en: "The complete text of each card, presented for unhurried reading, with adjustable text size.",
    zh: "每張卡片的完整文字內容，適合靜心閱讀，並可放大文字。",
  },

  audioguideH1: { fr: "Audioguide", en: "Audio Guide", zh: "語音導覽" },
  audioguideSubtitle: {
    fr: "Écoutez le commentaire de chaque point de visite. La lecture ne démarre jamais automatiquement.",
    en: "Listen to the commentary for each stop. Playback never starts automatically.",
    zh: "逐一聆聽每個導覽項目的語音解說，播放不會自動開始。",
  },
  playAllBtn: { fr: "▶ Écouter toute la visite", en: "▶ Play the whole tour", zh: "▶ 播放全部導覽" },
  playItemLabel: { fr: "Lire : ", en: "Play: ", zh: "播放：" },

  aproposH1: { fr: "À propos du temple", en: "About the temple", zh: "關於本道場" },
  aproposPresentation: { fr: "Présentation", en: "Overview", zh: "簡介" },
  aproposPratique: { fr: "Informations pratiques", en: "Practical information", zh: "實用資訊" },
  aproposAttention: { fr: "À votre attention", en: "Please note", zh: "注意事項" },
  aproposContact: { fr: "Contact", en: "Contact", zh: "聯絡方式" },
  labelAddress: { fr: "Adresse", en: "Address", zh: "地址" },
  labelPhone: { fr: "Téléphone", en: "Phone", zh: "電話" },
  labelEmail: { fr: "E-mail", en: "Email", zh: "電子郵件" },
  labelWebsite: { fr: "Site web", en: "Website", zh: "網站" },

  audioDockNoItem: { fr: "Aucune fiche sélectionnée", en: "No item selected", zh: "尚未選擇項目" },
  audioDockAriaLabel: { fr: "Lecteur audio", en: "Audio player", zh: "語音播放器" },
  audioPrevLabel: { fr: "Fiche audio précédente", en: "Previous item", zh: "上一則語音" },
  audioReplayLabel: { fr: "Revenir au début", en: "Restart", zh: "重新播放" },
  audioPlayLabel: { fr: "Lecture", en: "Play", zh: "播放" },
  audioPauseLabel: { fr: "Pause", en: "Pause", zh: "暫停" },
  audioNextLabel: { fr: "Fiche audio suivante", en: "Next item", zh: "下一則語音" },
  audioSeekLabel: { fr: "Avancement de la lecture", en: "Playback progress", zh: "播放進度" },
  audioVolumeLabel: { fr: "Volume", en: "Volume", zh: "音量" },
  audioSpeedText: { fr: "Vitesse", en: "Speed", zh: "播放速度" },
  audioSpeedLabel: { fr: "Vitesse de lecture", en: "Playback speed", zh: "播放速度" },
  audioCloseLabel: { fr: "Fermer le lecteur", en: "Close player", zh: "關閉播放器" },

  backToTopLabel: { fr: "Revenir en haut de la page", en: "Back to top", zh: "回到頂端" },

  searchAriaLabel: { fr: "Recherche", en: "Search", zh: "搜尋" },
  searchPlaceholder: {
    fr: "Rechercher un objet, une zone, un mot du texte, un numéro de fiche…",
    en: "Search for an item, an area, a word, or a card number…",
    zh: "搜尋文物、分區、關鍵字或編號…",
  },
  searchCloseLabel: { fr: "Fermer la recherche", en: "Close search", zh: "關閉搜尋" },
  searchHint: {
    fr: "Tapez au moins deux lettres pour lancer la recherche.",
    en: "Type at least two letters to start searching.",
    zh: "請輸入至少兩個字開始搜尋。",
  },
  searchNoResults: { fr: "Aucun résultat pour « %s ».", en: "No results for “%s”.", zh: "沒有符合「%s」的結果。" },

  imageModalLabel: { fr: "Image agrandie", en: "Enlarged image", zh: "放大圖片" },
  imageModalCloseLabel: { fr: "Fermer l'image agrandie", en: "Close enlarged image", zh: "關閉放大圖片" },

  footerText: {
    fr: "Fo Guang Shan Genève — Guide de visite numérique. Contenu d'après les fiches d'information du temple.",
    en: "Fo Guang Shan Geneva — Digital visit guide. Content based on the temple's information cards.",
    zh: "佛光山日內瓦道場——數位導覽指南。內容取材自寺院導覽卡片。",
  },

  resumeViewing: { fr: "Vous étiez en train de consulter « %s ». ", en: "You were viewing “%s”. ", zh: "您先前正在瀏覽「%s」。" },
  resumeBtn: { fr: "Reprendre la visite", en: "Resume the tour", zh: "繼續導覽" },
};

/** 取得介面固定文字，中／英文缺哪個就自動退回法文；%s 可用 sub 帶入動態內容 */
function tUi(key, sub) {
  const entry = UI_STRINGS[key];
  if (!entry) return "";
  let text = entry[CURRENT_LANG] || entry.fr;
  if (sub != null) text = text.replace("%s", sub);
  return text;
}

// 頁面上「靜態」文字節點（不是靠 TOUR_ITEMS/TEMPLE_INFO 資料渲染出來的）跟 UI_STRINGS
// key 的對照表：{ 元素 id: [UI_STRINGS key, 'text'|'aria-label'|'title'|'placeholder'] }
// text 以外的屬性，是因為有些文字放在 aria-label／title／placeholder 而不是看得到的內文。
const STATIC_UI_MAP = [
  ["skip-link", "skipLink", "text"],
  ["hamburger-btn", "openNavMenu", "aria-label"],
  ["nav-link-visite", "navVisite", "text"],
  ["nav-link-audioguide", "navAudioguide", "text"],
  ["sidebar", "sommaireTitle", "aria-label"],
  ["sidebar-title-text", "sommaireTitle", "text"],
  ["sidebar-close-btn", "closeSommaire", "aria-label"],
  ["hero-eyebrow", "heroEyebrow", "text"],
  ["hero-start-btn", "startTour", "text"],
  ["hero-search-btn", "searchAnItem", "text"],
  ["explore-title", "exploreTitle", "text"],
  ["card-visite-title", "cardVisiteTitle", "text"],
  ["card-visite-text", "cardVisiteText", "text"],
  ["card-paroles-title", "cardParolesTitle", "text"],
  ["card-paroles-text", "cardParolesText", "text"],
  ["card-audio-title", "cardAudioTitle", "text"],
  ["card-audio-text", "cardAudioText", "text"],
  ["featured-title", "featuredTitle", "text"],
  ["howto-title", "howToTitle", "text"],

  ["visite-h1", "visiteH1", "text"],
  ["visite-subtitle", "visiteSubtitle", "text"],
  ["toc-open-btn-text", "tocOpenBtn", "text"],
  ["back-to-overview-link", "backToOverview", "text"],

  ["paroles-h1", "parolesH1", "text"],
  ["paroles-subtitle", "parolesSubtitle", "text"],

  ["audioguide-h1", "audioguideH1", "text"],
  ["audioguide-subtitle", "audioguideSubtitle", "text"],
  ["play-all-btn", "playAllBtn", "text"],

  ["apropos-h1", "aproposH1", "text"],
  ["apropos-presentation-title", "aproposPresentation", "text"],
  ["apropos-pratique-title", "aproposPratique", "text"],
  ["apropos-attention-title", "aproposAttention", "text"],
  ["apropos-contact-title", "aproposContact", "text"],

  ["audio-dock", "audioDockAriaLabel", "aria-label"],
  ["audio-dock-title", "audioDockNoItem", "text"], // 播放中的時候 playItem() 會覆寫掉，這裡只當初始值
  ["audio-prev-btn", "audioPrevLabel", "aria-label"],
  ["audio-prev-btn", "audioPrevLabel", "title"],
  ["audio-replay-btn", "audioReplayLabel", "aria-label"],
  ["audio-replay-btn", "audioReplayLabel", "title"],
  ["audio-next-btn", "audioNextLabel", "aria-label"],
  ["audio-next-btn", "audioNextLabel", "title"],
  ["audio-seek", "audioSeekLabel", "aria-label"],
  ["audio-volume", "audioVolumeLabel", "aria-label"],
  ["audio-speed-text", "audioSpeedText", "text"],
  ["audio-speed", "audioSpeedLabel", "aria-label"],
  ["audio-close-btn", "audioCloseLabel", "aria-label"],

  ["back-to-top", "backToTopLabel", "aria-label"],

  ["search-modal-panel", "searchAriaLabel", "aria-label"],
  ["search-input", "searchPlaceholder", "placeholder"],
  ["search-input", "searchAriaLabel", "aria-label"],
  ["search-close-btn", "searchCloseLabel", "aria-label"],

  ["image-modal-panel", "imageModalLabel", "aria-label"],
  ["image-modal-close", "imageModalCloseLabel", "aria-label"],

  ["site-footer-text", "footerText", "text"],
];

/** 依照 STATIC_UI_MAP，把頁面上所有跟資料無關的靜態文字換成目前語言 */
function applyStaticUiStrings() {
  STATIC_UI_MAP.forEach(([id, key, kind]) => {
    const node = document.getElementById(id);
    if (!node) return; // 有些 id 可能還沒加到 HTML 裡，防呆跳過不要整個掛掉
    const text = tUi(key);
    if (kind === "text") node.textContent = text;
    else node.setAttribute(kind, text);
  });

  // 播放按鈕的 aria-label 要依照目前是「播放中」還是「暫停中」決定，不是固定值，
  // 這裡只在切換語言的當下，依照按鈕目前顯示的符號（❚❚／▶）重新套用正確語言的文字
  const playBtn = document.getElementById("audio-play-btn");
  if (playBtn) {
    const isPlaying = playBtn.textContent.indexOf("❚") !== -1;
    playBtn.setAttribute("aria-label", isPlaying ? tUi("audioPauseLabel") : tUi("audioPlayLabel"));
  }

  // 語言按鈕本身的顯示文字（FR / EN / 中文）
  const langBtn = document.getElementById("lang-toggle-btn");
  if (langBtn) langBtn.textContent = LANG_SHORT_LABEL[CURRENT_LANG];

  document.documentElement.lang = CURRENT_LANG === "zh" ? "zh-Hant" : CURRENT_LANG;
}