import { Component, input, output } from '@angular/core';
import { Flight, SearchCriteria } from '../../../../core/models';
import { FlightCardComponent } from '../../../../shared/components/flight-card/flight-card.component';

@Component({
  selector: 'app-flight-list',
  imports: [FlightCardComponent],
  templateUrl: './flight-list.component.html',
  styleUrl: './flight-list.component.scss',
})
export class FlightListComponent {
  readonly flights = input<Flight[]>([]);
  readonly totalMatches = input<number>(0);
  readonly loading = input<boolean>(false);
  readonly error = input<string | null>(null);
  readonly simulateError = input<boolean>(false);
  readonly searchCriteria = input<SearchCriteria | null>(null);
  readonly passengers = input<number>(1);

  readonly retry = output<void>();
  readonly resetFilters = output<void>();
  readonly clearSearch = output<void>();
  readonly simulateErrorChange = output<boolean>();

  onSimulateErrorToggle(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.simulateErrorChange.emit(checked);
  }
}
