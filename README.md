# Spritesheet Player

本機 spritesheet 播放器。選擇現成的 PNG、JPEG 或 WebP 圖片，設定欄數、列數與 FPS，即可在瀏覽器中循環預覽。

圖片只會以瀏覽器的 object URL 載入，不會上傳到伺服器，也不會被修改或保存。

## 啟動

需要 Node.js 22 或更新版本。

```powershell
npm install
npm start
```

開啟 <http://127.0.0.1:3000>。

## 使用方式

1. 選擇或拖放 spritesheet。
2. 設定欄數、列數及 FPS；總幀數自動等於欄數 × 列數，預設為 5 × 5、25 幀、12 FPS。
3. 使用播放、暫停、上一幀與下一幀控制動畫。
4. 切換「完整圖表」可查看格線及目前幀位置。
5. 使用縮放滑桿檢查角色細節。

幀的讀取順序固定為由左至右、由上而下，播放器會使用格線中的所有格子。

## 測試

```powershell
npm test
```

專案不再需要 NVIDIA API key、FFmpeg、ONNX 模型或影像處理套件。
