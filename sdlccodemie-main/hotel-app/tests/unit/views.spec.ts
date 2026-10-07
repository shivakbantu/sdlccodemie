import { test, expect } from '@playwright/test';
import L from '../../js/logic';
import D from '../../js/data';
import V from '../../js/views';
import type { BookingState } from '../../js/logic';
import Confetti from '../../js/confetti';

const hotel = L.findHotel(D.HOTELS, 'h1')!;
const room = hotel.rooms[0];
const count = (str: string, re: RegExp): number => (str.match(re) || []).length;

test('hotelCard shows name, location, price, and links to the detail page', () => {
  const html = V.hotelCard(hotel, { nights: 3 });
  expect(html).toMatch(/Le Petit Lumière/);
  expect(html).toMatch(/Paris, France/);
  expect(html).toMatch(/\$180\.00/);
  expect(html).toMatch(/\$540\.00 for 3 nights/);
  expect(html).toMatch(/href="#\/hotel\/h1"/);
});

test('hotelCard favorite state is reflected for assistive tech', () => {
  expect(V.hotelCard(hotel, { favorite: true })).toMatch(/aria-pressed="true"/);
  expect(V.hotelCard(hotel, { favorite: false })).toMatch(/aria-pressed="false"/);
});

test('hotelCard omits the total when there are no nights', () => {
  expect(V.hotelCard(hotel, { nights: 0 })).not.toMatch(/for \d+ night/);
});

test('hotelCard escapes untrusted text', () => {
  const evil = { ...hotel, name: '<script>alert(1)</script>', city: '"><img src=x>' };
  const html = V.hotelCard(evil, {});
  expect(html).not.toMatch(/<script>/);
  expect(html).not.toMatch(/<img src=x>/);
  expect(html).toMatch(/&lt;script&gt;/);
});

test('hotelList renders one card per hotel', () => {
  const html = V.hotelList(D.HOTELS, { favorites: ['h2'] });
  expect(count(html, /class="card"/g)).toBe(D.HOTELS.length);
  expect(count(html, /aria-pressed="true"/g)).toBe(1);
});

test('hotelList shows an empty state with a reset action', () => {
  const html = V.hotelList([]);
  expect(html).toMatch(/No hotels match/);
  expect(html).toMatch(/data-action="reset-filters"/);
});

test('resultsCount pluralises', () => {
  expect(V.resultsCount(1, 0)).toMatch(/1 hotel<\/strong> found/);
  expect(V.resultsCount(5, 2)).toMatch(/5 hotels<\/strong> found · 2 nights/);
});

test('homePage contains all filter controls and the chosen values', () => {
  const html = V.homePage({
    filters: { query: 'par"is', maxPrice: 300, minStars: 4, minRating: 4.5, amenities: ['pool'], freeCancellation: true },
    sort: 'price-asc', search: { checkIn: '2030-06-10', checkOut: '2030-06-12', guests: 3 }, today: '2030-06-01'
  });
  for (const id of ['f-query', 'f-checkIn', 'f-checkOut', 'f-guests', 'f-maxPrice', 'f-stars', 'f-rating', 'f-free', 'f-sort', 'results', 'count']) {
    expect(html.includes('id="' + id + '"'), id).toBeTruthy();
  }
  expect(count(html, /name="amenity"/g)).toBe(Object.keys(D.AMENITIES).length);
  expect(html).toMatch(/value="pool" checked/);
  expect(html).toMatch(/value="par&quot;is"/);
  expect(html).toMatch(/<option value="price-asc" selected>/);
  expect(html).toMatch(/<option value="3" selected>3 guests/);
  expect(html).toMatch(/min="2030-06-01"/);
});

test('roomCard shows scarcity and policy badges', () => {
  const scarce = V.roomCard({ ...room, roomsLeft: 1 }, { nights: 2 });
  expect(scarce).toMatch(/Only 1 left!/);
  expect(scarce).toMatch(/Free cancellation/);
  expect(scarce).toMatch(/\$360\.00 for 2 nights/);
  const plenty = V.roomCard({ ...room, roomsLeft: 9, refundable: false });
  expect(plenty).not.toMatch(/left!/);
  expect(plenty).toMatch(/Non-refundable/);
  expect(plenty).toMatch(/data-action="select-room" data-room-id="h1-r1"/);
});

test('hotelDetail lists rooms that fit the party and explains when none do', () => {
  const two = V.hotelDetail(hotel, { guests: 2, nights: 2 });
  expect(count(two, /class="room"/g)).toBe(3);
  const four = V.hotelDetail(hotel, { guests: 4, nights: 2 });
  expect(count(four, /class="room"/g)).toBe(1);
  const none = V.hotelDetail(hotel, { guests: 9, nights: 2 });
  expect(count(none, /class="room"/g)).toBe(0);
  expect(none).toMatch(/No room fits 9 guests/);
});

test('stepper marks active and completed steps', () => {
  const s2 = V.stepper(2);
  expect(count(s2, /is-done/g)).toBe(1);
  expect(count(s2, /is-active/g)).toBe(1);
  expect(s2).toMatch(/aria-current="step"/);
  expect(count(V.stepper(3), /is-done/g)).toBe(2);
});

test('field renders an accessible error message', () => {
  const ok = V.field({ label: 'Email', name: 'email', value: 'a@b.co' });
  expect(ok).not.toMatch(/aria-invalid/);
  const bad = V.field({ label: 'Email', name: 'email', value: '"><x', error: 'Enter a valid email address' });
  expect(bad).toMatch(/aria-invalid="true"/);
  expect(bad).toMatch(/role="alert"/);
  expect(bad).toMatch(/has-error/);
  expect(bad).not.toMatch(/"><x/);
});

const baseBooking: BookingState = {
  ...L.initialBooking(), hotelId: 'h1', roomId: 'h1-r1', checkIn: '2030-06-10', checkOut: '2030-06-12', guests: 2, rooms: 1,
  guest: { firstName: 'Ada', lastName: '<b>Lovelace</b>', email: 'ada@example.com' }
};
const breakdown = L.priceBreakdown({ pricePerNight: 180, nights: 2, rooms: 1, taxRate: 0.12 });
const ctx = { today: '2030-06-01', breakdown, nights: 2 };

test('bookingPage step 1 shows every room option with the current one checked', () => {
  const html = V.bookingPage(hotel, baseBooking, ctx);
  expect(count(html, /type="radio"/g)).toBe(3);
  expect(count(html, / checked>/g)).toBe(1);
  expect(html).toMatch(/Step 1 · Choose your room/);
  expect(html).toMatch(/data-action="wiz-cancel"/);
  expect(html).toMatch(/data-action="wiz-next"/);
});

test('bookingPage step 1 surfaces validation errors', () => {
  const html = V.bookingPage(hotel, { ...baseBooking, errors: { roomId: 'Please choose a room', dates: 'Check-out must be after check-in' }, error: 'Please fix the highlighted fields' }, ctx);
  expect(html).toMatch(/Please choose a room/);
  expect(html).toMatch(/Check-out must be after check-in/);
  expect(html).toMatch(/class="form-error"/);
});

test('bookingPage step 2 prefills guest details and offers Back', () => {
  const html = V.bookingPage(hotel, { ...baseBooking, step: 2 }, ctx);
  expect(html).toMatch(/Step 2 · Guest details/);
  expect(html).toMatch(/value="ada@example\.com"/);
  expect(html).toMatch(/data-action="wiz-back"/);
});

test('bookingPage step 3 shows the pay button with the total and the demo notice', () => {
  const html = V.bookingPage(hotel, { ...baseBooking, step: 3 }, ctx);
  expect(html).toMatch(/Step 3 · Payment/);
  expect(html).toMatch(/Pay \$403\.20/);
  expect(html).toMatch(/No real payment/);
  expect(html).toMatch(/data-action="wiz-pay"/);
  expect(html).not.toMatch(/data-action="wiz-next"/);
});

test('bookingPage step 3 restores the draft so a failed attempt keeps what was typed', () => {
  const html = V.bookingPage(hotel, { ...baseBooking, step: 3, errors: { cvv: 'Enter 3 or 4 digits' } }, { ...ctx, paymentDraft: { cardName: 'Ada', cardNumber: '4242 4242 4242 4242', expiry: '12/30', cvv: '1' } });
  expect(html).toMatch(/value="4242 4242 4242 4242"/);
  expect(html).toMatch(/Enter 3 or 4 digits/);
});

test('summary computes the price lines and asks for a room when none is chosen', () => {
  const html = V.summary(hotel, room, baseBooking, breakdown);
  expect(html).toMatch(/\$180\.00 × 2 nights × 1 room/);
  expect(html).toMatch(/Taxes \(12%\)/);
  expect(html).toMatch(/\$403\.20/);
  expect(V.summary(hotel, null, baseBooking, null)).toMatch(/Select a room/);
});

test('confirmation page shows the reference, hides the stepper, and escapes guest input', () => {
  const done: BookingState = { ...baseBooking, step: 4, confirmation: { ref: 'HB-ABCD2345', confirmedAt: '2030-06-01T00:00:00.000Z' }, payment: { last4: '4242', cardName: 'Ada' } };
  const html = V.bookingPage(hotel, done, ctx);
  expect(html).toMatch(/Booking confirmed!/);
  expect(html).toMatch(/HB-ABCD2345/);
  expect(html).toMatch(/card ending 4242/);
  expect(html).toMatch(/&lt;b&gt;Lovelace&lt;\/b&gt;/);
  expect(html).not.toMatch(/<b>Lovelace/);
  expect(html).not.toMatch(/class="stepper"/);
  expect(html).not.toMatch(/id="summary"/);
  expect(html).toMatch(/data-action="copy-ref"/);
  expect(html).toMatch(/data-action="new-booking"/);
});

/* ---------- confetti ---------- */

test('createParticles makes the requested number of in-bounds particles', () => {
  const parts = Confetti.createParticles(100, 800);
  expect(parts.length).toBe(100);
  for (const p of parts) {
    expect(p.x >= 0 && p.x <= 800).toBeTruthy();
    expect(p.y < 0, 'starts above the viewport').toBeTruthy();
    expect(Confetti.COLORS.includes(p.color)).toBeTruthy();
    expect(p.life).toBe(1);
  }
});

test('stepParticle applies gravity, motion and fade', () => {
  const p = { x: 0, y: 0, vx: 1, vy: 1, rot: 0, vr: 0.1, life: 1 };
  Confetti.stepParticle(p, 1);
  expect(p.vy > 1).toBeTruthy();
  expect(p.x).toBe(1);
  expect(p.y > 1).toBeTruthy();
  expect(p.life < 1).toBeTruthy();
});

test('launch is a safe no-op outside the browser', () => {
  const stop = Confetti.launch();
  expect(typeof stop).toBe('function');
  stop();
});
