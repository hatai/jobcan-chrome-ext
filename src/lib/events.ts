// events.ts — content（隔離ワールド）と inject（MAIN ワールド）間の CustomEvent 通信を
// 型安全にラップする。`as EventListener` / CustomEvent のキャストをこの1ファイルに閉じ込める。

import { EVENT, type MODE_SAVE, type MODE_SAVE_AND_NEXT } from './constants';

export type SaveMode = typeof MODE_SAVE | typeof MODE_SAVE_AND_NEXT;

export interface SaveValidatedDetail {
  readonly mode: SaveMode;
}

export interface OpenEditDetail {
  readonly time: string;
}

// inject → content: バリデーション通過を通知
export function dispatchSaveValidated(detail: SaveValidatedDetail): void {
  document.dispatchEvent(new CustomEvent(EVENT.saveValidated, { detail }));
}

export function onSaveValidated(handler: (detail: SaveValidatedDetail) => void): void {
  document.addEventListener(EVENT.saveValidated, ((e: CustomEvent<SaveValidatedDetail>) => {
    handler(e.detail);
  }) as EventListener);
}

// content → inject: 次の日の編集モーダルを開くよう依頼
export function dispatchOpenEdit(detail: OpenEditDetail): void {
  document.dispatchEvent(new CustomEvent(EVENT.openEdit, { detail }));
}

export function onOpenEdit(handler: (detail: OpenEditDetail) => void): void {
  document.addEventListener(EVENT.openEdit, ((e: CustomEvent<OpenEditDetail>) => {
    handler(e.detail);
  }) as EventListener);
}
