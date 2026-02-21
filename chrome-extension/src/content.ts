import { createDomObserver } from './utils/dom-observer.js';
import { createActiveChatObserver } from './utils/active-chat-observer.js';
import { sendMessage } from './utils/api-client.js';
import { parseChannelPreview } from './utils/message-parser.js';
import { CONFIG } from '@gather-overlay/shared';

const CHANNEL_SELECTOR = '[data-testid^="chat-channel-preview-"]';

function handleSendError(error: unknown): void {
  // Electronが起動していない場合は静かに失敗
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return;
  }
  // eslint-disable-next-line no-console
  console.error('[Gather Overlay] Failed to send message:', error);
}

function initialize(): void {
  // 監視1: チャンネル一覧のプレビュー変化（バックグラウンド検知）
  const channelListObserver = createDomObserver({
    selector: CHANNEL_SELECTOR,
    identityAttribute: 'data-testid',
    onTextChange: (element, newText) => {
      const parsed = parseChannelPreview(element, newText);
      if (parsed === null) {
        return;
      }
      sendMessage(parsed, CONFIG.DEFAULT_PORT).catch(handleSendError);
    },
  });

  // 監視2: アクティブチャットの新着メッセージ（部屋チャット表示中の検知）
  const activeChatObserver = createActiveChatObserver({
    onNewMessage: (message) => {
      sendMessage(message, CONFIG.DEFAULT_PORT).catch(handleSendError);
    },
  });

  channelListObserver.start();
  activeChatObserver.start();
}

initialize();
