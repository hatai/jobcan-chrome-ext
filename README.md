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
- **保存成功トースト** — 保存完了を画面下に通知
- **保存中スピナー** — 保存中はボタンにスピナーを表示
- **エラーハンドリング** — ネットワークエラー/サーバーエラー時にモーダル内にメッセージを表示。ネットワーク例外時は自動リトライ
- **ダブルクリック防止** — 保存中はボタンを無効化

## インストール

1. このリポジトリをクローン
   ```bash
   git clone https://github.com/hatai/jobcan-chrome-ext.git
   cd jobcan-chrome-ext
   mise install
   mise run install
   ```
2. ビルド
   ```bash
   mise run build
   ```
3. Chromeで `chrome://extensions` を開く
4. 右上の「デベロッパー モード」をONにする
5. 「パッケージ化されていない拡張機能を読み込む」をクリック
6. `dist` ディレクトリを選択

## 動作要件

- Chrome 111以上（Manifest V3 `"world": "MAIN"` を使用）
- Jobcan勤怠管理の工数管理画面 (`https://ssl.jobcan.jp/employee/man-hour-manage`)

## 開発

| コマンド | 内容 |
|---------|------|
| `bun run check` | Biome で lint + format を自動修正 |
| `bun run lint` | Lint のみ |
| `bun run format` | フォーマット適用 |
| `bun run typecheck` | `tsc --noEmit` 型チェック |
| `bun run test` | Vitest 単体テスト |
| `bun run test:cov` | カバレッジ付きテスト（目標80%） |
| `bun run build` | Rolldown ビルド |
| `bun run watch` | ビルド監視 |

### テスト

ロジックは `src/lib/` に純粋関数として切り出してあり、Vitest + happy-dom で単体テストします。一覧テーブルの走査ロジックは `document` を引数注入できるため、HTML フィクスチャを組んで検証できます。カバレッジ対象は `src/lib/**`（DOM 配線層の `content.ts`/`inject.ts` は将来の E2E で担保）。

## ファイル構成

```
jobcan-chrome-ext/
├── src/
│   ├── manifest.json     # Chrome拡張マニフェスト (Manifest V3)
│   ├── global.d.ts       # ページ由来グローバルの型定義
│   ├── content.css       # UIスタイル（ボタン/エラー/トースト/スピナー）
│   ├── content.ts        # 隔離ワールドの薄いエントリ
│   ├── inject.ts         # MAINワールドの薄いエントリ
│   ├── lib/              # テスト可能な共有ロジック
│   │   ├── constants.ts  #   セレクタ/メッセージ/モード/正規表現を一元管理
│   │   ├── events.ts     #   型安全な CustomEvent ヘルパ
│   │   ├── logger.ts     #   console ラッパ
│   │   ├── time.ts       #   時間計算（純粋）
│   │   ├── table.ts      #   一覧テーブル走査（document をDI）
│   │   ├── save-result.ts#   保存レスポンス判定（純粋）
│   │   ├── fetch-retry.ts#   リトライ付き fetch
│   │   ├── toast.ts      #   トースト表示
│   │   └── *.test.ts     #   各ロジックの単体テスト
│   ├── content/          # 隔離ワールドのDOM副作用
│   │   ├── dom.ts        #   テーブル更新/ボタン状態/エラー/モーダル
│   │   └── save.ts       #   保存フローのオーケストレーション
│   └── inject/
│       └── buttons.ts    #   保存ボタン制御/バリデーション
├── icons/                # 拡張アイコン (16/48/128px)
├── dist/                 # ビルド出力 (Chrome拡張として読み込むディレクトリ)
├── biome.json            # Lint/Format 設定
├── vitest.config.ts      # テスト設定
├── rolldown.config.mjs
├── tsconfig.json
└── package.json
```

## 仕組み

```
[保存ボタンクリック]
  → inject (MAIN world): pushSave() でバリデーション実行
  → inject: CustomEvent('jce-save-validated') を発火
  → content (isolated world): fetchWithRetry() でPOST送信（リロードなし）
  → content: classifySaveResponse() で成功/失敗判定
  → content: 一覧テーブルのDOM更新 + トースト + モーダル閉じ
  → (「保存して次へ」の場合) 次の未入力平日のモーダルを開く
```

inject と content は異なるJavaScript実行コンテキストで動作し、CustomEvent（`src/lib/events.ts` の型安全ヘルパ）で通信します。inject はページのグローバル関数（`pushSave()`, `openEditWindow()`）にアクセスでき、content は fetch API で保存リクエストを送信します。エントリ（`content.ts`/`inject.ts`）は配線のみの薄い層で、ロジックは `src/lib/` に切り出して単体テスト可能にしています。
