import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createActiveChatObserver } from '../src/utils/active-chat-observer.js';
import type { ChatMessage } from '@gather-overlay/shared';

function createMessageView(sender: string, time: string, message: string): HTMLElement {
  const view = document.createElement('div');
  view.setAttribute('data-testid', 'sendbird-message-view');

  const middle = document.createElement('div');
  middle.setAttribute('data-testid', 'sendbird-message-content__middle');

  const senderDiv = document.createElement('div');
  senderDiv.textContent = sender;
  const timeDiv = document.createElement('div');
  timeDiv.textContent = time;
  const msgDiv = document.createElement('div');
  msgDiv.textContent = message;

  middle.appendChild(senderDiv);
  middle.appendChild(timeDiv);
  middle.appendChild(msgDiv);
  view.appendChild(middle);

  return view;
}

/** グループ化されたメッセージ（送信者名・時刻なし、本文のみ） */
function createGroupedMessageView(message: string): HTMLElement {
  const view = document.createElement('div');
  view.setAttribute('data-testid', 'sendbird-message-view');

  const middle = document.createElement('div');
  middle.setAttribute('data-testid', 'sendbird-message-content__middle');

  const msgDiv = document.createElement('div');
  msgDiv.textContent = message;

  middle.appendChild(msgDiv);
  view.appendChild(middle);

  return view;
}

function createChatTab(roomName: string): HTMLElement {
  const tab = document.createElement('div');
  tab.setAttribute('data-testid', 'chat-tab');

  const header = document.createElement('div');
  header.textContent = roomName;
  tab.appendChild(header);

  return tab;
}

describe('createActiveChatObserver', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('start時は既存メッセージを記録するのみ（コールバックは呼ばない）', () => {
    const chatTab = createChatTab('Test Room');
    document.body.appendChild(chatTab);

    const msg = createMessageView('Alice', '11:00', 'Hello');
    document.body.appendChild(msg);

    const onNewMessage = vi.fn();
    const observer = createActiveChatObserver({ onNewMessage });
    observer.start();

    expect(onNewMessage).not.toHaveBeenCalled();
    observer.stop();
  });

  it('新しいメッセージが追加されたらコールバックを呼ぶ', async () => {
    const chatTab = createChatTab('Test Room');
    document.body.appendChild(chatTab);

    const msg1 = createMessageView('Alice', '11:00', 'First');
    document.body.appendChild(msg1);

    const onNewMessage = vi.fn();
    const observer = createActiveChatObserver({ onNewMessage });
    observer.start();

    // 新しいメッセージを追加
    const msg2 = createMessageView('Bob', '11:01', 'Second');
    document.body.appendChild(msg2);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onNewMessage).toHaveBeenCalledTimes(1);
    expect(onNewMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'Test Room',
        sender: 'Bob',
        message: 'Second',
      }),
    );
    observer.stop();
  });

  it('メッセージビューが0のとき（チャンネル一覧表示中）はスキップ', async () => {
    const onNewMessage = vi.fn();
    const observer = createActiveChatObserver({ onNewMessage });
    observer.start();

    // メッセージビューなしでDOM変更
    const div = document.createElement('div');
    document.body.appendChild(div);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onNewMessage).not.toHaveBeenCalled();
    observer.stop();
  });

  it('stop後はコールバックを呼ばない', async () => {
    const chatTab = createChatTab('Test Room');
    document.body.appendChild(chatTab);

    const msg1 = createMessageView('Alice', '11:00', 'First');
    document.body.appendChild(msg1);

    const onNewMessage = vi.fn();
    const observer = createActiveChatObserver({ onNewMessage });
    observer.start();
    observer.stop();

    const msg2 = createMessageView('Bob', '11:01', 'Second');
    document.body.appendChild(msg2);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onNewMessage).not.toHaveBeenCalled();
  });

  it('グループ化されたメッセージ（送信者なし）も検知する', async () => {
    const chatTab = createChatTab('Test Room');
    document.body.appendChild(chatTab);

    const msg1 = createMessageView('Alice', '11:00', 'First');
    document.body.appendChild(msg1);

    const onNewMessage = vi.fn();
    const observer = createActiveChatObserver({ onNewMessage });
    observer.start();

    // グループ化されたメッセージ（送信者名・時刻なし）
    const msg2 = createGroupedMessageView('Second grouped');
    document.body.appendChild(msg2);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onNewMessage).toHaveBeenCalledTimes(1);
    expect(onNewMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'Test Room',
        sender: 'Alice',
        message: 'Second grouped',
      }),
    );
    observer.stop();
  });

  it('連続グループ化メッセージを全て検知する', async () => {
    const chatTab = createChatTab('Test Room');
    document.body.appendChild(chatTab);

    const msg1 = createMessageView('Alice', '11:00', 'First');
    document.body.appendChild(msg1);

    const onNewMessage = vi.fn();
    const observer = createActiveChatObserver({ onNewMessage });
    observer.start();

    // 2通のグループ化メッセージを同時に追加
    const msg2 = createGroupedMessageView('Second');
    const msg3 = createGroupedMessageView('Third');
    document.body.appendChild(msg2);
    document.body.appendChild(msg3);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onNewMessage).toHaveBeenCalledTimes(2);
    expect(onNewMessage).toHaveBeenCalledWith(
      expect.objectContaining({ sender: 'Alice', message: 'Second' }),
    );
    expect(onNewMessage).toHaveBeenCalledWith(
      expect.objectContaining({ sender: 'Alice', message: 'Third' }),
    );
    observer.stop();
  });

  it('ルーム名が取得できない場合はスキップ', async () => {
    // chat-tab なし
    const msg1 = createMessageView('Alice', '11:00', 'First');
    document.body.appendChild(msg1);

    const onNewMessage = vi.fn();
    const observer = createActiveChatObserver({ onNewMessage });
    observer.start();

    const msg2 = createMessageView('Bob', '11:01', 'Second');
    document.body.appendChild(msg2);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onNewMessage).not.toHaveBeenCalled();
    observer.stop();
  });
});
