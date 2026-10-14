import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

import { getTaskById } from '@/services/api';
import { openGoogleMapsNavigation, GOOGLE_MAPS_API_KEY } from '@/services/mapService';
import { Task } from '@/data/MockData';

// User's provided Google Maps API Key
const API_KEY = GOOGLE_MAPS_API_KEY || 'AIzaSyAcLpY9pfIZ5lMi3_1zU1-NLv7Cw9LPS9A';

// Guaranteed default coordinates for Salem matching the UI mock
const DEFAULT_PICKUP = { latitude: 11.6448, longitude: 78.1485 };
const DEFAULT_DELIVERY = { latitude: 11.6668, longitude: 78.1745 };

export default function TaskMap() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const webViewRef = useRef<WebView>(null);

  const paramOrderId = (params.orderId as string) || '#YL-10001';

  // Parse coordinates directly from params if provided, otherwise use defaults
  const parsedPickupLat = params.pickupLat ? parseFloat(params.pickupLat as string) : DEFAULT_PICKUP.latitude;
  const parsedPickupLng = params.pickupLng ? parseFloat(params.pickupLng as string) : DEFAULT_PICKUP.longitude;
  const parsedDeliveryLat = params.deliveryLat ? parseFloat(params.deliveryLat as string) : DEFAULT_DELIVERY.latitude;
  const parsedDeliveryLng = params.deliveryLng ? parseFloat(params.deliveryLng as string) : DEFAULT_DELIVERY.longitude;

  const [pickupCoords, setPickupCoords] = useState({
    latitude: !isNaN(parsedPickupLat) ? parsedPickupLat : DEFAULT_PICKUP.latitude,
    longitude: !isNaN(parsedPickupLng) ? parsedPickupLng : DEFAULT_PICKUP.longitude,
  });

  const [deliveryCoords, setDeliveryCoords] = useState({
    latitude: !isNaN(parsedDeliveryLat) ? parsedDeliveryLat : DEFAULT_DELIVERY.latitude,
    longitude: !isNaN(parsedDeliveryLng) ? parsedDeliveryLng : DEFAULT_DELIVERY.longitude,
  });

  const [orderId, setOrderId] = useState(paramOrderId);

  // Background fetch to ensure latest task data is synced
  useEffect(() => {
    let isMounted = true;
    async function syncTaskData() {
      try {
        const fetched = await getTaskById(paramOrderId);
        if (isMounted && fetched) {
          if (fetched.orderId) setOrderId(fetched.orderId);
          if (fetched.pickupCoordinates?.latitude && fetched.pickupCoordinates?.longitude) {
            setPickupCoords(fetched.pickupCoordinates);
          }
          if (fetched.deliveryCoordinates?.latitude && fetched.deliveryCoordinates?.longitude) {
            setDeliveryCoords(fetched.deliveryCoordinates);
          }
        }
      } catch (e) {
        console.warn('TaskMap sync fallback to default coordinates:', e);
      }
    }
    syncTaskData();
    return () => {
      isMounted = false;
    };
  }, [paramOrderId]);

  const handleRecenter = () => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.recenterMap) {
          window.recenterMap();
        }
        true;
      `);
    }
  };

  const handleExternalNavigation = async () => {
    try {
      await openGoogleMapsNavigation(pickupCoords);
    } catch (e) {
      console.warn('Navigation error:', e);
      Alert.alert('Navigation', 'Could not open Google Maps navigation.');
    }
  };

  // Google Maps JavaScript API with official key AIzaSyAcLpY9pfIZ5lMi3_1zU1-NLv7Cw9LPS9A
  const mapHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #212a37; overflow: hidden; }

    /* Custom Pickup & Delivery Overlay Markers */
    .custom-marker {
      position: absolute;
      transform: translate(-50%, -100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      user-select: none;
      pointer-events: auto;
    }
    .pickup-circle {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #16a34a;
      border: 2.5px solid #ffffff;
      box-shadow: 0 4px 10px rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .pickup-circle svg {
      width: 22px;
      height: 22px;
      fill: #fef08a;
    }
    .delivery-circle {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #2563eb;
      border: 2.5px solid #ffffff;
      box-shadow: 0 4px 10px rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .delivery-circle svg {
      width: 24px;
      height: 24px;
      fill: #ef4444;
    }
    .marker-pill {
      background: #ffffff;
      padding: 4px 12px;
      border-radius: 6px;
      margin-top: 4px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      white-space: nowrap;
    }
  </style>
  <script src="https://maps.googleapis.com/maps/api/js?key=${API_KEY}&callback=initMap" async defer></script>
</head>
<body>
  <div id="map"></div>
  <script>
    var map;
    var pLat = ${pickupCoords.latitude};
    var pLng = ${pickupCoords.longitude};
    var dLat = ${deliveryCoords.latitude};
    var dLng = ${deliveryCoords.longitude};

    var darkStyle = [
      { elementType: "geometry", stylers: [{ color: "#212a37" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#212a37" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
      { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
      { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
      { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
      { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
      { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
      { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
      { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
      { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
      { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
      { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
      { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
      { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
      { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] }
    ];

    function initMap() {
      var centerLat = (pLat + dLat) / 2;
      var centerLng = (pLng + dLng) / 2;

      map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: centerLat, lng: centerLng },
        zoom: 14,
        styles: darkStyle,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'greedy'
      });

      // Custom HTML overlay marker class
      function HTMLMarker(lat, lng, html) {
        this.lat = lat;
        this.lng = lng;
        this.html = html;
        this.div = null;
        this.setMap(map);
      }
      HTMLMarker.prototype = new google.maps.OverlayView();
      HTMLMarker.prototype.onAdd = function() {
        var div = document.createElement('div');
        div.className = 'custom-marker';
        div.innerHTML = this.html;
        this.div = div;
        var panes = this.getPanes();
        panes.overlayMouseTarget.appendChild(div);
      };
      HTMLMarker.prototype.draw = function() {
        var overlayProjection = this.getProjection();
        if (!overlayProjection || !this.div) return;
        var position = overlayProjection.fromLatLngToDivPixel(new google.maps.LatLng(this.lat, this.lng));
        this.div.style.left = position.x + 'px';
        this.div.style.top = position.y + 'px';
      };
      HTMLMarker.prototype.onRemove = function() {
        if (this.div && this.div.parentNode) {
          this.div.parentNode.removeChild(this.div);
          this.div = null;
        }
      };

      var pickupHTML = '<div class="pickup-circle"><svg viewBox="0 0 24 24"><path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18s-.41-.06-.57-.18l-7.9-4.44A.991.991 0 0 1 3 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18s.41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9zM12 4.15L6.04 7.5 12 10.85l5.96-3.35L12 4.15z"/></svg></div><div class="marker-pill">Pickup</div>';
      var deliveryHTML = '<div class="delivery-circle"><svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg></div><div class="marker-pill">Delivery</div>';

      new HTMLMarker(pLat, pLng, pickupHTML);
      new HTMLMarker(dLat, dLng, deliveryHTML);

      // Polyline connecting Pickup and Delivery
      new google.maps.Polyline({
        path: [
          { lat: pLat, lng: pLng },
          { lat: dLat, lng: dLng }
        ],
        geodesic: true,
        strokeColor: '#3b82f6',
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map: map
      });

      window.recenterMap = function() {
        var bounds = new google.maps.LatLngBounds();
        bounds.extend(new google.maps.LatLng(pLat, pLng));
        bounds.extend(new google.maps.LatLng(dLat, dLng));
        map.fitBounds(bounds, { top: 70, right: 70, bottom: 70, left: 70 });
      };

      window.recenterMap();
    }
  </script>
</body>
</html>
  `;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      {/* Top Header Bar matching Image 1 */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/explore');
            }
          }}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          hitSlop={12}
          accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </Pressable>
        <View style={styles.headerTextGroup}>
          <Text style={styles.headerTitle}>Task Map</Text>
          <Text style={styles.headerSubtitle}>{orderId}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Interactive Google Map (Pan, Zoom, Anchor to Lat/Lng) */}
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <iframe
            srcDoc={mapHtml}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Interactive Task Map"
          />
        ) : (
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: mapHtml }}
            style={styles.webView}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            scrollEnabled={false}
          />
        )}

        {/* Floating Recenter Button */}
        <Pressable
          style={({ pressed }) => [styles.recenterButton, pressed && styles.pressed]}
          onPress={handleRecenter}
          accessibilityLabel="Recenter map">
          <Ionicons name="locate" size={22} color="#2563eb" />
        </Pressable>

        {/* Floating Navigate in Google Maps Button */}
        <Pressable
          style={({ pressed }) => [styles.navFloatingButton, pressed && styles.pressed]}
          onPress={handleExternalNavigation}
          accessibilityLabel="Open in Google Maps">
          <Ionicons name="navigate" size={18} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.navFloatingText}>Navigate</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    zIndex: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTextGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 2,
  },
  headerSpacer: {
    width: 36,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#212a37',
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: '#212a37',
  },
  recenterButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  navFloatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    backgroundColor: '#2563eb',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  navFloatingText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.75,
  },
});
