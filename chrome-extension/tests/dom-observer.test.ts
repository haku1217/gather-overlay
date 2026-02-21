import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDomObserver } from '../src/utils/dom-observer.js';

describe('createDomObserver', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('start時に既存要素のテキストを記録する（コールバックは呼ばない）', () => {
    const el = document.createElement('div');
    el.setAttribute('data-testid', 'chat-channel-preview-general');
    el.textContent = 'John: Hello';
    document.body.appendChild(el);

    const onTextChange = vi.fn();
    const observer = createDomObserver({
      selector: '[data-testid^="chat-channel-preview-"]',
      onTextChange,
    });

    observer.start();
    expect(onTextChange).not.toHaveBeenCalled();
    observer.stop();
  });

  it('テキスト変化時にコールバックを呼ぶ', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-testid', 'chat-channel-preview-general');
    el.textContent = 'John: Hello';
    document.body.appendChild(el);

    const onTextChange = vi.fn();
    const observer = createDomObserver({
      selector: '[data-testid^="chat-channel-preview-"]',
      onTextChange,
    });

    observer.start();

    // テキストを変更 → MutationObserverがトリガー
    el.textContent = 'Alice: World';

    // MutationObserverは非同期で発火するので少し待つ
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onTextChange).toHaveBeenCalledWith(el, 'Alice: World');
    observer.stop();
  });

  it('stop後はコールバックを呼ばない', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-testid', 'chat-channel-preview-general');
    el.textContent = 'John: Hello';
    document.body.appendChild(el);

    const onTextChange = vi.fn();
    const observer = createDomObserver({
      selector: '[data-testid^="chat-channel-preview-"]',
      onTextChange,
    });

    observer.start();
    observer.stop();

    el.textContent = 'Alice: World';
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
      onTextChange,
    });

    observer.start();
    el.textContent = 'changed';
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onTextChange).not.toHaveBeenCalled();
    observer.stop();
  });
});
