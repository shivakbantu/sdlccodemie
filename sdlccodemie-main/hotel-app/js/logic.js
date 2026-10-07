(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HotelLogic = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DAY_MS = 86400000;
  var DEFAULT_TAX_RATE = 0.12;
  var LIMITS = { maxGuests: 10, maxRooms: 5, maxNights: 30 };
  var REF_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  var currencyFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  function isNum(v) { return typeof v === 'number' && isFinite(v); }
  function isInt(v) { return isNum(v) && Math.floor(v) === v; }
  function trim(v) { return typeof v === 'string' ? v.trim() : ''; }
  function has(obj, key) { return Object.prototype.hasOwnProperty.call(obj, key); }

  function escapeHtml(value) {
    var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return map[c]; });
  }

  function formatCurrency(n) { return currencyFmt.format(n); }
  function plural(n, word) { return n + ' ' + word + (n === 1 ? '' : 's'); }

  /* ---------- dates ---------- */

  function parseISODate(s) {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    var p = s.split('-').map(Number);
    var t = Date.UTC(p[0], p[1] - 1, p[2]);
    var d = new Date(t);
    if (d.getUTCFullYear() !== p[0] || d.getUTCMonth() !== p[1] - 1 || d.getUTCDate() !== p[2]) return null;
    return t;
  }

  function toISODate(date) {
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }

  function addDays(iso, n) {
    var t = parseISODate(iso);
    return t === null ? null : new Date(t + n * DAY_MS).toISOString().slice(0, 10);
  }

  function nightsBetween(checkIn, checkOut) {
    var a = parseISODate(checkIn);
    var b = parseISODate(checkOut);
    if (a === null || b === null) return 0;
    var n = Math.round((b - a) / DAY_MS);
    return n > 0 ? n : 0;
  }

  function formatDate(iso) {
    var t = parseISODate(iso);
    if (t === null) return '';
    return new Date(t).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  }

  /* ---------- hotels: search, filter, sort ---------- */

  function minPrice(hotel) {
    return hotel.rooms.reduce(function (m, r) { return Math.min(m, r.pricePerNight); }, Infinity);
  }

  function findHotel(hotels, id) {
    for (var i = 0; i < hotels.length; i++) if (hotels[i].id === id) return hotels[i];
    return null;
  }

  function findRoom(hotel, roomId) {
    if (!hotel) return null;
    for (var i = 0; i < hotel.rooms.length; i++) if (hotel.rooms[i].id === roomId) return hotel.rooms[i];
    return null;
  }

  function availableRooms(hotel, guests) {
    var g = isNum(guests) && guests > 0 ? guests : 1;
    return hotel.rooms.filter(function (r) { return r.maxGuests >= g; });
  }

  function filterHotels(hotels, f) {
    f = f || {};
    var q = trim(f.query).toLowerCase();
    var wanted = f.amenities || [];
    return hotels.filter(function (h) {
      var from = minPrice(h);
      if (q && (h.name + ' ' + h.city + ' ' + h.country).toLowerCase().indexOf(q) === -1) return false;
      if (isNum(f.minPrice) && from < f.minPrice) return false;
      if (isNum(f.maxPrice) && from > f.maxPrice) return false;
      if (isNum(f.minStars) && h.stars < f.minStars) return false;
      if (isNum(f.minRating) && h.rating < f.minRating) return false;
      if (wanted.length && !wanted.every(function (a) { return h.amenities.indexOf(a) !== -1; })) return false;
      if (isNum(f.guests) && f.guests > 0 && !h.rooms.some(function (r) { return r.maxGuests >= f.guests; })) return false;
      if (f.freeCancellation && !h.rooms.some(function (r) { return r.refundable; })) return false;
      return true;
    });
  }

  var COMPARATORS = {
    'price-asc': function (a, b) { return minPrice(a) - minPrice(b); },
    'price-desc': function (a, b) { return minPrice(b) - minPrice(a); },
    rating: function (a, b) { return b.rating - a.rating; },
    stars: function (a, b) { return b.stars - a.stars; }
  };

  function sortHotels(hotels, key) {
    if (!has(COMPARATORS, key)) return hotels.slice();
    var cmp = COMPARATORS[key];
    return hotels
      .map(function (h, i) { return { h: h, i: i }; })
      .sort(function (x, y) { return cmp(x.h, y.h) || x.i - y.i; })
      .map(function (x) { return x.h; });
  }

  /* ---------- pricing ---------- */

  function priceBreakdown(o) {
    var rooms = o.rooms == null ? 1 : o.rooms;
    var nights = o.nights || 0;
    var taxRate = o.taxRate == null ? DEFAULT_TAX_RATE : o.taxRate;
    var subtotalC = Math.round(o.pricePerNight * 100) * nights * rooms;
    var taxC = Math.round(subtotalC * taxRate);
    return {
      pricePerNight: o.pricePerNight,
      nights: nights,
      rooms: rooms,
      taxRate: taxRate,
      subtotal: subtotalC / 100,
      taxes: taxC / 100,
      total: (subtotalC + taxC) / 100
    };
  }

  /* ---------- validation ---------- */

  function validateGuest(g) {
    g = g || {};
    var e = {};
    if (!trim(g.firstName)) e.firstName = 'First name is required';
    else if (trim(g.firstName).length > 50) e.firstName = 'First name is too long';
    if (!trim(g.lastName)) e.lastName = 'Last name is required';
    else if (trim(g.lastName).length > 50) e.lastName = 'Last name is too long';
    if (!trim(g.email)) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trim(g.email))) e.email = 'Enter a valid email address';
    var phone = trim(g.phone);
    if (!phone) e.phone = 'Phone number is required';
    else if (!/^[+()\d\s-]+$/.test(phone) || phone.replace(/\D/g, '').length < 7 || phone.replace(/\D/g, '').length > 15) {
      e.phone = 'Enter a valid phone number';
    }
    if (trim(g.requests).length > 300) e.requests = 'Keep special requests under 300 characters';
    return { valid: Object.keys(e).length === 0, errors: e };
  }

  function luhnValid(number) {
    var d = String(number).replace(/\D/g, '');
    if (d.length < 13 || d.length > 19) return false;
    var sum = 0;
    var alt = false;
    for (var i = d.length - 1; i >= 0; i--) {
      var n = Number(d[i]);
      if (alt) { n *= 2; if (n > 9) n -= 9; }
      sum += n;
      alt = !alt;
    }
    return sum % 10 === 0;
  }

  function validatePayment(p, now) {
    p = p || {};
    now = now || new Date();
    var e = {};
    if (!trim(p.cardName)) e.cardName = 'Name on card is required';
    if (!trim(p.cardNumber)) e.cardNumber = 'Card number is required';
    else if (!luhnValid(p.cardNumber)) e.cardNumber = 'Enter a valid card number';
    var m = /^(\d{2})\/(\d{2})$/.exec(trim(p.expiry));
    if (!m) e.expiry = 'Use MM/YY';
    else {
      var month = Number(m[1]);
      var year = 2000 + Number(m[2]);
      if (month < 1 || month > 12) e.expiry = 'Invalid month';
      else if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) e.expiry = 'Card has expired';
    }
    if (!/^\d{3,4}$/.test(trim(p.cvv))) e.cvv = 'Enter 3 or 4 digits';
    return { valid: Object.keys(e).length === 0, errors: e };
  }

  function formatCardNumber(v) {
    var d = String(v).replace(/\D/g, '').slice(0, 19);
    return d.replace(/(.{4})(?=.)/g, '$1 ');
  }

  function formatExpiry(v) {
    var d = String(v).replace(/\D/g, '').slice(0, 4);
    return d.length >= 3 ? d.slice(0, 2) + '/' + d.slice(2) : d;
  }

  function cardLast4(number) {
    return String(number).replace(/\D/g, '').slice(-4);
  }

  function generateBookingRef(rng) {
    rng = rng || Math.random;
    var out = '';
    for (var i = 0; i < 8; i++) {
      out += REF_ALPHABET.charAt(Math.min(REF_ALPHABET.length - 1, Math.floor(rng() * REF_ALPHABET.length)));
    }
    return 'HB-' + out;
  }

  /* ---------- 3-step booking wizard (pure reducer) ---------- */

  function initialBooking() {
    return {
      step: 1, hotelId: null, roomId: null, checkIn: null, checkOut: null,
      guests: 1, rooms: 1, guest: null, payment: null, confirmation: null,
      error: null, errors: {}
    };
  }

  function validateSelection(b, hotel, today) {
    var e = {};
    var room = hotel ? findRoom(hotel, b.roomId) : null;
    if (!b.roomId) e.roomId = 'Please choose a room';
    else if (hotel && !room) e.roomId = 'That room is not available';

    var nights = nightsBetween(b.checkIn, b.checkOut);
    if (parseISODate(b.checkIn) === null || parseISODate(b.checkOut) === null) e.dates = 'Please choose valid dates';
    else if (nights < 1) e.dates = 'Check-out must be after check-in';
    else if (today && b.checkIn < today) e.dates = 'Check-in cannot be in the past';
    else if (nights > LIMITS.maxNights) e.dates = 'Stays are limited to ' + LIMITS.maxNights + ' nights';

    if (!isInt(b.guests) || b.guests < 1 || b.guests > LIMITS.maxGuests) e.guests = 'Choose 1 to ' + LIMITS.maxGuests + ' guests';
    if (!isInt(b.rooms) || b.rooms < 1 || b.rooms > LIMITS.maxRooms) e.rooms = 'Choose 1 to ' + LIMITS.maxRooms + ' rooms';

    if (room && !e.guests && !e.rooms) {
      if (b.guests > room.maxGuests * b.rooms) {
        e.guests = 'This room sleeps ' + room.maxGuests + ' per room. Add rooms or pick a larger one';
      } else if (b.rooms > room.roomsLeft) {
        e.rooms = 'Only ' + room.roomsLeft + ' left of this room type';
      }
    }
    return e;
  }

  var UPDATABLE = ['roomId', 'checkIn', 'checkOut', 'guests', 'rooms'];

  function bookingReducer(state, action) {
    var next;
    switch (action.type) {
      case 'START':
        next = initialBooking();
        ['hotelId', 'roomId', 'checkIn', 'checkOut', 'guests', 'rooms'].forEach(function (k) {
          if (action[k] !== undefined) next[k] = action[k];
        });
        return next;

      case 'UPDATE':
        if (state.step !== 1) return Object.assign({}, state, { error: 'Selection can only be changed in step 1' });
        next = Object.assign({}, state, { error: null });
        UPDATABLE.forEach(function (k) { if (action[k] !== undefined) next[k] = action[k]; });
        return next;

      case 'SET_GUEST':
        return Object.assign({}, state, { guest: Object.assign({}, action.guest) });

      case 'NEXT': {
        if (state.step === 1) {
          var errs = validateSelection(state, action.hotel, action.today);
          if (Object.keys(errs).length) return Object.assign({}, state, { error: 'Please fix the highlighted fields', errors: errs });
          return Object.assign({}, state, { step: 2, error: null, errors: {} });
        }
        if (state.step === 2) {
          var v = validateGuest(state.guest);
          if (!v.valid) return Object.assign({}, state, { error: 'Please fix the highlighted fields', errors: v.errors });
          return Object.assign({}, state, { step: 3, error: null, errors: {} });
        }
        return Object.assign({}, state, { error: 'Use the Pay button to complete your booking' });
      }

      case 'BACK':
        if (state.step === 2 || state.step === 3) return Object.assign({}, state, { step: state.step - 1, error: null, errors: {} });
        return state;

      case 'CONFIRM': {
        if (state.step !== 3) return Object.assign({}, state, { error: 'Complete the previous steps first' });
        var pv = validatePayment(action.payment, action.now);
        if (!pv.valid) return Object.assign({}, state, { error: 'Please check your payment details', errors: pv.errors });
        return Object.assign({}, state, {
          step: 4,
          error: null,
          errors: {},
          payment: { last4: cardLast4(action.payment.cardNumber), cardName: trim(action.payment.cardName) },
          confirmation: { ref: action.ref, confirmedAt: (action.now || new Date()).toISOString() }
        });
      }

      case 'RESET':
        return initialBooking();

      default:
        return state;
    }
  }

  return {
    LIMITS: LIMITS,
    escapeHtml: escapeHtml,
    formatCurrency: formatCurrency,
    plural: plural,
    parseISODate: parseISODate,
    toISODate: toISODate,
    addDays: addDays,
    nightsBetween: nightsBetween,
    formatDate: formatDate,
    minPrice: minPrice,
    findHotel: findHotel,
    findRoom: findRoom,
    availableRooms: availableRooms,
    filterHotels: filterHotels,
    sortHotels: sortHotels,
    priceBreakdown: priceBreakdown,
    validateGuest: validateGuest,
    luhnValid: luhnValid,
    validatePayment: validatePayment,
    formatCardNumber: formatCardNumber,
    formatExpiry: formatExpiry,
    cardLast4: cardLast4,
    generateBookingRef: generateBookingRef,
    initialBooking: initialBooking,
    validateSelection: validateSelection,
    bookingReducer: bookingReducer
  };
});
