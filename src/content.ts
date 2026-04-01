// content.ts — Content script (isolated world)
// 役割:
// 1. inject.jsからのCustomEventを受信してAJAX保存を実行
// 2. 保存成功後のDOM更新（一覧テーブルの工数セル書き換え）
// 3. 連続入力機能（次の未入力平日を自動で開く）

(function () {
  'use strict';

  const LOG_PREFIX = '[JCE]';
  const MODE_SAVE_AND_NEXT = 'save-and-next';
  const EDIT_WINDOW_RE = /openEditWindow\((\d+)\)/;
  let isSaving = false;

  // --- 初期化 ---
  init();

  function init(): void {
    const editMenu = document.getElementById('edit-menu');
    if (!editMenu) {
      console.warn(LOG_PREFIX, '#edit-menu not found, content.js disabled');
      return;
    }

    // inject.jsからのCustomEventを受信
    document.addEventListener('jce-save-validated', ((e: CustomEvent<JceSaveValidatedDetail>) => {
      onSaveValidated(e);
    }) as EventListener);

    console.log(LOG_PREFIX, 'Initialized');
  }

  // --- 保存フロー ---

  async function onSaveValidated(e: CustomEvent<JceSaveValidatedDetail>): Promise<void> {
    if (isSaving) return;
    isSaving = true;

    const mode = e.detail?.mode || 'save';
    try {
      await performAjaxSave(mode === MODE_SAVE_AND_NEXT);
    } finally {
      isSaving = false;
    }
  }

  async function performAjaxSave(openNext: boolean): Promise<void> {
    const form = document.getElementById('save-form') as HTMLFormElement | null;
    if (!form) {
      console.error(LOG_PREFIX, '#save-form not found');
      return;
    }

    disableSaveButtons();
    clearError();

    const formData = new FormData(form);
    const savedTimeRaw = formData.get('time');
    if (savedTimeRaw === null || typeof savedTimeRaw !== 'string') {
      console.error(LOG_PREFIX, 'time field not found in form');
      enableSaveButtons();
      return;
    }
    const savedTime = savedTimeRaw;

    // 保存した工数合計を計算（DOM更新用）
    const totalMinutes = calcTotalMinutesFromForm(form);

    try {
      const resp = await fetch(form.action, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        redirect: 'follow',
      });

      if (!resp.ok) {
        showError('保存に失敗しました（HTTP ' + resp.status + '）。再度お試しください。');
        return;
      }

      // 成功判定: #save-formがレスポンスに存在 = 保存失敗（フォームに戻された）
      const html = await resp.text();
      if (html.includes('id="save-form"')) {
        // エラーパスのみDOMParserで詳細メッセージを抽出
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const respForm = doc.querySelector('#save-form');
        const errorEl = respForm?.querySelector('.jbc-text-danger, .text-danger, .alert-danger');
        showError(errorEl?.textContent?.trim() || '保存に失敗しました。再度お試しください。');
        return;
      }

      // 成功！
      console.log(LOG_PREFIX, 'Save successful for time:', savedTime);

      // 一覧テーブルのDOM更新
      updateTableRow(savedTime, totalMinutes);

      // モーダルを閉じて次のアクションへ
      closeModalAndContinue(openNext, savedTime);
    } catch (err) {
      console.error(LOG_PREFIX, 'Save error:', err);
      showError('ネットワークエラーが発生しました。再度お試しください。');
    } finally {
      enableSaveButtons();
    }
  }

  // --- DOM更新 ---

  function updateTableRow(savedTime: string, totalMinutes: number): void {
    try {
      const row = findTableRowByTime(savedTime);
      if (!row) {
        console.warn(LOG_PREFIX, 'Could not find table row for time:', savedTime);
        return;
      }

      const cells = row.querySelectorAll('td');
      // cells[0]=日付, cells[1]=総労働時間, cells[2]=工数合計, cells[3]=編集
      if (cells.length < 4) {
        console.warn(LOG_PREFIX, 'Unexpected table row structure');
        return;
      }

      const manHourCell = cells[2];
      const formattedTime = minutesToHHMM(totalMinutes);

      // 「入力がありません」を工数合計に書き換え
      const dangerSpan = manHourCell.querySelector('.jbc-text-danger');
      if (dangerSpan) {
        dangerSpan.remove();
      }
      manHourCell.textContent = formattedTime;
    } catch (err) {
      console.warn(LOG_PREFIX, 'Failed to update table row:', err);
    }
  }

  // 一覧テーブルの各行を走査し、editボタンのtimestampとともにyield
  function* iterateTableRows(): Generator<{ row: Element; rowTime: string }> {
    for (const table of document.querySelectorAll('main table.jbc-table')) {
      for (const row of table.querySelectorAll('tbody tr')) {
        const editBtn = row.querySelector('[onclick*="openEditWindow"]');
        if (!editBtn) continue;
        const match = editBtn.getAttribute('onclick')?.match(EDIT_WINDOW_RE);
        if (!match) continue;
        yield { row, rowTime: match[1] };
      }
    }
  }

  function findTableRowByTime(targetTime: string): Element | null {
    for (const { row, rowTime } of iterateTableRows()) {
      if (rowTime === String(targetTime)) return row;
    }
    return null;
  }

  // --- 連続入力 ---

  function closeModalAndContinue(openNext: boolean, savedTime: string): void {
    const closeModal = (): void => {
      // jQuery/Bootstrap が利用可能か
      if (window.$ && typeof $.fn?.modal === 'function') {
        $('#man-hour-manage-modal').modal('hide');
      } else {
        const closeBtn = document.getElementById('menu-close');
        if (closeBtn) closeBtn.click();
      }
    };

    if (!openNext) {
      closeModal();
      return;
    }

    // 次の未入力平日を探す
    const nextTime = findNextUnfilledWeekday(savedTime);

    if (!nextTime) {
      // 未入力日がない → モーダルを閉じて終了
      closeModal();
      return;
    }

    // モーダルの閉じアニメーション完了を待ってから次を開く
    const modal = document.getElementById('man-hour-manage-modal');
    if (modal && window.$ && typeof $.fn?.on === 'function') {
      $(modal).one('hidden.bs.modal', () => {
        openEditWindowSafe(nextTime);
      });
      closeModal();
    } else {
      closeModal();
      // fallback: 少し待ってから開く
      setTimeout(() => openEditWindowSafe(nextTime), 500);
    }
  }

  function findNextUnfilledWeekday(currentTime: string): string | null {
    let found = false;
    for (const { row, rowTime } of iterateTableRows()) {
      if (!found) {
        if (rowTime === String(currentTime)) found = true;
        continue;
      }
      if (isWeekend(row, rowTime)) continue;
      if (isUnfilled(row)) return rowTime;
    }
    return null;
  }

  function isWeekend(row: Element, unixTime: string): boolean {
    // 第1候補: 日付テキストの末尾1文字
    const dateLink = row.querySelector('a');
    if (dateLink) {
      const text = dateLink.textContent?.trim() ?? '';
      const lastChar = text.slice(-1);
      if (lastChar === '土' || lastChar === '日') return true;
    }

    // 第2候補: <font color="red"> の存在
    const redFont = row.querySelector('font[color="red"]');
    if (redFont) return true;

    // フォールバック: unixTimestampから曜日算出
    const date = new Date(Number(unixTime) * 1000);
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  function isUnfilled(row: Element): boolean {
    // 第1候補: jbc-text-danger クラスの存在
    if (row.querySelector('.jbc-text-danger')) return true;

    // 第2候補: テキストに「入力がありません」
    const cells = row.querySelectorAll('td');
    if (cells.length >= 3) {
      const text = cells[2].textContent?.trim() ?? '';
      if (text === '入力がありません') return true;
    }

    return false;
  }

  function openEditWindowSafe(unixTime: string): void {
    // inject.jsのページコンテキストのopenEditWindowを呼ぶため、
    // CustomEventを使ってinject.js側で実行してもらう
    document.dispatchEvent(
      new CustomEvent<JceOpenEditDetail>('jce-open-edit', { detail: { time: unixTime } })
    );
  }

  // --- UIヘルパー ---

  function disableSaveButtons(): void {
    const saveBtn = document.getElementById('save') as HTMLButtonElement | null;
    const nextBtn = document.getElementById('jce-save-next') as HTMLButtonElement | null;
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.dataset.originalText = saveBtn.textContent ?? '';
      saveBtn.textContent = '保存中...';
    }
    if (nextBtn) {
      nextBtn.disabled = true;
    }
  }

  function enableSaveButtons(): void {
    const saveBtn = document.getElementById('save') as HTMLButtonElement | null;
    const nextBtn = document.getElementById('jce-save-next') as HTMLButtonElement | null;
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = saveBtn.dataset.originalText || '保存';
    }
    if (nextBtn) {
      nextBtn.disabled = false;
    }
  }

  function showError(message: string): void {
    clearError();
    const banner = document.createElement('div');
    banner.id = 'jce-error-banner';
    banner.className = 'jce-error-banner';
    banner.textContent = message;

    // #un-match-time の上に挿入、なければ .modal-body の先頭に
    const target = document.getElementById('un-match-time');
    if (target?.parentNode) {
      target.parentNode.insertBefore(banner, target);
    } else {
      const modalBody = document.querySelector('.modal-body');
      if (modalBody) {
        modalBody.insertBefore(banner, modalBody.firstChild);
      }
    }
  }

  function clearError(): void {
    const existing = document.getElementById('jce-error-banner');
    if (existing) existing.remove();
  }

  // --- ユーティリティ ---

  function minutesToHHMM(totalMinutes: number): string {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  }

  function calcTotalMinutesFromForm(form: HTMLFormElement): number {
    const hiddenMinutes = form.querySelectorAll<HTMLInputElement>('input[name="hiddenMinutes[]"]');
    let total = 0;
    hiddenMinutes.forEach((input) => {
      const val = parseInt(input.value, 10);
      if (!isNaN(val)) total += val;
    });
    return total;
  }
})();
