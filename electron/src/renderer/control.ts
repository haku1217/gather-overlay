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
}

declare global {
  interface Window {
    readonly electronAPI: ElectronAPI;
  }
}

const displayList = document.getElementById('display-list');
const quitBtn = document.getElementById('quit-btn');

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

quitBtn?.addEventListener('click', () => {
  void window.electronAPI.quitApp();
});

window.electronAPI.onDisplaysChanged(renderDisplays);
void window.electronAPI.getDisplays().then(renderDisplays);
