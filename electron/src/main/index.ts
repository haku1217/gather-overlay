import { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage } from 'electron';
import { join } from 'node:path';
import { createHttpServer } from './http-server.js';
import { CONFIG } from '@gather-overlay/shared';

let mainWindow: BrowserWindow | null = null;
let controlWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let currentDisplayId: number | null = null;

interface DisplayInfo {
  readonly id: number;
  readonly label: string;
  readonly width: number;
  readonly height: number;
  readonly selected: boolean;
}

function getDisplayList(): readonly DisplayInfo[] {
  return screen.getAllDisplays().map((display, index) => ({
    id: display.id,
    label: display.label || `Display ${String(index + 1)}`,
    width: display.size.width,
    height: display.size.height,
    selected: display.id === currentDisplayId,
  }));
}

function broadcastDisplays(): void {
  controlWindow?.webContents.send('displays-changed', getDisplayList());
}

function createOverlayWindow(display: Electron.Display): BrowserWindow {
  const { x, y, width, height } = display.workArea;
  currentDisplayId = display.id;

  const window = new BrowserWindow({
    width,
    height,
    x,
    y,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
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

function moveToDisplay(window: BrowserWindow, display: Electron.Display): void {
  currentDisplayId = display.id;
  const { x, y, width, height } = display.workArea;
  window.setBounds({ x, y, width, height });
  broadcastDisplays();
}

function createControlWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 220,
    height: 160,
    resizable: false,
    minimizable: false,
    maximizable: false,
    closable: false,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: true,
    transparent: false,
    titleBarStyle: 'hidden',
    vibrancy: 'under-window',
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  window.setVisibleOnAllWorkspaces(true);
  window.setAlwaysOnTop(true, 'floating');

  if (process.env['ELECTRON_RENDERER_URL'] !== undefined) {
    const url = new URL(process.env['ELECTRON_RENDERER_URL']);
    url.pathname = '/control.html';
    void window.loadURL(url.toString());
  } else {
    void window.loadFile(join(__dirname, '../renderer/control.html'));
  }

  return window;
}

function createTray(overlayWindow: BrowserWindow): Tray {
  const iconPath = join(__dirname, '../../resources/iconTemplate.png');
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  icon.setTemplateImage(true);
  const newTray = new Tray(icon);
  newTray.setToolTip('Gather Overlay');

  function updateMenu(): void {
    const displays = screen.getAllDisplays();
    const displayItems = displays.map((display, index) => ({
      label: `${display.label || `Display ${String(index + 1)}`} (${String(display.size.width)}x${String(display.size.height)})`,
      type: 'radio' as const,
      checked: display.id === currentDisplayId,
      click: (): void => {
        moveToDisplay(overlayWindow, display);
        updateMenu();
      },
    }));

    const template: Electron.MenuItemConstructorOptions[] = [
      ...displayItems,
      { type: 'separator' },
      {
        label: 'Quit',
        click: (): void => {
          app.quit();
        },
      },
    ];

    newTray.setContextMenu(Menu.buildFromTemplate(template));
  }

  screen.on('display-added', () => {
    updateMenu();
    broadcastDisplays();
  });
  screen.on('display-removed', () => {
    updateMenu();
    broadcastDisplays();
  });
  updateMenu();

  return newTray;
}

function setupIpcHandlers(): void {
  ipcMain.handle('get-displays', () => getDisplayList());

  ipcMain.handle('switch-display', (_event, displayId: number) => {
    if (mainWindow === null) return;
    const display = screen.getAllDisplays().find((d) => d.id === displayId);
    if (display !== undefined) {
      moveToDisplay(mainWindow, display);
    }
  });

  ipcMain.handle('quit-app', () => {
    // closable: false のウィンドウは app.quit() だけでは閉じないため
    // 全ウィンドウを明示的に破棄してから終了する
    mainWindow?.destroy();
    controlWindow?.destroy();
    tray?.destroy();
    app.quit();
  });
}

app
  .whenReady()
  .then(() => {
    // Dockアイコンを非表示（Tray専用アプリ）
    if (process.platform === 'darwin') {
      app.dock.hide();
    }

    setupIpcHandlers();

    const primaryDisplay = screen.getPrimaryDisplay();
    mainWindow = createOverlayWindow(primaryDisplay);

    // コントロールウィンドウを作成
    controlWindow = createControlWindow();

    // システムトレイを作成（メニューバーに空きがあれば表示される）
    tray = createTray(mainWindow);

    // HTTPサーバーを起動
    const server = createHttpServer(CONFIG.DEFAULT_PORT, (message) => {
      mainWindow?.webContents.send('new-message', message);
    });

    server.start();

    app.on('window-all-closed', () => {
      server.stop();
      tray?.destroy();
      app.quit();
    });
  })
  .catch((error: unknown) => {
    process.stderr.write(`Failed to start app: ${String(error)}\n`);
    app.quit();
  });
