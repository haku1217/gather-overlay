import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendMessage } from '../src/utils/api-client.js';
import type { ChatMessage } from '@gather-overlay/shared';

const mockMessage: ChatMessage = {
  channel: 'general',
  sender: 'John',
  message: 'Hello',
  timestamp: '2024-01-01T00:00:00.000Z',
};

describe('sendMessage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('成功時にsuccess: trueを返す', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      }),
    );

    const result = await sendMessage(mockMessage, 19274);
    expect(result).toEqual({ success: true });

    const fetchCall = vi.mocked(fetch).mock.calls[0];
    expect(fetchCall?.[0]).toBe('http://localhost:19274/api/messages');
    expect(fetchCall?.[1]).toEqual({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockMessage),
    });
  });

  it('HTTPエラー時にerrorを返す', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      }),
    );

    const result = await sendMessage(mockMessage, 19274);
    expect(result).toEqual({
      success: false,
      error: 'HTTP 500: Internal Server Error',
    });
  });

  it('ネットワークエラー時にエラーをthrowする', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
    );

    await expect(sendMessage(mockMessage, 19274)).rejects.toThrow('Failed to fetch');
  });
});
