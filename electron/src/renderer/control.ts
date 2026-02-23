interface DisplayInfo {
  readonly id: number;
  readonly label: string;
  readonly width: number;
  readonly height: number;
  readonly selected: boolean;
}

interface ElectronAPI {
  readonly getDisplays: () => Promise<readonly DisplayInfo[]>;
  readonly switchDisplay: (displayId: number) => Promise<void>;
  readonly quitApp: () => Promise<void>;
  readonly onDisplaysChanged: (callback: (displays: readonly DisplayInfo[]) => void) => void;
  readonly toggleWindowMode: () => Promise<string>;
  readonly getWindowMode: () => Promise<string>;
  readonly onWindowModeChanged: (callback: (mode: string) => void) => void;
  readonly sendDebugMessage: (text: string) => Promise<void>;
}

declare global {
  interface Window {
    readonly electronAPI: ElectronAPI;
  }
}

const displayList = document.getElementById('display-list');
const quitBtn = document.getElementById('quit-btn');
const modeBtn = document.getElementById('mode-btn');
const debugInput = document.getElementById('debug-input') as HTMLInputElement | null;
const debugBtn = document.getElementById('debug-btn');

function sendDebugMessage(): void {
  if (debugInput === null) return;
  const text = debugInput.value.trim();
  if (text === '') return;
  void window.electronAPI.sendDebugMessage(text);
  debugInput.value = '';
}

debugBtn?.addEventListener('click', sendDebugMessage);
debugInput?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    sendDebugMessage();
  }
});

function renderDisplays(displays: readonly DisplayInfo[]): void {
  if (displayList === null) return;
  displayList.innerHTML = '';

  displays.forEach((display, index) => {
    const btn = document.createElement('button');
    btn.className = `display-btn${display.selected ? ' active' : ''}`;
    const label = display.label || `Display ${String(index + 1)}`;
    btn.textContent = `${label} (${String(display.width)}x${String(display.height)})`;
    btn.addEventListener('click', () => {
      void window.electronAPI.switchDisplay(display.id);
    });
    displayList.appendChild(btn);
  });
}

function updateModeButton(mode: string): void {
  if (modeBtn === null) return;
  if (mode === 'float') {
    modeBtn.textContent = '\u{1F4CC} Normal';
    modeBtn.title = '通常ウィンドウに切り替え';
    document.body.classList.remove('normal-mode');
  } else {
    modeBtn.textContent = '\u{1F4A8} Float';
    modeBtn.title = 'フロートに切り替え';
    document.body.classList.add('normal-mode');
  }
}

modeBtn?.addEventListener('click', () => {
  void window.electronAPI.toggleWindowMode();
});

quitBtn?.addEventListener('click', () => {
  void window.electronAPI.quitApp();
});

window.electronAPI.onDisplaysChanged(renderDisplays);
window.electronAPI.onWindowModeChanged(updateModeButton);
void window.electronAPI.getDisplays().then(renderDisplays);
void window.electronAPI.getWindowMode().then(updateModeButton);
