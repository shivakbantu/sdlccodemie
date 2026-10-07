import { test, expect } from '@playwright/test';
import {
  CARD, GUEST, continueToNextStep, fillGuest, fillPayment, goToPaymentStep, openApp, startBooking,
} from './helpers';

test.describe('3-step booking flow', () => {
  test('completes a booking: room, guest details, payment, confirmation', async ({ page }) => {
    await startBooking(page, 'h1', 'Classic Double');
    const stepper = page.getByRole('list', { name: 'Booking progress' });
    await expect(stepper.locator('[aria-current="step"]')).toContainText('1');

    await expect(page.locator('#summary')).toContainText('Classic Double');
    await expect(page.locator('#summary')).toContainText('Taxes (12%)');
    await continueToNextStep(page);

    await expect(page.getByRole('heading', { name: 'Step 2 · Guest details' })).toBeVisible();
    await expect(stepper.locator('[aria-current="step"]')).toContainText('2');
    await fillGuest(page);
    await continueToNextStep(page);

    await expect(page.getByRole('heading', { name: 'Step 3 · Payment' })).toBeVisible();
    await expect(page.getByText('No real payment is made')).toBeVisible();
    await fillPayment(page);

    // Instant visual feedback on Pay (well under 200ms), then the simulated processing delay.
    const feedback = await page.evaluate(() => {
      const btn = document.querySelector<HTMLButtonElement>('#pay-btn')!;
      const t0 = performance.now();
      btn.click();
      return { ms: performance.now() - t0, loading: btn.classList.contains('is-loading'), disabled: btn.disabled };
    });
    expect(feedback.loading).toBe(true);
    expect(feedback.disabled).toBe(true);
    expect(feedback.ms).toBeLessThan(200);

    await expect(page.getByRole('heading', { name: 'Booking confirmed!' })).toBeVisible();
    await expect(page.locator('#booking-ref')).toHaveText(/^HB-[A-Z2-9]{8}$/);
    await expect(page.locator('canvas.confetti')).toBeAttached();
    await expect(page.locator('.toast', { hasText: 'Booking confirmed' })).toBeVisible();

    const details = page.locator('.confirm');
    await expect(details).toContainText('Ada Lovelace');
    await expect(details).toContainText('Le Petit Lumière, Paris');
    await expect(details).toContainText('Classic Double');
    await expect(details).toContainText('card ending 4242');
    await expect(page.getByRole('list', { name: 'Booking progress' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Book another stay' }).click();
    await expect(page.locator('.card')).toHaveCount(9);
  });

  test('changing the room updates the price summary immediately', async ({ page }) => {
    await startBooking(page, 'h1', 'Classic Double');
    const summary = page.locator('#summary');
    await expect(summary).toContainText('$180.00 × 3 nights × 1 room');
    await expect(summary).toContainText('$604.80');

    await page.getByRole('radio', { name: /Deluxe Eiffel View/ }).check();
    await expect(summary).toContainText('$260.00 × 3 nights × 1 room');
    await expect(summary).toContainText('$873.60');

    await page.getByLabel('Rooms', { exact: true }).selectOption('2');
    await expect(summary).toContainText('× 2 rooms');
    await expect(summary).toContainText('$1,747.20');
  });

  test('step 1 refuses more guests than the room sleeps', async ({ page }) => {
    await startBooking(page);
    await page.getByLabel('Guests', { exact: true }).selectOption('5');
    await continueToNextStep(page);
    await expect(page.getByRole('heading', { name: /Step 1/ })).toBeVisible();
    await expect(page.getByRole('alert').first()).toContainText('sleeps 2 per room');
    await expect(page.locator('.toast', { hasText: 'highlighted fields' })).toBeVisible();

    await page.getByLabel('Rooms', { exact: true }).selectOption('3');
    await continueToNextStep(page);
    await expect(page.getByRole('heading', { name: /Step 2/ })).toBeVisible();
  });

  test('step 1 refuses a check-out that is not after check-in', async ({ page }) => {
    await startBooking(page);
    const checkIn = await page.getByLabel('Check-in').inputValue();
    await page.getByLabel('Check-out').fill(checkIn);
    await continueToNextStep(page);
    await expect(page.getByRole('heading', { name: /Step 1/ })).toBeVisible();
    await expect(page.getByText('Check-out must be after check-in')).toBeVisible();
  });

  test('step 2 shows an error for every empty required field', async ({ page }) => {
    await startBooking(page);
    await continueToNextStep(page);
    await continueToNextStep(page);
    await expect(page.getByRole('heading', { name: /Step 2/ })).toBeVisible();
    await expect(page.locator('.field__error')).toHaveText([
      'First name is required', 'Last name is required', 'Email is required', 'Phone number is required',
    ]);
    await expect(page.getByLabel('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  test('step 2 rejects a malformed email and phone, and errors clear while typing', async ({ page }) => {
    await startBooking(page);
    await continueToNextStep(page);
    await fillGuest(page, { ...GUEST, email: 'not-an-email', phone: '12' });
    await continueToNextStep(page);
    await expect(page.getByText('Enter a valid email address')).toBeVisible();
    await expect(page.getByText('Enter a valid phone number')).toBeVisible();

    await page.getByLabel('Email').fill('ada@example.com');
    await expect(page.getByText('Enter a valid email address')).toBeHidden();
  });

  test('Back keeps the details already entered', async ({ page }) => {
    await startBooking(page);
    await continueToNextStep(page);
    await fillGuest(page);
    await page.getByRole('button', { name: /Back/ }).click();
    await expect(page.getByRole('heading', { name: /Step 1/ })).toBeVisible();
    await continueToNextStep(page);
    await expect(page.getByLabel('First name')).toHaveValue('Ada');
    await expect(page.getByLabel('Email')).toHaveValue('ada@example.com');
  });

  test('card number and expiry are formatted as you type', async ({ page }) => {
    await goToPaymentStep(page);
    await page.getByLabel('Card number').pressSequentially('4242424242424242');
    await expect(page.getByLabel('Card number')).toHaveValue('4242 4242 4242 4242');
    await page.getByLabel('Expiry (MM/YY)').pressSequentially('1230');
    await expect(page.getByLabel('Expiry (MM/YY)')).toHaveValue('12/30');
    await page.getByLabel('CVV').pressSequentially('12a3');
    await expect(page.getByLabel('CVV')).toHaveValue('123');
  });

  test('an invalid card is rejected, errors are shown, typed values are kept', async ({ page }) => {
    await goToPaymentStep(page);
    await fillPayment(page, { ...CARD, cardNumber: '4242424242424241', cvv: '1' });
    await page.getByRole('button', { name: /Pay/ }).click();

    await expect(page.getByRole('heading', { name: /Step 3/ })).toBeVisible();
    await expect(page.getByText('Enter a valid card number')).toBeVisible();
    await expect(page.getByText('Enter 3 or 4 digits')).toBeVisible();
    await expect(page.locator('.toast', { hasText: 'check your payment details' })).toBeVisible();
    await expect(page.getByLabel('Card number')).toHaveValue('4242 4242 4242 4241');
    await expect(page.getByLabel('Name on card')).toHaveValue('Ada Lovelace');

    await fillPayment(page, { cardNumber: '4242424242424242', cvv: '123' });
    await page.getByRole('button', { name: /Pay/ }).click();
    await expect(page.getByRole('heading', { name: 'Booking confirmed!' })).toBeVisible();
  });

  test('an expired card is rejected', async ({ page }) => {
    await goToPaymentStep(page);
    await fillPayment(page, { ...CARD, expiry: '0120' });
    await page.getByRole('button', { name: /Pay/ }).click();
    await expect(page.getByText('Card has expired')).toBeVisible();
  });

  test('guest input is escaped on the confirmation page (no HTML injection)', async ({ page }) => {
    await startBooking(page);
    await continueToNextStep(page);
    await fillGuest(page, { ...GUEST, lastName: '<img src=x onerror=alert(1)>' });
    await continueToNextStep(page);
    await fillPayment(page);
    await page.getByRole('button', { name: /Pay/ }).click();
    await expect(page.getByRole('heading', { name: 'Booking confirmed!' })).toBeVisible();
    await expect(page.locator('.confirm')).toContainText('<img src=x onerror=alert(1)>');
    await expect(page.locator('.confirm img')).toHaveCount(0);
  });

  test('cancel asks for confirmation; keeping the booking stays, confirming goes home', async ({ page }) => {
    await startBooking(page);
    await page.getByRole('button', { name: 'Cancel' }).click();
    const dialog = page.getByRole('dialog', { name: 'Cancel this booking?' });
    await expect(dialog).toBeVisible();

    await dialog.getByRole('button', { name: 'Keep booking' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('heading', { name: /Step 1/ })).toBeVisible();

    await page.getByRole('button', { name: 'Cancel' }).click();
    await page.getByRole('button', { name: 'Yes, cancel' }).click();
    await expect(page.locator('.card')).toHaveCount(9);
    await expect(page.locator('.toast', { hasText: 'Booking cancelled' })).toBeVisible();
  });

  test('opening /book without choosing a room redirects to the hotel list', async ({ page }) => {
    await openApp(page, '#/book');
    await expect(page.locator('.card')).toHaveCount(9);
    await expect(page.locator('.toast', { hasText: 'Pick a hotel and room first' })).toBeVisible();
  });
});
