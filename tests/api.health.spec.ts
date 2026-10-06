import { test, expect } from '@playwright/test';

test.describe('API smoke', () => {
  test('GET / returns app identity', async ({ request, baseURL }) => {
    const resp = await request.get(baseURL + '/');
    expect(resp.ok()).toBeTrue();

    const body = await resp.json();
    expect(body).toMatchObject({
      name: expect.any(String),
      status: 'ok',
      method: 'GET',
    });
    expect(typeof body.port).toBe('number');
  });

  test('GET /health returns 200', async ({ request, baseURL }) => {
    const resp = await request.get(baseURL + '/health');
    // The app currently doesn't implement /health. This test will fail and should generate a defect.
    expect(resp.status()).toBe(200);
  });
});
