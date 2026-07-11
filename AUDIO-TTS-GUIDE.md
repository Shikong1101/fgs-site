# 產生正式語音導覽 — Google Cloud Text-to-Speech 設定指南

這份指南說明如何申請 Google Cloud 帳號、啟用 Text-to-Speech API，並執行
這個專案附帶的腳本，把 16 篇法語全文轉換成真正的語音檔案，取代目前
`audio/` 資料夾裡的占位音檔。

整個過程約 15–20 分鐘，且完全不會產生費用（詳見下方「會不會收費」）。

---

## 一、申請 Google Cloud 帳號與建立專案

1. 前往 [console.cloud.google.com](https://console.cloud.google.com)，用你的 Google
   帳號登入（沒有 Google 帳號的話先免費註冊一個）。
2. 第一次登入會被要求同意服務條款。如果想要，也可以順便輸入信用卡資訊
   申請免費試用額度（新用戶通常會有一筆一次性的免費金額可用，但**這個
   專案的用量遠低於免費的「每月固定額度」，用不用試用金額都沒差**，
   詳見下方說明）。
3. 點選頁面上方的專案選單 → 「新增專案」，取一個名字（例如
   `fgs-geneve-audioguide`），建立完成。
4. 確認頁面上方目前選取的是你剛建立的這個專案。

## 二、啟用帳單（Billing）

Google 規定即使是用免費額度，專案也必須先連結一組有效的帳單方式
（信用卡）才能呼叫付費 API，**但只要用量沒有超過免費額度，就完全不會
被扣款**。

1. 點左上角的「☰」選單 → 「帳單」。
2. 依畫面指示建立或連結一個帳單帳戶，填入信用卡資訊。
3. 建議同時設定一個「預算快訊」（Budget Alert），例如設定 1 美元的警示，
   這樣萬一不小心超出額度，會立刻收到通知信，而不是等帳單來才發現。

## 三、啟用 Text-to-Speech API

1. 直接前往
   [Text-to-Speech API 啟用頁面](https://console.cloud.google.com/apis/library/texttospeech.googleapis.com)，
   確認上方選取的是正確的專案。
2. 點選「啟用」（Enable）。等待幾秒鐘，看到啟用完成的提示即可。

## 四、建立服務帳號（Service Account）與金鑰

這是讓你電腦上的程式可以合法呼叫 API 的「身分證」。

1. 點左上角「☰」選單 → 「IAM 與管理」→「服務帳號」。
2. 點「建立服務帳號」，輸入任意名稱（例如 `tts-generator`），點繼續。
3. 在「授予這個服務帳號存取權」的角色欄位，選擇
   **「Cloud Text-to-Speech API 使用者」**（Cloud Text-to-Speech API User）。
   找不到的話，直接打「text-to-speech」搜尋。
4. 點「完成」，回到服務帳號列表，點剛建立好的帳號。
5. 切到「金鑰」分頁 → 「新增金鑰」→「建立新的金鑰」→ 選擇 **JSON** →
   「建立」。
6. 瀏覽器會自動下載一個 `.json` 檔案。**這個檔案等同你的 API 密碼，
   請妥善保管，不要上傳到 GitHub 或分享給別人**，建議直接存在這個
   專案資料夾外面（例如使用者家目錄底下）。

## 五、在電腦上設定好環境

1. 確認電腦已安裝 Node.js（18 版以上即可；終端機輸入 `node -v` 確認）。
2. 在這個專案資料夾（`fgs-site/`）裡開啟終端機，安裝相依套件：
   ```bash
   npm install
   ```
3. 設定環境變數，指向你剛剛下載的金鑰檔案路徑：

   **macOS / Linux：**
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/完整路徑/到/你的金鑰.json"
   ```

   **Windows（PowerShell）：**
   ```powershell
   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\完整路徑\到\你的金鑰.json"
   ```

   這個指令只在「目前這個終端機視窗」有效；如果關掉視窗重開，要再執行
   一次（或設成系統的永久環境變數）。

## 六、執行腳本

確認好以上設定後，依序執行：

```bash
# （可選）先看看有哪些法語語音可以選
node list-voices.js

# 產生全部 16 個正式語音檔，會覆蓋 audio/ 資料夾裡的占位音檔
node generate-audio.js

# （可選）自動把 data.js 裡的 audioDuration 估計值，改成音檔的真實秒數
# 這一步需要本機已安裝 ffmpeg（內含 ffprobe）
node update-durations.js
```

`generate-audio.js` 跑完之後，打開網站、點任一張卡片的「▶ 收聽」，
應該就能聽到正式的法語語音，而不是之前的測試音調。

### 想換別的聲音？

打開 `generate-audio.js`，找到最上面的：

```js
const VOICE_NAME = "fr-FR-Neural2-C";
```

把它換成 `node list-voices.js` 列出的任何一個名稱，存檔後重新執行
`node generate-audio.js` 即可。建議優先選名稱裡有 **Neural2** 或
**Chirp3-HD** 的語音，音質最自然；**Wavenet** 次之；**Standard** 最陽春
但免費額度最高（見下方）。

---

## 會不會收費？

不會，以這個專案的用量來說幾乎不可能超過免費額度：

| 語音等級 | 每月免費字元數 | 這個專案會用到的量 |
|---|---|---|
| Standard | 400 萬字元 / 月 | |
| WaveNet | 100 萬字元 / 月 | |
| Neural2（預設使用） | 100 萬字元 / 月 | 16 篇全文約 2.2 萬字元 |
| Chirp 3: HD | 100 萬字元 / 月 | |

16 篇法語全文加總大約 22,000 字元，只占 Neural2 免費額度的 2% 左右。
就算之後想反覆調整文字、重新生成幾十次，也完全不會碰到付費門檻。
免費額度是**每個月重新計算**的，不是一次性用完就沒了。

## 疑難排解

- **`PERMISSION_DENIED` 或認證錯誤**：先確認
  `GOOGLE_APPLICATION_CREDENTIALS` 有正確指向 JSON 金鑰檔案的「完整
  路徑」，且該路徑檔案確實存在；也確認步驟三的 API 真的已經啟用。
- **`Billing account not found` 或類似訊息**：回到步驟二，確認帳單帳戶
  已經成功連結到「目前這個專案」。
- **`update-durations.js` 顯示找不到 ffprobe**：這個腳本是選用的，沒有
  ffmpeg 也沒關係，data.js 裡的 audioDuration 只是「顯示用的估計時長」，
  播放器會在音檔載入後自動以實際長度為準，不影響網站正常使用。
- **想要重新產生某幾篇而不是全部 16 篇**：可以直接修改
  `generate-audio.js` 裡的迴圈，把 `items` 換成
  `items.filter(i => ["1-1", "3-3"].includes(i.id))` 這種寫法，只處理
  你列出的編號。
