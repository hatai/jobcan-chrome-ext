// time.ts — 時間計算の純粋関数。DOM や外部状態に依存しない。

// 合計分を "HH:MM" 形式に整形する（時は2桁ゼロ埋め、24時間超もそのまま）
export function minutesToHHMM(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// フォーム内の hiddenMinutes[] を合算する（空文字や非数値は無視）
export function calcTotalMinutesFromForm(form: HTMLFormElement): number {
  const inputs = form.querySelectorAll<HTMLInputElement>('input[name="hiddenMinutes[]"]');
  return Array.from(inputs).reduce((sum, input) => {
    const val = Number.parseInt(input.value, 10);
    return Number.isNaN(val) ? sum : sum + val;
  }, 0);
}
