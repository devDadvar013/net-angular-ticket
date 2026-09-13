export interface Airport {
  code: string;
  city: string;
  name: string;
}

export type CabinClass = "اکونومی" | "بیزینس";

export interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  from: Airport;
  to: Airport;
  departure: string;
  arrival: string;
  price: number;
  cabinClass: CabinClass;
  stops: number;
  baggage: number;
  capacity: number;
  booked: number;
  airlineColor: string;
}

export interface SearchQuery {
  from: string;
  to: string;
  date: string;
  returnDate?: string;
  passengers: number;
  cabinClass: CabinClass;
  roundTrip: boolean;
}

export interface Passenger {
  firstName: string;
  lastName: string;
  nationalId: string;
  phone: string;
}

export interface Booking {
  ref: string;
  flights: Flight[];
  passengers: Passenger[];
  total: number;
  createdAt: string;
}
