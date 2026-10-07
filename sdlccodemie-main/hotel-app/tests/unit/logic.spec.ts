import { test, expect } from '@playwright/test';
import L from '../../js/logic';
import D from '../../js/data';
import type { Hotel } from '../../js/data';
import type { BookingState } from '../../js/logic';

const H = D.HOTELS;
const ids = (list: Hotel[]): string[] => list.map((h) => h.id);

/* ---------- escaping / formatting ---------- */

test('escapeHtml neutralises markup and quotes', () => {
  expect(L.escapeHtml('<img src=x onerror="a()">')).toBe('&lt;img src=x onerror=&quot;a()&quot;&gt;');
  expect(L.escapeHtml("O'Neil & Co")).toBe('O&#39;Neil &amp; Co');
  expect(L.escapeHtml(null)).toBe('');
  expect(L.escapeHtml(42)).toBe('42');
});

test('formatCurrency and plural', () => {
  expect(L.formatCurrency(1234.5)).toBe('$1,234.50');
  expect(L.plural(1, 'night')).toBe('1 night');
  expect(L.plural(3, 'night')).toBe('3 nights');
  expect(L.plural(0, 'guest')).toBe('0 guests');
});

/* ---------- dates ---------- */

test('parseISODate accepts real dates only', () => {
  expect(L.parseISODate('2030-02-28')).not.toBe(null);
  expect(L.parseISODate('2030-02-30')).toBe(null);
  expect(L.parseISODate('2030-13-01')).toBe(null);
  expect(L.parseISODate('30-02-2030')).toBe(null);
  expect(L.parseISODate('')).toBe(null);
  expect(L.parseISODate(undefined)).toBe(null);
});

test('nightsBetween counts nights, including month/leap/DST boundaries', () => {
  expect(L.nightsBetween('2030-01-10', '2030-01-13')).toBe(3);
  expect(L.nightsBetween('2030-01-30', '2030-02-02')).toBe(3);
  expect(L.nightsBetween('2028-02-28', '2028-03-01')).toBe(2);
  expect(L.nightsBetween('2030-03-09', '2030-03-11')).toBe(2);
  expect(L.nightsBetween('2030-10-26', '2030-10-28')).toBe(2);
});

test('nightsBetween returns 0 for same-day, reversed or invalid input', () => {
  expect(L.nightsBetween('2030-01-10', '2030-01-10')).toBe(0);
  expect(L.nightsBetween('2030-01-10', '2030-01-09')).toBe(0);
  expect(L.nightsBetween('nope', '2030-01-09')).toBe(0);
  expect(L.nightsBetween(null, null)).toBe(0);
});

test('addDays and toISODate', () => {
  expect(L.addDays('2030-01-31', 1)).toBe('2030-02-01');
  expect(L.addDays('2028-02-28', 1)).toBe('2028-02-29');
  expect(L.addDays('2030-01-01', -1)).toBe('2029-12-31');
  expect(L.addDays('bad', 1)).toBe(null);
  expect(L.toISODate(new Date(2030, 0, 5))).toBe('2030-01-05');
});

test('formatDate renders a readable date and tolerates bad input', () => {
  expect(L.formatDate('2030-01-05')).toMatch(/Jan 5, 2030/);
  expect(L.formatDate('x')).toBe('');
});

/* ---------- lookups ---------- */

test('minPrice, findHotel, findRoom', () => {
  expect(L.minPrice(L.findHotel(H, 'h1')!)).toBe(180);
  expect(L.findHotel(H, 'nope')!).toBe(null);
  const hotel = L.findHotel(H, 'h2')!;
  expect(L.findRoom(hotel, 'h2-r2')!.name).toBe('Executive Room');
  expect(L.findRoom(hotel, 'h1-r1')).toBe(null);
  expect(L.findRoom(null, 'h1-r1')).toBe(null);
});

test('availableRooms keeps rooms that fit the party', () => {
  const h = L.findHotel(H, 'h1')!;
  expect(L.availableRooms(h, 2).length).toBe(3);
  expect(L.availableRooms(h, 4).map((r) => r.id)).toEqual(['h1-r3']);
  expect(L.availableRooms(h, 5).length).toBe(0);
  expect(L.availableRooms(h, undefined).length).toBe(3);
});

/* ---------- filtering ---------- */

test('filterHotels with no criteria returns everything', () => {
  expect(L.filterHotels(H).length).toBe(H.length);
  expect(L.filterHotels(H, {}).length).toBe(H.length);
});

test('filter by text matches name, city and country, case-insensitively', () => {
  expect(ids(L.filterHotels(H, { query: 'PARIS' }))).toEqual(['h1']);
  expect(ids(L.filterHotels(H, { query: 'harbor' }))).toEqual(['h3']);
  expect(ids(L.filterHotels(H, { query: '  japan ' }))).toEqual(['h2']);
  expect(L.filterHotels(H, { query: 'atlantis' })).toEqual([]);
});

test('filter by price uses the hotel from-price inclusively', () => {
  expect(ids(L.filterHotels(H, { maxPrice: 85 }))).toEqual(['h4', 'h9']);
  expect(L.filterHotels(H, { maxPrice: 84 }).every((h) => L.minPrice(h) <= 84)).toBeTruthy();
  expect(ids(L.filterHotels(H, { minPrice: 290 }))).toEqual(['h5', 'h8']);
  expect(ids(L.filterHotels(H, { minPrice: 200, maxPrice: 210 }))).toEqual(['h2']);
});

test('filter by stars and guest rating', () => {
  expect(L.filterHotels(H, { minStars: 5 }).every((h) => h.stars === 5)).toBeTruthy();
  expect(L.filterHotels(H, { minStars: 5 }).length).toBe(3);
  expect(L.filterHotels(H, { minRating: 4.5 }).every((h) => h.rating >= 4.5)).toBeTruthy();
  expect(L.filterHotels(H, { minStars: 0, minRating: 0 }).length).toBe(H.length);
});

test('amenity filter requires ALL selected amenities', () => {
  const pool = L.filterHotels(H, { amenities: ['pool'] });
  expect(pool.length > 0 && pool.every((h) => h.amenities.includes('pool'))).toBeTruthy();
  const both = L.filterHotels(H, { amenities: ['pool', 'pet'] });
  expect(ids(both)).toEqual(['h4']);
  expect(L.filterHotels(H, { amenities: ['pet', 'beach'] })).toEqual([]);
});

test('guest filter hides hotels with no room big enough', () => {
  expect(L.filterHotels(H, { guests: 6 }).length).toBe(2);
  expect(ids(L.filterHotels(H, { guests: 4 }))).toEqual(ids(H).filter((id: string) => id !== 'h6'));
  expect(L.filterHotels(H, { guests: 7 }).length).toBe(0);
});

test('free-cancellation filter', () => {
  const noRefund = [{
    ...L.findHotel(H, 'h1')!,
    rooms: [{ ...L.findHotel(H, 'h1')!.rooms[0], refundable: false }],
  }];
  expect(L.filterHotels(noRefund, { freeCancellation: true }).length).toBe(0);
  expect(L.filterHotels(noRefund, { freeCancellation: false }).length).toBe(1);
  expect(L.filterHotels(H, { freeCancellation: true }).length).toBe(H.length);
});

test('filters combine with AND semantics and do not mutate input', () => {
  const before = ids(H);
  const r = L.filterHotels(H, { query: 'a', minStars: 4, maxPrice: 300, amenities: ['wifi'], minRating: 4.4 });
  expect(r.every((h) => h.stars >= 4 && L.minPrice(h) <= 300 && h.rating >= 4.4)).toBeTruthy();
  expect(ids(H)).toEqual(before);
});

/* ---------- sorting ---------- */

test('sortHotels by price, rating and stars', () => {
  const asc = L.sortHotels(H, 'price-asc').map(L.minPrice);
  expect(asc).toEqual([...asc].sort((a, b) => a - b));
  const desc = L.sortHotels(H, 'price-desc').map(L.minPrice);
  expect(desc).toEqual([...desc].sort((a, b) => b - a));
  const rating = L.sortHotels(H, 'rating').map((h) => h.rating);
  expect(rating).toEqual([...rating].sort((a, b) => b - a));
  expect(L.sortHotels(H, 'stars')[0].stars).toBe(5);
});

test('sortHotels is stable, non-mutating and tolerant of unknown keys', () => {
  const before = ids(H);
  const sorted = L.sortHotels(H, 'stars');
  const fives = sorted.filter((h) => h.stars === 5).map((h) => h.id);
  expect(fives).toEqual(ids(H).filter((id) => fives.includes(id)));
  expect(ids(H)).toEqual(before);
  expect(ids(L.sortHotels(H, 'recommended'))).toEqual(before);
  expect(ids(L.sortHotels(H, 'constructor'))).toEqual(before);
  expect(L.sortHotels(H, 'recommended')).not.toBe(H);
});

test('filter + sort on 5,000 hotels stays well inside the 200ms budget', () => {
  const big: Hotel[] = [];
  for (let i = 0; i < 556; i++) H.forEach((h) => big.push(Object.assign({}, h, { id: h.id + '-' + i })));
  expect(big.length >= 5000).toBeTruthy();
  const start = performance.now();
  const r = L.sortHotels(L.filterHotels(big, { query: 'a', minStars: 3, maxPrice: 500, amenities: ['wifi'], guests: 2 }), 'price-asc');
  const ms = performance.now() - start;
  expect(r.length > 0).toBeTruthy();
  expect(ms < 200, `took ${ms.toFixed(1)}ms`).toBeTruthy();
});

/* ---------- pricing ---------- */

test('priceBreakdown computes subtotal, tax and total', () => {
  const b = L.priceBreakdown({ pricePerNight: 100, nights: 3, rooms: 2, taxRate: 0.1 });
  expect(b.subtotal).toBe(600);
  expect(b.taxes).toBe(60);
  expect(b.total).toBe(660);
});

test('priceBreakdown defaults to one room and the standard tax rate', () => {
  const b = L.priceBreakdown({ pricePerNight: 180, nights: 2 });
  expect(b.rooms).toBe(1);
  expect(b.taxRate).toBe(0.12);
  expect(b.subtotal).toBe(360);
  expect(b.taxes).toBe(43.2);
  expect(b.total).toBe(403.2);
});

test('priceBreakdown avoids floating point drift', () => {
  const b = L.priceBreakdown({ pricePerNight: 19.99, nights: 3, rooms: 1, taxRate: 0.07 });
  expect(b.subtotal).toBe(59.97);
  expect(b.taxes).toBe(4.2);
  expect(b.total).toBe(64.17);
  expect(L.priceBreakdown({ pricePerNight: 100, nights: 0 }).total).toBe(0);
});

/* ---------- guest validation ---------- */

const goodGuest = { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', phone: '+1 (555) 010-1234', requests: '' };

test('validateGuest accepts a complete, valid guest', () => {
  const r = L.validateGuest(goodGuest);
  expect(r.valid).toBe(true);
  expect(r.errors).toEqual({});
});

test('validateGuest reports every missing required field', () => {
  const r = L.validateGuest({});
  expect(r.valid).toBe(false);
  expect(Object.keys(r.errors).sort()).toEqual(['email', 'firstName', 'lastName', 'phone']);
  expect(L.validateGuest(null).valid).toBe(false);
});

test('validateGuest rejects whitespace-only names', () => {
  expect(L.validateGuest({ ...goodGuest, firstName: '   ' }).errors.firstName).toBeTruthy();
});

test('validateGuest email rules', () => {
  for (const bad of ['plain', 'a@b', 'a@b.', '@x.com', 'a b@x.com', 'a@b.c']) {
    expect(L.validateGuest({ ...goodGuest, email: bad }).errors.email, bad).toBeTruthy();
  }
  for (const ok of ['a@b.co', 'first.last+tag@sub.example.org']) {
    expect(L.validateGuest({ ...goodGuest, email: ok }).errors.email, ok).toBe(undefined);
  }
});

test('validateGuest phone rules', () => {
  for (const bad of ['12345', 'abc-defg-hij', '1234567890123456', '555 010 12x4']) {
    expect(L.validateGuest({ ...goodGuest, phone: bad }).errors.phone, bad).toBeTruthy();
  }
  for (const ok of ['5550101234', '+44 20 7946 0958', '(555) 010-1234']) {
    expect(L.validateGuest({ ...goodGuest, phone: ok }).errors.phone, ok).toBe(undefined);
  }
});

test('validateGuest caps special requests length', () => {
  expect(L.validateGuest({ ...goodGuest, requests: 'x'.repeat(301) }).errors.requests).toBeTruthy();
  expect(L.validateGuest({ ...goodGuest, requests: 'x'.repeat(300) }).valid).toBe(true);
});

/* ---------- payment ---------- */

const NOW = new Date(2030, 5, 15); // June 2030
const goodPay = { cardName: 'Ada Lovelace', cardNumber: '4242 4242 4242 4242', expiry: '12/30', cvv: '123' };

test('luhnValid accepts well-known test numbers and rejects typos', () => {
  for (const n of ['4242424242424242', '4242 4242 4242 4242', '5555555555554444', '378282246310005', '6011111111111117']) {
    expect(L.luhnValid(n), n).toBe(true);
  }
  for (const n of ['4242424242424241', '1234567890123456', '424242', '', 'abcd', '42424242424242424242']) {
    expect(L.luhnValid(n), n).toBe(false);
  }
});

test('validatePayment accepts the demo card', () => {
  expect(L.validatePayment(goodPay, NOW).valid).toBe(true);
});

test('validatePayment reports all missing fields', () => {
  const r = L.validatePayment({}, NOW);
  expect(Object.keys(r.errors).sort()).toEqual(['cardName', 'cardNumber', 'cvv', 'expiry']);
});

test('validatePayment expiry: format, month range, past and current month', () => {
  const v = (expiry: string) => L.validatePayment({ ...goodPay, expiry }, NOW).errors.expiry;
  expect(v('1230')).toBeTruthy();
  expect(v('13/30')).toBeTruthy();
  expect(v('00/30')).toBeTruthy();
  expect(v('05/30')).toBeTruthy();
  expect(v('12/29')).toBeTruthy();
  expect(v('06/30')).toBe(undefined);
  expect(v('07/30')).toBe(undefined);
  expect(v('01/31')).toBe(undefined);
});

test('validatePayment cvv accepts 3 or 4 digits only', () => {
  const v = (cvv: string) => L.validatePayment({ ...goodPay, cvv }, NOW).errors.cvv;
  expect(v('123')).toBe(undefined);
  expect(v('1234')).toBe(undefined);
  expect(v('12')).toBeTruthy();
  expect(v('12345')).toBeTruthy();
  expect(v('12a')).toBeTruthy();
});

test('validatePayment rejects bad card numbers', () => {
  expect(L.validatePayment({ ...goodPay, cardNumber: '4242 4242 4242 4241' }, NOW).errors.cardNumber).toBeTruthy();
});

test('card input formatters', () => {
  expect(L.formatCardNumber('4242424242424242')).toBe('4242 4242 4242 4242');
  expect(L.formatCardNumber('42a42-4')).toBe('4242 4');
  expect(L.formatCardNumber('4242 4242 4242 4242 4242 999')).toBe('4242 4242 4242 4242 424');
  expect(L.formatCardNumber('')).toBe('');
  expect(L.formatExpiry('1')).toBe('1');
  expect(L.formatExpiry('12')).toBe('12');
  expect(L.formatExpiry('123')).toBe('12/3');
  expect(L.formatExpiry('12/30')).toBe('12/30');
  expect(L.formatExpiry('123099')).toBe('12/30');
  expect(L.cardLast4('4242 4242 4242 1234')).toBe('1234');
});

test('generateBookingRef is deterministic for a seeded rng and well-formed', () => {
  expect(L.generateBookingRef(() => 0)).toBe('HB-AAAAAAAA');
  expect(L.generateBookingRef(() => 0.9999999)).toBe('HB-99999999');
  for (let i = 0; i < 50; i++) expect(L.generateBookingRef()).toMatch(/^HB-[A-HJKMNP-Z2-9]{8}$/);
  const refs = new Set(Array.from({ length: 200 }, () => L.generateBookingRef()));
  expect(refs.size > 190).toBeTruthy();
});

/* ---------- selection validation ---------- */

const TODAY = '2030-06-01';
const hotel1 = L.findHotel(H, 'h1')!;
const selection = (o: Record<string, unknown> = {}) => ({ roomId: 'h1-r1', checkIn: '2030-06-10', checkOut: '2030-06-13', guests: 2, rooms: 1, ...o });

test('validateSelection passes for a valid request', () => {
  expect(L.validateSelection(selection(), hotel1, TODAY)).toEqual({});
});

test('validateSelection: missing or unknown room', () => {
  expect(L.validateSelection(selection({ roomId: null }), hotel1, TODAY).roomId).toBeTruthy();
  expect(L.validateSelection(selection({ roomId: 'zzz' }), hotel1, TODAY).roomId).toBeTruthy();
});

test('validateSelection: date rules', () => {
  const dates = (o: Record<string, unknown>) => L.validateSelection(selection(o), hotel1, TODAY).dates;
  expect(dates({ checkIn: null })).toBeTruthy();
  expect(dates({ checkOut: '2030-06-10' })).toBeTruthy();
  expect(dates({ checkOut: '2030-06-09' })).toBeTruthy();
  expect(dates({ checkIn: '2030-05-31', checkOut: '2030-06-02' })).toBeTruthy();
  expect(dates({ checkOut: '2030-08-01' })).toBeTruthy();
  expect(dates({ checkIn: TODAY, checkOut: '2030-06-02' })).toBe(undefined);
  expect(L.validateSelection(selection({ checkIn: '2020-01-01', checkOut: '2020-01-02' }), hotel1).dates).toBe(undefined);
});

test('validateSelection: guest and room capacity', () => {
  const e = (o: Record<string, unknown>) => L.validateSelection(selection(o), hotel1, TODAY);
  expect(e({ guests: 3 }).guests).toBeTruthy();
  expect(e({ guests: 4, rooms: 2 }).guests).toBe(undefined);
  expect(e({ guests: 0 }).guests).toBeTruthy();
  expect(e({ guests: 1.5 }).guests).toBeTruthy();
  expect(e({ guests: 11 }).guests).toBeTruthy();
  expect(e({ rooms: 0 }).rooms).toBeTruthy();
  expect(e({ rooms: 6 }).rooms).toBeTruthy();
  expect(e({ roomId: 'h1-r2', guests: 4, rooms: 3 }).rooms).toBeTruthy();
});

/* ---------- wizard reducer ---------- */

function start(extra: Partial<Pick<BookingState, 'roomId' | 'guests' | 'rooms' | 'checkIn' | 'checkOut'>> = {}): BookingState {
  return L.bookingReducer(L.initialBooking(), { type: 'START', hotelId: 'h1', roomId: 'h1-r1', checkIn: '2030-06-10', checkOut: '2030-06-13', guests: 2, rooms: 1, ...extra });
}
const next = (s: BookingState): BookingState => L.bookingReducer(s, { type: 'NEXT', hotel: hotel1, today: TODAY });

test('initial state is step 1 with nothing chosen', () => {
  const s = L.initialBooking();
  expect(s.step).toBe(1);
  expect(s.hotelId).toBe(null);
  expect(s.confirmation).toBe(null);
});

test('START seeds the selection and resets everything else', () => {
  const dirty: BookingState = { ...start(), step: 3, guest: { firstName: 'x' } };
  const s = L.bookingReducer(dirty, { type: 'START', hotelId: 'h2', roomId: 'h2-r1' });
  expect(s.step).toBe(1);
  expect(s.hotelId).toBe('h2');
  expect(s.guest).toBe(null);
  expect(s.guests).toBe(1);
});

test('step 1 blocks advance without a room and shows errors', () => {
  const s = next(L.bookingReducer(start({ roomId: null }), { type: 'NEXT', hotel: hotel1, today: TODAY }));
  expect(s.step).toBe(1);
  expect(s.error).toBeTruthy();
  expect(s.errors.roomId).toBeTruthy();
});

test('step 1 advances to guest details when valid', () => {
  const s = next(start());
  expect(s.step).toBe(2);
  expect(s.error).toBe(null);
  expect(s.errors).toEqual({});
});

test('UPDATE changes the selection in step 1 only', () => {
  const s1 = L.bookingReducer(start(), { type: 'UPDATE', roomId: 'h1-r2', guests: 1 });
  expect(s1.roomId).toBe('h1-r2');
  expect(s1.guests).toBe(1);
  expect(s1.checkIn).toBe('2030-06-10');
  const s2 = L.bookingReducer(next(start()), { type: 'UPDATE', roomId: 'h1-r3' });
  expect(s2.roomId).toBe('h1-r1');
  expect(s2.error).toBeTruthy();
});

test('step 2 blocks advance until guest details are valid', () => {
  let s = next(start());
  s = next(s);
  expect(s.step).toBe(2);
  expect(s.errors.firstName && s.errors.email).toBeTruthy();
  s = L.bookingReducer(s, { type: 'SET_GUEST', guest: goodGuest });
  s = next(s);
  expect(s.step).toBe(3);
});

test('SET_GUEST stores a copy of the details', () => {
  const g = { ...goodGuest };
  const s = L.bookingReducer(start(), { type: 'SET_GUEST', guest: g });
  g.firstName = 'Mutated';
  expect(s.guest!.firstName).toBe('Ada');
});

test('BACK moves one step back, keeps data, and stops at step 1', () => {
  let s = L.bookingReducer(next(start()), { type: 'SET_GUEST', guest: goodGuest });
  s = L.bookingReducer(s, { type: 'BACK' });
  expect(s.step).toBe(1);
  expect(s.guest!.email).toBe('ada@example.com');
  expect(L.bookingReducer(s, { type: 'BACK' }).step).toBe(1);
});

function atPayment() {
  let s = L.bookingReducer(next(start()), { type: 'SET_GUEST', guest: goodGuest });
  return next(s);
}

test('NEXT on the payment step is refused (Pay must be used)', () => {
  const s = next(atPayment());
  expect(s.step).toBe(3);
  expect(s.error).toBeTruthy();
});

test('CONFIRM with invalid payment stays on step 3 with field errors', () => {
  const s = L.bookingReducer(atPayment(), { type: 'CONFIRM', payment: { ...goodPay, cvv: '1' }, now: NOW, ref: 'HB-TEST0001' });
  expect(s.step).toBe(3);
  expect(s.errors.cvv).toBeTruthy();
  expect(s.confirmation).toBe(null);
});

test('CONFIRM with valid payment completes the booking and never stores the full card', () => {
  const s = L.bookingReducer(atPayment(), { type: 'CONFIRM', payment: goodPay, now: NOW, ref: 'HB-TEST0001' });
  expect(s.step).toBe(4);
  expect(s.confirmation!.ref).toBe('HB-TEST0001');
  expect(s.confirmation!.confirmedAt).toBe(NOW.toISOString());
  expect(s.payment).toEqual({ last4: '4242', cardName: 'Ada Lovelace' });
  const dump = JSON.stringify(s);
  expect(!dump.includes('4242 4242 4242 4242')).toBeTruthy();
  expect(!dump.includes('"cvv"')).toBeTruthy();
});

test('CONFIRM is rejected before step 3', () => {
  const s = L.bookingReducer(start(), { type: 'CONFIRM', payment: goodPay, now: NOW, ref: 'HB-X' });
  expect(s.step).toBe(1);
  expect(s.error).toBeTruthy();
});

test('RESET returns to a clean state; unknown actions are ignored', () => {
  const done = L.bookingReducer(atPayment(), { type: 'CONFIRM', payment: goodPay, now: NOW, ref: 'HB-X' });
  expect(L.bookingReducer(done, { type: 'RESET' })).toEqual(L.initialBooking());
  expect(L.bookingReducer(done, { type: '???' })).toBe(done);
});

test('reducer never mutates the previous state', () => {
  const s0 = start();
  const snapshot = JSON.stringify(s0);
  next(s0);
  L.bookingReducer(s0, { type: 'UPDATE', guests: 5 });
  L.bookingReducer(s0, { type: 'SET_GUEST', guest: goodGuest });
  expect(JSON.stringify(s0)).toBe(snapshot);
});
