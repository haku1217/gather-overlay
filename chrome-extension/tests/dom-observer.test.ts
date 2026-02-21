import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDomObserver } from '../src/utils/dom-observer.js';

describe('createDomObserver', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('start時に既存要素のテキストを記録する（コールバックは呼ばない）', () => {
    const el = document.createElement('div');
    el.setAttribute('data-testid', 'chat-channel-preview-general');
    el.textContent = 'general\nJohn: Hello\n9/19';
    document.body.appendChild(el);

    const onTextChange = vi.fn();
    const observer = createDomObserver({
      selector: '[data-testid^="chat-channel-preview-"]',
      identityAttribute: 'data-testid',
      onTextChange,
    });

    observer.start();
    expect(onTextChange).not.toHaveBeenCalled();
    observer.stop();
  });

  it('テキスト変化時にコールバックを呼ぶ', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-testid', 'chat-channel-preview-general');
    el.textContent = 'general\nJohn: Hello\n9/19';
    document.body.appendChild(el);

    const onTextChange = vi.fn();
    const observer = createDomObserver({
      selector: '[data-testid^="chat-channel-preview-"]',
      identityAttribute: 'data-testid',
      onTextChange,
    });

    observer.start();

    el.textContent = 'general\nAlice: World\n9/20';

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onTextChange).toHaveBeenCalledWith(el, expect.any(String));
    expect(onTextChange).toHaveBeenCalledTimes(1);
    observer.stop();
  });

  it('stop後はコールバックを呼ばない', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-testid', 'chat-channel-preview-general');
    el.textContent = 'general\nJohn: Hello\n9/19';
    document.body.appendChild(el);

    const onTextChange = vi.fn();
    const observer = createDomObserver({
      selector: '[data-testid^="chat-channel-preview-"]',
      identityAttribute: 'data-testid',
      onTextChange,
    });

    observer.start();
    observer.stop();

    el.textContent = 'general\nAlice: World\n9/20';
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onTextChange).not.toHaveBeenCalled();
  });

  it('セレクタに一致しない要素の変更は無視する', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-testid', 'other-element');
    el.textContent = 'initial';
    document.body.appendChild(el);

    const onTextChange = vi.fn();
    const observer = createDomObserver({
      selector: '[data-testid^="chat-channel-preview-"]',
      identityAttribute: 'data-testid',
      onTextChange,
    });

    observer.start();
    el.textContent = 'changed';
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onTextChange).not.toHaveBeenCalled();
    observer.stop();
  });

  it('DOM要素が再生成されても同じidentityなら変化を検知する', async () => {
    // 初期要素を作成
    const el1 = document.createElement('div');
    el1.setAttribute('data-testid', 'chat-channel-preview-room');
    el1.textContent = 'room\nAlice: Hello\n9/19';
    document.body.appendChild(el1);

    const onTextChange = vi.fn();
    const observer = createDomObserver({
      selector: '[data-testid^="chat-channel-preview-"]',
      identityAttribute: 'data-testid',
      onTextChange,
    });

    observer.start();

    // 元の要素を削除し、同じidentityの新しい要素を追加（画面遷移を模擬）
    document.body.removeChild(el1);
    const el2 = document.createElement('div');
    el2.setAttribute('data-testid', 'chat-channel-preview-room');
    el2.textContent = 'room\nBob: New message!\n9/20';
    document.body.appendChild(el2);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onTextChange).toHaveBeenCalledTimes(1);
    expect(onTextChange).toHaveBeenCalledWith(el2, expect.any(String));
    observer.stop();
  });
});
