// Service Worker - Chrome拡張のライフサイクル管理
// 現時点では最小限。将来的にポート設定のストレージ管理等を追加予定

chrome.runtime.onInstalled.addListener(() => {
  // 拡張のインストール時の初期化処理
});

export {};
