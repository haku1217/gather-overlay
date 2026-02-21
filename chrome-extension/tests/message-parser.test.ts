import { describe, it, expect } from 'vitest';
import { parseChannelPreview } from '../src/utils/message-parser.js';

function createMockElement(testId: string): Element {
  const el = document.createElement('div');
  el.setAttribute('data-testid', testId);
  return el;
}

describe('parseChannelPreview', () => {
  it('正常なメッセージを解析できる', () => {
    const element = createMockElement('chat-channel-preview-general');
    const result = parseChannelPreview(element, 'John: Hello world');

    expect(result).toEqual({
      channel: 'general',
      sender: 'John',
      message: 'Hello world',
      timestamp: expect.any(String),
    });
  });

  it('自分の送信メッセージはnullを返す', () => {
    const element = createMockElement('chat-channel-preview-general');
    const result = parseChannelPreview(element, 'あなた: テストメッセージ');

    expect(result).toBeNull();
  });

  it('コロンを含まないテキストはnullを返す', () => {
    const element = createMockElement('chat-channel-preview-general');
    const result = parseChannelPreview(element, 'invalid text');

    expect(result).toBeNull();
  });

  it('空のチャンネル名はnullを返す', () => {
    const element = createMockElement('chat-channel-preview-');
    const result = parseChannelPreview(element, 'John: Hello');

    expect(result).toBeNull();
  });

  it('空のメッセージはnullを返す', () => {
    const element = createMockElement('chat-channel-preview-general');
    const result = parseChannelPreview(element, 'John:  ');

    // trim後に空文字列になるため null
    expect(result).toBeNull();
  });

  it('空の送信者名はnullを返す', () => {
    const element = createMockElement('chat-channel-preview-general');
    const result = parseChannelPreview(element, ': Hello');

    expect(result).toBeNull();
  });

  it('メッセージ中のコロンは2つ目以降が本文に含まれる', () => {
    const element = createMockElement('chat-channel-preview-general');
    const result = parseChannelPreview(element, 'John: time is 12:30');

    expect(result).toEqual({
      channel: 'general',
      sender: 'John',
      message: 'time is 12:30',
      timestamp: expect.any(String),
    });
  });
});
