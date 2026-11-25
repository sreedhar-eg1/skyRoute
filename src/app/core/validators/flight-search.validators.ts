import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validates that an optional return date is not earlier than the departure date.
 */
export const returnDateAfterDepartureValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const departureDate = control.get('departureDate')?.value as string | null | undefined;
  const returnDate = control.get('returnDate')?.value as string | null | undefined;

  if (!departureDate || !returnDate) {
    return null;
  }

  return returnDate < departureDate ? { returnDateBeforeDeparture: true } : null;
};

/**
 * Validates that origin and destination inputs do not refer to the same location.
 */
export const distinctRouteValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const origin = (control.get('origin')?.value as string | null | undefined)?.trim().toLowerCase();
  const destination = (control.get('destination')?.value as string | null | undefined)
    ?.trim()
    .toLowerCase();

  if (!origin || !destination) {
    return null;
  }

  return origin === destination ? { sameOriginDestination: true } : null;
};
