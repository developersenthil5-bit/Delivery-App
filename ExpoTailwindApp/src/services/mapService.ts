import { Linking, Platform } from 'react-native';
import { Coordinates } from '@/data/MockData';

/**
 * ==============================================================================
 * GOOGLE MAPS CONFIGURATION & HELPERS
 * ==============================================================================
 */
export const GOOGLE_MAPS_API_KEY = 'AIzaSyAcLpY9pfIZ5lMi3_1zU1-NLv7Cw9LPS9A';

/**
 * Open turn-by-turn navigation in Google Maps
 */
export async function openGoogleMapsNavigation(
  destination: string | Coordinates,
  origin?: string | Coordinates
): Promise<void> {
  let destQuery = '';
  if (typeof destination === 'string') {
    destQuery = encodeURIComponent(destination);
  } else {
    destQuery = `${destination.latitude},${destination.longitude}`;
  }

  let originQuery = '';
  if (origin) {
    if (typeof origin === 'string') {
      originQuery = `&origin=${encodeURIComponent(origin)}`;
    } else {
      originQuery = `&origin=${origin.latitude},${origin.longitude}`;
    }
  }

  // Primary Google Maps Directions URL (works universally on Android, iOS, and Web)
  const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${destQuery}${originQuery}&travelmode=driving`;

  // Native intent for Android Google Maps turn-by-turn navigation
  const nativeAndroidUrl = `google.navigation:q=${destQuery}&mode=d`;

  try {
    if (Platform.OS === 'android') {
      const supported = await Linking.canOpenURL(nativeAndroidUrl);
      if (supported) {
        await Linking.openURL(nativeAndroidUrl);
        return;
      }
    }
    await Linking.openURL(webUrl);
  } catch (error) {
    console.warn('Failed to launch Google Maps navigation, opening web fallback:', error);
    await Linking.openURL(webUrl);
  }
}

/**
 * Open a location on Google Maps
 */
export async function openGoogleMapsLocation(location: string | Coordinates): Promise<void> {
  let query = '';
  if (typeof location === 'string') {
    query = encodeURIComponent(location);
  } else {
    query = `${location.latitude},${location.longitude}`;
  }

  const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
  await Linking.openURL(url);
}

/**
 * Generate a Google Static Maps image URL for a route
 */
export function getRouteStaticMapUrl(
  pickupCoords: Coordinates,
  deliveryCoords: Coordinates,
  width: number = 600,
  height: number = 280
): string {
  const p = `${pickupCoords.latitude},${pickupCoords.longitude}`;
  const d = `${deliveryCoords.latitude},${deliveryCoords.longitude}`;

  return `https://maps.googleapis.com/maps/api/staticmap?size=${width}x${height}&scale=2&maptype=roadmap&markers=color:blue%7Clabel:P%7C${p}&markers=color:red%7Clabel:D%7C${d}&path=color:0x2563ebff%7Cweight:4%7C${p}%7C${d}&key=${GOOGLE_MAPS_API_KEY}`;
}

/**
 * Generate a Google Static Maps image URL for a single location
 */
export function getLocationStaticMapUrl(
  coords: Coordinates,
  zoom: number = 15,
  width: number = 600,
  height: number = 240
): string {
  const loc = `${coords.latitude},${coords.longitude}`;
  return `https://maps.googleapis.com/maps/api/staticmap?center=${loc}&zoom=${zoom}&size=${width}x${height}&scale=2&maptype=roadmap&markers=color:red%7C${loc}&key=${GOOGLE_MAPS_API_KEY}`;
}
