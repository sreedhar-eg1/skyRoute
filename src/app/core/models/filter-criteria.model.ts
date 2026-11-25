export type StopsOption = 'all' | '0' | '1' | '2+';

export type SortOption =
  | 'price_asc'
  | 'price_desc'
  | 'duration_asc'
  | 'departure_asc';

export interface FilterCriteria {
  maxPrice: number | null;
  stops: StopsOption;
  airlines: string[];
  sortBy: SortOption;
}

export interface PriceBounds {
  min: number;
  max: number;
}
