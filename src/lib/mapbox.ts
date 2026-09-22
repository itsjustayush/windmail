/**
 * Mapbox configuration and access token management.
 * Sourced from the VITE_MAPBOX_TOKEN environment variable.
 */

export const MAPBOX_TOKEN: string = import.meta.env.VITE_MAPBOX_TOKEN || '';

/**
 * Returns true if a non-empty Mapbox access token is configured.
 */
export const isMapboxTokenAvailable = (): boolean => {
  return typeof MAPBOX_TOKEN === 'string' && MAPBOX_TOKEN.trim().length > 0;
};
