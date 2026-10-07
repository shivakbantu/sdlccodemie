export interface Room {
  id: string;
  name: string;
  beds: string;
  sizeSqm: number;
  maxGuests: number;
  pricePerNight: number;
  refundable: boolean;
  roomsLeft: number;
  perks: string[];
}

export interface Hotel {
  id: string;
  name: string;
  city: string;
  country: string;
  stars: number;
  rating: number;
  reviews: number;
  hue: number;
  emoji: string;
  description: string;
  amenities: string[];
  rooms: Room[];
}

declare const HotelData: {
  HOTELS: Hotel[];
  AMENITIES: Record<string, { label: string; icon: string }>;
  TAX_RATE: number;
  PRICE_RANGE: { min: number; max: number };
};

export = HotelData;
