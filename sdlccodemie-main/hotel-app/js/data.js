(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HotelData = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var AMENITIES = {
    wifi: { label: 'Free Wi-Fi', icon: '📶' },
    pool: { label: 'Pool', icon: '🏊' },
    spa: { label: 'Spa', icon: '💆' },
    gym: { label: 'Gym', icon: '🏋️' },
    parking: { label: 'Parking', icon: '🅿️' },
    breakfast: { label: 'Breakfast', icon: '🥐' },
    pet: { label: 'Pet friendly', icon: '🐾' },
    beach: { label: 'Beach access', icon: '🏖️' }
  };

  var HOTELS = [
    {
      id: 'h1', name: 'Le Petit Lumière', city: 'Paris', country: 'France', stars: 4, rating: 4.6, reviews: 1842,
      hue: 340, emoji: '🗼',
      description: 'A boutique hotel a short stroll from the Seine, with candle-lit lounges and a rooftop breakfast terrace.',
      amenities: ['wifi', 'breakfast', 'spa', 'gym'],
      rooms: [
        { id: 'h1-r1', name: 'Classic Double', beds: '1 double bed', sizeSqm: 20, maxGuests: 2, pricePerNight: 180, refundable: true, roomsLeft: 5, perks: ['City view', 'Rain shower'] },
        { id: 'h1-r2', name: 'Deluxe Eiffel View', beds: '1 king bed', sizeSqm: 28, maxGuests: 2, pricePerNight: 260, refundable: true, roomsLeft: 2, perks: ['Eiffel Tower view', 'Nespresso machine', 'Bathtub'] },
        { id: 'h1-r3', name: 'Family Suite', beds: '1 king + 2 singles', sizeSqm: 42, maxGuests: 4, pricePerNight: 340, refundable: false, roomsLeft: 3, perks: ['Separate lounge', 'Two bathrooms'] }
      ]
    },
    {
      id: 'h2', name: 'Sakura Grand Tokyo', city: 'Tokyo', country: 'Japan', stars: 5, rating: 4.8, reviews: 3120,
      hue: 320, emoji: '🌸',
      description: 'Sky-high luxury in Shinjuku with an infinity pool, onsen-style spa and a Michelin-starred sushi counter.',
      amenities: ['wifi', 'pool', 'spa', 'gym', 'breakfast'],
      rooms: [
        { id: 'h2-r1', name: 'Standard Twin', beds: '2 single beds', sizeSqm: 26, maxGuests: 2, pricePerNight: 210, refundable: true, roomsLeft: 6, perks: ['Smart toilet', 'Green tea set'] },
        { id: 'h2-r2', name: 'Executive Room', beds: '1 king bed', sizeSqm: 36, maxGuests: 2, pricePerNight: 320, refundable: true, roomsLeft: 4, perks: ['Club lounge access', 'Skyline view'] },
        { id: 'h2-r3', name: 'Grand Suite', beds: '1 king + sofa bed', sizeSqm: 68, maxGuests: 4, pricePerNight: 520, refundable: false, roomsLeft: 1, perks: ['Private onsen tub', 'Butler service'] }
      ]
    },
    {
      id: 'h3', name: 'Harbor & Pine', city: 'New York', country: 'USA', stars: 4, rating: 4.3, reviews: 2210,
      hue: 215, emoji: '🗽',
      description: 'A pet-friendly Brooklyn Heights hotel with skyline views, a lively lobby bar and quick subway access.',
      amenities: ['wifi', 'gym', 'pet', 'parking'],
      rooms: [
        { id: 'h3-r1', name: 'Queen Studio', beds: '1 queen bed', sizeSqm: 22, maxGuests: 2, pricePerNight: 199, refundable: true, roomsLeft: 8, perks: ['Kitchenette'] },
        { id: 'h3-r2', name: 'City King', beds: '1 king bed', sizeSqm: 30, maxGuests: 2, pricePerNight: 249, refundable: true, roomsLeft: 3, perks: ['Manhattan view', 'Work desk'] },
        { id: 'h3-r3', name: 'Two Queen Family', beds: '2 queen beds', sizeSqm: 38, maxGuests: 4, pricePerNight: 329, refundable: false, roomsLeft: 2, perks: ['Sofa seating', 'Mini fridge'] }
      ]
    },
    {
      id: 'h4', name: 'Ubud Jungle Retreat', city: 'Bali', country: 'Indonesia', stars: 4, rating: 4.7, reviews: 980,
      hue: 140, emoji: '🌴',
      description: 'Thatched bungalows among the rice terraces, with daily yoga, a jungle pool and a farm-to-table kitchen.',
      amenities: ['wifi', 'pool', 'spa', 'breakfast', 'pet'],
      rooms: [
        { id: 'h4-r1', name: 'Garden Bungalow', beds: '1 king bed', sizeSqm: 32, maxGuests: 2, pricePerNight: 85, refundable: true, roomsLeft: 7, perks: ['Outdoor shower', 'Private terrace'] },
        { id: 'h4-r2', name: 'Pool Villa', beds: '1 king bed', sizeSqm: 55, maxGuests: 3, pricePerNight: 160, refundable: true, roomsLeft: 2, perks: ['Private plunge pool', 'Daily breakfast'] },
        { id: 'h4-r3', name: 'Family Villa', beds: '2 king beds', sizeSqm: 90, maxGuests: 5, pricePerNight: 230, refundable: false, roomsLeft: 1, perks: ['Two bedrooms', 'Private kitchen'] }
      ]
    },
    {
      id: 'h5', name: 'Desert Pearl Resort', city: 'Dubai', country: 'UAE', stars: 5, rating: 4.5, reviews: 2650,
      hue: 35, emoji: '🏜️',
      description: 'A beachfront palace of marble and gold with seven restaurants, a private marina and a world-class spa.',
      amenities: ['wifi', 'pool', 'spa', 'gym', 'parking', 'beach', 'breakfast'],
      rooms: [
        { id: 'h5-r1', name: 'Deluxe King', beds: '1 king bed', sizeSqm: 45, maxGuests: 2, pricePerNight: 290, refundable: true, roomsLeft: 9, perks: ['Balcony', 'Marble bathroom'] },
        { id: 'h5-r2', name: 'Ocean Suite', beds: '1 king + sofa bed', sizeSqm: 80, maxGuests: 3, pricePerNight: 450, refundable: true, roomsLeft: 3, perks: ['Sea view', 'Lounge access'] },
        { id: 'h5-r3', name: 'Royal Villa', beds: '3 king beds', sizeSqm: 220, maxGuests: 6, pricePerNight: 580, refundable: false, roomsLeft: 1, perks: ['Private pool', 'Personal chef'] }
      ]
    },
    {
      id: 'h6', name: 'The Thames Inn', city: 'London', country: 'UK', stars: 3, rating: 4.0, reviews: 1530,
      hue: 260, emoji: '🎡',
      description: 'A cosy, well-priced inn on the South Bank, steps from the London Eye and the Borough Market.',
      amenities: ['wifi', 'breakfast', 'pet'],
      rooms: [
        { id: 'h6-r1', name: 'Compact Double', beds: '1 double bed', sizeSqm: 14, maxGuests: 2, pricePerNight: 120, refundable: true, roomsLeft: 4, perks: ['Tea & coffee'] },
        { id: 'h6-r2', name: 'Superior Twin', beds: '2 single beds', sizeSqm: 18, maxGuests: 2, pricePerNight: 150, refundable: true, roomsLeft: 2, perks: ['River glimpse'] },
        { id: 'h6-r3', name: 'Triple Room', beds: '1 double + 1 single', sizeSqm: 24, maxGuests: 3, pricePerNight: 175, refundable: false, roomsLeft: 2, perks: ['Breakfast included'] }
      ]
    },
    {
      id: 'h7', name: 'Casa Mar Barcelona', city: 'Barcelona', country: 'Spain', stars: 4, rating: 4.4, reviews: 1760,
      hue: 20, emoji: '🏖️',
      description: 'Bright Mediterranean rooms on Barceloneta beach, with a rooftop pool and tapas bar.',
      amenities: ['wifi', 'pool', 'beach', 'parking', 'gym'],
      rooms: [
        { id: 'h7-r1', name: 'Standard Double', beds: '1 double bed', sizeSqm: 21, maxGuests: 2, pricePerNight: 140, refundable: true, roomsLeft: 6, perks: ['Courtyard view'] },
        { id: 'h7-r2', name: 'Sea View Double', beds: '1 king bed', sizeSqm: 26, maxGuests: 2, pricePerNight: 210, refundable: true, roomsLeft: 3, perks: ['Sea view', 'Balcony'] },
        { id: 'h7-r3', name: 'Terrace Suite', beds: '1 king + sofa bed', sizeSqm: 50, maxGuests: 4, pricePerNight: 300, refundable: false, roomsLeft: 1, perks: ['Private terrace', 'Hot tub'] }
      ]
    },
    {
      id: 'h8', name: 'Opera Bay Sydney', city: 'Sydney', country: 'Australia', stars: 5, rating: 4.6, reviews: 1390,
      hue: 190, emoji: '🦘',
      description: 'Harbour-front elegance with uninterrupted Opera House views, a sky pool and a private ferry dock.',
      amenities: ['wifi', 'pool', 'gym', 'spa', 'parking', 'beach'],
      rooms: [
        { id: 'h8-r1', name: 'Harbour King', beds: '1 king bed', sizeSqm: 38, maxGuests: 2, pricePerNight: 310, refundable: true, roomsLeft: 5, perks: ['Harbour view'] },
        { id: 'h8-r2', name: 'Bay Suite', beds: '1 king + sofa bed', sizeSqm: 64, maxGuests: 3, pricePerNight: 430, refundable: true, roomsLeft: 2, perks: ['Opera House view', 'Lounge access'] },
        { id: 'h8-r3', name: 'Penthouse', beds: '2 king beds', sizeSqm: 140, maxGuests: 6, pricePerNight: 590, refundable: false, roomsLeft: 1, perks: ['Wraparound terrace', 'Private lift'] }
      ]
    },
    {
      id: 'h9', name: 'Alfama Nest', city: 'Lisbon', country: 'Portugal', stars: 3, rating: 4.1, reviews: 720,
      hue: 55, emoji: '🚋',
      description: 'A friendly, budget-smart guesthouse in a tiled 18th-century building above the old tram line.',
      amenities: ['wifi', 'breakfast'],
      rooms: [
        { id: 'h9-r1', name: 'Twin Room', beds: '2 single beds', sizeSqm: 15, maxGuests: 2, pricePerNight: 70, refundable: true, roomsLeft: 5, perks: ['Shared terrace'] },
        { id: 'h9-r2', name: 'Double Room', beds: '1 double bed', sizeSqm: 17, maxGuests: 2, pricePerNight: 85, refundable: true, roomsLeft: 3, perks: ['River glimpse'] },
        { id: 'h9-r3', name: 'Family Room', beds: '1 double + 2 singles', sizeSqm: 30, maxGuests: 4, pricePerNight: 120, refundable: false, roomsLeft: 2, perks: ['Kitchenette'] }
      ]
    }
  ];

  return {
    HOTELS: HOTELS,
    AMENITIES: AMENITIES,
    TAX_RATE: 0.12,
    PRICE_RANGE: { min: 50, max: 600 }
  };
});
