export function buildLocationQuery(event) {
  if (!event) return null;

  const query = [event.location, event.address, event.city]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean)
    .join(', ');

  return query || null;
}

export function buildGoogleMapsSearchUrl(event) {
  const query = buildLocationQuery(event);
  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function buildGoogleMapsDirectionsUrl(event) {
  const query = buildLocationQuery(event);
  if (!query) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}
