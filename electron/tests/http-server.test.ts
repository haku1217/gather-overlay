import { describe, it, expect, afterEach } from 'vitest';
import { createHttpServer } from '../src/main/http-server.js';
import type { ChatMessage } from '@gather-overlay/shared';

describe('createHttpServer', () => {
  const TEST_PORT = 19999;
  let stopServer: (() => void) | null = null;

  afterEach(() => {
    stopServer?.();
    stopServer = null;
  });

  it('有効なメッセージを受信できる', async () => {
    const received: ChatMessage[] = [];
    const server = createHttpServer(TEST_PORT, (msg) => {
      received.push(msg);
    });
    server.start();
    stopServer = () => server.stop();

    // サーバーが起動するまで少し待つ
    await new Promise((resolve) => setTimeout(resolve, 50));

    const response = await fetch(`http://localhost:${String(TEST_PORT)}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: 'general',
        sender: 'John',
        message: 'Hello',
        timestamp: new Date().toISOString(),
      }),
    });

    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(received).toHaveLength(1);
    expect(received[0]?.sender).toBe('John');
  });

  it('不正なJSONを拒否する', async () => {
    const server = createHttpServer(TEST_PORT, () => {});
    server.start();
    stopServer = () => server.stop();

    await new Promise((resolve) => setTimeout(resolve, 50));

    const response = await fetch(`http://localhost:${String(TEST_PORT)}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json',
    });

    expect(response.status).toBe(400);
  });

  it('バリデーションエラーを返す', async () => {
    const server = createHttpServer(TEST_PORT, () => {});
    server.start();
    stopServer = () => server.stop();

    await new Promise((resolve) => setTimeout(resolve, 50));

    const response = await fetch(`http://localhost:${String(TEST_PORT)}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel: '', sender: '', message: '' }),
    });

    expect(response.status).toBe(400);
  });

  it('存在しないエンドポイントは404を返す', async () => {
    const server = createHttpServer(TEST_PORT, () => {});
    server.start();
    stopServer = () => server.stop();

    await new Promise((resolve) => setTimeout(resolve, 50));

    const response = await fetch(`http://localhost:${String(TEST_PORT)}/api/unknown`, {
      method: 'POST',
    });

    expect(response.status).toBe(404);
  });

  it('CORSプリフライトに対応する', async () => {
    const server = createHttpServer(TEST_PORT, () => {});
    server.start();
    stopServer = () => server.stop();

    await new Promise((resolve) => setTimeout(resolve, 50));

    const response = await fetch(`http://localhost:${String(TEST_PORT)}/api/messages`, {
      method: 'OPTIONS',
    });

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://app.gather.town');
  });
});
