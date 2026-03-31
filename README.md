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
   ```
2. Chromeで `chrome://extensions` を開く
3. 右上の「デベロッパー モード」をONにする
4. 「パッケージ化されていない拡張機能を読み込む」をクリック
5. クローンした `jobcan-chrome-ext` ディレクトリを選択

## 動作要件

- Chrome 111以上（Manifest V3 `"world": "MAIN"` を使用）
- Jobcan勤怠管理の工数管理画面 (`https://ssl.jobcan.jp/employee/man-hour-manage`)

## ファイル構成

```
jobcan-chrome-ext/
├── manifest.json    # Chrome拡張マニフェスト (Manifest V3)
├── inject.js        # ページコンテキスト注入スクリプト (MAIN world)
│                    # - 保存ボタンのインターセプト
│                    # - 既存バリデーション (pushSave()) の呼び出し
│                    # - 「保存して次へ」ボタンの追加
├── content.js       # メインロジック (isolated world)
│                    # - AJAX保存 (fetch API)
│                    # - 保存後のDOM更新
│                    # - 連続入力（次の未入力平日を自動で開く）
├── content.css      # UIスタイル
└── icons/           # 拡張アイコン (16/48/128px)
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
