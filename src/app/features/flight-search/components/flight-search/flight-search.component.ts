import { Component, effect, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AirportOption, SearchCriteria } from '../../../../core/models';
import {
  distinctRouteValidator,
  returnDateAfterDepartureValidator,
} from '../../../../core/validators/flight-search.validators';

@Component({
  selector: 'app-flight-search',
  imports: [ReactiveFormsModule],
  templateUrl: './flight-search.component.html',
  styleUrl: './flight-search.component.scss',
})
export class FlightSearchComponent {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly airports = input<AirportOption[]>([]);
  readonly initialCriteria = input<SearchCriteria | null>(null);

  readonly searchSubmitted = output<SearchCriteria>();
  readonly searchReset = output<void>();

  readonly submitted = signal(false);

  readonly quickRoutes = [
    { origin: 'DEL', destination: 'BOM' },
    { origin: 'DEL', destination: 'BLR' },
    { origin: 'BOM', destination: 'DXB' },
    { origin: 'BLR', destination: 'SIN' },
  ];

  readonly searchForm = this.fb.group(
    {
      origin: ['', [Validators.required, Validators.minLength(2)]],
      destination: ['', [Validators.required, Validators.minLength(2)]],
      departureDate: ['', [Validators.required]],
      returnDate: [''],
      passengers: [1, [Validators.required, Validators.min(1), Validators.max(9)]],
    },
    {
      validators: [returnDateAfterDepartureValidator, distinctRouteValidator],
    }
  );

  constructor() {
    effect(() => {
      const criteria = this.initialCriteria();
      if (criteria) {
        this.searchForm.patchValue(
          {
            origin: criteria.origin,
            destination: criteria.destination,
            departureDate: criteria.departureDate,
            returnDate: criteria.returnDate ?? '',
            passengers: criteria.passengers,
          },
          { emitEvent: false }
        );
      }
    });
  }

  get controls() {
    return this.searchForm.controls;
  }

  isControlInvalid(name: keyof typeof this.searchForm.controls): boolean {
    const control = this.searchForm.controls[name];
    return control.invalid && (control.touched || this.submitted());
  }

  get isDestinationInvalid(): boolean {
    const control = this.controls.destination;
    const sameRoute =
      this.searchForm.hasError('sameOriginDestination') &&
      (control.touched || this.controls.origin.touched || this.submitted());
    return this.isControlInvalid('destination') || sameRoute;
  }

  get isReturnDateInvalid(): boolean {
    const control = this.controls.returnDate;
    return (
      this.searchForm.hasError('returnDateBeforeDeparture') &&
      (control.touched || control.dirty || this.submitted())
    );
  }

  swapLocations(): void {
    const { origin, destination } = this.searchForm.getRawValue();
    this.searchForm.patchValue({
      origin: destination,
      destination: origin,
    });
  }

  applyQuickRoute(origin: string, destination: string): void {
    const currentDate = this.controls.departureDate.value || this.getTomorrowDateString();
    this.searchForm.patchValue({
      origin,
      destination,
      departureDate: currentDate,
      returnDate: '',
    });
    this.onSubmit();
  }

  onSubmit(): void {
    this.submitted.set(true);
    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      return;
    }

    const raw = this.searchForm.getRawValue();
    this.searchSubmitted.emit({
      origin: raw.origin.trim(),
      destination: raw.destination.trim(),
      departureDate: raw.departureDate,
      returnDate: raw.returnDate ? raw.returnDate : null,
      passengers: Number(raw.passengers),
    });
  }

  onReset(): void {
    this.submitted.set(false);
    this.searchForm.reset({
      origin: '',
      destination: '',
      departureDate: '',
      returnDate: '',
      passengers: 1,
    });
    this.searchReset.emit();
  }

  private getTomorrowDateString(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
}
