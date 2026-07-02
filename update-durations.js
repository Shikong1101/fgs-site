#!/usr/bin/env node
/**
 * update-durations.js
 *
 * 在 generate-audio.js 產生新的 mp3 之後執行這支程式：它會用 ffprobe
 * 讀出每個音檔的實際長度（秒），並自動把 data.js 裡對應項目的
 * audioDuration 估計值，改成真正的數字。
 *
 * 需要本機已安裝 ffmpeg（內含 ffprobe）：
 *   macOS：    brew install ffmpeg
 *   Windows：  choco install ffmpeg   （或從 ffmpeg.org 下載並加入 PATH）
 *   Linux：    sudo apt install ffmpeg
 *
 * 執行：
 *   node update-durations.js
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const DATA_JS_PATH = path.join(__dirname, "data.js");
const AUDIO_DIR = path.join(__dirname, "audio");

function loadTourItems() {
  const code = fs.readFileSync(DATA_JS_PATH, "utf8");
  const loader = new Function(code + "\nreturn { TOUR_ITEMS };");
  return loader().TOUR_ITEMS;
}

function checkFfprobe() {
  try {
    execSync("ffprobe -version", { stdio: "ignore" });
    return true;
  } catch (e) {
    return false;
  }
}

function getDurationSeconds(mp3Path) {
  const out = execSync(
    'ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "' +
      mp3Path +
      '"'
  ).toString();
  return Math.round(parseFloat(out.trim()));
}

function main() {
  if (!checkFfprobe()) {
    console.error(
      "找不到 ffprobe。請先安裝 ffmpeg（內含 ffprobe），詳見本檔案開頭的安裝說明。"
    );
    process.exit(1);
  }

  const items = loadTourItems();
  let content = fs.readFileSync(DATA_JS_PATH, "utf8");
  let updated = 0;

  items.forEach((item) => {
    const mp3Path = path.join(AUDIO_DIR, item.id + ".mp3");
    if (!fs.existsSync(mp3Path)) {
      console.log("跳過 " + item.id + "：找不到對應的音檔");
      return;
    }

    const seconds = getDurationSeconds(mp3Path);

    // 只替換「這個項目」區塊內的 audioDuration 數字：從這個 id 開始，
    // 找到下一個 audioDuration 欄位為止，避免不小心改到別的項目。
    const itemBlockRegex = new RegExp(
      '(id:\\s*"' + item.id + '"[\\s\\S]*?audioDuration:\\s*)\\d+'
    );
    if (itemBlockRegex.test(content)) {
      content = content.replace(itemBlockRegex, "$1" + seconds);
      console.log(item.id + " → " + seconds + " 秒");
      updated++;
    } else {
      console.log("在 data.js 裡找不到 " + item.id + " 的 audioDuration 欄位，略過");
    }
  });

  fs.writeFileSync(DATA_JS_PATH, content, "utf8");
  console.log("\n已更新 " + updated + " 筆 audioDuration，data.js 已寫回完成。");
}

main();
