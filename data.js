/**
 * data.js — 資料載入器（改版）
 *
 * 之前這個檔案直接寫死 TEMPLE_INFO / AREAS / TOUR_ITEMS 這三個變數的內容，
 * 每次要改文字/圖片路徑都要懂 JavaScript 語法才能動。
 *
 * 現在改成：真正的資料放在 data/tour-data.json（純 JSON，格式簡單，
 * CMS 後台可以直接讀寫），這個檔案只負責在網頁載入時把 JSON 抓進來、
 * 賦值成原本 script.js 在用的那三個全域變數，其他邏輯完全不動。
 *
 * 要改導覽內容 → 改 data/tour-data.json（或直接用 /admin 後台介面）
 * 要改網站行為/排版邏輯 → 才需要動 script.js / index.html / style.css
 */

fetch("data/tour-data.json")
  .then((res) => res.json())
  .then((data) => {
    window.TEMPLE_INFO = data.templeInfo;
    window.AREAS = data.areas;
    window.TOUR_ITEMS = data.tourItems;

    // 保留原本的排序保險機制：以防 JSON 裡的順序被不小心打亂
    window.TOUR_ITEMS.sort((a, b) => a.order - b.order);

    // 資料就緒後才載入 script.js，避免它在資料還沒到位前就開始執行
    const s = document.createElement("script");
    s.src = "script.js";
    document.body.appendChild(s);
  })
  .catch((err) => {
    console.error("無法載入導覽資料 data/tour-data.json：", err);
    document.body.innerHTML =
      "<p style='padding:2rem;font-family:sans-serif;'>網站資料載入失敗，請確認 data/tour-data.json 是否存在，或稍後重新整理。</p>";
  });
