import { test, expect, type Page } from '@playwright/test';
import { continueToNextStep, fillGuest, fillPayment, openApp, startBooking } from './helpers';

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'tablet', width: 820, height: 1100 },
  { name: 'mobile', width: 390, height: 844 },
];

async function hasHorizontalScroll(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
}

for (const vp of VIEWPORTS) {
  test.describe(`${vp.name} (${vp.width}px)`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test('home, detail and booking pages never scroll horizontally', async ({ page }) => {
      await openApp(page);
      expect(await hasHorizontalScroll(page)).toBe(false);

      await openApp(page, '#/hotel/h5');
      expect(await hasHorizontalScroll(page)).toBe(false);

      await startBooking(page, 'h5', 'Deluxe King');
      expect(await hasHorizontalScroll(page)).toBe(false);
      await continueToNextStep(page);
      await fillGuest(page);
      await continueToNextStep(page);
      expect(await hasHorizontalScroll(page)).toBe(false);
      await fillPayment(page);
      await page.getByRole('button', { name: /Pay/ }).click();
      await expect(page.getByRole('heading', { name: 'Booking confirmed!' })).toBeVisible();
      expect(await hasHorizontalScroll(page)).toBe(false);
    });

    test('hotel cards use the available width', async ({ page }) => {
      await openApp(page);
      const columns = await page.evaluate(() => {
        const tops = [...document.querySelectorAll<HTMLElement>('.card')].map((c) => Math.round(c.getBoundingClientRect().top));
        return tops.filter((t) => t === tops[0]).length;
      });
      const expected = vp.name === 'desktop' ? 3 : vp.name === 'tablet' ? 2 : 1;
      expect(columns).toBeGreaterThanOrEqual(expected);
    });
  });
}

test.describe('mobile filters', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('are collapsed behind a Filters button that toggles them', async ({ page }) => {
    await openApp(page);
    const panel = page.locator('#filters');
    const toggle = page.getByRole('button', { name: /Filters/ }).first();
    await expect(panel).toBeHidden();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await toggle.click();
    await expect(panel).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await page.locator('#f-stars').selectOption('5');
    await expect(page.locator('.card')).toHaveCount(3);
  });
});

test.describe('desktop layout', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('filters are always visible and the toggle button is hidden', async ({ page }) => {
    await openApp(page);
    await expect(page.locator('#filters')).toBeVisible();
    await expect(page.locator('.filters-toggle')).toBeHidden();
  });
});
