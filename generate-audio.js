#!/usr/bin/env node
/**
 * generate-audio.js
 *
 * 讀取 data.js 裡 16 篇法語全文，呼叫 Google Cloud Text-to-Speech API，
 * 產生對應的 mp3 檔案，覆蓋掉 audio/ 資料夾中的占位音檔。
 *
 * ── 使用前準備 ──────────────────────────────────────────────
 *   1. 申請 Google Cloud 帳號、建立專案、啟用 Text-to-Speech API、
 *      建立服務帳號並下載 JSON 金鑰。完整步驟見 AUDIO-TTS-GUIDE.md。
 *   2. 安裝相依套件（在這個專案資料夾內執行）：
 *        npm install
 *   3. 設定環境變數，指向你下載的金鑰檔案：
 *        macOS / Linux:   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"
 *        Windows PowerShell: $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\key.json"
 *   4. 執行：
 *        node generate-audio.js
 *
 * 這支程式總共只會呼叫 16 次 API（每篇一次），16 篇全文加總約 2.2 萬字元，
 * 遠低於 Neural2 語音每月 100 萬字元的免費額度，不會產生費用。
 *
 * 想換別的語音？先執行 `node list-voices.js` 看所有法語語音選項，
 * 再修改下面的 VOICE_NAME。
 * ──────────────────────────────────────────────────────────
 */

const fs = require("fs");
const path = require("path");
const textToSpeech = require("@google-cloud/text-to-speech");

// ---------------------------------------------------------------------
// 設定區
// ---------------------------------------------------------------------
const VOICE_NAME = "fr-FR-Neural2-C"; // 法語女聲（Neural2），音質接近 Google 翻譯朗讀
const LANGUAGE_CODE = "fr-FR";
const SPEAKING_RATE = 0.95; // 1.0 為正常語速；導覽解說稍微放慢比較適合聆聽

const DATA_JS_PATH = path.join(__dirname, "data.js");
const AUDIO_DIR = path.join(__dirname, "audio");

// ---------------------------------------------------------------------
// 讀取 data.js，取出 TOUR_ITEMS — 不需要修改 data.js 本身
// ---------------------------------------------------------------------
function loadTourItems() {
  const code = fs.readFileSync(DATA_JS_PATH, "utf8");
  // data.js 用頂層 const 宣告資料；用 Function 包一層函式範圍再 return，
  // 避免直接 eval 造成的全域作用域問題，同時完全不用修改 data.js 本身。
  const loader = new Function(code + "\nreturn { TOUR_ITEMS };");
  return loader().TOUR_ITEMS;
}

function buildSpeechText(item) {
  // 先唸標題，再唸完整內文段落，段落之間用句點留一點停頓。
  return item.title + "。 " + item.fullText.join(" ");
}

async function main() {
  const items = loadTourItems();
  const client = new textToSpeech.TextToSpeechClient();

  if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR);

  console.log("開始產生 " + items.length + " 個音檔（語音：" + VOICE_NAME + "）…\n");

  for (const item of items) {
    const text = buildSpeechText(item);
    const outPath = path.join(AUDIO_DIR, item.id + ".mp3");

    process.stdout.write("產生中：" + item.id + " — " + item.title + " ... ");

    const [response] = await client.synthesizeSpeech({
      input: { text },
      voice: { languageCode: LANGUAGE_CODE, name: VOICE_NAME },
      audioConfig: { audioEncoding: "MP3", speakingRate: SPEAKING_RATE },
    });

    fs.writeFileSync(outPath, response.audioContent, "binary");
    console.log("完成 → audio/" + item.id + ".mp3");
  }

  console.log("\n全部 " + items.length + " 個音檔已產生完成。");
  console.log("提醒：data.js 裡的 audioDuration 欄位目前還是先前的估計值。");
  console.log("如果想自動填入正確秒數，可以接著執行：node update-durations.js");
  console.log("（這一步需要本機已安裝 ffmpeg / ffprobe）。");
}

main().catch((err) => {
  console.error("\n發生錯誤：", err.message || err);
  console.error(
    "常見原因：尚未設定 GOOGLE_APPLICATION_CREDENTIALS、API 尚未啟用、" +
      "或專案尚未啟用帳單。詳見 AUDIO-TTS-GUIDE.md 的疑難排解章節。"
  );
  process.exit(1);
});
