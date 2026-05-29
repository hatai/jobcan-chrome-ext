import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createToast, showToast } from './toast';

beforeEach(() => {
  document.body.innerHTML = '';
});

afterEach(() => {
  vi.useRealTimers();
});

describe('createToast', () => {
  it('メッセージと role=status を持つ要素を生成する', () => {
    const toast = createToast('保存しました');
    expect(toast.id).toBe('jce-toast');
    expect(toast.className).toBe('jce-toast');
    expect(toast.getAttribute('role')).toBe('status');
    expect(toast.textContent).toBe('保存しました');
  });

  it('生成しただけでは DOM に追加されない', () => {
    createToast('x');
    expect(document.querySelector('#jce-toast')).toBeNull();
  });
});

describe('showToast', () => {
  it('body にトーストを追加する', () => {
    showToast('保存しました');
    const toast = document.querySelector('#jce-toast');
    expect(toast?.textContent).toBe('保存しました');
  });

  it('連続表示時は既存トーストを置き換える（重複しない）', () => {
    showToast('1回目');
    showToast('2回目');
    const toasts = document.querySelectorAll('#jce-toast');
    expect(toasts).toHaveLength(1);
    expect(toasts[0].textContent).toBe('2回目');
  });

  it('一定時間後にフェードアウトして DOM から除去される', () => {
    vi.useFakeTimers();
    showToast('保存しました');
    expect(document.querySelector('#jce-toast')).not.toBeNull();

    // 表示時間経過 → is-visible 除去 → transitionend フォールバックで remove
    vi.advanceTimersByTime(2000);
    const toast = document.querySelector('#jce-toast');
    expect(toast?.classList.contains('is-visible')).toBe(false);

    vi.advanceTimersByTime(300);
    expect(document.querySelector('#jce-toast')).toBeNull();
  });
});
