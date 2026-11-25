import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'flights',
    pathMatch: 'full',
  },
  {
    path: 'flights',
    loadComponent: () =>
      import('./features/flight-search/flight-search-page.component').then(
        (m) => m.FlightSearchPageComponent
      ),
    title: 'SkyRoute — Flight Search',
  },
  {
    path: 'flights/:id',
    loadComponent: () =>
      import('./features/flight-details/flight-details.component').then(
        (m) => m.FlightDetailsComponent
      ),
    title: 'SkyRoute — Flight Details',
  },
  {
    path: '**',
    redirectTo: 'flights',
  },
];
