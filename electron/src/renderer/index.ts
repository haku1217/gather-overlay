import type { ChatMessage } from '@gather-overlay/shared';
import { createOverlay } from './overlay.js';

interface ElectronAPI {
  readonly onNewMessage: (callback: (message: ChatMessage) => void) => void;
}

declare global {
  interface Window {
    readonly electronAPI: ElectronAPI;
  }
}

const container = document.getElementById('overlay-container');

if (container === null) {
  throw new Error('overlay-container element not found');
}

const overlay = createOverlay(container);

window.electronAPI.onNewMessage((message) => {
  overlay.addMessage(message);
});
