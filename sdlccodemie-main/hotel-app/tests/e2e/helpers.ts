import { expect, type Page } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const INDEX_URL = pathToFileURL(path.resolve(__dirname, '../../index.html')).href;

export const GUEST = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  phone: '+1 555 010 1234',
};

export const CARD = {
  cardName: 'Ada Lovelace',
  cardNumber: '4242424242424242',
  expiry: '1230',
  cvv: '123',
};

export async function openApp(page: Page, hash = '#/'): Promise<void> {
  await page.goto(INDEX_URL + hash);
  await expect(page.locator('#app .page')).toBeVisible();
}

export async function startBooking(page: Page, hotelId = 'h1', roomName = 'Classic Double'): Promise<void> {
  await openApp(page, `#/hotel/${hotelId}`);
  await page.locator('.room', { hasText: roomName }).getByRole('button', { name: 'Select room' }).click();
  await expect(page.getByRole('heading', { name: /Step 1/ })).toBeVisible();
}

export async function continueToNextStep(page: Page): Promise<void> {
  await page.getByRole('button', { name: /Continue/ }).click();
}

export async function fillGuest(page: Page, guest: Partial<typeof GUEST> = GUEST): Promise<void> {
  if (guest.firstName !== undefined) await page.getByLabel('First name').fill(guest.firstName);
  if (guest.lastName !== undefined) await page.getByLabel('Last name').fill(guest.lastName);
  if (guest.email !== undefined) await page.getByLabel('Email').fill(guest.email);
  if (guest.phone !== undefined) await page.getByLabel('Phone').fill(guest.phone);
}

export async function fillPayment(page: Page, card: Partial<typeof CARD> = CARD): Promise<void> {
  if (card.cardName !== undefined) await page.getByLabel('Name on card').fill(card.cardName);
  if (card.cardNumber !== undefined) await page.getByLabel('Card number').fill(card.cardNumber);
  if (card.expiry !== undefined) await page.getByLabel('Expiry (MM/YY)').fill(card.expiry);
  if (card.cvv !== undefined) await page.getByLabel('CVV').fill(card.cvv);
}

export async function goToPaymentStep(page: Page): Promise<void> {
  await startBooking(page);
  await continueToNextStep(page);
  await expect(page.getByRole('heading', { name: /Step 2/ })).toBeVisible();
  await fillGuest(page);
  await continueToNextStep(page);
  await expect(page.getByRole('heading', { name: /Step 3/ })).toBeVisible();
}

export const money = (text: string): number => Number(text.replace(/[^0-9.]/g, ''));
