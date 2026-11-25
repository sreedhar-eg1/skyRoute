import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  concat,
  of,
  throwError,
} from 'rxjs';
import {
  catchError,
  debounceTime,
  delay,
  finalize,
  map,
  shareReplay,
  skip,
  switchMap,
  take,
  tap,
} from 'rxjs/operators';
import {
  AirportOption,
  FilterCriteria,
  Flight,
  PriceBounds,
  SearchCriteria,
} from '../models';

export const DEFAULT_FILTER_CRITERIA: FilterCriteria = {
  maxPrice: null,
  stops: 'all',
  airlines: [],
  sortBy: 'price_asc',
};

@Injectable({
  providedIn: 'root',
})
export class FlightService {
  private readonly http = inject(HttpClient);
  private readonly dataUrl = 'data/flights.json';

  private hasLoaded = false;

  private readonly flightsSubject = new BehaviorSubject<Flight[]>([]);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private readonly errorSubject = new BehaviorSubject<string | null>(null);
  private readonly simulateErrorSubject = new BehaviorSubject<boolean>(false);
  private readonly searchCriteriaSubject = new BehaviorSubject<SearchCriteria | null>(null);
  private readonly filterCriteriaSubject = new BehaviorSubject<FilterCriteria>(
    DEFAULT_FILTER_CRITERIA
  );

  readonly loading$ = this.loadingSubject.asObservable();
  readonly error$ = this.errorSubject.asObservable();
  readonly simulateError$ = this.simulateErrorSubject.asObservable();
  readonly searchCriteria$ = this.searchCriteriaSubject.asObservable();
  readonly filterCriteria$ = this.filterCriteriaSubject.asObservable();

  readonly passengers$: Observable<number> = this.searchCriteria$.pipe(
    map((criteria) => criteria?.passengers ?? 1)
  );

  readonly availableAirports$: Observable<AirportOption[]> = this.flightsSubject.pipe(
    map((flights) => this.extractUniqueAirports(flights)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly searchMatchedFlights$: Observable<Flight[]> = combineLatest([
    this.flightsSubject.asObservable(),
    this.searchCriteriaSubject.asObservable(),
  ]).pipe(
    map(([flights, criteria]) => this.applySearchCriteria(flights, criteria)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly totalSearchMatchesCount$: Observable<number> = this.searchMatchedFlights$.pipe(
    map((flights) => flights.length)
  );

  readonly availableAirlines$: Observable<string[]> = this.searchMatchedFlights$.pipe(
    map((flights) => Array.from(new Set(flights.map((f) => f.airline))).sort()),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly priceBounds$: Observable<PriceBounds> = this.searchMatchedFlights$.pipe(
    map((flights) => this.calculatePriceBounds(flights)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly filteredFlights$: Observable<Flight[]> = combineLatest([
    this.searchMatchedFlights$,
    concat(
      this.filterCriteriaSubject.pipe(take(1)),
      this.filterCriteriaSubject.pipe(skip(1), debounceTime(150))
    ),
  ]).pipe(
    map(([flights, filters]) => this.applyFiltersAndSort(flights, filters)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  /**
   * Fetches all flights from the mock JSON endpoint with simulated network latency.
   */
  getAllFlights(): Observable<Flight[]> {
    if (this.simulateErrorSubject.value) {
      return of(null).pipe(
        delay(500),
        switchMap(() =>
          throwError(
            () =>
              new HttpErrorResponse({
                status: 503,
                statusText: 'Service Unavailable',
                url: this.dataUrl,
                error: 'Simulated flight API failure for error-handling verification.',
              })
          )
        )
      );
    }

    return this.http.get<Flight[]>(this.dataUrl).pipe(delay(500));
  }

  /**
   * Loads flights into reactive state if they have not already been fetched.
   */
  ensureFlightsLoaded(): void {
    if (!this.hasLoaded && !this.loadingSubject.value) {
      this.loadFlights();
    }
  }

  /**
   * Triggers a fresh HTTP request to fetch flights and updates loading/error streams.
   */
  loadFlights(): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    this.getAllFlights()
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this.hasLoaded = false;
          this.errorSubject.next(this.formatHttpError(error));
          return of([] as Flight[]);
        }),
        finalize(() => this.loadingSubject.next(false))
      )
      .subscribe((flights) => {
        if (!this.errorSubject.value) {
          this.hasLoaded = true;
        }
        this.flightsSubject.next(flights);
      });
  }

  /**
   * Fetches a single flight by ID, reusing cached flights when available or loading from HTTP.
   */
  getFlightById(id: string): Observable<Flight | undefined> {
    if (this.hasLoaded && this.flightsSubject.value.length > 0 && !this.simulateErrorSubject.value) {
      return of(this.flightsSubject.value.find((flight) => flight.id === id));
    }

    return this.getAllFlights().pipe(
      tap((flights) => {
        this.hasLoaded = true;
        this.errorSubject.next(null);
        this.flightsSubject.next(flights);
      }),
      map((flights) => flights.find((flight) => flight.id === id)),
      catchError((error: HttpErrorResponse) => {
        this.hasLoaded = false;
        return throwError(() => new Error(this.formatHttpError(error)));
      })
    );
  }

  /**
   * Updates active search criteria and resets sidebar filters to avoid stale filter hiding.
   */
  updateSearchCriteria(criteria: SearchCriteria): void {
    this.searchCriteriaSubject.next({
      ...criteria,
      origin: criteria.origin.trim(),
      destination: criteria.destination.trim(),
    });
    this.filterCriteriaSubject.next({ ...DEFAULT_FILTER_CRITERIA });
  }

  /**
   * Clears active search criteria and restores default filters to display all flights.
   */
  clearSearch(): void {
    this.searchCriteriaSubject.next(null);
    this.filterCriteriaSubject.next({ ...DEFAULT_FILTER_CRITERIA });
  }

  /**
   * Updates filter criteria reactively without re-fetching data from the API.
   */
  updateFilters(filters: FilterCriteria): void {
    this.filterCriteriaSubject.next({
      ...filters,
      airlines: [...filters.airlines],
    });
  }

  /**
   * Resets only the sidebar filters while preserving the current search query.
   */
  resetFilters(): void {
    this.filterCriteriaSubject.next({ ...DEFAULT_FILTER_CRITERIA });
  }

  /**
   * Toggles simulated API error mode and reloads flights to demonstrate catchError handling.
   */
  setSimulateError(enabled: boolean): void {
    this.simulateErrorSubject.next(enabled);
    this.loadFlights();
  }

  getCurrentSearchCriteria(): SearchCriteria | null {
    return this.searchCriteriaSubject.value;
  }

  getCurrentFilterCriteria(): FilterCriteria {
    return this.filterCriteriaSubject.value;
  }

  private applySearchCriteria(flights: Flight[], criteria: SearchCriteria | null): Flight[] {
    if (!criteria) {
      return flights;
    }

    const originQuery = criteria.origin.trim().toLowerCase();
    const destinationQuery = criteria.destination.trim().toLowerCase();

    return flights.filter((flight) => {
      const matchesOrigin =
        !originQuery ||
        flight.origin.toLowerCase() === originQuery ||
        flight.originCity.toLowerCase().includes(originQuery) ||
        flight.originAirport.toLowerCase().includes(originQuery);

      const matchesDestination =
        !destinationQuery ||
        flight.destination.toLowerCase() === destinationQuery ||
        flight.destinationCity.toLowerCase().includes(destinationQuery) ||
        flight.destinationAirport.toLowerCase().includes(destinationQuery);

      const matchesSeats = flight.availableSeats >= criteria.passengers;

      return matchesOrigin && matchesDestination && matchesSeats;
    });
  }

  private applyFiltersAndSort(flights: Flight[], filters: FilterCriteria): Flight[] {
    const filtered = flights.filter((flight) => {
      const matchesPrice =
        filters.maxPrice === null || flight.price <= filters.maxPrice;

      const matchesStops =
        filters.stops === 'all' ||
        (filters.stops === '0' && flight.stops === 0) ||
        (filters.stops === '1' && flight.stops === 1) ||
        (filters.stops === '2+' && flight.stops >= 2);

      const matchesAirline =
        filters.airlines.length === 0 || filters.airlines.includes(flight.airline);

      return matchesPrice && matchesStops && matchesAirline;
    });

    return [...filtered].sort((a, b) => {
      switch (filters.sortBy) {
        case 'price_desc':
          return b.price - a.price;
        case 'duration_asc':
          return a.durationMinutes - b.durationMinutes;
        case 'departure_asc':
          return a.departureTime.localeCompare(b.departureTime);
        case 'price_asc':
        default:
          return a.price - b.price;
      }
    });
  }

  private extractUniqueAirports(flights: Flight[]): AirportOption[] {
    const airportMap = new Map<string, AirportOption>();

    for (const flight of flights) {
      if (!airportMap.has(flight.origin)) {
        airportMap.set(flight.origin, {
          code: flight.origin,
          city: flight.originCity,
          airport: flight.originAirport,
        });
      }
      if (!airportMap.has(flight.destination)) {
        airportMap.set(flight.destination, {
          code: flight.destination,
          city: flight.destinationCity,
          airport: flight.destinationAirport,
        });
      }
    }

    return Array.from(airportMap.values()).sort((a, b) => a.code.localeCompare(b.code));
  }

  private calculatePriceBounds(flights: Flight[]): PriceBounds {
    if (flights.length === 0) {
      return { min: 0, max: 50000 };
    }

    const prices = flights.map((flight) => flight.price);
    const min = Math.floor(Math.min(...prices) / 500) * 500;
    const max = Math.ceil(Math.max(...prices) / 500) * 500;

    return {
      min,
      max: max > min ? max : min + 500,
    };
  }

  private formatHttpError(error: HttpErrorResponse): string {
    if (error.status === 503) {
      return 'Simulated API error (503): Flight service is temporarily unavailable.';
    }
    if (error.status === 0) {
      return 'Network error: Unable to reach the flight data service.';
    }
    if (error.status >= 400) {
      return `Unable to load flights (HTTP ${error.status}). Please retry.`;
    }
    return 'Unable to parse flight data from the server. Please retry.';
  }
}
