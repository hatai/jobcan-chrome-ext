// inject.ts — MAIN ワールドのエントリポイント（配線のみ）。
// ページのグローバル関数（pushSave / openEditWindow）にアクセスできる。

import { addSaveAndNextButton, interceptSaveButton, patchFormSubmit } from './inject/buttons';
import { MESSAGES, SELECTORS } from './lib/constants';
import { onOpenEdit } from './lib/events';
import * as log from './lib/logger';

(() => {
  const editMenu = document.querySelector(SELECTORS.editMenu);
  if (!editMenu) {
    log.warn(MESSAGES.injectDisabled);
    return;
  }

  const setup = (): void => {
    interceptSaveButton();
    addSaveAndNextButton();
    patchFormSubmit();
  };

  // モーダル内の DOM 変化を監視（デバウンスで不要な再実行を抑制）
  let mutationTimer: ReturnType<typeof setTimeout> | null = null;
  const observer = new MutationObserver(() => {
    if (mutationTimer) return;
    mutationTimer = setTimeout(() => {
      mutationTimer = null;
      setup();
    }, 0);
  });
  observer.observe(editMenu, { childList: true, subtree: true });

  setup();

  // content script からの「次の日を開く」依頼を受信
  onOpenEdit(({ time }) => {
    if (time && typeof openEditWindow === 'function') {
      openEditWindow(Number(time));
    } else {
      log.warn(MESSAGES.openEditMissing, time);
    }
  });
})();
