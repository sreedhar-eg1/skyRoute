export interface SearchCriteria {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string | null;
  passengers: number;
}

export interface AirportOption {
  code: string;
  city: string;
  airport: string;
}
