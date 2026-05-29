// logger.ts — console 出力を LOG_PREFIX 付きで一元化する薄いラッパ。
// 拡張のランタイム診断ログはすべてこのモジュール経由にし、純粋ロジック層では使わない。

import { LOG_PREFIX } from './constants';

export function log(...args: unknown[]): void {
  console.log(LOG_PREFIX, ...args);
}

export function warn(...args: unknown[]): void {
  console.warn(LOG_PREFIX, ...args);
}

export function error(...args: unknown[]): void {
  console.error(LOG_PREFIX, ...args);
}
