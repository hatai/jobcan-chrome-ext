// constants.ts — 拡張全体で共有する定数（content/inject 両ワールドから import）
// セレクタ・メッセージ・モード・正規表現を一元管理し、Jobcan の DOM 変更への追従点を集約する。

export const LOG_PREFIX = '[JCE]';

// 保存モード（CustomEvent の detail.mode）
export const MODE_SAVE = 'save';
export const MODE_SAVE_AND_NEXT = 'save-and-next';

// 編集ボタンの onclick から Unix timestamp を抽出する正規表現
export const EDIT_WINDOW_RE = /openEditWindow\((\d+)\)/;

// 土日判定に使う曜日文字
export const WEEKEND_CHARS = ['土', '日'] as const;
// 日付テキストから曜日文字を抽出する正規表現（書式揺れ対応）
export const WEEKDAY_RE = /[月火水木金土日]/g;

// CustomEvent 名
export const EVENT = {
  saveValidated: 'jce-save-validated',
  openEdit: 'jce-open-edit',
} as const;

// Jobcan ページ / 拡張が依存する DOM セレクタ（querySelector 用に '#' 込みで保持）
export const SELECTORS = {
  editMenu: '#edit-menu',
  saveBtn: '#save',
  saveForm: '#save-form',
  nextBtn: '#jce-save-next',
  modal: '#man-hour-manage-modal',
  menuClose: '#menu-close',
  unMatchTime: '#un-match-time',
  modalBody: '.modal-body',
  errorBanner: '#jce-error-banner',
  table: 'main table.jbc-table',
  tableRows: 'tbody tr',
  editButton: '[onclick*="openEditWindow"]',
  dangerText: '.jbc-text-danger',
  // 保存失敗時にレスポンス内から探すエラー文言候補
  errorTexts: '.jbc-text-danger, .text-danger, .alert-danger',
  redFont: 'font[color="red"]',
  dateLink: 'a',
} as const;

// レスポンスのパース失敗時フォールバックで使う「フォーム残存=保存失敗」マーカー
export const SAVE_FORM_MARKER = 'id="save-form"';

// ユーザー向け / ログ用メッセージ
export const MESSAGES = {
  // ログ
  initialized: 'Initialized',
  contentDisabled: '#edit-menu not found, content.js disabled',
  injectDisabled: '#edit-menu not found, inject.js disabled',
  formNotFound: '#save-form not found',
  timeFieldMissing: 'time field not found in form',
  rowNotFound: (time: string) => `Could not find table row for time: ${time}`,
  unexpectedRow: 'Unexpected table row structure',
  saveSuccess: (time: string) => `Save successful for time: ${time}`,
  saveBtnNoParent: '#save has no parent node, cannot add next button',
  pushSaveMissing: 'pushSave() not found',
  openEditMissing: 'openEditWindow() not available or invalid time',
  formSubmitIntercepted: 'form.submit() intercepted for #save-form',
  // ユーザー向け
  saving: '保存中...',
  saveLabel: '保存',
  nextLabel: '保存して次へ',
  emptyInput: '入力がありません',
  saved: '保存しました',
  httpError: (status: number) => `保存に失敗しました（HTTP ${status}）。再度お試しください。`,
  saveFailed: '保存に失敗しました。再度お試しください。',
  networkError: 'ネットワークエラーが発生しました。再度お試しください。',
} as const;
