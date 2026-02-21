import type { ChatMessage } from '@gather-overlay/shared';
import { CONFIG } from '@gather-overlay/shared';

interface OverlayHandle {
  readonly addMessage: (message: ChatMessage) => void;
}

/** チャンネル/送信者に基づく色のハッシュ生成 */
function generateColor(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // 32bit整数に変換
  }

  const hue = Math.abs(hash) % 360;
  return `hsl(${String(hue)}, 80%, 70%)`;
}

/** 使用可能な縦位置（レーン）を管理 */
function createLaneManager(containerHeight: number, lineHeight: number) {
  const laneCount = Math.max(1, Math.floor(containerHeight / lineHeight));
  const activeLanes = new Set<number>();

  function acquireLane(): number {
    for (let i = 0; i < laneCount; i++) {
      if (!activeLanes.has(i)) {
        activeLanes.add(i);
        return i;
      }
    }
    // 全レーン使用中の場合はランダム
    return Math.floor(Math.random() * laneCount);
  }

  function releaseLane(lane: number): void {
    activeLanes.delete(lane);
  }

  return { acquireLane, releaseLane };
}

export function createOverlay(container: HTMLElement): OverlayHandle {
  const lineHeight = CONFIG.FONT_SIZE + 16;
  const laneManager = createLaneManager(window.innerHeight, lineHeight);

  function addMessage(message: ChatMessage): void {
    const lane = laneManager.acquireLane();
    const color = generateColor(`${message.channel}:${message.sender}`);

    const element = document.createElement('div');
    element.className = 'overlay-message';
    element.textContent = `${message.sender}: ${message.message}`;
    element.style.top = `${String(lane * lineHeight)}px`;
    element.style.color = color;
    element.style.fontSize = `${String(CONFIG.FONT_SIZE)}px`;
    element.style.animationDuration = `${String(CONFIG.DISPLAY_DURATION)}ms`;

    container.appendChild(element);

    // アニメーション終了後にDOM要素を削除しレーンを解放
    element.addEventListener('animationend', () => {
      element.remove();
      laneManager.releaseLane(lane);
    });
  }

  return { addMessage };
}
