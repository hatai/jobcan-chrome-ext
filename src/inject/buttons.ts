// inject/buttons.ts — MAIN ワールド側の保存ボタン制御。
// 保存ボタンのインターセプト・「保存して次へ」ボタン追加・form.submit() の無害化・
// バリデーション実行後の CustomEvent 発火。

import { MESSAGES, MODE_SAVE, SELECTORS } from '../lib/constants';
import { dispatchSaveValidated, type SaveMode } from '../lib/events';
import * as log from '../lib/logger';

// 保存ボタンを type="submit" → "button" に変更し、デフォルトのフォーム送信を防ぐ
export function interceptSaveButton(): void {
  const saveBtn = document.querySelector<HTMLButtonElement>(SELECTORS.saveBtn);
  if (!saveBtn || saveBtn.dataset.jceIntercepted) return;

  saveBtn.type = 'button';
  saveBtn.dataset.jceIntercepted = 'true';
  saveBtn.removeAttribute('onclick');
  saveBtn.addEventListener('click', () => triggerSave(MODE_SAVE));
}

// 「保存して次へ」ボタンをモーダルフッターに追加（冪等）
export function addSaveAndNextButton(): void {
  const saveBtn = document.querySelector<HTMLButtonElement>(SELECTORS.saveBtn);
  if (!saveBtn || document.querySelector(SELECTORS.nextBtn)) return;

  const parent = saveBtn.parentNode;
  if (!parent) {
    log.warn(MESSAGES.saveBtnNoParent);
    return;
  }

  const nextBtn = document.createElement('button');
  nextBtn.id = 'jce-save-next';
  nextBtn.className = 'btn jbc-btn-primary jce-save-next-btn';
  nextBtn.type = 'button';
  nextBtn.textContent = MESSAGES.nextLabel;
  nextBtn.addEventListener('click', () => triggerSave('save-and-next'));

  parent.insertBefore(nextBtn, saveBtn.nextSibling);
}

// form.submit() をインスタンスレベルで no-op にする安全策
export function patchFormSubmit(): void {
  const form = document.querySelector<HTMLFormElement>(SELECTORS.saveForm);
  if (!form || form._jceSubmitPatched) return;

  form._jceSubmitPatched = true;
  form.submit = () => log.warn(MESSAGES.formSubmitIntercepted);
}

// バリデーション実行 → 通過したら content script へ通知
export function triggerSave(mode: SaveMode): void {
  if (typeof pushSave !== 'function') {
    log.error(MESSAGES.pushSaveMissing);
    return;
  }
  if (pushSave() === false) return; // Jobcan 側バリデーション失敗

  const form = document.querySelector<HTMLFormElement>(SELECTORS.saveForm);
  if (form && !form.checkValidity()) {
    form.reportValidity();
    return;
  }

  dispatchSaveValidated({ mode });
}
