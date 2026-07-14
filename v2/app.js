/**
 * app.js — v2 互動空間地圖主程式
 * 沿用 v1 的做法：純 vanilla JS，不用 bundler，靠 <script> 標籤載入順序
 * （data.js → scenes.js → app.js）拿到全域的 TOUR_ITEMS / SCENES。
 *
 * 目前階段：先把「場景移動」做扎實（開門→場景→場景之間的平滑轉場），
 * 光點跟光點互動已打開（SHOW_HOTSPOTS = true），開始校正座標。
 * 拖曳縮放（PanZoom）這階段也先不做，只留最基本的靜態圖＋出口箭頭。
 */

const SHOW_HOTSPOTS = true; // 開始調光點座標
const SHOW_DEBUG_HUD = false; // 場景動線已經測穩，關掉左下角除錯視窗

// ============================================================
// 語言切換 — 只翻譯 16 篇導覽文字本身（title / shortDescription / fullText），
// 其他一律維持法文（類別、分區、按鈕、音檔...不動），音檔本身也只有法文。
// ============================================================
let CURRENT_LANG = localStorage.getItem("fgs_lang") || "fr";

function setLang(lang) {
  CURRENT_LANG = lang;
  localStorage.setItem("fgs_lang", lang);
}

/** 取得某個導覽項目在目前語言下的欄位，沒有對應的英文欄位時自動退回法文 */
function tItem(item, field) {
  if (CURRENT_LANG === "en" && item[field + "_en"]) return item[field + "_en"];
  return item[field];
}

// 介面上固定不變的字（跟 TOUR_ITEMS/SCENES 無關的按鈕文字）
const UI_STRINGS = {
  sommaireToggle: { fr: "☰ Sommaire", en: "☰ Menu" },
  sommaireToggleLabel: { fr: "Ouvrir le sommaire de la visite", en: "Open the tour menu" },
  backBtn: { fr: "← Précédent", en: "← Back" },
  backBtnLabel: { fr: "Précédent", en: "Back" },
};
function tUi(key) {
  return UI_STRINGS[key][CURRENT_LANG] || UI_STRINGS[key].fr;
}

function debugLog(msg) {
  console.log(msg);
  if (!SHOW_DEBUG_HUD) return;
  let hud = document.getElementById("debug-hud");
  if (!hud) {
    hud = document.createElement("div");
    hud.id = "debug-hud";
    hud.style.cssText =
      "position:fixed;left:0;bottom:0;z-index:9999;background:rgba(0,0,0,0.75);color:#0f0;" +
      "font:12px monospace;padding:8px 10px;max-width:60vw;max-height:45vh;overflow-y:auto;" +
      "white-space:pre-wrap;pointer-events:none;";
    document.body.appendChild(hud);
  }
  const line = document.createElement("div");
  line.textContent = new Date().toLocaleTimeString() + "  " + msg;
  hud.appendChild(line);
  while (hud.childNodes.length > 20) hud.removeChild(hud.firstChild);
}

// ============================================================
// Transition — 場景切換動畫
// 直線前進（advance）：明顯的「往前走」感，兩張圖同步做 dolly zoom
// 轉角（branch）：先用單純淡入淡出，之後感覺不夠再調整
// ============================================================
function advanceTransition(fromEl, toEl, opts = {}) {
  const duration = opts.durationMs ?? 900;

  return new Promise((resolve) => {
    const fromImg = fromEl.querySelector(".scene-stage__image");
    const toImg = toEl.querySelector(".scene-stage__image");

    // TO 圖先預縮小一點，接著跟 FROM 圖同步放大，製造「走進去」的連續感
    toImg.style.transform = "scale(0.86)";
    toEl.style.opacity = "0";
    toEl.hidden = false;
    void toEl.offsetWidth; // 觸發 reflow，讓上面這行初始狀態先生效

    fromEl.style.transition = `opacity ${duration}ms ease-in`;
    fromImg.style.transition = `transform ${duration}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;
    toEl.style.transition = `opacity ${duration}ms ease-out`;
    toImg.style.transition = `transform ${duration}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;

    fromImg.style.transform = "scale(1.35)";
    toImg.style.transform = "scale(1)";
    toEl.style.opacity = "1";
    // FROM 淡出的時間點稍微延後一點，讓兩張圖有重疊的過渡感，不會太突兀
    setTimeout(() => { fromEl.style.opacity = "0"; }, duration * 0.35);

    setTimeout(() => {
      fromEl.hidden = true;
      fromEl.style.opacity = "1";
      fromImg.style.transform = "";
      resolve();
    }, duration);
  });
}

function branchTransition(fromEl, toEl, opts = {}) {
  const duration = opts.durationMs ?? 500;

  return new Promise((resolve) => {
    const fromImg = fromEl.querySelector(".scene-stage__image");

    fromEl.style.transition = `opacity ${duration}ms ease-in-out`;
    fromImg.style.transition = `transform ${duration}ms ease-in-out`;
    toEl.style.transition = `opacity ${duration}ms ease-in-out`;
    toEl.style.opacity = "0";
    toEl.hidden = false;
    void toEl.offsetWidth;

    fromImg.style.transform = "scale(1.08)";
    fromEl.style.opacity = "0";
    toEl.style.opacity = "1";

    setTimeout(() => {
      fromEl.hidden = true;
      fromEl.style.opacity = "1";
      fromImg.style.transform = "";
      resolve();
    }, duration);
  });
}

/** 上一步：advance 的反方向。FROM 往後縮小退出，TO 從放大狀態縮回原本大小，模擬「往後退」 */
function backTransition(fromEl, toEl, opts = {}) {
  const duration = opts.durationMs ?? 800;

  return new Promise((resolve) => {
    const fromImg = fromEl.querySelector(".scene-stage__image");
    const toImg = toEl.querySelector(".scene-stage__image");

    toImg.style.transform = "scale(1.3)"; // TO 從「比較近」的狀態開始
    toEl.style.opacity = "0";
    toEl.hidden = false;
    void toEl.offsetWidth;

    fromEl.style.transition = `opacity ${duration}ms ease-in`;
    fromImg.style.transition = `transform ${duration}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;
    toEl.style.transition = `opacity ${duration}ms ease-out`;
    toImg.style.transition = `transform ${duration}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;

    fromImg.style.transform = "scale(0.86)"; // FROM 往遠處縮小
    toImg.style.transform = "scale(1)";       // TO 退回正常大小
    toEl.style.opacity = "1";
    setTimeout(() => { fromEl.style.opacity = "0"; }, duration * 0.35);

    setTimeout(() => {
      fromEl.hidden = true;
      fromEl.style.opacity = "1";
      fromImg.style.transform = "";
      resolve();
    }, duration);
  });
}

/** 開場門的固定版本，呼叫 advanceTransition 的參數放大版 */
function playDoorTransition(doorEl, onMidpoint) {
  const duration = 1100;
  doorEl.style.transition = `opacity ${duration}ms ease-in-out, transform ${duration}ms ease-in-out`;
  doorEl.style.transform = "scale(1.2)";
  doorEl.style.opacity = "0";
  onMidpoint?.();
  return new Promise((resolve) => setTimeout(() => { doorEl.hidden = true; resolve(); }, duration));
}

// ============================================================
// SceneEngine — 狀態中樞（含通用「上一步」歷史紀錄）
// ============================================================
class SceneEngine {
  constructor() {
    this.scenesById = Object.fromEntries(SCENES.map((s) => [s.id, s]));
    this.currentSceneId = null;
    this.history = []; // 走過的路徑，goBack() 用
    this._listeners = {};
  }
  on(evt, fn) { (this._listeners[evt] ??= []).push(fn); }
  _emit(evt, payload) { (this._listeners[evt] || []).forEach((fn) => fn(payload)); }
  getScene(id) { return this.scenesById[id]; }
  getCurrentScene() { return this.scenesById[this.currentSceneId]; }
  canGoBack() { return this.history.length > 0; }

  enter() {
    this.currentSceneId = ENTRY_SCENE_ID;
    this.history = [];
    this._emit("scene:change", { scene: this.getCurrentScene(), transitionType: "advance" });
  }

  /** transitionType: "advance"（直線走位） 或 "branch"（轉角），由觸發的出口決定 */
  goTo(id, transitionType) {
    const scene = this.scenesById[id];
    if (!scene) return console.warn(`找不到場景 "${id}"`);
    this.history.push(this.currentSceneId); // 記錄離開前的場景，供上一步使用
    this.currentSceneId = id;
    this._emit("scene:change", { scene, transitionType: transitionType || "advance" });
    this._emit("history:change", { canGoBack: this.canGoBack() });
  }

  /**
   * 回到一個「已知樞紐」，並丟掉這趟支線累積的歷史（不是整段導覽的歷史都清空，
   * 只清掉「進支線之後」這一段）。用法：從 history 裡找上一次出現 toId 的位置，
   * 把那之後的全部丟掉，等於復原成「剛站上這個樞紐」當下的狀態。
   * 如果 history 裡完全沒出現過 toId（理論上不該發生），退回成普通 goTo()。
   */
  resetTo(id) {
    const scene = this.scenesById[id];
    if (!scene) return console.warn(`找不到場景 "${id}"`);
    const idx = this.history.lastIndexOf(id);
    if (idx === -1) return this.goTo(id, "branch");
    this.history = this.history.slice(0, idx);
    this.currentSceneId = id;
    this._emit("scene:change", { scene, transitionType: "branch" });
    this._emit("history:change", { canGoBack: this.canGoBack() });
  }

  /** 通用上一步：不管在哪個場景都能退回上一個走過的節點，用反方向的轉場 */
  goBack() {
    if (!this.canGoBack()) return;
    const prevId = this.history.pop();
    const scene = this.scenesById[prevId];
    this.currentSceneId = prevId;
    this._emit("scene:change", { scene, transitionType: "back" });
    this._emit("history:change", { canGoBack: this.canGoBack() });
  }
}

// ============================================================
// Hotspot — 單一光點
// ============================================================
function renderHotspot(hotspot, onClick) {
  const item = TOUR_ITEMS.find((i) => i.id === hotspot.tourItemId);
  const el = document.createElement("button");
  el.className = "hotspot";
  el.style.left = `${hotspot.x * 100}%`;
  el.style.top = `${hotspot.y * 100}%`;
  el.setAttribute("aria-label", item ? `查看：${tItem(item, "title")}` : hotspot.tourItemId);
  el.innerHTML = `<span class="hotspot-dot"></span>`;
  el.addEventListener("click", (e) => {
    e.stopPropagation();
    onClick(hotspot.tourItemId);
  });
  return el;
}

// ============================================================
// el() — 沿用 v1 script.js 的小工具，蓋 DOM 樹用
// ============================================================
function el(tag, attrs, children) {
  const node = document.createElement(tag);
  if (attrs) {
    Object.keys(attrs).forEach((key) => {
      if (key === "class") node.className = attrs[key];
      else if (key.startsWith("on") && typeof attrs[key] === "function") {
        node.addEventListener(key.slice(2), attrs[key]);
      } else {
        node.setAttribute(key, attrs[key]);
      }
    });
  }
  (children || []).forEach((child) => {
    if (child == null) return;
    node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
  });
  return node;
}

function formatTime(seconds) {
  if (!isFinite(seconds) || seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m + ":" + String(s).padStart(2, "0");
}

// ============================================================
// 圖片放大 Modal（沿用 v1 的 #image-modal 結構）
// ============================================================
function openImageModal(src, alt) {
  const modal = document.getElementById("image-modal");
  document.getElementById("image-modal-img").src = src;
  document.getElementById("image-modal-img").alt = alt || "";
  modal.hidden = false;
}
function closeImageModal() {
  const modal = document.getElementById("image-modal");
  modal.hidden = true;
  document.getElementById("image-modal-img").src = "";
}

// ============================================================
// 音檔播放器（沿用 v1 的 #audio-dock 結構與邏輯）
// ============================================================
let currentItemId = null;
const audioEl = () => document.getElementById("audio-element");

function showAudioDock() {
  document.getElementById("audio-dock").hidden = false;
  document.body.classList.add("has-audio-dock");
}
function hideAudioDock() {
  document.getElementById("audio-dock").hidden = true;
  document.body.classList.remove("has-audio-dock");
  audioEl().pause();
}
function setPlayButtonState(isPlaying) {
  const btn = document.getElementById("audio-play-btn");
  btn.textContent = isPlaying ? "❚❚" : "▶";
  btn.setAttribute("aria-label", isPlaying ? "Pause" : "Lecture");
}
function playItem(itemId) {
  const item = TOUR_ITEMS.find((i) => i.id === itemId);
  if (!item) return;
  currentItemId = itemId;
  const audio = audioEl();
  audio.src = item.audio;
  audio.playbackRate = parseFloat(document.getElementById("audio-speed").value || "1");

  document.getElementById("audio-dock-eyebrow").textContent = "N° " + item.id + " · " + item.area;
  document.getElementById("audio-dock-title").textContent = item.title;
  document.getElementById("audio-duration").textContent = formatTime(item.audioDuration);
  document.getElementById("audio-seek").value = 0;
  document.getElementById("audio-current-time").textContent = "0:00";

  showAudioDock();
  const p = audio.play();
  if (p && p.catch) p.catch(() => setPlayButtonState(false));
  setPlayButtonState(true);
}
function togglePlayPause() {
  const audio = audioEl();
  if (!currentItemId) return;
  if (audio.paused) { audio.play().catch(() => {}); setPlayButtonState(true); }
  else { audio.pause(); setPlayButtonState(false); }
}
function playRelative(offset) {
  if (!currentItemId) return;
  const idx = TOUR_ITEMS.findIndex((i) => i.id === currentItemId);
  const target = TOUR_ITEMS[idx + offset];
  if (target) playItem(target.id);
}
function initAudioPlayer() {
  const audio = audioEl();
  let isSeeking = false;

  audio.addEventListener("timeupdate", () => {
    if (isSeeking) return;
    const item = TOUR_ITEMS.find((i) => i.id === currentItemId);
    const duration = isFinite(audio.duration) ? audio.duration : (item ? item.audioDuration : 0);
    document.getElementById("audio-seek").value = String(duration ? (audio.currentTime / duration) * 100 : 0);
    document.getElementById("audio-current-time").textContent = formatTime(audio.currentTime);
  });
  audio.addEventListener("loadedmetadata", () => {
    if (isFinite(audio.duration)) document.getElementById("audio-duration").textContent = formatTime(audio.duration);
  });
  audio.addEventListener("ended", () => { setPlayButtonState(false); playRelative(1); });
  audio.addEventListener("play", () => setPlayButtonState(true));
  audio.addEventListener("pause", () => setPlayButtonState(false));

  document.getElementById("audio-play-btn").addEventListener("click", togglePlayPause);
  document.getElementById("audio-prev-btn").addEventListener("click", () => playRelative(-1));
  document.getElementById("audio-next-btn").addEventListener("click", () => playRelative(1));
  document.getElementById("audio-replay-btn").addEventListener("click", () => {
    audio.currentTime = 0;
    document.getElementById("audio-current-time").textContent = "0:00";
    document.getElementById("audio-seek").value = 0;
  });
  document.getElementById("audio-close-btn").addEventListener("click", hideAudioDock);
  document.getElementById("audio-volume").addEventListener("input", (e) => {
    audio.volume = Number(e.target.value) / 100;
  });
  document.getElementById("audio-speed").addEventListener("change", (e) => {
    audio.playbackRate = parseFloat(e.target.value);
  });
  document.getElementById("audio-seek").addEventListener("input", () => { isSeeking = true; });
  document.getElementById("audio-seek").addEventListener("change", (e) => {
    const item = TOUR_ITEMS.find((i) => i.id === currentItemId);
    const duration = isFinite(audio.duration) ? audio.duration : (item ? item.audioDuration : 0);
    audio.currentTime = (Number(e.target.value) / 100) * duration;
    isSeeking = false;
  });

  document.getElementById("image-modal-close").addEventListener("click", closeImageModal);
  document.getElementById("image-modal-backdrop").addEventListener("click", closeImageModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !document.getElementById("image-modal").hidden) closeImageModal();
  });
}

// ============================================================
// InfoPanel — 直接沿用 v1 的 tour-item 卡片結構（同一套 CSS class）
// ============================================================
function renderInfoPanel(tourItemId, onClose) {
  const item = TOUR_ITEMS.find((i) => i.id === tourItemId);
  if (!item) return null;

  const title = tItem(item, "title");
  const shortDescription = tItem(item, "shortDescription");
  const fullText = tItem(item, "fullText");

  const wrap = el("div", { class: "info-panel" }, [
    el("button", { class: "info-panel__close", "aria-label": "關閉" }, ["\u00d7"]),
    el("article", { class: "tour-item" }, [
      el("div", { class: "tour-item-head" }, [
        el("div", { class: "tour-item-media" }, [
          el(
            "button",
            { "aria-label": "Agrandir l'image : " + title, onclick: () => openImageModal(item.image, item.imageAlt) },
            [el("img", { src: item.image, alt: item.imageAlt || "" })]
          ),
          el("p", { class: "tour-item-media-caption" }, ["Touchez l'image pour l'agrandir"]),
        ]),
        el("div", { class: "tour-item-meta" }, [
          el("p", { class: "tour-item-eyebrow" }, [
            el("span", null, ["N° " + item.id]),
            el("span", { class: "sep" }, ["·"]),
            el("span", null, [item.category]),
            el("span", { class: "sep" }, ["·"]),
            el("span", null, [item.area]),
          ]),
          el("h2", { class: "tour-item-title" }, [title]),
          el("p", { class: "tour-item-short" }, [shortDescription]),
          el("div", { class: "tour-item-actions" }, [
            el("button", { class: "btn btn-primary", onclick: () => playItem(item.id) }, ["▶ Écouter le commentaire"]),
          ]),
        ]),
      ]),
      el("div", { class: "tour-item-body" }, fullText.map((para) => el("p", null, [para]))),
    ]),
  ]);

  wrap.querySelector(".info-panel__close").addEventListener("click", onClose);
  return wrap;
}

// ============================================================
// Sommaire — 側邊欄，走全 16 篇，不受地圖限制
// ============================================================
function renderSommaire(onItemClick) {
  const el = document.createElement("nav");
  el.className = "sommaire";
  AREAS.forEach((area) => {
    const group = document.createElement("div");
    group.className = "sommaire__group";
    group.innerHTML = `<h3>${area}</h3>`;
    TOUR_ITEMS.filter((i) => i.area === area).forEach((item) => {
      const btn = document.createElement("button");
      btn.className = "sommaire__item";
      btn.textContent = `${item.order}. ${tItem(item, "title")}`;
      btn.addEventListener("click", () => onItemClick(item.id));
      group.appendChild(btn);
    });
    el.appendChild(group);
  });
  return el;
}

// ============================================================
// SceneStage — 渲染目前場景的背景圖＋（先關閉的）光點＋出口
// ============================================================
class SceneStage {
  constructor(stageAEl, stageBEl, engine, onHotspotClick) {
    this.stages = [stageAEl, stageBEl];
    this.activeIndex = 0;
    this.engine = engine;
    this.onHotspotClick = onHotspotClick;

    engine.on("scene:change", ({ scene, transitionType }) => this._render(scene, transitionType));
  }

  async _render(scene, transitionType) {
    debugLog("_render → " + scene.id + "（" + transitionType + "）");
    this.currentScene = scene;
    const fromEl = this.stages[this.activeIndex];
    const toEl = this.stages[1 - this.activeIndex];

    toEl.innerHTML = "";
    const img = document.createElement("img");
    img.className = "scene-stage__image";
    img.src = scene.image;
    img.alt = tItem(scene, "label");
    toEl.appendChild(img);

    if (SHOW_HOTSPOTS) {
      scene.hotspots.forEach((h) => toEl.appendChild(renderHotspot(h, this.onHotspotClick)));
    }
    // branch 型出口如果同時有多個，垂直往上疊開，避免疊在同一個位置點不到
    let branchIndex = 0;
    scene.exits.forEach((exit) => {
      const el = this._renderExit(exit, exit.type === "branch" ? branchIndex++ : 0);
      toEl.appendChild(el);
    });

    const hasPrevious = fromEl.hidden === false && fromEl.innerHTML !== "";
    if (hasPrevious) {
      const run = transitionType === "branch" ? branchTransition
        : transitionType === "back" ? backTransition
        : advanceTransition;
      await run(fromEl, toEl);
    } else {
      toEl.hidden = false;
      toEl.style.opacity = "1";
    }
    this.activeIndex = 1 - this.activeIndex;
  }

  /** 語言切換時用：只換文字（alt、出口按鈕、光點 aria-label），不重播轉場動畫 */
  relabel() {
    if (!this.currentScene) return;
    const activeEl = this.stages[this.activeIndex];
    const img = activeEl.querySelector(".scene-stage__image");
    if (img) img.alt = tItem(this.currentScene, "label");

    const exitButtons = activeEl.querySelectorAll(".scene-exit");
    exitButtons.forEach((btn, i) => {
      const exit = this.currentScene.exits[i];
      if (!exit) return;
      btn.textContent = exit.type === "branch" ? `↗ ${tItem(exit, "label")}` : `↑ ${tItem(exit, "label")}`;
    });

    const hotspotButtons = activeEl.querySelectorAll(".hotspot");
    hotspotButtons.forEach((btn, i) => {
      const h = this.currentScene.hotspots[i];
      if (!h) return;
      const item = TOUR_ITEMS.find((it) => it.id === h.tourItemId);
      btn.setAttribute("aria-label", item ? `查看：${tItem(item, "title")}` : h.tourItemId);
    });
  }

  _renderExit(exit, branchIndex) {
    const el = document.createElement("button");
    el.className = `scene-exit scene-exit--${exit.type}`;
    el.textContent = exit.type === "branch" ? `↗ ${tItem(exit, "label")}` : `↑ ${tItem(exit, "label")}`;
    if (exit.type === "branch") {
      el.style.bottom = (24 + branchIndex * 80) + "px"; // 多個 branch 垂直往上疊開，按鈕變大了所以間距也加大，避免疊在一起
    }
    el.addEventListener("click", () => {
      debugLog("★ exit CLICK：" + exit.toSceneId + "（" + exit.type + (exit.reset ? "／reset" : "") + "）");
      if (exit.reset) this.engine.resetTo(exit.toSceneId);
      else this.engine.goTo(exit.toSceneId, exit.type);
    });
    return el;
  }
}

// ============================================================
// DoorIntro — 開場，呼叫 advanceTransition 系列的固定參數版本
// ============================================================
function mountDoorIntro(doorEl, ctaEl, engine, onDone) {
  ctaEl.addEventListener("click", async () => {
    await playDoorTransition(doorEl, () => engine.enter());
    onDone?.();
  });
}

// ============================================================
// 組裝
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  const engine = new SceneEngine();

  const stageA = document.getElementById("stage-a");
  const stageB = document.getElementById("stage-b");
  const infoPanelSlot = document.getElementById("info-panel-slot");
  const sommaireSlot = document.getElementById("sommaire-slot");
  const doorEl = document.getElementById("door-intro");
  const doorCta = document.getElementById("door-cta");
  const sommaireToggle = document.getElementById("sommaire-toggle");
  const backBtn = document.getElementById("back-btn");
  const langToggle = document.getElementById("lang-toggle");

  let openItemId = null;

  function openInfoPanel(tourItemId) {
    openItemId = tourItemId;
    infoPanelSlot.innerHTML = "";
    const panel = renderInfoPanel(tourItemId, () => { openItemId = null; infoPanelSlot.innerHTML = ""; });
    if (panel) infoPanelSlot.appendChild(panel);
  }

  function refreshSommaire() {
    sommaireSlot.innerHTML = "";
    sommaireSlot.appendChild(renderSommaire((id) => {
      openInfoPanel(id);
      sommaireSlot.classList.remove("is-open");
    }));
  }

  function applyUiStrings() {
    sommaireToggle.textContent = tUi("sommaireToggle");
    sommaireToggle.setAttribute("aria-label", tUi("sommaireToggleLabel"));
    backBtn.setAttribute("aria-label", tUi("backBtnLabel"));
    backBtn.textContent = tUi("backBtn");
  }

  const sceneStage = new SceneStage(stageA, stageB, engine, openInfoPanel);
  initAudioPlayer();

  refreshSommaire();
  applyUiStrings();

  langToggle.textContent = CURRENT_LANG === "en" ? "FR" : "EN";
  langToggle.addEventListener("click", () => {
    setLang(CURRENT_LANG === "en" ? "fr" : "en");
    langToggle.textContent = CURRENT_LANG === "en" ? "FR" : "EN";
    applyUiStrings();
    sceneStage.relabel(); // 目前這一景的出口按鈕／alt 文字換語言，不重播轉場
    refreshSommaire(); // 側邊目錄的標題要跟著換語言
    if (openItemId) openInfoPanel(openItemId); // 如果資訊卡開著，也要重新渲染成新語言
  });

  sommaireToggle.addEventListener("click", () => sommaireSlot.classList.toggle("is-open"));

  document.querySelector(".scene-viewport").addEventListener("click", () => {
    sommaireSlot.classList.remove("is-open");
  });

  backBtn.addEventListener("click", () => engine.goBack());
  engine.on("history:change", ({ canGoBack }) => { backBtn.hidden = !canGoBack; });

  mountDoorIntro(doorEl, doorCta, engine, () => {});
});
