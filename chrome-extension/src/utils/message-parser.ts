import type { ChatMessage } from '@gather-overlay/shared';

const SELF_PREFIX = 'あなた:';

/**
 * チャンネルプレビュー要素のinnerTextからメッセージ情報を抽出する。
 * 自分の送信メッセージの場合は null を返す。
 */
export function parseChannelPreview(element: Element, text: string): ChatMessage | null {
  // data-testid="chat-channel-preview-{チャンネル名}" からチャンネル名を抽出
  const testId = element.getAttribute('data-testid') ?? '';
  const channel = testId.replace('chat-channel-preview-', '');

  if (channel === '') {
    return null;
  }

  // innerTextの形式: "送信者名: メッセージ内容" (Gatherのプレビュー形式)
  const colonIndex = text.indexOf(':');
  if (colonIndex === -1) {
    return null;
  }

  const sender = text.slice(0, colonIndex).trim();
  const message = text.slice(colonIndex + 1).trim();

  // 自分の送信は除外
  if (text.startsWith(SELF_PREFIX)) {
    return null;
  }

  if (sender === '' || message === '') {
    return null;
  }

  return {
    channel,
    sender,
    message,
    timestamp: new Date().toISOString(),
  };
}
