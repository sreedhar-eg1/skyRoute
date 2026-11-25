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

  readonly stopsBadgeClass = computed(() => {
    const stops = this.flight().stops;
    if (stops === 0) {
      return 'text-bg-success';
    }
    return stops === 1 ? 'text-bg-warning' : 'text-bg-secondary';
  });

  readonly totalFare = computed(() => this.flight().price * Math.max(1, this.passengers()));
}
