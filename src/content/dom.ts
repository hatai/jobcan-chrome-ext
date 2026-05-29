// content/dom.ts — 隔離ワールド側の DOM 副作用を集約する。
// 一覧テーブル更新・保存ボタンの状態制御・エラーバナー・モーダル開閉/連続入力。

import { MESSAGES, SELECTORS } from '../lib/constants';
import { dispatchOpenEdit } from '../lib/events';
import * as log from '../lib/logger';
import { findNextUnfilledWeekday, findTableRowByTime } from '../lib/table';
import { minutesToHHMM } from '../lib/time';

// --- 一覧テーブル更新 ---

export function updateTableRow(savedTime: string, totalMinutes: number): void {
  try {
    const row = findTableRowByTime(savedTime);
    if (!row) {
      log.warn(MESSAGES.rowNotFound(savedTime));
      return;
    }

    const cells = row.querySelectorAll('td');
    // cells[0]=日付, cells[1]=総労働時間, cells[2]=工数合計, cells[3]=編集
    if (cells.length < 4) {
      log.warn(MESSAGES.unexpectedRow);
      return;
    }

    const manHourCell = cells[2];
    manHourCell.querySelector(SELECTORS.dangerText)?.remove();
    manHourCell.textContent = minutesToHHMM(totalMinutes);
  } catch (err) {
    log.warn('Failed to update table row:', err);
  }
}

// --- 保存ボタン状態 ---

function getSaveButtons(): {
  saveBtn: HTMLButtonElement | null;
  nextBtn: HTMLButtonElement | null;
} {
  return {
    saveBtn: document.querySelector<HTMLButtonElement>(SELECTORS.saveBtn),
    nextBtn: document.querySelector<HTMLButtonElement>(SELECTORS.nextBtn),
  };
}

export function disableSaveButtons(): void {
  const { saveBtn, nextBtn } = getSaveButtons();
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.dataset.originalText = saveBtn.textContent ?? '';
    saveBtn.textContent = MESSAGES.saving;
  }
  if (nextBtn) nextBtn.disabled = true;
}

export function enableSaveButtons(): void {
  const { saveBtn, nextBtn } = getSaveButtons();
  if (saveBtn) {
    saveBtn.disabled = false;
    saveBtn.textContent = saveBtn.dataset.originalText || MESSAGES.saveLabel;
  }
  if (nextBtn) nextBtn.disabled = false;
}

// --- エラーバナー ---

export function showError(message: string): void {
  clearError();
  const banner = document.createElement('div');
  banner.id = 'jce-error-banner';
  banner.className = 'jce-error-banner';
  banner.setAttribute('role', 'alert');
  banner.textContent = message;

  const target = document.querySelector(SELECTORS.unMatchTime);
  if (target?.parentNode) {
    target.parentNode.insertBefore(banner, target);
    return;
  }
  const modalBody = document.querySelector(SELECTORS.modalBody);
  modalBody?.insertBefore(banner, modalBody.firstChild);
}

export function clearError(): void {
  document.querySelector(SELECTORS.errorBanner)?.remove();
}

// --- モーダル開閉 / 連続入力 ---

function closeModal(): void {
  if (window.$ && typeof window.$.fn?.modal === 'function') {
    window.$(SELECTORS.modal).modal('hide');
    return;
  }
  document.querySelector<HTMLElement>(SELECTORS.menuClose)?.click();
}

// inject（MAIN ワールド）に openEditWindow 実行を依頼
function openEditWindowSafe(unixTime: string): void {
  dispatchOpenEdit({ time: unixTime });
}

export function closeModalAndContinue(openNext: boolean, savedTime: string): void {
  if (!openNext) {
    closeModal();
    return;
  }

  const nextTime = findNextUnfilledWeekday(savedTime);
  if (!nextTime) {
    closeModal();
    return;
  }

  // モーダルの閉じアニメーション完了を待ってから次を開く
  const modal = document.querySelector(SELECTORS.modal);
  if (modal && window.$ && typeof window.$.fn?.on === 'function') {
    window.$(modal).one('hidden.bs.modal', () => openEditWindowSafe(nextTime));
    closeModal();
    return;
  }
  closeModal();
  setTimeout(() => openEditWindowSafe(nextTime), 500);
}
