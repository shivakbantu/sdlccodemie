(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./logic'), require('./data'));
  else root.HotelViews = factory(root.HotelLogic, root.HotelData);
})(typeof self !== 'undefined' ? self : this, function (L, D) {
  'use strict';

  var esc = L.escapeHtml;
  var money = L.formatCurrency;
  var STEP_LABELS = ['Room', 'Guest details', 'Payment'];

  function stars(n) {
    return '<span class="stars" role="img" aria-label="' + Number(n) + ' star hotel">' + '★'.repeat(n) + '</span>';
  }

  function amenityLabel(key) {
    var a = D.AMENITIES[key];
    return a ? a.icon + ' ' + esc(a.label) : esc(key);
  }

  function options(list, selected) {
    return list.map(function (o) {
      return '<option value="' + esc(o.value) + '"' + (String(o.value) === String(selected) ? ' selected' : '') + '>' + esc(o.label) + '</option>';
    }).join('');
  }

  function range(from, to) {
    var out = [];
    for (var i = from; i <= to; i++) out.push(i);
    return out;
  }

  function cover(hotel, cls) {
    return '<div class="' + cls + '" style="--hue:' + Number(hotel.hue) + '" role="img" aria-label="' + esc(hotel.name) + ' illustration">' +
      '<span class="cover__emoji" aria-hidden="true">' + esc(hotel.emoji) + '</span>';
  }

  function favButton(hotelId, on) {
    return '<button type="button" class="fav' + (on ? ' is-on' : '') + '" data-action="toggle-fav" data-id="' + esc(hotelId) + '"' +
      ' aria-pressed="' + (on ? 'true' : 'false') + '" aria-label="' + (on ? 'Remove from favorites' : 'Save to favorites') + '">' + (on ? '♥' : '♡') + '</button>';
  }

  function emptyState(title, text, actionHtml) {
    return '<div class="empty"><div class="empty__icon" aria-hidden="true">🧳</div><h3>' + esc(title) + '</h3><p>' + esc(text) + '</p>' + (actionHtml || '') + '</div>';
  }

  /* ---------- home ---------- */

  function hotelCard(h, o) {
    o = o || {};
    var from = L.minPrice(h);
    var chips = h.amenities.slice(0, 3).map(function (a) { return '<li>' + amenityLabel(a) + '</li>'; }).join('');
    var total = o.nights > 0
      ? '<small>' + money(from * o.nights) + ' for ' + L.plural(o.nights, 'night') + ' + taxes</small>'
      : '';
    return '<article class="card" data-hotel-id="' + esc(h.id) + '">' +
      cover(h, 'card__cover cover') + favButton(h.id, o.favorite) + '</div>' +
      '<div class="card__body">' +
      '<div class="card__row"><h3 class="card__title">' + esc(h.name) + '</h3><span class="rating" title="' + L.plural(h.reviews, 'review') + '">★ ' + Number(h.rating).toFixed(1) + '</span></div>' +
      '<p class="card__meta">' + esc(h.city) + ', ' + esc(h.country) + ' · ' + stars(h.stars) + '</p>' +
      '<ul class="chips">' + chips + '</ul>' +
      '<div class="card__foot"><div class="price"><strong>' + money(from) + '</strong> <span>/ night</span>' + total + '</div>' +
      '<a class="btn btn--primary" href="#/hotel/' + encodeURIComponent(h.id) + '">View rooms</a></div>' +
      '</div></article>';
  }

  function hotelList(hotels, o) {
    o = o || {};
    if (!hotels.length) {
      return emptyState('No hotels match your filters', 'Try a different destination, or loosen the price and amenity filters.',
        '<button type="button" class="btn btn--primary" data-action="reset-filters">Clear all filters</button>');
    }
    var favs = o.favorites || [];
    return hotels.map(function (h) {
      return hotelCard(h, { favorite: favs.indexOf(h.id) !== -1, nights: o.nights });
    }).join('');
  }

  function resultsCount(count, nights) {
    return '<strong>' + L.plural(count, 'hotel') + '</strong> found' + (nights > 0 ? ' · ' + L.plural(nights, 'night') : '');
  }

  function homePage(c) {
    var f = c.filters;
    var amenityChecks = Object.keys(D.AMENITIES).map(function (k) {
      var on = (f.amenities || []).indexOf(k) !== -1;
      return '<label class="check"><input type="checkbox" name="amenity" value="' + esc(k) + '"' + (on ? ' checked' : '') + '><span>' + amenityLabel(k) + '</span></label>';
    }).join('');
    var guestOpts = options(range(1, 6).map(function (n) { return { value: n, label: L.plural(n, 'guest') }; }), c.search.guests);
    return '<div class="page">' +
      '<section class="hero"><div class="container">' +
      '<h1>Find your next stay</h1><p class="hero__sub">Browse handpicked hotels, compare rooms and book in three easy steps.</p>' +
      '<form class="searchbar" id="search-form" novalidate>' +
      '<div class="field"><label for="f-query">Destination or hotel</label><input id="f-query" type="search" placeholder="Try Paris, Bali, Sydney…" value="' + esc(f.query || '') + '" autocomplete="off"></div>' +
      '<div class="field"><label for="f-checkIn">Check-in</label><input id="f-checkIn" type="date" min="' + esc(c.today) + '" value="' + esc(c.search.checkIn) + '"></div>' +
      '<div class="field"><label for="f-checkOut">Check-out</label><input id="f-checkOut" type="date" min="' + esc(L.addDays(c.today, 1)) + '" value="' + esc(c.search.checkOut) + '"></div>' +
      '<div class="field"><label for="f-guests">Guests</label><select id="f-guests">' + guestOpts + '</select></div>' +
      '</form></div></section>' +
      '<section class="container layout">' +
      '<button type="button" class="btn btn--ghost filters-toggle" data-action="toggle-filters" aria-expanded="false" aria-controls="filters">⚙ Filters</button>' +
      '<aside class="filters" id="filters" aria-label="Filters">' +
      '<div class="filters__head"><h2>Filters</h2><button type="button" class="link" data-action="reset-filters">Reset</button></div>' +
      '<div class="field"><label for="f-maxPrice">Max price per night: <output id="f-maxPrice-out">' + money(f.maxPrice) + '</output></label>' +
      '<input id="f-maxPrice" type="range" min="' + D.PRICE_RANGE.min + '" max="' + D.PRICE_RANGE.max + '" step="10" value="' + Number(f.maxPrice) + '"></div>' +
      '<div class="field"><label for="f-stars">Star rating</label><select id="f-stars">' +
      options([{ value: 0, label: 'Any' }, { value: 3, label: '3★ and up' }, { value: 4, label: '4★ and up' }, { value: 5, label: '5★ only' }], f.minStars) + '</select></div>' +
      '<div class="field"><label for="f-rating">Guest rating</label><select id="f-rating">' +
      options([{ value: 0, label: 'Any' }, { value: 3.5, label: '3.5+' }, { value: 4, label: '4.0+' }, { value: 4.5, label: '4.5+' }], f.minRating) + '</select></div>' +
      '<fieldset class="field"><legend>Amenities</legend><div class="checks">' + amenityChecks + '</div></fieldset>' +
      '<label class="check check--switch"><input type="checkbox" id="f-free"' + (f.freeCancellation ? ' checked' : '') + '><span>Free cancellation available</span></label>' +
      '</aside>' +
      '<div class="results">' +
      '<div class="results__head"><p id="count" aria-live="polite"></p>' +
      '<label class="inline">Sort by <select id="f-sort">' +
      options([{ value: 'recommended', label: 'Recommended' }, { value: 'price-asc', label: 'Price: low to high' }, { value: 'price-desc', label: 'Price: high to low' }, { value: 'rating', label: 'Guest rating' }, { value: 'stars', label: 'Star rating' }], c.sort) +
      '</select></label></div>' +
      '<div class="grid" id="results"></div>' +
      '</div></section></div>';
  }

  /* ---------- hotel detail ---------- */

  function roomCard(room, o) {
    o = o || {};
    var perks = room.perks.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('');
    var scarcity = room.roomsLeft <= 2 ? '<span class="badge badge--warn">Only ' + Number(room.roomsLeft) + ' left!</span>' : '';
    var policy = room.refundable ? '<span class="badge badge--ok">Free cancellation</span>' : '<span class="badge">Non-refundable</span>';
    var total = o.nights > 0 ? '<small>' + money(room.pricePerNight * o.nights) + ' for ' + L.plural(o.nights, 'night') + '</small>' : '';
    return '<article class="room" data-room-id="' + esc(room.id) + '">' +
      '<div class="room__info"><h3>' + esc(room.name) + '</h3>' +
      '<p class="room__meta">🛏 ' + esc(room.beds) + ' · 📐 ' + Number(room.sizeSqm) + ' m² · 👥 up to ' + Number(room.maxGuests) + '</p>' +
      '<ul class="chips">' + perks + '</ul><div class="badges">' + policy + scarcity + '</div></div>' +
      '<div class="room__buy"><div class="price"><strong>' + money(room.pricePerNight) + '</strong> <span>/ night</span>' + total + '</div>' +
      '<button type="button" class="btn btn--ghost" data-action="room-details" data-room-id="' + esc(room.id) + '">Details</button>' +
      '<button type="button" class="btn btn--primary" data-action="select-room" data-room-id="' + esc(room.id) + '">Select room</button></div>' +
      '</article>';
  }

  function hotelDetail(h, o) {
    o = o || {};
    var rooms = L.availableRooms(h, o.guests);
    var amen = h.amenities.map(function (a) { return '<li>' + amenityLabel(a) + '</li>'; }).join('');
    var roomsHtml = rooms.length
      ? rooms.map(function (r) { return roomCard(r, { nights: o.nights }); }).join('')
      : emptyState('No room fits ' + L.plural(o.guests, 'guest'), 'Try fewer guests, or book more than one room.');
    return '<div class="page">' +
      '<section class="detail-hero">' + cover(h, 'detail-hero__cover cover') + '</div>' +
      '<div class="container detail-hero__text"><a class="back" href="#/">← All hotels</a>' +
      '<div class="detail-title"><div><h1>' + esc(h.name) + '</h1>' +
      '<p class="card__meta">' + esc(h.city) + ', ' + esc(h.country) + ' · ' + stars(h.stars) + ' · <span class="rating">★ ' + Number(h.rating).toFixed(1) + '</span> (' + L.plural(h.reviews, 'review') + ')</p></div>' +
      favButton(h.id, o.favorite) + '</div></div></section>' +
      '<section class="container detail-body"><div>' +
      '<h2>About this hotel</h2><p>' + esc(h.description) + '</p>' +
      '<h2>Amenities</h2><ul class="amenities">' + amen + '</ul>' +
      '<h2>Choose your room</h2>' +
      '<p class="muted">Showing rooms for ' + L.plural(o.guests || 1, 'guest') + (o.nights > 0 ? ' · ' + L.plural(o.nights, 'night') : '') + '</p>' +
      '<div class="rooms">' + roomsHtml + '</div></div></section></div>';
  }

  function roomDetails(room, hotel) {
    return '<p class="muted">' + esc(hotel.name) + '</p>' +
      '<dl class="dl"><dt>Bed</dt><dd>' + esc(room.beds) + '</dd><dt>Size</dt><dd>' + Number(room.sizeSqm) + ' m²</dd>' +
      '<dt>Sleeps</dt><dd>' + Number(room.maxGuests) + '</dd><dt>Policy</dt><dd>' + (room.refundable ? 'Free cancellation' : 'Non-refundable') + '</dd>' +
      '<dt>Price</dt><dd>' + money(room.pricePerNight) + ' per night</dd></dl>' +
      '<ul class="chips">' + room.perks.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>';
  }

  /* ---------- booking wizard ---------- */

  function stepper(step) {
    return '<ol class="stepper" aria-label="Booking progress">' + STEP_LABELS.map(function (label, i) {
      var n = i + 1;
      var cls = step > n ? 'is-done' : step === n ? 'is-active' : '';
      return '<li class="' + cls + '"' + (step === n ? ' aria-current="step"' : '') + '><span class="stepper__dot">' + (step > n ? '✓' : n) + '</span><span class="stepper__label">' + esc(label) + '</span></li>';
    }).join('') + '</ol>';
  }

  function field(o) {
    var id = 'w-' + o.name;
    var tag = o.textarea
      ? '<textarea id="' + id + '" name="' + o.name + '" rows="3"' + (o.attrs || '') + '>' + esc(o.value || '') + '</textarea>'
      : '<input id="' + id + '" name="' + o.name + '" type="' + (o.type || 'text') + '" value="' + esc(o.value || '') + '"' + (o.attrs || '') + '>';
    return '<div class="field' + (o.error ? ' has-error' : '') + (o.cls ? ' ' + o.cls : '') + '">' +
      '<label for="' + id + '">' + esc(o.label) + '</label>' +
      tag.replace(/^(<\w+)/, '$1' + (o.error ? ' aria-invalid="true" aria-describedby="' + id + '-err"' : '')) +
      (o.error ? '<p class="field__error" id="' + id + '-err" role="alert">' + esc(o.error) + '</p>' : '') + '</div>';
  }

  function roomOption(room, selected, nights) {
    return '<label class="room-opt' + (selected ? ' is-selected' : '') + '">' +
      '<input type="radio" name="roomId" value="' + esc(room.id) + '"' + (selected ? ' checked' : '') + '>' +
      '<span class="room-opt__main"><strong>' + esc(room.name) + '</strong>' +
      '<span class="muted">' + esc(room.beds) + ' · up to ' + Number(room.maxGuests) + ' guests · ' + (room.refundable ? 'Free cancellation' : 'Non-refundable') + '</span></span>' +
      '<span class="room-opt__price"><strong>' + money(room.pricePerNight) + '</strong><small>/ night</small></span></label>';
  }

  function stepRoom(hotel, b, c) {
    var e = b.errors || {};
    var guestOpts = options(range(1, L.LIMITS.maxGuests).map(function (n) { return { value: n, label: L.plural(n, 'guest') }; }), b.guests);
    var roomOpts = options(range(1, L.LIMITS.maxRooms).map(function (n) { return { value: n, label: L.plural(n, 'room') }; }), b.rooms);
    var minOut = L.addDays(b.checkIn || c.today, 1) || L.addDays(c.today, 1);
    return '<h2 class="step-title" tabindex="-1">Step 1 · Choose your room</h2>' +
      '<div class="form-grid">' +
      field({ label: 'Check-in', name: 'checkIn', type: 'date', value: b.checkIn, error: e.dates, attrs: ' min="' + esc(c.today) + '"' }) +
      field({ label: 'Check-out', name: 'checkOut', type: 'date', value: b.checkOut, attrs: ' min="' + esc(minOut) + '"' }) +
      '<div class="field' + (e.guests ? ' has-error' : '') + '"><label for="w-guests">Guests</label><select id="w-guests" name="guests">' + guestOpts + '</select>' +
      (e.guests ? '<p class="field__error" role="alert">' + esc(e.guests) + '</p>' : '') + '</div>' +
      '<div class="field' + (e.rooms ? ' has-error' : '') + '"><label for="w-rooms">Rooms</label><select id="w-rooms" name="rooms">' + roomOpts + '</select>' +
      (e.rooms ? '<p class="field__error" role="alert">' + esc(e.rooms) + '</p>' : '') + '</div></div>' +
      '<fieldset class="room-opts' + (e.roomId ? ' has-error' : '') + '"><legend>Room type</legend>' +
      hotel.rooms.map(function (r) { return roomOption(r, r.id === b.roomId, c.nights); }).join('') +
      (e.roomId ? '<p class="field__error" role="alert">' + esc(e.roomId) + '</p>' : '') + '</fieldset>';
  }

  function stepGuest(b) {
    var g = b.guest || {};
    var e = b.errors || {};
    return '<h2 class="step-title" tabindex="-1">Step 2 · Guest details</h2>' +
      '<div class="form-grid">' +
      field({ label: 'First name', name: 'firstName', value: g.firstName, error: e.firstName, attrs: ' autocomplete="given-name" maxlength="60"' }) +
      field({ label: 'Last name', name: 'lastName', value: g.lastName, error: e.lastName, attrs: ' autocomplete="family-name" maxlength="60"' }) +
      field({ label: 'Email', name: 'email', type: 'email', value: g.email, error: e.email, attrs: ' autocomplete="email"' }) +
      field({ label: 'Phone', name: 'phone', type: 'tel', value: g.phone, error: e.phone, attrs: ' autocomplete="tel" placeholder="+1 555 010 1234"' }) +
      '</div>' +
      field({ label: 'Special requests (optional)', name: 'requests', value: g.requests, error: e.requests, textarea: true, attrs: ' maxlength="400"' });
  }

  function stepPayment(b, c) {
    var e = b.errors || {};
    var d = c.paymentDraft || {};
    var total = c.breakdown ? money(c.breakdown.total) : '';
    return '<h2 class="step-title" tabindex="-1">Step 3 · Payment</h2>' +
      '<p class="notice">🔒 This is a demo. No real payment is made. Use test card <code>4242 4242 4242 4242</code>, any future expiry and any 3-digit CVV.</p>' +
      field({ label: 'Name on card', name: 'cardName', value: d.cardName, error: e.cardName, attrs: ' autocomplete="cc-name"' }) +
      field({ label: 'Card number', name: 'cardNumber', value: d.cardNumber, error: e.cardNumber, attrs: ' inputmode="numeric" autocomplete="cc-number" placeholder="4242 4242 4242 4242" maxlength="23"' }) +
      '<div class="form-grid">' +
      field({ label: 'Expiry (MM/YY)', name: 'expiry', value: d.expiry, error: e.expiry, attrs: ' inputmode="numeric" autocomplete="cc-exp" placeholder="12/30" maxlength="5"' }) +
      field({ label: 'CVV', name: 'cvv', type: 'password', value: d.cvv, error: e.cvv, attrs: ' inputmode="numeric" autocomplete="off" maxlength="4"' }) +
      '</div><p class="muted">You will be charged <strong>' + esc(total) + '</strong> (demo only).</p>';
  }

  function summary(hotel, room, b, breakdown) {
    var nights = L.nightsBetween(b.checkIn, b.checkOut);
    var head = '<h3>Your stay</h3><p class="summary__hotel"><strong>' + esc(hotel.name) + '</strong><br><span class="muted">' + esc(hotel.city) + ', ' + esc(hotel.country) + '</span></p>';
    if (!room || !breakdown) return head + '<p class="muted">Select a room and valid dates to see your price.</p>';
    return head +
      '<dl class="dl"><dt>Check-in</dt><dd>' + esc(L.formatDate(b.checkIn)) + '</dd><dt>Check-out</dt><dd>' + esc(L.formatDate(b.checkOut)) + '</dd>' +
      '<dt>Guests</dt><dd>' + Number(b.guests) + '</dd><dt>Room</dt><dd>' + L.plural(b.rooms, 'room') + ' · ' + esc(room.name) + '</dd></dl>' +
      '<div class="totals"><div><span>' + money(room.pricePerNight) + ' × ' + L.plural(nights, 'night') + ' × ' + L.plural(b.rooms, 'room') + '</span><span>' + money(breakdown.subtotal) + '</span></div>' +
      '<div><span>Taxes (' + Math.round(breakdown.taxRate * 100) + '%)</span><span>' + money(breakdown.taxes) + '</span></div>' +
      '<div class="totals__total"><span>Total</span><span>' + money(breakdown.total) + '</span></div></div>' +
      '<p class="badges">' + (room.refundable ? '<span class="badge badge--ok">Free cancellation</span>' : '<span class="badge">Non-refundable</span>') + '</p>';
  }

  function confirmation(hotel, room, b, breakdown) {
    var g = b.guest || {};
    return '<div class="confirm">' +
      '<div class="confirm__check" aria-hidden="true"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="M14 27l8 8 16-17"/></svg></div>' +
      '<h2 class="step-title" tabindex="-1">Booking confirmed!</h2>' +
      '<p class="muted">A confirmation would be emailed to <strong>' + esc(g.email) + '</strong> (demo: nothing is sent).</p>' +
      '<div class="confirm__ref"><span>Booking reference</span><strong id="booking-ref">' + esc(b.confirmation.ref) + '</strong>' +
      '<button type="button" class="btn btn--ghost" data-action="copy-ref">Copy</button></div>' +
      '<dl class="dl dl--wide"><dt>Guest</dt><dd>' + esc(g.firstName) + ' ' + esc(g.lastName) + '</dd>' +
      '<dt>Hotel</dt><dd>' + esc(hotel.name) + ', ' + esc(hotel.city) + '</dd>' +
      '<dt>Room</dt><dd>' + L.plural(b.rooms, 'room') + ' · ' + esc(room.name) + '</dd>' +
      '<dt>Dates</dt><dd>' + esc(L.formatDate(b.checkIn)) + ' → ' + esc(L.formatDate(b.checkOut)) + '</dd>' +
      '<dt>Paid</dt><dd>' + money(breakdown.total) + ' · card ending ' + esc(b.payment.last4) + '</dd></dl>' +
      '<div class="actions"><button type="button" class="btn btn--primary" data-action="new-booking">Book another stay</button></div></div>';
  }

  function bookingPage(hotel, b, c) {
    var room = L.findRoom(hotel, b.roomId);
    var main;
    var actions = '';
    if (b.step === 4) {
      main = confirmation(hotel, room, b, c.breakdown);
    } else {
      main = b.step === 1 ? stepRoom(hotel, b, c) : b.step === 2 ? stepGuest(b) : stepPayment(b, c);
      var next = b.step === 3
        ? '<button type="button" class="btn btn--primary btn--lg" data-action="wiz-pay" id="pay-btn"><span class="btn__label">Pay ' + esc(c.breakdown ? money(c.breakdown.total) : '') + '</span><span class="spinner" aria-hidden="true"></span></button>'
        : '<button type="button" class="btn btn--primary btn--lg" data-action="wiz-next">Continue →</button>';
      actions = '<div class="actions">' +
        (b.step > 1 ? '<button type="button" class="btn btn--ghost" data-action="wiz-back">← Back</button>' : '<button type="button" class="btn btn--ghost" data-action="wiz-cancel">Cancel</button>') +
        next + '</div>';
    }
    return '<div class="page"><div class="container booking">' +
      '<a class="back" href="#/hotel/' + encodeURIComponent(hotel.id) + '">← Back to ' + esc(hotel.name) + '</a>' +
      (b.step < 4 ? stepper(b.step) : '') +
      '<div class="booking__grid' + (b.step === 4 ? ' booking__grid--single' : '') + '">' +
      '<form class="panel" id="wizard-form" novalidate data-step="' + b.step + '">' + main +
      (b.error && b.step < 4 ? '<p class="form-error" role="alert">' + esc(b.error) + '</p>' : '') + actions + '</form>' +
      (b.step < 4 ? '<aside class="panel summary" id="summary" aria-label="Booking summary">' + summary(hotel, room, b, c.breakdown) + '</aside>' : '') +
      '</div></div></div>';
  }

  return {
    stars: stars,
    hotelCard: hotelCard,
    hotelList: hotelList,
    resultsCount: resultsCount,
    homePage: homePage,
    roomCard: roomCard,
    hotelDetail: hotelDetail,
    roomDetails: roomDetails,
    stepper: stepper,
    field: field,
    stepRoom: stepRoom,
    stepGuest: stepGuest,
    stepPayment: stepPayment,
    summary: summary,
    confirmation: confirmation,
    bookingPage: bookingPage,
    emptyState: emptyState
  };
});
