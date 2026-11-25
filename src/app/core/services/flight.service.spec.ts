import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Flight } from '../models';
import { FlightService } from './flight.service';

const MOCK_FLIGHTS: Flight[] = [
  {
    id: 'FL101',
    flightNumber: '6E-2041',
    airline: 'IndiGo',
    airlineCode: '6E',
    origin: 'DEL',
    originCity: 'New Delhi',
    originAirport: 'Indira Gandhi International Airport',
    originTerminal: 'Terminal 3',
    destination: 'BOM',
    destinationCity: 'Mumbai',
    destinationAirport: 'Chhatrapati Shivaji Maharaj International Airport',
    destinationTerminal: 'Terminal 2',
    departureTime: '06:15',
    arrivalTime: '08:30',
    duration: '2h 15m',
    durationMinutes: 135,
    stops: 0,
    layovers: [],
    price: 4899,
    currency: 'INR',
    cabinClass: 'Economy',
    aircraftType: 'Airbus A320neo',
    baggageAllowance: { cabin: '7 kg', checkIn: '15 kg' },
    availableSeats: 20,
    refundable: false,
  },
  {
    id: 'FL104',
    flightNumber: 'QP-1120',
    airline: 'Akasa Air',
    airlineCode: 'QP',
    origin: 'DEL',
    originCity: 'New Delhi',
    originAirport: 'Indira Gandhi International Airport',
    originTerminal: 'Terminal 1',
    destination: 'BOM',
    destinationCity: 'Mumbai',
    destinationAirport: 'Chhatrapati Shivaji Maharaj International Airport',
    destinationTerminal: 'Terminal 1',
    departureTime: '17:45',
    arrivalTime: '21:55',
    duration: '4h 10m',
    durationMinutes: 250,
    stops: 1,
    layovers: [
      {
        airportCode: 'GOI',
        airportName: 'Manohar International Airport',
        city: 'Goa',
        duration: '55m',
      },
    ],
    price: 4250,
    currency: 'INR',
    cabinClass: 'Economy',
    aircraftType: 'Boeing 737 MAX 8',
    baggageAllowance: { cabin: '7 kg', checkIn: '15 kg' },
    availableSeats: 4,
    refundable: false,
  },
  {
    id: 'FL111',
    flightNumber: 'EK-501',
    airline: 'Emirates',
    airlineCode: 'EK',
    origin: 'BOM',
    originCity: 'Mumbai',
    originAirport: 'Chhatrapati Shivaji Maharaj International Airport',
    originTerminal: 'Terminal 2',
    destination: 'DXB',
    destinationCity: 'Dubai',
    destinationAirport: 'Dubai International Airport',
    destinationTerminal: 'Terminal 3',
    departureTime: '04:30',
    arrivalTime: '06:15',
    duration: '3h 15m',
    durationMinutes: 195,
    stops: 0,
    layovers: [],
    price: 18900,
    currency: 'INR',
    cabinClass: 'Economy',
    aircraftType: 'Boeing 777-300ER',
    baggageAllowance: { cabin: '7 kg', checkIn: '30 kg' },
    availableSeats: 15,
    refundable: true,
  },
];

describe('FlightService', () => {
  let service: FlightService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FlightService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load flights after simulated 500ms delay', fakeAsync(() => {
    let latestFlights: Flight[] = [];
    const sub = service.filteredFlights$.subscribe((flights) => {
      latestFlights = flights;
    });

    service.loadFlights();

    const req = httpMock.expectOne('data/flights.json');
    expect(req.request.method).toBe('GET');
    req.flush(MOCK_FLIGHTS);

    tick(499);
    expect(latestFlights.length).toBe(0);

    tick(1);
    expect(latestFlights.length).toBe(3);
    sub.unsubscribe();
  }));

  it('should handle HTTP errors gracefully via catchError', fakeAsync(() => {
    let latestError: string | null = null;
    let isLoading = false;
    const errSub = service.error$.subscribe((err) => (latestError = err));
    const loadSub = service.loading$.subscribe((loading) => (isLoading = loading));

    service.loadFlights();
    expect(isLoading).toBeTrue();

    const req = httpMock.expectOne('data/flights.json');
    req.flush('Not Found', { status: 404, statusText: 'Not Found' });

    tick(500);
    expect(isLoading).toBeFalse();
    expect(latestError).toContain('HTTP 404');

    errSub.unsubscribe();
    loadSub.unsubscribe();
  }));

  it('should combine search criteria and debounced filters without extra API calls', fakeAsync(() => {
    let filtered: Flight[] = [];
    const sub = service.filteredFlights$.subscribe((flights) => (filtered = flights));

    service.loadFlights();
    const req = httpMock.expectOne('data/flights.json');
    req.flush(MOCK_FLIGHTS);
    tick(500);

    service.updateSearchCriteria({
      origin: 'del',
      destination: 'bom',
      departureDate: '2026-12-01',
      passengers: 2,
    });
    expect(filtered.length).toBe(2);

    service.updateFilters({
      maxPrice: 5000,
      stops: '0',
      airlines: ['IndiGo'],
      sortBy: 'price_asc',
    });

    tick(150);
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('FL101');
    httpMock.expectNone('data/flights.json');
    sub.unsubscribe();
  }));

  it('should fetch a single flight by ID from cache or HTTP', fakeAsync(() => {
    let selectedFlight: Flight | undefined;
    service.getFlightById('FL111').subscribe((flight) => {
      selectedFlight = flight;
    });

    const req = httpMock.expectOne('data/flights.json');
    req.flush(MOCK_FLIGHTS);
    tick(500);

    expect(selectedFlight?.flightNumber).toBe('EK-501');
  }));
});
