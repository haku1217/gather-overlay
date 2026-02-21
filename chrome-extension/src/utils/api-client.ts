import type { ChatMessage, ApiResponse } from '@gather-overlay/shared';

/**
 * メッセージをElectronアプリへ送信する
 */
export async function sendMessage(message: ChatMessage, port: number): Promise<ApiResponse> {
  const url = `http://localhost:${String(port)}/api/messages`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    return {
      success: false,
      error: `HTTP ${String(response.status)}: ${response.statusText}`,
    };
  }

  const data = (await response.json()) as ApiResponse;
  return data;
}
