import type { Hotel, Room } from './data';
import type { BookingState, PriceBreakdown } from './logic';

export interface BookingContext {
  today: string;
  nights?: number;
  breakdown: PriceBreakdown | null;
  paymentDraft?: { cardName?: string; cardNumber?: string; expiry?: string; cvv?: string } | null;
}

declare const HotelViews: {
  stars(n: number): string;
  hotelCard(h: Hotel, o?: { favorite?: boolean; nights?: number }): string;
  hotelList(hotels: Hotel[], o?: { favorites?: string[]; nights?: number }): string;
  resultsCount(count: number, nights: number): string;
  homePage(c: {
    filters: { query?: string; maxPrice: number; minStars: number; minRating: number; amenities?: string[]; freeCancellation?: boolean };
    sort: string;
    search: { checkIn: string; checkOut: string; guests: number };
    today: string;
  }): string;
  roomCard(room: Room, o?: { nights?: number }): string;
  hotelDetail(h: Hotel, o?: { favorite?: boolean; guests?: number; nights?: number }): string;
  roomDetails(room: Room, hotel: Hotel): string;
  stepper(step: number): string;
  field(o: { label: string; name: string; value?: string; error?: string; type?: string; attrs?: string; textarea?: boolean; cls?: string }): string;
  summary(hotel: Hotel, room: Room | null, b: BookingState, breakdown: PriceBreakdown | null): string;
  bookingPage(hotel: Hotel, b: BookingState, c: BookingContext): string;
  emptyState(title: string, text: string, actionHtml?: string): string;
};

export = HotelViews;
