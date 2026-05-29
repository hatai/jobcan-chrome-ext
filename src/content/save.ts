// content/save.ts — 保存フローのオーケストレーション。
// フォーム収集 → fetch（リトライ付き）→ レスポンス判定 → DOM 更新 / 連続入力。

import { MESSAGES, SELECTORS } from '../lib/constants';
import { fetchWithRetry } from '../lib/fetch-retry';
import * as log from '../lib/logger';
import { classifySaveResponse } from '../lib/save-result';
import { calcTotalMinutesFromForm } from '../lib/time';
import { showToast } from '../lib/toast';
import {
  clearError,
  closeModalAndContinue,
  disableSaveButtons,
  enableSaveButtons,
  showError,
  updateTableRow,
} from './dom';

export async function performAjaxSave(openNext: boolean): Promise<void> {
  const form = document.querySelector<HTMLFormElement>(SELECTORS.saveForm);
  if (!form) {
    log.error(MESSAGES.formNotFound);
    return;
  }

  disableSaveButtons();
  clearError();

  const formData = new FormData(form);
  const savedTime = formData.get('time');
  if (typeof savedTime !== 'string') {
    log.error(MESSAGES.timeFieldMissing);
    enableSaveButtons();
    return;
  }

  // 保存する工数合計を送信前に計算（成功後の DOM 更新用）
  const totalMinutes = calcTotalMinutesFromForm(form);

  try {
    const resp = await fetchWithRetry(form.action, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      redirect: 'follow',
    });

    if (!resp.ok) {
      showError(MESSAGES.httpError(resp.status));
      return;
    }

    const outcome = classifySaveResponse(await resp.text());
    if (outcome.kind === 'failure') {
      showError(outcome.message);
      return;
    }

    log.log(MESSAGES.saveSuccess(savedTime));
    updateTableRow(savedTime, totalMinutes);
    showToast(MESSAGES.saved);
    closeModalAndContinue(openNext, savedTime);
  } catch (err) {
    log.error('Save error:', err);
    showError(MESSAGES.networkError);
  } finally {
    enableSaveButtons();
  }
}
