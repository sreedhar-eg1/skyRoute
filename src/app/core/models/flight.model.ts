export type CabinClass = 'Economy' | 'Premium Economy' | 'Business';

export interface Layover {
  airportCode: string;
  airportName: string;
  city: string;
  duration: string;
}

export interface BaggageAllowance {
  cabin: string;
  checkIn: string;
}

export interface Flight {
  id: string;
  flightNumber: string;
  airline: string;
  airlineCode: string;
  origin: string;
  originCity: string;
  originAirport: string;
  originTerminal: string;
  destination: string;
  destinationCity: string;
  destinationAirport: string;
  destinationTerminal: string;
  departureTime: string;
  arrivalTime: string;
  arrivalNextDay?: boolean;
  duration: string;
  durationMinutes: number;
  stops: number;
  layovers: Layover[];
  price: number;
  currency: string;
  cabinClass: CabinClass;
  aircraftType: string;
  baggageAllowance: BaggageAllowance;
  availableSeats: number;
  refundable: boolean;
}
