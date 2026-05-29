// global.d.ts — Jobcan ページ由来のグローバル型のみ。
// 拡張内部の CustomEvent detail 型は lib/events.ts に定義。

// Jobcan ページ固有のグローバル関数
declare function openEditWindow(time: number): void;
declare function pushSave(): boolean | undefined;

// jQuery 最小型定義（Bootstrap modal 操作に必要な分のみ）
type JQueryEventHandler = (...args: unknown[]) => void;

interface JQuery {
  modal(action: 'hide' | 'show'): void;
  on(event: string, handler: JQueryEventHandler): JQuery;
  one(event: string, handler: JQueryEventHandler): JQuery;
}

interface JQueryStatic {
  (selector: string): JQuery;
  (element: Element): JQuery;
  fn?: {
    modal?: (action: string) => void;
    on?: JQuery['on'];
    one?: JQuery['one'];
  };
}

declare const $: JQueryStatic;

interface Window {
  $?: JQueryStatic;
}

// inject/buttons.ts の form.submit() パッチ用フラグ
interface HTMLFormElement {
  _jceSubmitPatched?: boolean;
}
