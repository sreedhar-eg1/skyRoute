# SkyRoute — Flight Search Application

A minimal, clean, and well-architected Flight Search web application built with **Angular 20**, **TypeScript**, **RxJS**, and **Bootstrap 5**.

---

## 1. Project Overview

SkyRoute lets users search scheduled flights, filter results reactively without redundant network calls, and inspect full itinerary and fare details for a selected flight.

### Core Capabilities
- **Flight Search Form (`FlightSearchComponent`):** Reactive Form with inline Bootstrap validation for origin, destination, departure date, optional return date (validated not to precede departure date), passenger count (`1–9`), airport autocomplete (`<datalist>`), location swap, and quick route presets.
- **Reactive Filtering (`FlightFiltersComponent`):** Filter results by **Max Price** (range slider), **Number of Stops** (`All`, `Non-stop`, `1 Stop`, `2+ Stops`), and **Airlines** (checkboxes), plus **Sort By** (price, duration, departure time) powered by RxJS streams.
- **Results View (`FlightListComponent` & `FlightCardComponent`):** Displays flight cards with airline, flight number, schedule times, duration, stop badges, and price, alongside a loading spinner, empty state, and error alert with retry.
- **Flight Details (`FlightDetailsComponent`):** Navigable via `/flights/:id`, displaying terminal info, aircraft type, cabin class, baggage allowance, layover breakdown, and passenger-scaled total price with a **Back to Results** action.

---

## 2. Setup Instructions

### Prerequisites
- **Node.js:** `v20.19+`, `v22.12+`, or `v24+`
- **npm:** `v10+`
- **Angular CLI (optional globally):** `v20.x` (local `npx ng` uses the project's `@angular/cli` `^20.3.43`)

### Installation
```bash
npm install
```

### Run Locally (Development Server)
```bash
npm start
# or
npx ng serve
```
Navigate to `http://localhost:4200/`. The application automatically redirects `/` to `/flights`.

### Production Build
```bash
npm run build
# or
npx ng build
```
Build artifacts are output to `dist/flight-search-app/`.

### Unit Tests
```bash
npm test
# or
npx ng test
```

---

## 3. Technologies Used

| Technology | Version | Purpose |
| --- | --- | --- |
| **Angular** | `^20.3.0` | Standalone components, `@if`/`@for`/`@let` control flow, `inject()`, Reactive Forms, Router, `HttpClient` |
| **TypeScript** | `~5.9.2` | Strict type safety (`strict: true`, `strictTemplates: true`) |
| **RxJS** | `~7.8.0` | `BehaviorSubject`, `combineLatest`, `debounceTime`, `map`, `delay`, `catchError`, `switchMap`, `shareReplay` |
| **Bootstrap** | `^5.3.9` | Clean responsive layout, grid, cards, badges, forms, alerts, and spinners |

---

## 4. API Details

### Mock JSON Setup
Flight data is stored in [`public/data/flights.json`](public/data/flights.json) containing **18 diverse flight records** across domestic and international routes (`DEL`, `BOM`, `BLR`, `HYD`, `GOI`, `DXB`, `SIN`), multiple airlines (`IndiGo`, `Air India`, `Vistara`, `Akasa Air`, `SpiceJet`, `Emirates`, `Singapore Airlines`), cabin classes, and stop counts (`0`, `1`, `2`).

[`FlightService`](src/app/core/services/flight.service.ts) fetches the dataset using Angular's `HttpClient` (`provideHttpClient(withFetch())`) from `data/flights.json`.

### Simulated Latency & Error Handling
- `getAllFlights()` applies RxJS `delay(500)` to simulate a 500ms network round trip so loading spinners are clearly observable.
- HTTP errors are caught via `catchError`, converted into user-friendly error messages in `error$`, and displayed in a Bootstrap danger alert with a **Retry** button (verified in unit tests with `HttpTestingController`).

### Flight Data Schema (`Flight`)
Defined in [`src/app/core/models/flight.model.ts`](src/app/core/models/flight.model.ts):
```ts
export interface Flight {
  id: string;
  flightNumber: string;
  airline: string;
  airlineCode: string;
  origin: string;
  originCity: string;
  originAirport: string;
  originTerminal: string;
  destination: string;
  destinationCity: string;
  destinationAirport: string;
  destinationTerminal: string;
  departureTime: string;
  arrivalTime: string;
  arrivalNextDay?: boolean;
  duration: string;
  durationMinutes: number;
  stops: number;
  layovers: Layover[];
  price: number;
  currency: string;
  cabinClass: 'Economy' | 'Premium Economy' | 'Business';
  aircraftType: string;
  baggageAllowance: {
    cabin: string;
    checkIn: string;
  };
  availableSeats: number;
  refundable: boolean;
}
```

### Swapping for a Real REST API
1. Update `dataUrl` in `src/app/core/services/flight.service.ts` (or move it into Angular environment config) to point to your backend endpoint (e.g., `https://api.example.com/v1/flights`).
2. Update `getFlightById(id)` to call ``this.http.get<Flight>(`${apiUrl}/${id}`)`` if details are fetched per resource, and forward `SearchCriteria`/`FilterCriteria` as `HttpParams` in `getAllFlights()` if filtering moves server-side.
3. Remove the `delay(500)` operator once real network latency is present.

---

## 5. Key Implementation Decisions

### Project Architecture
```text
src/app/
├── core/
│   ├── models/        # Flight, SearchCriteria, FilterCriteria, PriceBounds, AirportOption
│   ├── services/      # FlightService (HttpClient + RxJS reactive state)
│   └── validators/    # Custom cross-field Reactive Form validators
├── features/
│   ├── flight-search/ # FlightSearchPageComponent + FlightSearch, FlightFilters, FlightList
│   └── flight-details/# FlightDetailsComponent (/flights/:id)
└── shared/
    └── components/    # Reusable FlightCardComponent, NavbarComponent, and FooterComponent
```

### Key Patterns
- **Angular 20 Standalone & Modern Syntax:** All components are standalone and use `inject()`, signal-based `input()` / `output()` / `computed()`, and native `@if`, `@for`, and `@let` template control flow.
- **Smart/Presentational Separation:** `FlightSearchPageComponent` subscribes to `FlightService`'s combined view-model (`vm$`) via `AsyncPipe` and passes inputs/outputs to presentational components (`FlightSearchComponent`, `FlightFiltersComponent`, `FlightListComponent`, `FlightCardComponent`).
- **Reactive Filtering with RxJS `combineLatest`:** `FlightService` maintains `BehaviorSubject`s for loaded flights, search criteria, and filter criteria. `searchMatchedFlights$` combines flights with search criteria, and `filteredFlights$` combines `searchMatchedFlights$` with debounced (`debounceTime(150)`) filter updates via `combineLatest` + `map`—preventing unnecessary API calls during typing or slider dragging. Initial subscription emits immediately without waiting 150ms.
- **Custom Reactive Form Validators:** Cross-field validators in `src/app/core/validators/flight-search.validators.ts` enforce `returnDate >= departureDate` (when a return date is provided) and prevent identical origin/destination entries.
- **Lazy-Loaded Routing:** `src/app/app.routes.ts` lazy-loads `FlightSearchPageComponent` at `/flights` and `FlightDetailsComponent` at `/flights/:id`, with `withComponentInputBinding()` enabled.

---

## 6. Assumptions Made

1. **Static Daily Schedule Dataset:** Flights in `public/data/flights.json` represent daily scheduled routes rather than date-specific inventory; therefore, searching filters by origin, destination (airport code or city name, case-insensitive), and `availableSeats >= passengers`, while storing the chosen dates for summary and details display.
2. **Currency Format:** Prices are modeled in Indian Rupees (`INR`) to align with the primary route hubs (`DEL`, `BOM`, `BLR`, `HYD`, `GOI`, `DXB`, `SIN`) and formatted using Angular's `CurrencyPipe` (`'INR':'symbol':'1.0-0'`).
3. **One-Way Default with Optional Return Date:** `returnDate` is optional for one-way searches. Total fare on the details page is calculated as `flight.price * passengers` based on the selected passenger count (defaulting to `1` if `/flights/:id` is opened directly).
4. **Client-Side Filtering After Initial Fetch:** The dataset is fetched once via `HttpClient` and cached in `FlightService`'s `BehaviorSubject`; subsequent searches, sorts, and sidebar filter changes operate client-side without extra HTTP requests unless **Retry** is triggered after a failed load.
5. **Clean Bootstrap 5 Theming:** Styling relies on Bootstrap 5 utility, grid, card, badge, and form classes (`node_modules/bootstrap/dist/css/bootstrap.min.css`), customized cleanly via Bootstrap CSS variables (`--bs-primary`, `--bs-body-bg`, `--bs-border-color`, etc.) and minimal theme classes in `src/styles.scss` inspired by Pratra's deep-navy and cool-canvas visual palette.

---

## 7. Live Demo & Deployment

This project is pre-configured for zero-config deployment to **GitHub Pages** using GitHub Actions via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

### How to Enable Deployment
1. Push this repository to GitHub with a `main` branch.
2. In your GitHub repository, open **Settings → Pages**.
3. Under **Build and deployment → Source**, select **GitHub Actions**.
4. Every push to `main` (or manual run via **Actions → Deploy to GitHub Pages → Run workflow**) automatically builds and publishes the app to `https://<your-username>.github.io/<repo-name>/`.

### How Subpath Routing & Assets Work
- **Relative Mock Data Path:** `FlightService` fetches `data/flights.json` (without a leading `/`) so `HttpClient` resolves the mock JSON relative to `<base href="/<repo-name>/">` instead of the domain root.
- **Dynamic `--base-href`:** The workflow builds with `npx ng build --configuration production --base-href /${{ github.event.repository.name }}/` using Node.js 22 and `npm ci`.
- **Deep-Link Refresh Fallback:** After building, `dist/flight-search-app/browser/index.html` is copied to `dist/flight-search-app/browser/404.html` before deploying with `actions/upload-pages-artifact@v3` and `actions/deploy-pages@v4`, ensuring browser refreshes on nested Angular routes such as `/flights/FL101` load the SPA cleanly without a 404 page.
