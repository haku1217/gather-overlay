import type { ChatMessage } from '@gather-overlay/shared';

interface ActiveChatObserverOptions {
  readonly onNewMessage: (message: ChatMessage) => void;
}

interface ActiveChatObserverHandle {
  readonly start: () => void;
  readonly stop: () => void;
}

const MESSAGE_VIEW_SELECTOR = '[data-testid="sendbird-message-view"]';
const CHAT_TAB_SELECTOR = '[data-testid="chat-tab"]';

/**
 * sendbird-message-content__middle からテキスト行を取得する。
 */
function getMiddleLines(element: Element): readonly string[] {
  const middle = element.querySelector('[data-testid="sendbird-message-content__middle"]');
  if (middle === null) {
    return [];
  }
  return (middle as HTMLElement).innerText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l !== '');
}

/**
 * 直前の sendbird-message-view 要素をたどって送信者名を取得する。
 * Sendbirdは同一送信者の連続メッセージをグループ化し、
 * 2通目以降はメッセージ本文のみ（送信者名・時刻なし）になる。
 */
function findSenderFromPreviousSibling(element: Element): string | null {
  let current = element.previousElementSibling;
  while (current !== null) {
    if (current.matches(MESSAGE_VIEW_SELECTOR)) {
      const lines = getMiddleLines(current);
      if (lines.length >= 3) {
        return lines[0] !== '' ? lines[0] : null;
      }
    }
    current = current.previousElementSibling;
  }
  return null;
}

/**
 * アクティブチャットの innerText から送信者とメッセージを抽出する。
 *
 * sendbird-message-content__middle の innerText 形式:
 *   通常: "送信者名\n時刻\nメッセージ本文"
 *   グループ化: "メッセージ本文" (送信者名・時刻なし)
 */
function parseMessageView(element: Element): { sender: string; message: string } | null {
  const lines = getMiddleLines(element);

  if (lines.length === 0) {
    return null;
  }

  // 3行以上: 通常メッセージ (送信者, 時刻, 本文)
  if (lines.length >= 3) {
    const sender = lines[0];
    const message = lines.slice(2).join('\n');
    if (sender === '' || message === '') {
      return null;
    }
    return { sender, message };
  }

  // 1-2行: グループ化されたメッセージ (本文のみ)
  // 直前のメッセージから送信者名を取得
  const sender = findSenderFromPreviousSibling(element);
  if (sender === null) {
    return null;
  }

  const message = lines.join('\n');
  if (message === '') {
    return null;
  }

  return { sender, message };
}

/**
 * 現在のチャットルーム名を取得する。
 * chat-tab の最初の子要素のテキストから取得。
 */
function getCurrentRoomName(): string {
  const chatTab = document.querySelector(CHAT_TAB_SELECTOR);
  if (chatTab === null) {
    return '';
  }

  const firstChild = chatTab.firstElementChild;
  if (firstChild === null) {
    return '';
  }

  // ヘッダーの最初の行がルーム名
  const text = (firstChild as HTMLElement).innerText ?? '';
  const firstLine = text.split('\n')[0]?.trim() ?? '';
  return firstLine;
}

/**
 * アクティブチャット（部屋のチャットビュー）の新着メッセージを監視する。
 *
 * sendbird-message-view 要素の数を追跡し、増加した分を新着として処理する。
 */
export function createActiveChatObserver(
  options: ActiveChatObserverOptions,
): ActiveChatObserverHandle {
  const { onNewMessage } = options;
  let previousMessageCount = 0;
  let observer: MutationObserver | null = null;

  function checkMessages(): void {
    const messageViews = document.querySelectorAll(MESSAGE_VIEW_SELECTOR);
    const currentCount = messageViews.length;

    if (currentCount === 0) {
      // チャンネル一覧表示中 → メッセージビューなし
      previousMessageCount = 0;
      return;
    }

    if (previousMessageCount === 0) {
      // 初回 or 部屋に入った直後 → 記録のみ
      previousMessageCount = currentCount;
      return;
    }

    if (currentCount > previousMessageCount) {
      const channel = getCurrentRoomName();
      if (channel === '') {
        previousMessageCount = currentCount;
        return;
      }

      // 新着分のメッセージを処理
      const newMessages = Array.from(messageViews).slice(previousMessageCount);
      for (const msgEl of newMessages) {
        const parsed = parseMessageView(msgEl);
        if (parsed !== null) {
          onNewMessage({
            channel,
            sender: parsed.sender,
            message: parsed.message,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    previousMessageCount = currentCount;
  }

  function start(): void {
    checkMessages();

    observer = new MutationObserver(() => {
      checkMessages();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  function stop(): void {
    observer?.disconnect();
    observer = null;
    previousMessageCount = 0;
  }

  return { start, stop };
}
