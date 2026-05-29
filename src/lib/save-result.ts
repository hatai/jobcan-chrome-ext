// save-result.ts — 保存レスポンス HTML の成功/失敗を判定する純粋関数。
// Jobcan は保存成功時にリダイレクトし、バリデーション失敗時はフォーム HTML を返す。
// よって「レスポンスに #save-form が残っている = 失敗」で判定する。

import { MESSAGES, SAVE_FORM_MARKER, SELECTORS } from './constants';

export type SaveOutcome =
  | { readonly kind: 'success' }
  | { readonly kind: 'failure'; readonly message: string };

export function classifySaveResponse(html: string): SaveOutcome {
  let doc: Document | null = null;
  try {
    doc = new DOMParser().parseFromString(html, 'text/html');
  } catch {
    doc = null;
  }

  // 主シグナル: パース成功なら #save-form ノードの実在で判定（文字列 includes より堅牢）。
  // パース失敗時のみ旧来の文字列マッチへフォールバック。
  const formStillPresent = doc
    ? doc.querySelector(SELECTORS.saveForm) !== null
    : html.includes(SAVE_FORM_MARKER);

  if (!formStillPresent) return { kind: 'success' };

  const errorEl = doc?.querySelector(SELECTORS.saveForm)?.querySelector(SELECTORS.errorTexts);
  const message = errorEl?.textContent?.trim() || MESSAGES.saveFailed;
  return { kind: 'failure', message };
}
