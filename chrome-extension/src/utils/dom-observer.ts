interface DomObserverOptions {
  readonly selector: string;
  readonly identityAttribute: string;
  readonly onTextChange: (element: Element, newText: string) => void;
}

interface DomObserverHandle {
  readonly start: () => void;
  readonly stop: () => void;
}

/**
 * DOM要素の変化を監視する。
 *
 * identityAttribute で要素を一意に識別するため、
 * 画面遷移でDOM要素が再生成されても前回テキストを保持できる。
 */
export function createDomObserver(options: DomObserverOptions): DomObserverHandle {
  const { selector, identityAttribute, onTextChange } = options;
  /** identityAttribute の値 → 前回テキスト */
  const previousTexts = new Map<string, string>();
  let observer: MutationObserver | null = null;

  function checkElements(): void {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      const identity = element.getAttribute(identityAttribute) ?? '';
      if (identity === '') {
        continue;
      }

      const currentText = (element as HTMLElement).innerText ?? '';
      const previousText = previousTexts.get(identity);

      if (previousText !== undefined && previousText !== currentText) {
        onTextChange(element, currentText);
      }
      previousTexts.set(identity, currentText);
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
