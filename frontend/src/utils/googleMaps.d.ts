import { Event } from '../types/domain';

export function buildLocationQuery(event: Partial<Pick<Event, 'location' | 'address' | 'city'>> | null | undefined): string | null;
export function buildGoogleMapsSearchUrl(event: Partial<Pick<Event, 'location' | 'address' | 'city'>> | null | undefined): string | null;
export function buildGoogleMapsDirectionsUrl(event: Partial<Pick<Event, 'location' | 'address' | 'city'>> | null | undefined): string | null;
