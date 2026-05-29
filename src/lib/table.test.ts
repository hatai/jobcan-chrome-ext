import { beforeEach, describe, expect, it } from 'vitest';
import {
  findNextUnfilledWeekday,
  findTableRowByTime,
  isUnfilled,
  isWeekend,
  iterateTableRows,
} from './table';

interface RowSpec {
  time: string;
  label: string;
  filled: boolean;
}

// Jobcan 一覧テーブル (main table.jbc-table > tbody > tr) を模したフィクスチャを構築
function buildTable(rows: RowSpec[]): Document {
  const trs = rows
    .map(
      ({ time, label, filled }) => `
      <tr>
        <td><a>${label}</a></td>
        <td>08:00</td>
        <td>${filled ? '08:00' : '<span class="jbc-text-danger">入力がありません</span>'}</td>
        <td><button onclick="openEditWindow(${time})">編集</button></td>
      </tr>`,
    )
    .join('');
  document.body.innerHTML = `<main><table class="jbc-table"><tbody>${trs}</tbody></table></main>`;
  return document;
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('iterateTableRows', () => {
  it('編集ボタンの timestamp を抽出して yield する', () => {
    const doc = buildTable([
      { time: '1000', label: '5/25(月)', filled: true },
      { time: '2000', label: '5/26(火)', filled: false },
    ]);
    const times = [...iterateTableRows(doc)].map((r) => r.rowTime);
    expect(times).toEqual(['1000', '2000']);
  });

  it('openEditWindow を持たない行は除外する', () => {
    document.body.innerHTML =
      '<main><table class="jbc-table"><tbody><tr><td>合計</td></tr></tbody></table></main>';
    expect([...iterateTableRows(document)]).toHaveLength(0);
  });
});

describe('findTableRowByTime', () => {
  it('一致する行を返す', () => {
    const doc = buildTable([
      { time: '1000', label: '5/25(月)', filled: true },
      { time: '2000', label: '5/26(火)', filled: false },
    ]);
    const row = findTableRowByTime('2000', doc);
    expect(row?.querySelector('a')?.textContent).toBe('5/26(火)');
  });

  it('一致が無ければ null', () => {
    const doc = buildTable([{ time: '1000', label: '5/25(月)', filled: true }]);
    expect(findTableRowByTime('9999', doc)).toBeNull();
  });
});

describe('isWeekend', () => {
  it('日付末尾が土/日なら true', () => {
    const doc = buildTable([{ time: '1000', label: '5/30(土)', filled: false }]);
    const row = doc.querySelector('tr') as Element;
    expect(isWeekend(row, '1000')).toBe(true);
  });

  it('font[color="red"] があれば true', () => {
    document.body.innerHTML =
      '<main><table class="jbc-table"><tbody><tr><td><font color="red">5/1</font></td><td></td><td></td><td><button onclick="openEditWindow(1)">編集</button></td></tr></tbody></table></main>';
    const row = document.querySelector('tr') as Element;
    expect(isWeekend(row, '1')).toBe(true);
  });

  it('平日テキストでも unixtime が日曜なら true（フォールバック）', () => {
    // 2024-01-07 は日曜。テキストに曜日が無い行を作る
    document.body.innerHTML =
      '<main><table class="jbc-table"><tbody><tr><td>1/7</td><td></td><td></td><td><button onclick="openEditWindow(1704585600)">編集</button></td></tr></tbody></table></main>';
    const row = document.querySelector('tr') as Element;
    const sundayUnix = String(Math.floor(new Date('2024-01-07T12:00:00').getTime() / 1000));
    expect(isWeekend(row, sundayUnix)).toBe(true);
  });

  it('平日なら false', () => {
    const doc = buildTable([{ time: '1000', label: '5/27(水)', filled: true }]);
    const row = doc.querySelector('tr') as Element;
    const wedUnix = String(Math.floor(new Date('2024-01-10T12:00:00').getTime() / 1000));
    expect(isWeekend(row, wedUnix)).toBe(false);
  });
});

describe('isUnfilled', () => {
  it('jbc-text-danger があれば true', () => {
    const doc = buildTable([{ time: '1000', label: '5/27(水)', filled: false }]);
    expect(isUnfilled(doc.querySelector('tr') as Element)).toBe(true);
  });

  it('工数セルが「入力がありません」テキストなら true', () => {
    document.body.innerHTML =
      '<main><table class="jbc-table"><tbody><tr><td><a>5/27</a></td><td>08:00</td><td>入力がありません</td><td><button onclick="openEditWindow(1)">編集</button></td></tr></tbody></table></main>';
    expect(isUnfilled(document.querySelector('tr') as Element)).toBe(true);
  });

  it('入力済みなら false', () => {
    const doc = buildTable([{ time: '1000', label: '5/27(水)', filled: true }]);
    expect(isUnfilled(doc.querySelector('tr') as Element)).toBe(false);
  });
});

describe('findNextUnfilledWeekday', () => {
  it('現在日の次の未入力平日の timestamp を返す', () => {
    const doc = buildTable([
      { time: '1000', label: '5/25(月)', filled: true },
      { time: '2000', label: '5/26(火)', filled: false },
      { time: '3000', label: '5/27(水)', filled: false },
    ]);
    expect(findNextUnfilledWeekday('1000', doc)).toBe('2000');
  });

  it('土日はスキップする', () => {
    const doc = buildTable([
      { time: '1000', label: '5/29(金)', filled: true },
      { time: '2000', label: '5/30(土)', filled: false },
      { time: '3000', label: '5/31(日)', filled: false },
      { time: '4000', label: '6/1(月)', filled: false },
    ]);
    expect(findNextUnfilledWeekday('1000', doc)).toBe('4000');
  });

  it('入力済みの平日はスキップする', () => {
    const doc = buildTable([
      { time: '1000', label: '5/26(火)', filled: true },
      { time: '2000', label: '5/27(水)', filled: true },
      { time: '3000', label: '5/28(木)', filled: false },
    ]);
    expect(findNextUnfilledWeekday('1000', doc)).toBe('3000');
  });

  it('以降に未入力平日が無ければ null', () => {
    const doc = buildTable([
      { time: '1000', label: '5/26(火)', filled: true },
      { time: '2000', label: '5/27(水)', filled: true },
    ]);
    expect(findNextUnfilledWeekday('1000', doc)).toBeNull();
  });
});
