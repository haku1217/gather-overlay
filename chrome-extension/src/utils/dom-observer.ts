interface DomObserverOptions {
  readonly selector: string;
  readonly onTextChange: (element: Element, newText: string) => void;
}

interface DomObserverHandle {
  readonly start: () => void;
  readonly stop: () => void;
}

export function createDomObserver(options: DomObserverOptions): DomObserverHandle {
  const { selector, onTextChange } = options;
  /** 各要素の前回テキストを記憶 */
  const previousTexts = new Map<Element, string>();
  let observer: MutationObserver | null = null;

  function checkElements(): void {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      const currentText = element.textContent ?? '';
      const previousText = previousTexts.get(element);

      if (previousText !== undefined && previousText !== currentText) {
        onTextChange(element, currentText);
      }
      previousTexts.set(element, currentText);
    }
  }

  function start(): void {
    // 初回スキャンで現在の状態を記録
    checkElements();

    observer = new MutationObserver(() => {
      checkElements();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  function stop(): void {
    observer?.disconnect();
    observer = null;
    previousTexts.clear();
  }

  return { start, stop };
}
