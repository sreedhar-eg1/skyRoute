import { AsyncPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { combineLatest } from 'rxjs';
import { FilterCriteria, SearchCriteria } from '../../core/models';
import { FlightService } from '../../core/services/flight.service';
import { FlightFiltersComponent } from './components/flight-filters/flight-filters.component';
import { FlightListComponent } from './components/flight-list/flight-list.component';
import { FlightSearchComponent } from './components/flight-search/flight-search.component';

@Component({
  selector: 'app-flight-search-page',
  imports: [
    AsyncPipe,
    FlightSearchComponent,
    FlightFiltersComponent,
    FlightListComponent,
  ],
  templateUrl: './flight-search-page.component.html',
  styleUrl: './flight-search-page.component.scss',
})
export class FlightSearchPageComponent implements OnInit {
  private readonly flightService = inject(FlightService);

  readonly vm$ = combineLatest({
    flights: this.flightService.filteredFlights$,
    totalMatches: this.flightService.totalSearchMatchesCount$,
    loading: this.flightService.loading$,
    error: this.flightService.error$,
    simulateError: this.flightService.simulateError$,
    searchCriteria: this.flightService.searchCriteria$,
    filterCriteria: this.flightService.filterCriteria$,
    airlines: this.flightService.availableAirlines$,
    priceBounds: this.flightService.priceBounds$,
    airports: this.flightService.availableAirports$,
    passengers: this.flightService.passengers$,
  });

  ngOnInit(): void {
    this.flightService.ensureFlightsLoaded();
  }

  onSearchSubmitted(criteria: SearchCriteria): void {
    this.flightService.updateSearchCriteria(criteria);
  }

  onSearchReset(): void {
    this.flightService.clearSearch();
  }

  onFiltersChange(filters: FilterCriteria): void {
    this.flightService.updateFilters(filters);
  }

  onFiltersReset(): void {
    this.flightService.resetFilters();
  }

  onRetry(): void {
    this.flightService.setSimulateError(false);
  }

  onSimulateErrorChange(enabled: boolean): void {
    this.flightService.setSimulateError(enabled);
  }
}
