import { CurrencyPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Flight } from '../../../core/models';

@Component({
  selector: 'app-flight-card',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './flight-card.component.html',
  styleUrl: './flight-card.component.scss',
})
export class FlightCardComponent {
  readonly flight = input.required<Flight>();
  readonly passengers = input<number>(1);

  readonly stopsLabel = computed(() => {
    const stops = this.flight().stops;
    if (stops === 0) {
      return 'Non-stop';
    }
    return stops === 1 ? '1 Stop' : `${stops} Stops`;
  });

  readonly layoverSummary = computed(() => {
    const layovers = this.flight().layovers;
    if (layovers.length === 0) {
      return '';
    }
    return `via ${layovers.map((stop) => stop.airportCode).join(', ')}`;
  });

  readonly stopsBadgeClass = computed(() => {
    const stops = this.flight().stops;
    if (stops === 0) {
      return 'badge-soft-success';
    }
    return stops === 1 ? 'badge-soft-warning' : 'badge-soft-neutral';
  });

  readonly totalFare = computed(() => this.flight().price * Math.max(1, this.passengers()));
}
