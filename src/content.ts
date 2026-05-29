// content.ts — 隔離ワールドのエントリポイント（配線のみ）。
// inject からの CustomEvent を受けて AJAX 保存を実行する。

import { performAjaxSave } from './content/save';
import { MESSAGES, MODE_SAVE_AND_NEXT, SELECTORS } from './lib/constants';
import { onSaveValidated } from './lib/events';
import * as log from './lib/logger';

(() => {
  if (!document.querySelector(SELECTORS.editMenu)) {
    log.warn(MESSAGES.contentDisabled);
    return;
  }

  let isSaving = false;
  onSaveValidated(async ({ mode }) => {
    if (isSaving) return;
    isSaving = true;
    try {
      await performAjaxSave(mode === MODE_SAVE_AND_NEXT);
    } finally {
      isSaving = false;
    }
  });

  log.log(MESSAGES.initialized);
})();
