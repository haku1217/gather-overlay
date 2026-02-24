# Gather Overlay

チャットメッセージをニコニコ動画風に画面全体にオーバーレイ表示するデスクトップアプリです。

Gatherのチャットを自動的に拾って流すChrome拡張が付属していますが、HTTPリクエストを送れるものなら何でもオーバーレイ表示できます。Slack、Discord、CI通知、自作スクリプトなど、用途は自由です。

![demo](public/demo.gif)

## インストール

### デスクトップアプリ (Electron)

1. [Releases](https://github.com/haku1217/gather-overlay/releases) から最新の `.dmg` をダウンロード
2. dmgを開いて `Gather Overlay.app` を Applications にドラッグ
3. アプリを起動するとメニューバーにトレイアイコンが表示されます

> 現在 macOS (Apple Silicon) のみ対応しています。

### Chrome拡張 (Gather連携を使う場合)

1. Chrome で `chrome://extensions` を開く
2. 「デベロッパーモード」を有効にする
3. 「パッケージ化されていない拡張機能を読み込む」から `chrome-extension/dist/` フォルダを選択
4. Gatherのタブを開くと自動で監視が始まります

## 使い方

### Gatherとの連携

デスクトップアプリとChrome拡張の両方を起動した状態でGatherを使うだけです。チャットに新着メッセージが来ると、画面上をニコニコ動画風にテキストが右から左へ流れます。

- 送信者名とメッセージ内容が表示されます
- チャンネルや送信者ごとに色分けされます
- 複数メッセージは縦位置をずらして重ならないように表示されます

### 汎用的な使い方

デスクトップアプリは `http://127.0.0.1:19274` でHTTPリクエストを受け付けています。以下の形式でPOSTすれば、どんなツールからでもオーバーレイ表示できます。

```bash
curl -X POST http://127.0.0.1:19274/api/messages \
  -H 'Content-Type: application/json' \
  -d '{
    "channel": "general",
    "sender": "Bot",
    "message": "表示したいテキスト",
    "timestamp": "2026-01-01T00:00:00Z"
  }'
```

| フィールド | 型 | 説明 |
|-----------|------|------|
| `channel` | string | チャンネル名（色分けに使用） |
| `sender` | string | 送信者名（表示・色分けに使用） |
| `message` | string | 表示するメッセージ本文 |
| `timestamp` | string | ISO 8601形式のタイムスタンプ |

レスポンス: `{"success": true}` または `{"success": false, "error": "エラー内容"}`

### コントロールウィンドウ

起動すると小さなコントロールウィンドウが表示されます。

- **ディスプレイ切替** — オーバーレイを表示するモニターを選択
- **Normal / Float** — ウィンドウモードの切り替え
  - **Float**: 常に最前面に表示される小さなフロートパネル
  - **Normal**: macOSのトラフィックライト（赤・黄・緑ボタン）付きの通常ウィンドウ
- **Quit** — アプリを終了

Normalモードで赤ボタンで閉じた場合、アプリは終了せずバックグラウンドで動作し続けます。Dockアイコンのクリックまたはトレイメニューの「Show Control」で再表示できます。

### トレイメニュー

メニューバーのトレイアイコンを右クリックすると以下の操作ができます。

- ディスプレイの切り替え
- コントロールウィンドウの再表示（Show Control）
- アプリの終了（Quit）

## ビルド（開発者向け）

```bash
# 依存インストール
pnpm install

# テスト
pnpm -r test

# 開発サーバー起動
cd electron && pnpm dev

# パッケージ作成 (dmg)
cd electron && pnpm build && pnpm package
```
