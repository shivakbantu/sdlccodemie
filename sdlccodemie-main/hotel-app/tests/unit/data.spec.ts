import { test, expect } from '@playwright/test';
import D from '../../js/data';

test('mock data has hotels with unique ids', () => {
  expect(D.HOTELS.length >= 8).toBeTruthy();
  const ids = D.HOTELS.map((h) => h.id);
  expect(new Set(ids).size).toBe(ids.length);
});

test('every hotel has the fields the UI depends on', () => {
  for (const h of D.HOTELS) {
    expect(h.name && h.city && h.country && h.description, `${h.id} text fields`).toBeTruthy();
    expect(h.stars >= 1 && h.stars <= 5, `${h.id} stars`).toBeTruthy();
    expect(h.rating >= 0 && h.rating <= 5, `${h.id} rating`).toBeTruthy();
    expect(Number.isFinite(h.hue) && h.emoji, `${h.id} cover`).toBeTruthy();
    expect(h.rooms.length >= 1, `${h.id} rooms`).toBeTruthy();
    for (const a of h.amenities) expect(D.AMENITIES[a], `${h.id} unknown amenity ${a}`).toBeTruthy();
  }
});

test('room ids are globally unique and well-formed', () => {
  const ids = D.HOTELS.flatMap((h) => h.rooms.map((r) => r.id));
  expect(new Set(ids).size).toBe(ids.length);
  for (const h of D.HOTELS) {
    for (const r of h.rooms) {
      expect(r.id.startsWith(h.id + '-'), `${r.id} prefix`).toBeTruthy();
      expect(r.pricePerNight > 0 && r.maxGuests >= 1 && r.roomsLeft >= 1, `${r.id} numbers`).toBeTruthy();
      expect(typeof r.refundable).toBe('boolean');
    }
  }
});

test('every hotel price sits inside the price slider range', () => {
  for (const h of D.HOTELS) {
    const from = Math.min(...h.rooms.map((r) => r.pricePerNight));
    expect(from >= D.PRICE_RANGE.min && from <= D.PRICE_RANGE.max, `${h.id} from-price ${from}`).toBeTruthy();
  }
});

test('data set exercises the filters (cheap and luxury, refundable and not)', () => {
  expect(D.HOTELS.some((h) => h.stars === 5)).toBeTruthy();
  expect(D.HOTELS.some((h) => h.stars === 3)).toBeTruthy();
  expect(D.HOTELS.some((h) => h.amenities.includes('pet'))).toBeTruthy();
  expect(D.HOTELS.some((h) => h.rooms.some((r) => r.maxGuests >= 5))).toBeTruthy();
});
