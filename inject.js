// inject.js — ページコンテキスト (MAIN world) で実行される
// 役割:
// 1. 保存ボタンのtype="submit"→"button"に変更してデフォルトフォーム送信を防止
// 2. pushSave()でバリデーション実行後、CustomEventでcontent scriptに通知
// 3. 「保存して次へ」ボタンを追加
// 4. form.submit()をインスタンスレベルでno-opにする安全策

(function () {
  'use strict';

  const LOG_PREFIX = '[JCE]';
  const MODE_SAVE = 'save';
  const MODE_SAVE_AND_NEXT = 'save-and-next';

  // edit-menu の存在を待つ
  const editMenu = document.getElementById('edit-menu');
  if (!editMenu) {
    console.warn(LOG_PREFIX, '#edit-menu not found, inject.js disabled');
    return;
  }

  // モーダル内のDOM変化を監視（デバウンスで不要な再実行を抑制）
  let mutationTimer = null;
  const observer = new MutationObserver(() => {
    if (mutationTimer) return;
    mutationTimer = setTimeout(() => {
      mutationTimer = null;
      interceptSaveButton();
      addSaveAndNextButton();
      patchFormSubmit();
    }, 0);
  });
  observer.observe(editMenu, { childList: true, subtree: true });

  // 初回実行
  interceptSaveButton();
  addSaveAndNextButton();
  patchFormSubmit();

  /**
   * 保存ボタンをインターセプト
   * type="submit" → type="button" に変更し、バリデーション後にCustomEventを発火
   */
  function interceptSaveButton() {
    const saveBtn = document.getElementById('save');
    if (!saveBtn || saveBtn.dataset.jceIntercepted) return;

    saveBtn.type = 'button';
    saveBtn.dataset.jceIntercepted = 'true';
    saveBtn.removeAttribute('onclick');

    saveBtn.addEventListener('click', () => {
      triggerSave(MODE_SAVE);
    });
  }

  /**
   * 「保存して次へ」ボタンをモーダルフッターに追加（冪等）
   */
  function addSaveAndNextButton() {
    const saveBtn = document.getElementById('save');
    if (!saveBtn) return;
    if (document.getElementById('jce-save-next')) return;

    const nextBtn = document.createElement('button');
    nextBtn.id = 'jce-save-next';
    nextBtn.className = 'btn jbc-btn-primary jce-save-next-btn';
    nextBtn.type = 'button';
    nextBtn.textContent = '保存して次へ';

    nextBtn.addEventListener('click', () => {
      triggerSave(MODE_SAVE_AND_NEXT);
    });

    // 保存ボタンの後に挿入
    saveBtn.parentNode.insertBefore(nextBtn, saveBtn.nextSibling);
  }

  /**
   * form.submit() をインスタンスレベルでno-opにする
   */
  function patchFormSubmit() {
    const form = document.getElementById('save-form');
    if (!form || form._jceSubmitPatched) return;

    form._jceSubmitPatched = true;
    form.submit = function () {
      console.warn(LOG_PREFIX, 'form.submit() intercepted for #save-form');
    };
  }

  // content scriptからの「次の日を開く」リクエストを受信
  document.addEventListener('jce-open-edit', (e) => {
    const time = e.detail?.time;
    if (time && typeof openEditWindow === 'function') {
      openEditWindow(Number(time));
    } else {
      console.warn(LOG_PREFIX, 'openEditWindow() not available or invalid time:', time);
    }
  });

  /**
   * バリデーション実行 → 成功ならCustomEvent発火
   */
  function triggerSave(mode) {
    // 既存のpushSave()を呼んでバリデーションを実行
    if (typeof pushSave !== 'function') {
      console.error(LOG_PREFIX, 'pushSave() not found');
      return;
    }

    const result = pushSave();
    if (result === false) {
      // バリデーション失敗
      return;
    }

    // フォームのHTML5バリデーションも確認
    const form = document.getElementById('save-form');
    if (form && !form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // バリデーション通過 → content scriptに通知
    document.dispatchEvent(
      new CustomEvent('jce-save-validated', {
        detail: { mode: mode },
      })
    );
  }
})();
