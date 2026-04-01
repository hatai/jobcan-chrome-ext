// Jobcan ページ固有のグローバル関数
declare function openEditWindow(time: number): void;
declare function pushSave(): boolean | undefined;

// jQuery 最小型定義
interface JQuery {
  modal(action: string): void;
  on(event: string, handler: (...args: unknown[]) => void): JQuery;
  one(event: string, handler: (...args: unknown[]) => void): JQuery;
}

interface JQueryStatic {
  (selector: string): JQuery;
  (element: Element): JQuery;
  fn?: {
    modal?: Function;
    on?: Function;
    one?: Function;
  };
}

declare const $: JQueryStatic;

interface Window {
  $?: JQueryStatic;
}

// HTMLFormElement 拡張
interface HTMLFormElement {
  _jceSubmitPatched?: boolean;
}

// カスタムイベント detail 型
interface JceSaveValidatedDetail {
  mode: 'save' | 'save-and-next';
}

interface JceOpenEditDetail {
  time: string;
}
