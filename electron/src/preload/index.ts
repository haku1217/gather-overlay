import { contextBridge, ipcRenderer } from 'electron';
import type { ChatMessage } from '@gather-overlay/shared';

type MessageCallback = (message: ChatMessage) => void;

contextBridge.exposeInMainWorld('electronAPI', {
  onNewMessage: (callback: MessageCallback): void => {
    ipcRenderer.on('new-message', (_event, message: ChatMessage) => {
      callback(message);
    });
  },
});
