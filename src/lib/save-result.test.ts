import { describe, expect, it } from 'vitest';
import { classifySaveResponse } from './save-result';

describe('classifySaveResponse', () => {
  it('レスポンスに #save-form が無ければ成功', () => {
    const html = '<html><body><div id="dashboard">保存完了</div></body></html>';
    expect(classifySaveResponse(html)).toEqual({ kind: 'success' });
  });

  it('#save-form が残っていれば失敗', () => {
    const html = '<html><body><form id="save-form"></form></body></html>';
    expect(classifySaveResponse(html)).toEqual({
      kind: 'failure',
      message: '保存に失敗しました。再度お試しください。',
    });
  });

  it('失敗時はフォーム内のエラー文言を抽出する', () => {
    const html =
      '<html><body><form id="save-form"><span class="jbc-text-danger">時間が不正です</span></form></body></html>';
    expect(classifySaveResponse(html)).toEqual({
      kind: 'failure',
      message: '時間が不正です',
    });
  });

  it('.alert-danger からも文言を抽出する', () => {
    const html =
      '<html><body><form id="save-form"><div class="alert-danger">必須項目です</div></form></body></html>';
    expect(classifySaveResponse(html)).toEqual({
      kind: 'failure',
      message: '必須項目です',
    });
  });
});
