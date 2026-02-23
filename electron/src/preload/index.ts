import { contextBridge, ipcRenderer } from 'electron';
import type { ChatMessage } from '@gather-overlay/shared';

type MessageCallback = (message: ChatMessage) => void;

interface DisplayInfo {
  readonly id: number;
  readonly label: string;
  readonly width: number;
  readonly height: number;
  readonly selected: boolean;
}

type DisplaysCallback = (displays: readonly DisplayInfo[]) => void;
type WindowModeCallback = (mode: string) => void;

contextBridge.exposeInMainWorld('electronAPI', {
  onNewMessage: (callback: MessageCallback): void => {
    ipcRenderer.on('new-message', (_event, message: ChatMessage) => {
      callback(message);
    });
  },
  getDisplays: (): Promise<readonly DisplayInfo[]> => ipcRenderer.invoke('get-displays'),
  switchDisplay: (displayId: number): Promise<void> =>
    ipcRenderer.invoke('switch-display', displayId),
  quitApp: (): Promise<void> => ipcRenderer.invoke('quit-app'),
  onDisplaysChanged: (callback: DisplaysCallback): void => {
    ipcRenderer.on('displays-changed', (_event, displays: readonly DisplayInfo[]) => {
      callback(displays);
    });
  },
  toggleWindowMode: (): Promise<string> => ipcRenderer.invoke('toggle-window-mode'),
  sendDebugMessage: (text: string): Promise<void> => ipcRenderer.invoke('send-debug-message', text),
  getWindowMode: (): Promise<string> => ipcRenderer.invoke('get-window-mode'),
  onWindowModeChanged: (callback: WindowModeCallback): void => {
    ipcRenderer.on('window-mode-changed', (_event, mode: string) => {
      callback(mode);
    });
  },
});
