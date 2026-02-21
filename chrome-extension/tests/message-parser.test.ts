import { describe, it, expect } from 'vitest';
import { parseChannelPreview } from '../src/utils/message-parser.js';

function createMockElement(testId: string): Element {
  const el = document.createElement('div');
  el.setAttribute('data-testid', testId);
  return el;
}

describe('parseChannelPreview', () => {
  it('通常のチャンネルプレビューを解析できる', () => {
    const element = createMockElement('chat-channel-preview-tacoms-inc');
    const text = 'tacoms-inc\nあなた: 全体チャット投げてます？\n9/19';
    const result = parseChannelPreview(element, text);

    expect(result).toEqual({
      channel: 'tacoms-inc',
      sender: 'あなた',
      message: '全体チャット投げてます？',
      timestamp: expect.any(String),
    });
  });

  it('未読バッジ付きのプレビューを解析できる', () => {
    const element = createMockElement('chat-channel-preview-mori さんと hokazaki さん');
    const text = '2\nmori さんと hokazaki さん\nあなた: 声聞こえてますが、大丈夫です？\n9/1';
    const result = parseChannelPreview(element, text);

    expect(result).toEqual({
      channel: 'mori さんと hokazaki さん',
      sender: 'あなた',
      message: '声聞こえてますが、大丈夫です？',
      timestamp: expect.any(String),
    });
  });

  it('URL含みメッセージを正しく解析する', () => {
    const element = createMockElement('chat-channel-preview-tmine');
    const text = 'tmine\nあなた: https://next-engine.net/\n9/16';
    const result = parseChannelPreview(element, text);

    expect(result).toEqual({
      channel: 'tmine',
      sender: 'あなた',
      message: 'https://next-engine.net/',
      timestamp: expect.any(String),
    });
  });

  it('メッセージ中のコロンは本文に含まれる', () => {
    const element = createMockElement('chat-channel-preview-general');
    const text = 'general\nJohn: time is 12:30\n9/19';
    const result = parseChannelPreview(element, text);

    expect(result).toEqual({
      channel: 'general',
      sender: 'John',
      message: 'time is 12:30',
      timestamp: expect.any(String),
    });
  });

  it('メッセージなしのデスクチャットはnullを返す', () => {
    const element = createMockElement('chat-channel-preview-たかはし さんのデスク');
    const text = 'たかはし さんのデスク';
    const result = parseChannelPreview(element, text);

    expect(result).toBeNull();
  });

  it('空のチャンネル名はnullを返す', () => {
    const element = createMockElement('chat-channel-preview-');
    const text = 'general\nJohn: Hello\n9/19';
    const result = parseChannelPreview(element, text);

    expect(result).toBeNull();
  });

  it('コロン+スペースなしの行のみの場合はnullを返す', () => {
    const element = createMockElement('chat-channel-preview-general');
    const text = 'general\nno colon here\n9/19';
    const result = parseChannelPreview(element, text);

    expect(result).toBeNull();
  });

  it('送信者名が空の場合はnullを返す', () => {
    const element = createMockElement('chat-channel-preview-general');
    const text = 'general\n: Hello\n9/19';
    const result = parseChannelPreview(element, text);

    expect(result).toBeNull();
  });
});
