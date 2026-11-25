import { CurrencyPipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import {
  FilterCriteria,
  PriceBounds,
  SortOption,
  StopsOption,
} from '../../../../core/models';

@Component({
  selector: 'app-flight-filters',
  imports: [CurrencyPipe],
  templateUrl: './flight-filters.component.html',
  styleUrl: './flight-filters.component.scss',
})
export class FlightFiltersComponent {
  readonly airlines = input<string[]>([]);
  readonly priceBounds = input<PriceBounds>({ min: 0, max: 50000 });
  readonly activeFilters = input.required<FilterCriteria>();

  readonly filtersChange = output<FilterCriteria>();
  readonly filtersReset = output<void>();

  readonly stopOptions: { value: StopsOption; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: '0', label: 'Non-stop' },
    { value: '1', label: '1 Stop' },
    { value: '2+', label: '2+ Stops' },
  ];

  readonly effectiveMaxPrice = computed(() => {
    const current = this.activeFilters().maxPrice;
    const max = this.priceBounds().max;
    return current !== null ? Math.min(current, max) : max;
  });

  readonly hasActiveFilters = computed(() => {
    const f = this.activeFilters();
    return (
      f.maxPrice !== null ||
      f.stops !== 'all' ||
      f.airlines.length > 0 ||
      f.sortBy !== 'price_asc'
    );
  });

  onMaxPriceChange(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    const maxBound = this.priceBounds().max;

    this.filtersChange.emit({
      ...this.activeFilters(),
      maxPrice: value >= maxBound ? null : value,
    });
  }

  onStopsChange(stops: StopsOption): void {
    this.filtersChange.emit({
      ...this.activeFilters(),
      stops,
    });
  }

  onAirlineToggle(airline: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const current = this.activeFilters().airlines;
    const nextAirlines = checked
      ? Array.from(new Set([...current, airline]))
      : current.filter((item) => item !== airline);

    this.filtersChange.emit({
      ...this.activeFilters(),
      airlines: nextAirlines,
    });
  }

  onSortChange(event: Event): void {
    const sortBy = (event.target as HTMLSelectElement).value as SortOption;
    this.filtersChange.emit({
      ...this.activeFilters(),
      sortBy,
    });
  }

  isAirlineSelected(airline: string): boolean {
    return this.activeFilters().airlines.includes(airline);
  }

  onResetFilters(): void {
    this.filtersReset.emit();
  }
}
