import { describe, expect, it } from 'vitest';
import { calcTotalMinutesFromForm, minutesToHHMM } from './time';

describe('minutesToHHMM', () => {
  it('0分は 00:00', () => expect(minutesToHHMM(0)).toBe('00:00'));
  it('端数分をゼロ埋め', () => expect(minutesToHHMM(5)).toBe('00:05'));
  it('時と分に分解', () => expect(minutesToHHMM(90)).toBe('01:30'));
  it('2桁時間', () => expect(minutesToHHMM(600)).toBe('10:00'));
  it('24時間超も丸めない', () => expect(minutesToHHMM(1500)).toBe('25:00'));
});

describe('calcTotalMinutesFromForm', () => {
  function buildForm(values: string[]): HTMLFormElement {
    const inputs = values.map((v) => `<input name="hiddenMinutes[]" value="${v}">`).join('');
    document.body.innerHTML = `<form id="save-form">${inputs}</form>`;
    return document.getElementById('save-form') as HTMLFormElement;
  }

  it('hiddenMinutes[] を合算する', () => {
    expect(calcTotalMinutesFromForm(buildForm(['60', '30']))).toBe(90);
  });

  it('空文字や非数値は無視する', () => {
    expect(calcTotalMinutesFromForm(buildForm(['60', '', 'abc', '30']))).toBe(90);
  });

  it('該当inputが無ければ 0', () => {
    document.body.innerHTML = '<form id="save-form"></form>';
    const form = document.getElementById('save-form') as HTMLFormElement;
    expect(calcTotalMinutesFromForm(form)).toBe(0);
  });
});
