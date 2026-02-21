# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gather Overlay — Gatherのチャットメッセージをニコニコ動画風に画面全体にオーバーレイ表示するツール。Chrome拡張がGatherのDOM変化を監視し、Electronアプリがメッセージを透過ウィンドウで流す。

## Architecture

2つのコンポーネントで構成:

### Chrome Extension (`chrome-extension/`)

- GatherのチャットDOM (`[data-testid^="chat-channel-preview-"]`) を MutationObserver で監視
- 新着検知時に `localhost:PORT` へ POST（チャンネル名・送信者・メッセージ内容）
- GatherはSendbird SDKを使用。チャンネル一覧は常にDOMに存在し、innerTextにプレビューが含まれる

### Electron App (`electron/`)

- localhost HTTPサーバーを内包し、Chrome拡張からのPOSTを受信
- `alwaysOnTop: true` + `transparent: true` の透過ウィンドウを画面全体に表示
- メッセージを右から左へニコニコ動画風に流す
  - 複数メッセージは縦位置をずらして重ならない
  - 送信者名 + メッセージ内容を表示
  - 送信者・チャンネルごとに色分け
  - 白文字・大きめフォント・ドロップシャドウ付き

### データフロー

```
Gather (Browser) → Chrome Extension (MutationObserver)
    → HTTP POST (localhost:PORT)
    → Electron Main Process (HTTP Server)
    → Electron Renderer (Overlay Window)
```

## Gather DOM Details

- チャンネル一覧（常にDOM存在）: `[data-testid^="chat-channel-preview-{チャンネル名}"]`
- メッセージ本文（アクティブチャンネルのみ）: `[data-testid="sendbird-message-view"]`
- 監視対象はチャンネル一覧のinnerText変化

## Constraints

- macOS優先、Windows対応は後回し
- 配布形式: dmg (macOS) / exe (Windows)
- Chrome拡張単体では画面全体オーバーレイ不可のためElectronと組み合わせる
