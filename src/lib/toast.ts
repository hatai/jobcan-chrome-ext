// toast.ts — body 直下に固定表示する軽量トースト。Jobcan の DOM 構造に依存しない。

const TOAST_ID = 'jce-toast';
const VISIBLE_CLASS = 'is-visible';
const VISIBLE_MS = 2000;

// トースト要素を生成する純粋関数（テスト可能）。表示はまだ行わない。
export function createToast(message: string): HTMLDivElement {
  const toast = document.createElement('div');
  toast.id = TOAST_ID;
  toast.className = 'jce-toast';
  toast.setAttribute('role', 'status');
  toast.textContent = message;
  return toast;
}

// トーストを表示し、一定時間後にフェードアウトして除去する。
export function showToast(message: string, root: HTMLElement = document.body): void {
  root.querySelector(`#${TOAST_ID}`)?.remove();

  const toast = createToast(message);
  root.appendChild(toast);

  // 次フレームで is-visible を付与し CSS トランジションを発火
  requestAnimationFrame(() => toast.classList.add(VISIBLE_CLASS));

  setTimeout(() => {
    toast.classList.remove(VISIBLE_CLASS);
    const remove = (): void => toast.remove();
    toast.addEventListener('transitionend', remove, { once: true });
    // transitionend が来ない環境向けフォールバック
    setTimeout(remove, 300);
  }, VISIBLE_MS);
}
