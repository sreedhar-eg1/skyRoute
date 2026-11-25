import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FlightService } from '../../../core/services/flight.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  private readonly flightService = inject(FlightService);
  private readonly router = inject(Router);

  onBrowseAllRoutes(): void {
    this.flightService.clearSearch();
    this.router.navigate(['/flights']);
  }
}
