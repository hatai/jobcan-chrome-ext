import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchWithRetry } from './fetch-retry';

afterEach(() => {
  vi.restoreAllMocks();
});

function mockResponse(status: number): Response {
  return { ok: status >= 200 && status < 300, status } as Response;
}

describe('fetchWithRetry', () => {
  it('成功時はそのまま Response を返す', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse(200));
    vi.stubGlobal('fetch', fetchMock);

    const resp = await fetchWithRetry('/save', { method: 'POST' });
    expect(resp.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('HTTP エラー（5xx）はリトライせず即返す（POST非冪等のため）', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse(500));
    vi.stubGlobal('fetch', fetchMock);

    const resp = await fetchWithRetry('/save', { method: 'POST' }, { baseDelayMs: 1 });
    expect(resp.status).toBe(500);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('ネットワーク例外はリトライ後に成功すれば Response を返す', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValue(mockResponse(200));
    vi.stubGlobal('fetch', fetchMock);

    const resp = await fetchWithRetry('/save', { method: 'POST' }, { baseDelayMs: 1 });
    expect(resp.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('リトライ上限まで失敗したら例外を投げる', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      fetchWithRetry('/save', { method: 'POST' }, { retries: 2, baseDelayMs: 1 }),
    ).rejects.toThrow('Failed to fetch');
    expect(fetchMock).toHaveBeenCalledTimes(3); // 初回 + リトライ2回
  });
});
