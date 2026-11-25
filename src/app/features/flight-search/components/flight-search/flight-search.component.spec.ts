import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FlightSearchComponent } from './flight-search.component';

describe('FlightSearchComponent', () => {
  let component: FlightSearchComponent;
  let fixture: ComponentFixture<FlightSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlightSearchComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FlightSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should require origin, destination, and departureDate', () => {
    component.onSubmit();
    expect(component.searchForm.invalid).toBeTrue();
    expect(component.controls.origin.hasError('required')).toBeTrue();
    expect(component.controls.destination.hasError('required')).toBeTrue();
    expect(component.controls.departureDate.hasError('required')).toBeTrue();
  });

  it('should invalidate returnDate earlier than departureDate', () => {
    component.searchForm.patchValue({
      origin: 'DEL',
      destination: 'BOM',
      departureDate: '2026-12-10',
      returnDate: '2026-12-05',
      passengers: 1,
    });

    expect(component.searchForm.hasError('returnDateBeforeDeparture')).toBeTrue();
  });

  it('should invalidate passengers less than 1', () => {
    component.searchForm.patchValue({
      origin: 'DEL',
      destination: 'BOM',
      departureDate: '2026-12-10',
      passengers: 0,
    });

    expect(component.controls.passengers.hasError('min')).toBeTrue();
  });

  it('should emit searchSubmitted when form is valid', () => {
    const emitSpy = spyOn(component.searchSubmitted, 'emit');

    component.searchForm.patchValue({
      origin: 'DEL',
      destination: 'BOM',
      departureDate: '2026-12-10',
      returnDate: '2026-12-15',
      passengers: 2,
    });

    component.onSubmit();

    expect(emitSpy).toHaveBeenCalledWith({
      origin: 'DEL',
      destination: 'BOM',
      departureDate: '2026-12-10',
      returnDate: '2026-12-15',
      passengers: 2,
    });
  });
});
