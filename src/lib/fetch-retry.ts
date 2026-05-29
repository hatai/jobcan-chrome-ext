// fetch-retry.ts — ネットワーク例外時のみ指数バックオフでリトライする fetch ラッパ。
// 保存は POST（非冪等）のため、サーバ未到達が濃厚な「fetch の reject（ネットワーク例外）」のみ
// リトライ対象とし、HTTP ステータスエラー（4xx/5xx）は二重保存を避けて即座に返す。

export interface RetryOptions {
  readonly retries?: number;
  readonly baseDelayMs?: number;
}

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchWithRetry(
  input: string,
  init: RequestInit,
  opts: RetryOptions = {},
): Promise<Response> {
  const retries = opts.retries ?? 2;
  const baseDelayMs = opts.baseDelayMs ?? 300;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetch(input, init);
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await delay(baseDelayMs * 2 ** attempt);
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error('fetch failed');
}
