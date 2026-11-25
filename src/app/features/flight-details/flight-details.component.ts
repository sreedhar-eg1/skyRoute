import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { combineLatest, of } from 'rxjs';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';
import { Flight, SearchCriteria } from '../../core/models';
import { FlightService } from '../../core/services/flight.service';

interface FlightDetailsViewModel {
  loading: boolean;
  flight?: Flight;
  error: string | null;
  searchCriteria: SearchCriteria | null;
}

@Component({
  selector: 'app-flight-details',
  imports: [AsyncPipe, CurrencyPipe, RouterLink],
  templateUrl: './flight-details.component.html',
  styleUrl: './flight-details.component.scss',
})
export class FlightDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly flightService = inject(FlightService);

  private readonly passengerOverride = signal<number | null>(null);

  private readonly flightState$ = this.route.paramMap.pipe(
    map((params) => params.get('id') ?? ''),
    switchMap((id) => {
      if (!id) {
        return of({
          loading: false,
          flight: undefined,
          error: 'No flight identifier was provided.',
        });
      }

      return this.flightService.getFlightById(id).pipe(
        map((flight) => ({
          loading: false,
          flight,
          error: null,
        })),
        startWith({
          loading: true,
          flight: undefined,
          error: null,
        }),
        catchError((err: Error) =>
          of({
            loading: false,
            flight: undefined,
            error: err.message || 'Unable to load flight details.',
          })
        )
      );
    })
  );

  readonly vm$ = combineLatest([
    this.flightState$,
    this.flightService.searchCriteria$,
  ]).pipe(
    map(
      ([state, searchCriteria]): FlightDetailsViewModel => ({
        ...state,
        searchCriteria,
      })
    )
  );

  getPassengerCount(searchCriteria: SearchCriteria | null): number {
    return this.passengerOverride() ?? searchCriteria?.passengers ?? 1;
  }

  adjustPassengers(delta: number, currentCount: number, maxSeats: number): void {
    const maxAllowed = Math.min(9, Math.max(1, maxSeats));
    const next = Math.min(maxAllowed, Math.max(1, currentCount + delta));
    this.passengerOverride.set(next);
  }

  getStopsLabel(stops: number): string {
    if (stops === 0) {
      return 'Non-stop';
    }
    return stops === 1 ? '1 Stop' : `${stops} Stops`;
  }
}
