import { createDomObserver } from './utils/dom-observer.js';
import { sendMessage } from './utils/api-client.js';
import { parseChannelPreview } from './utils/message-parser.js';
import { CONFIG } from '@gather-overlay/shared';

const CHANNEL_SELECTOR = '[data-testid^="chat-channel-preview-"]';

function initialize(): void {
  const observer = createDomObserver({
    selector: CHANNEL_SELECTOR,
    onTextChange: (element, newText) => {
      const parsed = parseChannelPreview(element, newText);
      if (parsed === null) {
        return;
      }
      sendMessage(parsed, CONFIG.DEFAULT_PORT).catch((error: unknown) => {
        // Electronが起動していない場合は静かに失敗
        if (error instanceof TypeError && error.message.includes('fetch')) {
          return;
        }
        // eslint-disable-next-line no-console
        console.error('[Gather Overlay] Failed to send message:', error);
      });
    },
  });

  observer.start();
}

initialize();
