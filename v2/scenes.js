/**
 * scenes.js — v2 場景資料（第二版，依「骨架圖.pdf」重新設計）
 *
 * 取代舊版（廣場/後院/大殿...那套），新的動線是：
 *   正門口外面 ×2
 *     → 佛堂正門口(遠) ★分岔樞紐
 *          ├─ advance 主線 → 佛堂正門口(近) → 門打開 → 近景
 *                → 佛堂外(遠/中景) → 佛堂外·觀世音(走廊)
 *                → 佛堂內(遠/中/近景) → 樓梯 → 地藏殿(沿用舊資料，這翼沒換照片)
 *          ├─ branch → 左邊 wing（left-1~left-4 過場，left-5 换成新照片後直接是達摩正面，掛光點＋回正門口）
 *          └─ branch → 右邊 wing（遠/中景 2 張 + 達摩正面照，跟左邊 left-5.jpg 是不同檔案但構圖幾乎相同）→ 停在達摩、回到樞紐
 */

const SCENES = [
  // ────────────────────────────── 正門 ──────────────────────────────
  {
    id: "gate-outside-1",
    area: "Entrée et parvis",
    label: "Devant l'entrée principale", label_en: "In front of the main entrance",
    image: "images/scenes2/gate-outside-1.jpg",
    hotspots: [
      { x: 0.5, y: 0.6, tourItemId: "1-1" }, // 中央彌勒佛石像
    ],
    exits: [{ type: "advance", toSceneId: "gate-outside-2", label: "Avancer", label_en: "Move forward" }],
  },
  {
    id: "gate-outside-2",
    area: "Entrée et parvis",
    label: "Devant l'entrée principale 2", label_en: "In front of the main entrance 2",
    image: "images/scenes2/gate-outside-2.jpg",
    hotspots: [
      { x: 0.25, y: 0.23, tourItemId: "1-2" }, // 五色旗
    ],
    exits: [{ type: "advance", toSceneId: "hall-gate-far", label: "Avancer", label_en: "Move forward" }],
  },

  // ────────────────────────────── 分岔樞紐 ──────────────────────────────
  {
    id: "hall-gate-far",
    area: "Entrée et parvis",
    label: "Porte du temple (vue éloignée, carrefour)", label_en: "Temple gate (distant view, junction)",
    image: "images/scenes2/hall-gate-far.jpg",
    hotspots: [],
    exits: [
      { type: "advance", toSceneId: "hall-gate-near", label: "Vers l'entrée", label_en: "Towards the entrance" },
      { type: "branch", toSceneId: "left-1", label: "Aile gauche", label_en: "Left wing" },
      { type: "branch", toSceneId: "right-1", label: "Aile droite", label_en: "Right wing" },
    ],
  },

  // ────────────────────────────── 主線：進入佛堂 ──────────────────────────────
  {
    id: "hall-gate-near",
    area: "Grande salle du Bouddha",
    label: "Porte du temple", label_en: "Temple gate",
    image: "images/scenes2/hall-gate-near.jpg",
    hotspots: [],
    exits: [{ type: "advance", toSceneId: "hall-gate-closeup", label: "Pousser la porte", label_en: "Push the door open" }],
  },
  {
    id: "hall-gate-closeup",
    area: "Grande salle du Bouddha",
    label: "Porte du temple (gros plan)", label_en: "Temple gate (close-up)",
    image: "images/scenes2/hall-gate-closeup.jpg",
    hotspots: [
      { x: 0.49, y: 0.73, tourItemId: "1-4" }, // BLIA 銅門標誌，再次依截圖標註微調
    ],
    exits: [{ type: "advance", toSceneId: "hall-outside-wide", label: "Avancer", label_en: "Move forward" }],
  },
  {
    id: "hall-outside-wide",
    area: "Grande salle du Bouddha",
    label: "Devant le temple (vue éloignée)", label_en: "In front of the temple (distant view)",
    image: "images/scenes2/hall-outside-wide.jpg",
    hotspots: [],
    exits: [{ type: "advance", toSceneId: "hall-outside-mid", label: "Avancer", label_en: "Move forward" }],
  },
  {
    id: "hall-outside-mid",
    area: "Grande salle du Bouddha",
    label: "Devant le temple (vue intermédiaire)", label_en: "In front of the temple (mid view)",
    image: "images/scenes2/hall-outside-mid.jpg",
    hotspots: [],
    exits: [{ type: "advance", toSceneId: "hall-outside-guanyin", label: "Avancer", label_en: "Move forward" }],
  },
  {
    id: "hall-outside-guanyin",
    area: "Grande salle du Bouddha",
    label: "Devant le temple · Avalokiteshvara (couloir)", label_en: "In front of the temple · Avalokiteshvara (corridor)",
    image: "images/scenes2/hall-outside-guanyin.jpg",
    hotspots: [
      { x: 0.49, y: 0.73, tourItemId: "2-1" }, // 走廊金色觀世音立像，已依截圖標註校正
    ],
    exits: [
      { type: "advance", toSceneId: "hall-inside-wide", label: "Entrer dans le temple", label_en: "Enter the temple" },
      { type: "branch", toSceneId: "stairs-down", label: "À gauche, descendre (Salle de Ksitigarbha)", label_en: "Turn left, go downstairs (Ksitigarbha Hall)" },
    ],
  },
  {
    id: "hall-inside-wide",
    area: "Grande salle du Bouddha",
    label: "Intérieur du temple (vue éloignée)", label_en: "Inside the temple (distant view)",
    image: "images/scenes2/hall-inside-wide.jpg",
    hotspots: [
      { x: 0.51, y: 0.43, tourItemId: "3-1" }, // 釋迦牟尼佛主尊，依紅色標註下移至胸口
      { x: 0.58, y: 0.09, tourItemId: "2-2" },  // 八正道天花板梁柱，依紅色標註微調
      { x: 0.74, y: 0.62, tourItemId: "3-5" }, // 鼓與鈴鐺，依紅色標註搬到實際鼓架位置（畫面右側）
    ],
    exits: [{ type: "advance", toSceneId: "hall-inside-mid", label: "S'approcher de l'autel", label_en: "Approach the altar" }],
  },
  {
    id: "hall-inside-mid",
    area: "Grande salle du Bouddha",
    label: "Intérieur du temple (vue intermédiaire)", label_en: "Inside the temple (mid view)",
    image: "images/scenes2/hall-inside-mid.jpg",
    hotspots: [
      { x: 0.31, y: 0.76, tourItemId: "3-3" }, // 鑼碗，從 hall-inside-near 搬過來，依截圖標註定位
      { x: 0.63, y: 0.75, tourItemId: "3-4" }, // 木魚，從 hall-inside-near 搬過來，依截圖標註定位
    ],
    exits: [{ type: "advance", toSceneId: "hall-inside-near", label: "S'approcher de l'autel", label_en: "Approach the altar" }],
  },
  {
    id: "hall-inside-near",
    area: "Grande salle du Bouddha",
    label: "Intérieur du temple (gros plan)", label_en: "Inside the temple (close-up)",
    image: "images/scenes2/hall-inside-near.jpg",
    hotspots: [
      { x: 0.26, y: 0.67, tourItemId: "3-8" }, // 伽藍菩薩，再次依紅色標註調整
      { x: 0.46, y: 0.75, tourItemId: "3-2" }, // 星雲大師，依紅色標註下移
      { x: 0.68, y: 0.6, tourItemId: "3-9" }, // 斯堪達菩薩，依紅色標註移到供桌區
    ],
    // 這裡是這條主線的底，加一顆直接回到觀世音的按鈕（跟地藏殿那顆同一套 reset 機制）
    exits: [
      { type: "branch", toSceneId: "hall-outside-guanyin", label: "Retour à Avalokiteshvara", label_en: "Back to Avalokiteshvara", reset: true },
    ],
  },

  // ────────────────────────────── 左邊 wing（獨立空間） ──────────────────────────────
  {
    id: "left-1", area: "Entrée et parvis", label: "Aile gauche 1", label_en: "Left wing 1",
    image: "images/scenes2/left-1.jpg", hotspots: [],
    exits: [{ type: "advance", toSceneId: "left-2", label: "Avancer", label_en: "Move forward" }],
  },
  {
    id: "left-2", area: "Entrée et parvis", label: "Aile gauche 2", label_en: "Left wing 2",
    image: "images/scenes2/left-2.jpg", hotspots: [],
    exits: [{ type: "advance", toSceneId: "left-3", label: "Avancer", label_en: "Move forward" }],
  },
  {
    id: "left-3", area: "Entrée et parvis", label: "Aile gauche 3", label_en: "Left wing 3",
    image: "images/scenes2/left-3.jpg", hotspots: [],
    exits: [{ type: "advance", toSceneId: "left-4", label: "Avancer", label_en: "Move forward" }],
  },
  {
    id: "left-4", area: "Entrée et parvis", label: "Aile gauche 4", label_en: "Left wing 4",
    image: "images/scenes2/left-4.jpg", hotspots: [],
    exits: [{ type: "advance", toSceneId: "left-5", label: "Avancer", label_en: "Move forward" }],
  },
  {
    id: "left-5", area: "Entrée et parvis",
    label: "Fin de l'aile gauche · Statue de Bodhidharma (vue de face)", label_en: "End of the left wing · Statue of Bodhidharma (front view)",
    image: "images/scenes2/left-5.jpg",
    hotspots: [
      { x: 0.44, y: 0.61, tourItemId: "1-3" }, // 菩提達摩銅像，跟 dharma-front.jpg 那組座標一樣先估，left-5.jpg 换成新照片後跟達摩正面照幾乎同一個取景，等截圖再微調
    ],
    exits: [{ type: "branch", toSceneId: "hall-gate-far", label: "Retour à l'entrée", label_en: "Back to the entrance", reset: true }],
  },

  // ────────────────────────────── 右邊 wing（獨立空間，遠中近＋達摩光點） ──────────────────────────────
  {
    id: "right-1", area: "Entrée et parvis", label: "Aile droite (entrée)", label_en: "Right wing (entrance)",
    image: "images/scenes2/right-1.jpg",
    hotspots: [],
    exits: [{ type: "advance", toSceneId: "right-far", label: "Avancer", label_en: "Move forward" }],
  },
  {
    id: "right-far", area: "Entrée et parvis", label: "Aile droite (vue éloignée)", label_en: "Right wing (distant view)",
    image: "images/scenes2/right-far.jpg",
    hotspots: [],
    exits: [{ type: "advance", toSceneId: "right-mid", label: "Avancer", label_en: "Move forward" }],
  },
  {
    id: "right-mid", area: "Entrée et parvis", label: "Aile droite (vue intermédiaire)", label_en: "Right wing (mid view)",
    image: "images/scenes2/right-mid.jpg", hotspots: [],
    exits: [{ type: "advance", toSceneId: "right-near", label: "Avancer", label_en: "Move forward" }],
  },
  {
    id: "right-near", area: "Entrée et parvis", label: "Fin de l'aile droite · Statue de Bodhidharma (vue de face)", label_en: "End of the right wing · Statue of Bodhidharma (front view)",
    image: "images/scenes2/dharma-front.jpg",
    hotspots: [
      { x: 0.44, y: 0.61, tourItemId: "1-3" }, // 菩提達摩銅像，跟左邊 left-5.jpg 是不同檔案但構圖幾乎一樣，座標先沿用同一組
    ],
    exits: [{ type: "branch", toSceneId: "hall-gate-far", label: "Retour à l'entrée", label_en: "Back to the entrance", reset: true }],
  },

  // ────────────────────────────── 地藏菩薩殿（沿用舊版，沒有新照片） ──────────────────────────────
  // 這一整段是單純的直線（樓梯→入口→內部），回頭完全靠通用「上一步」，
  // 不手動加「回到樓梯」之類的按鈕——手動按鈕會被記進歷史紀錄，
  // 跟「上一步」的歷史堆疊互相打架，導致按上一步跳去奇怪的地方。
  {
    id: "stairs-down",
    area: "Salle de Ksitigarbha",
    label: "Escalier (transition)", label_en: "Staircase (transition)",
    image: "images/scenes/stairs-down.jpg",
    hotspots: [],
    exits: [{ type: "advance", toSceneId: "ksitigarbha-entrance", label: "Descendre", label_en: "Go downstairs" }],
  },
  {
    id: "ksitigarbha-entrance",
    area: "Salle de Ksitigarbha",
    label: "Entrée de la salle de Ksitigarbha", label_en: "Entrance to the Ksitigarbha Hall",
    image: "images/scenes/ksitigarbha-entrance.jpg",
    hotspots: [],
    exits: [{ type: "advance", toSceneId: "ksitigarbha-hall", label: "Entrer dans le temple", label_en: "Enter the temple" }],
  },
  {
    id: "ksitigarbha-hall",
    area: "Salle de Ksitigarbha",
    label: "Intérieur de la salle de Ksitigarbha", label_en: "Inside the Ksitigarbha Hall",
    image: "images/scenes/ksitigarbha-hall.jpg",
    hotspots: [
      { x: 0.47, y: 0.57, tourItemId: "4-1" }, // 已依截圖標註校正
    ],
    exits: [
      { type: "branch", toSceneId: "hall-outside-guanyin", label: "Retour à Avalokiteshvara", label_en: "Back to Avalokiteshvara", reset: true },
    ],
  },
];

const ENTRY_SCENE_ID = "gate-outside-1";
