(function () {
  'use strict';

  var L = window.HotelLogic;
  var D = window.HotelData;
  var V = window.HotelViews;
  var PROCESSING_MS = 900;

  var appEl = document.getElementById('app');
  var toastsEl = document.getElementById('toasts');
  var modalRoot = document.getElementById('modal-root');
  var favCountEl = document.getElementById('fav-count');

  var today = L.toISODate(new Date());
  var state = {
    filters: { query: '', maxPrice: D.PRICE_RANGE.max, minStars: 0, minRating: 0, amenities: [], freeCancellation: false },
    sort: 'recommended',
    search: { checkIn: L.addDays(today, 14), checkOut: L.addDays(today, 17), guests: 2 },
    favorites: [],
    booking: L.initialBooking(),
    paymentDraft: null,
    processing: false
  };

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* ---------- feedback: toast + modal ---------- */

  function toast(message, type) {
    var el = document.createElement('div');
    el.className = 'toast toast--' + (type || 'info');
    el.textContent = message;
    while (toastsEl.children.length >= 4) toastsEl.removeChild(toastsEl.firstChild);
    toastsEl.appendChild(el);
    setTimeout(function () {
      el.classList.add('is-leaving');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 250);
    }, 3000);
  }

  var modalState = null;

  function closeModal() {
    if (!modalState) return;
    modalRoot.innerHTML = '';
    document.body.classList.remove('has-modal');
    document.removeEventListener('keydown', modalState.onKey);
    if (modalState.opener && modalState.opener.focus) modalState.opener.focus();
    modalState = null;
  }

  function openModal(o) {
    closeModal();
    var buttons = (o.actions || []).map(function (a, i) {
      return '<button type="button" class="btn ' + (a.primary ? 'btn--primary' : 'btn--ghost') + '" data-modal-btn="' + i + '">' + L.escapeHtml(a.label) + '</button>';
    }).join('');
    modalRoot.innerHTML = '<div class="modal-backdrop" data-modal-close>' +
      '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">' +
      '<h2 id="modal-title">' + L.escapeHtml(o.title) + '</h2><div class="modal__body">' + o.body + '</div>' +
      '<div class="actions">' + buttons + '</div></div></div>';
    document.body.classList.add('has-modal');

    var dialog = $('.modal', modalRoot);
    var focusable = $all('button', dialog);
    var onKey = function (e) {
      if (e.key === 'Escape') { closeModal(); return; }
      if (e.key === 'Tab' && focusable.length) {
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    modalState = { onKey: onKey, opener: document.activeElement, actions: o.actions || [] };
    (focusable[focusable.length - 1] || dialog).focus();
  }

  /* ---------- helpers ---------- */

  function nightsNow() { return L.nightsBetween(state.search.checkIn, state.search.checkOut); }

  function updateFavCount() {
    favCountEl.textContent = state.favorites.length;
    favCountEl.hidden = state.favorites.length === 0;
    favCountEl.classList.remove('bump');
    void favCountEl.offsetWidth;
    favCountEl.classList.add('bump');
  }

  function navigate(hash) {
    if (location.hash === hash) route();
    else location.hash = hash;
  }

  function currentHotelId() {
    var m = location.hash.match(/^#\/hotel\/([^/?]+)/);
    if (!m) return null;
    try { return decodeURIComponent(m[1]); } catch (e) { return null; }
  }

  /* ---------- home ---------- */

  function readFilters() {
    var f = state.filters;
    f.query = $('#f-query').value;
    f.maxPrice = Number($('#f-maxPrice').value);
    f.minStars = Number($('#f-stars').value);
    f.minRating = Number($('#f-rating').value);
    f.amenities = $all('input[name="amenity"]:checked').map(function (i) { return i.value; });
    f.freeCancellation = $('#f-free').checked;
    state.sort = $('#f-sort').value;
    $('#f-maxPrice-out').textContent = L.formatCurrency(f.maxPrice);
  }

  function renderResults(flash) {
    var started = performance.now();
    var criteria = Object.assign({}, state.filters, { guests: state.search.guests });
    var hotels = L.sortHotels(L.filterHotels(D.HOTELS, criteria), state.sort);
    var nights = nightsNow();
    var grid = $('#results');
    grid.innerHTML = V.hotelList(hotels, { favorites: state.favorites, nights: nights });
    var count = $('#count');
    count.innerHTML = V.resultsCount(hotels.length, nights);
    if (flash) {
      grid.classList.remove('flash');
      void grid.offsetWidth;
      grid.classList.add('flash');
    }
    grid.setAttribute('data-render-ms', (performance.now() - started).toFixed(1));
  }

  function renderHome() {
    appEl.innerHTML = V.homePage({ filters: state.filters, sort: state.sort, search: state.search, today: today });
    renderResults(false);
  }

  function resetFilters() {
    state.filters = { query: '', maxPrice: D.PRICE_RANGE.max, minStars: 0, minRating: 0, amenities: [], freeCancellation: false };
    state.sort = 'recommended';
    renderHome();
    toast('Filters cleared', 'info');
  }

  function onSearchChange(target) {
    var s = state.search;
    if (target.id === 'f-checkIn') {
      s.checkIn = target.value || s.checkIn;
      if (L.nightsBetween(s.checkIn, s.checkOut) < 1) {
        s.checkOut = L.addDays(s.checkIn, 1);
        $('#f-checkOut').value = s.checkOut;
        toast('Check-out moved to ' + L.formatDate(s.checkOut), 'info');
      }
    } else if (target.id === 'f-checkOut') {
      if (L.nightsBetween(s.checkIn, target.value) < 1) {
        target.value = s.checkOut;
        toast('Check-out must be after check-in', 'error');
        return;
      }
      s.checkOut = target.value;
    } else if (target.id === 'f-guests') {
      s.guests = Number(target.value);
    }
    renderResults(true);
  }

  /* ---------- hotel detail ---------- */

  function renderHotel(id) {
    var hotel = L.findHotel(D.HOTELS, id);
    if (!hotel) {
      appEl.innerHTML = '<div class="page container">' + V.emptyState('Hotel not found', 'That hotel does not exist.', '<a class="btn btn--primary" href="#/">Browse hotels</a>') + '</div>';
      return;
    }
    appEl.innerHTML = V.hotelDetail(hotel, { favorite: state.favorites.indexOf(id) !== -1, guests: state.search.guests, nights: nightsNow() });
  }

  function startBooking(hotelId, roomId) {
    state.paymentDraft = null;
    state.booking = L.bookingReducer(state.booking, {
      type: 'START', hotelId: hotelId, roomId: roomId,
      checkIn: state.search.checkIn, checkOut: state.search.checkOut,
      guests: state.search.guests, rooms: Math.max(1, Math.ceil(state.search.guests / (L.findRoom(L.findHotel(D.HOTELS, hotelId), roomId) || { maxGuests: 1 }).maxGuests))
    });
    navigate('#/book');
  }

  /* ---------- booking wizard ---------- */

  function bookingContext() {
    var b = state.booking;
    var hotel = L.findHotel(D.HOTELS, b.hotelId);
    var room = hotel ? L.findRoom(hotel, b.roomId) : null;
    var nights = L.nightsBetween(b.checkIn, b.checkOut);
    var breakdown = room && nights > 0 ? L.priceBreakdown({ pricePerNight: room.pricePerNight, nights: nights, rooms: b.rooms, taxRate: D.TAX_RATE }) : null;
    return { hotel: hotel, room: room, nights: nights, breakdown: breakdown, today: today, paymentDraft: state.paymentDraft };
  }

  function renderBooking(focus, celebrate) {
    var b = state.booking;
    var ctx = bookingContext();
    if (!ctx.hotel) {
      navigate('#/');
      toast('Pick a hotel and room first', 'info');
      return;
    }
    appEl.innerHTML = V.bookingPage(ctx.hotel, b, ctx);
    if (focus) {
      var title = $('.step-title', appEl);
      if (title) title.focus({ preventScroll: true });
    }
    if (b.step === 4 && celebrate) {
      window.Confetti.launch({ count: 180 });
      toast('Booking confirmed! 🎉', 'success');
    }
    shakeErrors();
  }

  function shakeErrors() {
    $all('.has-error', appEl).forEach(function (el) { el.classList.add('shake'); });
  }

  function formValues() {
    var out = {};
    var form = $('#wizard-form');
    if (!form) return out;
    new FormData(form).forEach(function (v, k) { out[k] = v; });
    return out;
  }

  function dispatch(action) {
    state.booking = L.bookingReducer(state.booking, action);
    return state.booking;
  }

  function readSelection() {
    var v = formValues();
    return {
      type: 'UPDATE', roomId: v.roomId || null, checkIn: v.checkIn || null, checkOut: v.checkOut || null,
      guests: Number(v.guests), rooms: Number(v.rooms)
    };
  }

  function wizardNext() {
    var ctx = bookingContext();
    var step = state.booking.step;
    if (step === 1) dispatch(readSelection());
    else if (step === 2) dispatch({ type: 'SET_GUEST', guest: formValues() });
    var before = state.booking.step;
    dispatch({ type: 'NEXT', hotel: ctx.hotel, today: today });
    if (state.booking.step === before) toast(state.booking.error, 'error');
    else toast('Step ' + before + ' complete', 'success');
    renderBooking(true);
  }

  function wizardBack() {
    if (state.booking.step === 2) dispatch({ type: 'SET_GUEST', guest: formValues() });
    state.paymentDraft = null;
    dispatch({ type: 'BACK' });
    renderBooking(true);
  }

  function wizardPay() {
    if (state.processing) return;
    var v = formValues();
    var payment = { cardName: v.cardName, cardNumber: v.cardNumber, expiry: v.expiry, cvv: v.cvv };
    state.paymentDraft = payment;
    var check = L.validatePayment(payment, new Date());
    if (!check.valid) {
      dispatch({ type: 'CONFIRM', payment: payment, now: new Date(), ref: null });
      toast(state.booking.error, 'error');
      renderBooking(false);
      return;
    }
    state.processing = true;
    var btn = $('#pay-btn');
    btn.classList.add('is-loading');
    btn.disabled = true;
    toast('Processing payment…', 'info');
    setTimeout(function () {
      state.processing = false;
      dispatch({ type: 'CONFIRM', payment: payment, now: new Date(), ref: L.generateBookingRef() });
      state.paymentDraft = null;
      renderBooking(true, true);
    }, PROCESSING_MS);
  }

  function refreshSummary() {
    var ctx = bookingContext();
    var sel = readSelection();
    var merged = Object.assign({}, state.booking, { roomId: sel.roomId, checkIn: sel.checkIn, checkOut: sel.checkOut, guests: sel.guests, rooms: sel.rooms });
    var room = ctx.hotel ? L.findRoom(ctx.hotel, merged.roomId) : null;
    var nights = L.nightsBetween(merged.checkIn, merged.checkOut);
    var breakdown = room && nights > 0 ? L.priceBreakdown({ pricePerNight: room.pricePerNight, nights: nights, rooms: merged.rooms, taxRate: D.TAX_RATE }) : null;
    var el = $('#summary');
    if (el) {
      el.innerHTML = V.summary(ctx.hotel, room, merged, breakdown);
      el.classList.remove('pulse');
      void el.offsetWidth;
      el.classList.add('pulse');
    }
    $all('.room-opt', appEl).forEach(function (opt) {
      opt.classList.toggle('is-selected', $('input', opt).checked);
    });
  }

  function onWizardInput(target) {
    if (target.name === 'cardNumber') target.value = L.formatCardNumber(target.value);
    else if (target.name === 'expiry') target.value = L.formatExpiry(target.value);
    else if (target.name === 'cvv') target.value = target.value.replace(/\D/g, '').slice(0, 4);
    var group = target.closest('.field, .room-opts');
    if (group) {
      group.classList.remove('has-error', 'shake');
      var msg = $('.field__error', group);
      if (msg) msg.remove();
    }
    target.removeAttribute('aria-invalid');
  }

  function onWizardChange(target) {
    if (state.booking.step !== 1) return;
    if (target.name === 'checkIn') {
      var out = $('#w-checkOut');
      if (L.nightsBetween(target.value, out.value) < 1) out.value = L.addDays(target.value, 1) || out.value;
      out.min = L.addDays(target.value, 1) || out.min;
    }
    refreshSummary();
  }

  /* ---------- actions ---------- */

  function toggleFavorite(id, button) {
    var i = state.favorites.indexOf(id);
    var hotel = L.findHotel(D.HOTELS, id);
    if (i === -1) { state.favorites.push(id); toast('Saved ' + hotel.name + ' to favorites', 'success'); }
    else { state.favorites.splice(i, 1); toast('Removed from favorites', 'info'); }
    var on = i === -1;
    $all('.fav[data-id="' + id + '"]').forEach(function (b) {
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', on ? 'Remove from favorites' : 'Save to favorites');
      b.textContent = on ? '♥' : '♡';
      b.classList.remove('pop');
      void b.offsetWidth;
      b.classList.add('pop');
    });
    updateFavCount();
  }

  var ACTIONS = {
    'toggle-fav': function (el) { toggleFavorite(el.getAttribute('data-id'), el); },
    'reset-filters': resetFilters,
    'toggle-filters': function (el) {
      var open = $('#filters').classList.toggle('is-open');
      el.setAttribute('aria-expanded', String(open));
    },
    'select-room': function (el) {
      var id = currentHotelId();
      startBooking(id, el.getAttribute('data-room-id'));
      toast('Room selected. Let\'s book it!', 'success');
    },
    'room-details': function (el) {
      var hotel = L.findHotel(D.HOTELS, currentHotelId());
      var room = L.findRoom(hotel, el.getAttribute('data-room-id'));
      if (!room) return;
      openModal({
        title: room.name, body: V.roomDetails(room, hotel),
        actions: [
          { label: 'Close' },
          { label: 'Select this room', primary: true, run: function () { startBooking(hotel.id, room.id); toast('Room selected. Let\'s book it!', 'success'); } }
        ]
      });
    },
    'wiz-next': wizardNext,
    'wiz-back': wizardBack,
    'wiz-pay': wizardPay,
    'wiz-cancel': function () {
      openModal({
        title: 'Cancel this booking?', body: '<p>Your selections will be discarded.</p>',
        actions: [
          { label: 'Keep booking' },
          { label: 'Yes, cancel', primary: true, run: function () { state.booking = L.initialBooking(); state.paymentDraft = null; navigate('#/'); toast('Booking cancelled', 'info'); } }
        ]
      });
    },
    'new-booking': function () { state.booking = L.initialBooking(); navigate('#/'); toast('Ready for your next trip ✈️', 'info'); },
    'copy-ref': function () {
      var ref = $('#booking-ref').textContent;
      var done = function () { toast('Reference ' + ref + ' copied', 'success'); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ref).then(done, function () { toast('Copy failed. Select the text instead', 'error'); });
      else toast('Reference: ' + ref, 'info');
    }
  };

  /* ---------- events ---------- */

  document.addEventListener('click', function (e) {
    var modalBtn = e.target.closest('[data-modal-btn]');
    if (modalBtn && modalState) {
      var action = modalState.actions[Number(modalBtn.getAttribute('data-modal-btn'))];
      closeModal();
      if (action && action.run) action.run();
      return;
    }
    if (e.target.matches('[data-modal-close]')) { closeModal(); return; }

    var el = e.target.closest('[data-action]');
    if (!el) return;
    var fn = ACTIONS[el.getAttribute('data-action')];
    if (fn) {
      el.classList.remove('pressed');
      void el.offsetWidth;
      el.classList.add('pressed');
      fn(el);
    }
  });

  appEl.addEventListener('input', function (e) {
    var t = e.target;
    if ($('#search-form') && (t.closest('#search-form') || t.closest('#filters'))) {
      if (t.id === 'f-checkIn' || t.id === 'f-checkOut' || t.id === 'f-guests') return;
      readFilters();
      renderResults(true);
    } else if (t.closest('#wizard-form')) {
      onWizardInput(t);
    }
  });

  appEl.addEventListener('change', function (e) {
    var t = e.target;
    if (t.id === 'f-checkIn' || t.id === 'f-checkOut' || t.id === 'f-guests') onSearchChange(t);
    else if (t.closest('#filters') || t.id === 'f-sort') { readFilters(); renderResults(true); }
    else if (t.closest('#wizard-form')) onWizardChange(t);
  });

  appEl.addEventListener('submit', function (e) {
    e.preventDefault();
    if (e.target.id === 'wizard-form') {
      if (state.booking.step === 3) wizardPay();
      else wizardNext();
    }
  });

  /* ---------- router ---------- */

  function route() {
    closeModal();
    var hash = location.hash || '#/';
    if (hash.indexOf('#/book') === 0) renderBooking(false);
    else if (/^#\/hotel\//.test(hash)) renderHotel(currentHotelId());
    else renderHome();
    window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', route);
  updateFavCount();
  route();
})();
