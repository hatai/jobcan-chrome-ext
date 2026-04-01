# Jobcan 工数入力改善 Chrome拡張

Jobcanの工数入力画面 (`/employee/man-hour-manage`) のUXを改善するChrome拡張機能です。

## 解決する問題

| 問題 | 原因 | 解決方法 |
|------|------|----------|
| 別月の工数を保存すると当月に戻る | 保存がフォームsubmitでフルリロードされる | fetch APIによるAJAX保存に置き換え |
| 保存のたびにページがリロードされる | 同上 | 同上 |
| 保存のたびにスクロール位置がリセットされる | フルリロードの副作用 | リロードしないため自然に解決 |

## 追加機能

- **「保存して次へ」ボタン** — 保存後、次の未入力平日のモーダルを自動で開く
- **エラーハンドリング** — ネットワークエラー/サーバーエラー時にモーダル内にメッセージを表示
- **ダブルクリック防止** — 保存中はボタンを無効化

## インストール

1. このリポジトリをクローン
   ```bash
   git clone https://github.com/hatai/jobcan-chrome-ext.git
   cd jobcan-chrome-ext
   ```
2. ビルド
   ```bash
   npm install
   npm run build
   ```
3. Chromeで `chrome://extensions` を開く
4. 右上の「デベロッパー モード」をONにする
5. 「パッケージ化されていない拡張機能を読み込む」をクリック
6. `dist` ディレクトリを選択

## 動作要件

- Chrome 111以上（Manifest V3 `"world": "MAIN"` を使用）
- Jobcan勤怠管理の工数管理画面 (`https://ssl.jobcan.jp/employee/man-hour-manage`)

## ファイル構成

```
jobcan-chrome-ext/
├── src/
│   ├── global.d.ts    # TypeScript グローバル型定義
│   ├── inject.ts      # ページコンテキスト注入スクリプト (MAIN world)
│   ├── content.ts     # メインロジック (isolated world)
│   ├── content.css    # UIスタイル
│   └── manifest.json  # Chrome拡張マニフェスト (Manifest V3)
├── icons/             # 拡張アイコン (16/48/128px)
├── dist/              # ビルド出力 (Chrome拡張として読み込むディレクトリ)
├── rolldown.config.mjs
├── tsconfig.json
└── package.json
```

## 仕組み

```
[保存ボタンクリック]
  → inject.js: pushSave() でバリデーション実行
  → inject.js: CustomEvent('jce-save-validated') を発火
  → content.js: fetch() でPOST送信（リロードなし）
  → content.js: レスポンス解析 → 成功/失敗判定
  → content.js: 一覧テーブルのDOM更新 + モーダル閉じ
  → (「保存して次へ」の場合) 次の未入力平日のモーダルを開く
```

inject.js と content.js は異なるJavaScript実行コンテキストで動作し、CustomEventで通信します。inject.js はページのグローバル関数（`pushSave()`, `openEditWindow()`）にアクセスでき、content.js はfetch APIで保存リクエストを送信します。
