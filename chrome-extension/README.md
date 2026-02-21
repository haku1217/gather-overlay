# Chrome Extension / Console Snippet

GatherのチャットメッセージをElectron Overlayアプリに転送するChrome拡張 & コンソールスニペットです。

## Console Snippet（コンソールスニペット）

Chrome拡張をインストールせずに、DevToolsコンソールにペーストするだけで利用できます。

### 前提条件

- Gather Overlay Electronアプリが起動済みであること（`localhost:19274` でHTTPサーバーが動作）
- GatherをChromeで開いていること

### 使い方

#### 1. スニペットをビルド

```bash
cd chrome-extension
pnpm build:snippet
```

`dist-snippet/gather-overlay.js` が生成されます。

#### 2. Gatherのタブで注入

1. GatherのタブでDevToolsを開く（`F12` または `Cmd+Option+I`）
2. **Console** タブを選択
3. `dist-snippet/gather-overlay.js` の中身を全選択してコピー
4. コンソールにペーストして `Enter`

以下のログが表示されれば成功です：

```
[Gather Overlay] Snippet initialized successfully
```

#### 3. 動作確認

Gatherでチャットメッセージを送受信すると、Electronアプリのオーバーレイにメッセージが流れます。

### Chrome Snippets への登録（おすすめ）

毎回ペーストする代わりに、DevToolsの「Snippets」に保存しておくと便利です。

1. DevToolsで **Sources** タブを開く
2. 左パネルの **Snippets** を選択
3. **+ New snippet** をクリック
4. `gather-overlay.js` の中身を貼り付けて保存（`Cmd+S`）
5. 次回以降は右クリック → **Run** で実行

### 制限事項

- **ページリロードで無効化**: Gatherのページをリロードすると再注入が必要
- **タブごとに注入が必要**: 複数タブでGatherを開いている場合、使いたいタブごとに注入
- **Electronアプリが必須**: スニペット単体ではオーバーレイ表示はできない
- **自分のメッセージも検知**: 自分が送信したメッセージもオーバーレイに流れる

## 仕組み

2つのDOM監視で新着メッセージを検知します：

| 監視対象 | 検知タイミング | 用途 |
|---|---|---|
| チャンネル一覧プレビュー | 別のチャンネルにいるとき | バックグラウンドでの新着検知 |
| アクティブチャットビュー | チャットを開いているとき | リアルタイムの新着検知 |

検知したメッセージは `POST http://localhost:19274/api/messages` でElectronアプリに送信されます。

## 開発

```bash
# Chrome拡張ビルド
pnpm build

# コンソールスニペットビルド
pnpm build:snippet

# テスト
pnpm test

# 型チェック
pnpm typecheck
```
