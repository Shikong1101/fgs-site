#!/usr/bin/env node
/**
 * list-voices.js
 *
 * 列出 Google Cloud Text-to-Speech 所有的法語（fr-FR）語音選項，
 * 方便你挑選喜歡的聲音，再把選好的語音名稱填進 generate-audio.js
 * 裡的 VOICE_NAME。
 *
 * 執行前準備與 generate-audio.js 相同（需要先設定好
 * GOOGLE_APPLICATION_CREDENTIALS）。
 *
 * 執行：
 *   node list-voices.js
 */

const textToSpeech = require("@google-cloud/text-to-speech");

async function main() {
  const client = new textToSpeech.TextToSpeechClient();
  const [result] = await client.listVoices({ languageCode: "fr-FR" });

  const voices = result.voices.sort((a, b) => a.name.localeCompare(b.name));

  console.log("找到 " + voices.length + " 個法語語音：\n");
  console.log(
    pad("名稱 (VOICE_NAME)", 28) + pad("性別", 8) + "取樣率"
  );
  console.log("-".repeat(50));
  voices.forEach((v) => {
    console.log(
      pad(v.name, 28) + pad(v.ssmlGender, 8) + v.naturalSampleRateHertz + " Hz"
    );
  });

  console.log(
    "\n提示：名稱裡有 Neural2 或 Chirp3-HD 的音質最自然；" +
      "Wavenet 次之；Standard 最陽春但完全免費額度最高。"
  );
}

function pad(str, len) {
  str = String(str);
  return str + " ".repeat(Math.max(0, len - str.length));
}

main().catch((err) => console.error("發生錯誤：", err.message || err));
