import { z } from 'zod';

/** Chrome拡張からElectronへ送信するメッセージのスキーマ */
export const chatMessageSchema = z.object({
  /** チャンネル名 */
  channel: z.string().min(1),
  /** 送信者名 */
  sender: z.string().min(1),
  /** メッセージ内容 */
  message: z.string().min(1),
  /** 検知タイムスタンプ (ISO 8601) */
  timestamp: z.string().datetime(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

/** Electronからのレスポンス */
export interface ApiResponse {
  readonly success: boolean;
  readonly error?: string;
}

/** 設定定数 */
export const CONFIG = {
  /** HTTPサーバーのデフォルトポート */
  DEFAULT_PORT: 19274,
  /** メッセージの表示時間 (ms) */
  DISPLAY_DURATION: 8000,
  /** フォントサイズ (px) */
  FONT_SIZE: 36,
} as const;
