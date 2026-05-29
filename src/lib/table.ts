// table.ts — 工数一覧テーブルの走査ロジック。
// root を引数注入（既定: document）することで happy-dom フィクスチャでテスト可能にしている。

import { EDIT_WINDOW_RE, MESSAGES, SELECTORS, WEEKDAY_RE, WEEKEND_CHARS } from './constants';

export interface TableRow {
  readonly row: Element;
  readonly rowTime: string;
}

// 一覧テーブルの各行を走査し、編集ボタンの timestamp とともに yield する
export function* iterateTableRows(root: ParentNode = document): Generator<TableRow> {
  for (const table of root.querySelectorAll(SELECTORS.table)) {
    for (const row of table.querySelectorAll(SELECTORS.tableRows)) {
      const editBtn = row.querySelector(SELECTORS.editButton);
      if (!editBtn) continue;
      const match = editBtn.getAttribute('onclick')?.match(EDIT_WINDOW_RE);
      if (!match) continue;
      yield { row, rowTime: match[1] };
    }
  }
}

export function findTableRowByTime(
  targetTime: string,
  root: ParentNode = document,
): Element | null {
  for (const { row, rowTime } of iterateTableRows(root)) {
    if (rowTime === targetTime) return row;
  }
  return null;
}

// 土日判定: 日付テキストの曜日文字 → font[color="red"] → unixtime 算出 の多段フォールバック
export function isWeekend(row: Element, unixTime: string): boolean {
  const dateLink = row.querySelector(SELECTORS.dateLink);
  if (dateLink) {
    // 「5/30(土)」「05/30 土」など書式の揺れに対応し、テキスト中の最後の曜日文字で判定
    const weekdayChars = (dateLink.textContent ?? '').match(WEEKDAY_RE);
    const lastWeekday = weekdayChars?.at(-1);
    if (lastWeekday && (WEEKEND_CHARS as readonly string[]).includes(lastWeekday)) return true;
  }

  if (row.querySelector(SELECTORS.redFont)) return true;

  const day = new Date(Number(unixTime) * 1000).getDay();
  return day === 0 || day === 6;
}

// 未入力判定: jbc-text-danger の存在 → 工数セルが「入力がありません」
export function isUnfilled(row: Element): boolean {
  if (row.querySelector(SELECTORS.dangerText)) return true;

  const cells = row.querySelectorAll('td');
  if (cells.length >= 3) {
    return cells[2].textContent?.trim() === MESSAGES.emptyInput;
  }
  return false;
}

// 現在日より後の、最初の「未入力かつ平日」の行の timestamp を返す
export function findNextUnfilledWeekday(
  currentTime: string,
  root: ParentNode = document,
): string | null {
  let passedCurrent = false;
  for (const { row, rowTime } of iterateTableRows(root)) {
    if (!passedCurrent) {
      if (rowTime === currentTime) passedCurrent = true;
      continue;
    }
    if (isWeekend(row, rowTime)) continue;
    if (isUnfilled(row)) return rowTime;
  }
  return null;
}
