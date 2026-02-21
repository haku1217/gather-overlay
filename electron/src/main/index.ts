import { app, BrowserWindow, screen } from 'electron';
import { join } from 'node:path';
import { createHttpServer } from './http-server.js';
import { CONFIG } from '@gather-overlay/shared';

let mainWindow: BrowserWindow | null = null;

function createOverlayWindow(): BrowserWindow {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  const window = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // マウスイベントを完全に透過
  window.setIgnoreMouseEvents(true);

  // フルスクリーンアプリの上にも表示
  window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  window.setAlwaysOnTop(true, 'screen-saver');

  // レンダラーをロード
  if (process.env['ELECTRON_RENDERER_URL'] !== undefined) {
    void window.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return window;
}

app
  .whenReady()
  .then(() => {
    mainWindow = createOverlayWindow();

    // HTTPサーバーを起動
    const server = createHttpServer(CONFIG.DEFAULT_PORT, (message) => {
      mainWindow?.webContents.send('new-message', message);
    });

    server.start();

    app.on('window-all-closed', () => {
      server.stop();
      app.quit();
    });
  })
  .catch((error: unknown) => {
    process.stderr.write(`Failed to start app: ${String(error)}\n`);
    app.quit();
  });
