import { test, expect } from '@playwright/test';
import { openApp, money } from './helpers';

test.describe('browse and filter hotels', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
  });

  test('lists every hotel with name, price and rating', async ({ page }) => {
    await expect(page.locator('.card')).toHaveCount(9);
    await expect(page.locator('#count')).toContainText('9 hotels found');
    const first = page.locator('.card').first();
    await expect(first).toContainText('Le Petit Lumière');
    await expect(first).toContainText('$180.00');
    await expect(first).toContainText('4.6');
  });

  test('searching by destination filters instantly (under 200ms)', async ({ page }) => {
    const ms = await page.evaluate(() => {
      const input = document.querySelector<HTMLInputElement>('#f-query')!;
      const t0 = performance.now();
      input.value = 'bali';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return performance.now() - t0;
    });
    expect(ms).toBeLessThan(200);
    await expect(page.locator('.card')).toHaveCount(1);
    await expect(page.locator('.card')).toContainText('Ubud Jungle Retreat');
    await expect(page.locator('#count')).toContainText('1 hotel found');
  });

  test('star rating filter', async ({ page }) => {
    await page.locator('#f-stars').selectOption('5');
    await expect(page.locator('.card')).toHaveCount(3);
    await expect(page.locator('.card .stars')).toHaveText(['★★★★★', '★★★★★', '★★★★★']);
  });

  test('amenity filters combine (pool AND pet friendly)', async ({ page }) => {
    await page.getByLabel('Pool').check();
    await expect(page.locator('.card')).toHaveCount(5);
    await page.getByLabel('Pet friendly').check();
    await expect(page.locator('.card')).toHaveCount(1);
    await expect(page.locator('.card')).toContainText('Ubud Jungle Retreat');
  });

  test('price slider narrows results and empty state can be cleared', async ({ page }) => {
    await page.locator('#f-maxPrice').fill('80');
    await expect(page.locator('.card')).toHaveCount(1);
    await expect(page.locator('.card')).toContainText('Alfama Nest');

    await page.locator('#f-maxPrice').fill('50');
    await expect(page.locator('.card')).toHaveCount(0);
    await expect(page.getByText('No hotels match your filters')).toBeVisible();

    await page.getByRole('button', { name: 'Clear all filters' }).click();
    await expect(page.locator('.card')).toHaveCount(9);
    await expect(page.locator('.toast', { hasText: 'Filters cleared' })).toBeVisible();
  });

  test('guest count hides hotels without a large enough room', async ({ page }) => {
    await page.locator('#f-guests').selectOption('6');
    await expect(page.locator('.card')).toHaveCount(2);
    await expect(page.locator('.card .card__title')).toHaveText(['Desert Pearl Resort', 'Opera Bay Sydney']);
  });

  test('sorting by price (low to high and high to low)', async ({ page }) => {
    await page.locator('#f-sort').selectOption('price-asc');
    const asc = (await page.locator('.card .price strong').allTextContents()).map(money);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    expect(asc[0]).toBe(70);

    await page.locator('#f-sort').selectOption('price-desc');
    const desc = (await page.locator('.card .price strong').allTextContents()).map(money);
    expect(desc).toEqual([...desc].sort((a, b) => b - a));
    expect(desc[0]).toBe(310);
  });

  test('changing dates updates the stay length and totals', async ({ page }) => {
    await expect(page.locator('#count')).toContainText('3 nights');
    const checkIn = await page.locator('#f-checkIn').inputValue();
    const [y, m, d] = checkIn.split('-').map(Number);
    const out = new Date(Date.UTC(y, m - 1, d + 5)).toISOString().slice(0, 10);
    await page.locator('#f-checkOut').fill(out);
    await expect(page.locator('#count')).toContainText('5 nights');
    await expect(page.locator('.card').first()).toContainText('$900.00 for 5 nights');
  });

  test('check-out before check-in is rejected with a toast', async ({ page }) => {
    const before = await page.locator('#f-checkOut').inputValue();
    await page.locator('#f-checkOut').fill('2000-01-01');
    await expect(page.locator('.toast', { hasText: 'Check-out must be after check-in' })).toBeVisible();
    await expect(page.locator('#f-checkOut')).toHaveValue(before);
  });

  test('favorites toggle with feedback and a header counter', async ({ page }) => {
    const heart = page.locator('.card').first().locator('.fav');
    await expect(heart).toHaveAttribute('aria-pressed', 'false');
    await heart.click();
    await expect(heart).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#fav-count')).toHaveText('1');
    await expect(page.locator('.toast', { hasText: 'Saved Le Petit Lumière' })).toBeVisible();

    await heart.click();
    await expect(heart).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#fav-count')).toBeHidden();
  });
});

test.describe('hotel detail page', () => {
  test('View rooms opens the detail page with room options', async ({ page }) => {
    await openApp(page);
    await page.locator('.card', { hasText: 'Le Petit Lumière' }).getByRole('link', { name: 'View rooms' }).click();
    await expect(page).toHaveURL(/#\/hotel\/h1$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Le Petit Lumière' })).toBeVisible();
    await expect(page.locator('.room')).toHaveCount(3);
    await expect(page.locator('.room', { hasText: 'Deluxe Eiffel View' })).toContainText('Only 2 left!');
    await expect(page.locator('.room', { hasText: 'Family Suite' })).toContainText('Non-refundable');
  });

  test('rooms are filtered by the number of guests', async ({ page }) => {
    await openApp(page);
    await page.locator('#f-guests').selectOption('4');
    await page.locator('.card', { hasText: 'Le Petit Lumière' }).getByRole('link', { name: 'View rooms' }).click();
    await expect(page.getByText('Showing rooms for 4 guests')).toBeVisible();
    await expect(page.locator('.room')).toHaveCount(1);
    await expect(page.locator('.room')).toContainText('Family Suite');
  });

  test('room details modal opens, traps Escape, and closes', async ({ page }) => {
    await openApp(page, '#/hotel/h2');
    await page.locator('.room', { hasText: 'Executive Room' }).getByRole('button', { name: 'Details' }).click();
    const dialog = page.getByRole('dialog', { name: 'Executive Room' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Club lounge access');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('unknown hotel shows a friendly not-found state', async ({ page }) => {
    await openApp(page, '#/hotel/does-not-exist');
    await expect(page.getByText('Hotel not found')).toBeVisible();
    await page.getByRole('link', { name: 'Browse hotels' }).click();
    await expect(page.locator('.card')).toHaveCount(9);
  });
});
