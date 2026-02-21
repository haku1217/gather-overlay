import type { ChatMessage } from '@gather-overlay/shared';

/**
 * innerTextの行から "送信者: メッセージ" 形式の行を探す。
 * ": " (コロン+スペース) で分割し、URL中の ":" を誤検知しないようにする。
 */
function findMessageLine(lines: readonly string[]): { sender: string; message: string } | null {
  for (const line of lines) {
    const colonSpaceIndex = line.indexOf(': ');
    if (colonSpaceIndex === -1) {
      continue;
    }

    const sender = line.slice(0, colonSpaceIndex).trim();
    const message = line.slice(colonSpaceIndex + 2).trim();

    if (sender !== '' && message !== '') {
      return { sender, message };
    }
  }
  return null;
}

/**
 * チャンネルプレビュー要素のinnerTextからメッセージ情報を抽出する。
 *
 * innerTextの形式 (改行区切り):
 *   - 通常: "チャンネル名\n送信者: メッセージ\n日付"
 *   - 未読バッジ付き: "未読数\nチャンネル名\n送信者: メッセージ\n日付"
 *   - メッセージなし: "チャンネル名" (デスクチャットなど)
 */
export function parseChannelPreview(element: Element, text: string): ChatMessage | null {
  const testId = element.getAttribute('data-testid') ?? '';
  const channel = testId.replace('chat-channel-preview-', '');

  if (channel === '') {
    return null;
  }

  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');
  const result = findMessageLine(lines);

  if (result === null) {
    return null;
  }

  return {
    channel,
    sender: result.sender,
    message: result.message,
    timestamp: new Date().toISOString(),
  };
}
