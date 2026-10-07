import type { Hotel, Room } from './data';

export interface FilterCriteria {
  query?: string;
  minPrice?: number;
  maxPrice?: number;
  minStars?: number;
  minRating?: number;
  amenities?: string[];
  guests?: number;
  freeCancellation?: boolean;
}

export interface PriceBreakdown {
  pricePerNight: number;
  nights: number;
  rooms: number;
  taxRate: number;
  subtotal: number;
  taxes: number;
  total: number;
}

export interface GuestDetails {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  requests?: string;
}

export interface PaymentDetails {
  cardName?: string;
  cardNumber?: string;
  expiry?: string;
  cvv?: string;
}

export interface Validation {
  valid: boolean;
  errors: Record<string, string>;
}

export interface BookingState {
  step: 1 | 2 | 3 | 4;
  hotelId: string | null;
  roomId: string | null;
  checkIn: string | null;
  checkOut: string | null;
  guests: number;
  rooms: number;
  guest: GuestDetails | null;
  payment: { last4: string; cardName: string } | null;
  confirmation: { ref: string; confirmedAt: string } | null;
  error: string | null;
  errors: Record<string, string>;
}

export type BookingAction =
  | { type: 'START'; hotelId?: string; roomId?: string | null; checkIn?: string; checkOut?: string; guests?: number; rooms?: number }
  | { type: 'UPDATE'; roomId?: string | null; checkIn?: string | null; checkOut?: string | null; guests?: number; rooms?: number }
  | { type: 'SET_GUEST'; guest: GuestDetails }
  | { type: 'NEXT'; hotel?: Hotel | null; today?: string }
  | { type: 'BACK' }
  | { type: 'CONFIRM'; payment: PaymentDetails; now?: Date; ref: string | null }
  | { type: 'RESET' }
  | { type: string };

declare const HotelLogic: {
  LIMITS: { maxGuests: number; maxRooms: number; maxNights: number };
  escapeHtml(value: unknown): string;
  formatCurrency(n: number): string;
  plural(n: number, word: string): string;
  parseISODate(s: unknown): number | null;
  toISODate(date: Date): string;
  addDays(iso: string, n: number): string | null;
  nightsBetween(checkIn: string | null | undefined, checkOut: string | null | undefined): number;
  formatDate(iso: string): string;
  minPrice(hotel: Hotel): number;
  findHotel(hotels: Hotel[], id: string): Hotel | null;
  findRoom(hotel: Hotel | null, roomId: string | null): Room | null;
  availableRooms(hotel: Hotel, guests?: number): Room[];
  filterHotels(hotels: Hotel[], criteria?: FilterCriteria): Hotel[];
  sortHotels(hotels: Hotel[], key: string): Hotel[];
  priceBreakdown(o: { pricePerNight: number; nights?: number; rooms?: number; taxRate?: number }): PriceBreakdown;
  validateGuest(g?: GuestDetails | null): Validation;
  luhnValid(number: string): boolean;
  validatePayment(p?: PaymentDetails | null, now?: Date): Validation;
  formatCardNumber(v: string): string;
  formatExpiry(v: string): string;
  cardLast4(number: string): string;
  generateBookingRef(rng?: () => number): string;
  initialBooking(): BookingState;
  validateSelection(b: Partial<BookingState>, hotel?: Hotel | null, today?: string): Record<string, string>;
  bookingReducer(state: BookingState, action: BookingAction): BookingState;
};

export = HotelLogic;
