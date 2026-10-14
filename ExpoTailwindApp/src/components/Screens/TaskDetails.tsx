import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { getTaskById, acceptTask } from '@/services/api';
import { openGoogleMapsNavigation } from '@/services/mapService';
import { Task, LoadItem } from '@/data/MockData';

export default function TaskDetails() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const paramOrderId = (params.orderId as string) || '#YL-10001';
  const [task, setTask] = useState<Task | null>(null);
  const [isAccepted, setIsAccepted] = useState(
    params.status === 'In Progress' || params.status === 'Accepted'
  );

  useEffect(() => {
    let isMounted = true;
    async function fetchTask() {
      const fetched = await getTaskById(paramOrderId);
      if (isMounted && fetched) {
        setTask(fetched);
        if (fetched.status === 'In Progress' || fetched.status === 'Accepted') {
          setIsAccepted(true);
        } else {
          setIsAccepted(false);
        }
      }
    }
    fetchTask();
    return () => {
      isMounted = false;
    };
  }, [paramOrderId]);

  // Dynamic parameters prioritizing task object from API/Mock, falling back to route params
  const orderId = task?.orderId || paramOrderId;
  const status = task?.status || (params.status as string) || 'Assigned';
  const customerName = task?.customerName || (params.customerName as string) || 'Arun Kumar';
  const customerPhone = task?.customerPhone || (params.customerPhone as string) || '9876543210';
  const pickupLocation =
    task?.pickupLocation ||
    (params.pickupLocation as string) ||
    'Yetlo Hub, Gugai, Salem';
  const deliveryLocation =
    task?.deliveryLocation ||
    (params.deliveryLocation as string) ||
    'Military Road, Johnsonpet, Salem';

  const loadItems: LoadItem[] = task?.loadItems || [
    { material: 'Cement', qty: 2, unit: 'Bags' },
    { material: 'Bricks', qty: 5000, unit: 'Nos' },
  ];

  const DEFAULT_PICKUP_COORDS = { latitude: 11.6448, longitude: 78.1485 };
  const DEFAULT_DELIVERY_COORDS = { latitude: 11.6668, longitude: 78.1745 };

  const pickupCoords = task?.pickupCoordinates || DEFAULT_PICKUP_COORDS;
  const deliveryCoords = task?.deliveryCoordinates || DEFAULT_DELIVERY_COORDS;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/explore');
    }
  };

  // Navigates to dedicated in-app Task Map screen matching Image 1
  const handleViewMap = () => {
    try {
      router.push({
        pathname: '/taskmap',
        params: {
          orderId,
          pickupLat: String(pickupCoords.latitude),
          pickupLng: String(pickupCoords.longitude),
          deliveryLat: String(deliveryCoords.latitude),
          deliveryLng: String(deliveryCoords.longitude),
        },
      });
    } catch (e) {
      console.warn('Navigation to /taskmap failed:', e);
    }
  };

  // Launches Google Maps app for turn-by-turn navigation
  const handleNavigateToPickup = async () => {
    try {
      await openGoogleMapsNavigation(pickupCoords);
    } catch (e) {
      console.warn('Unable to launch Google Maps navigation:', e);
      Alert.alert('Navigation Error', 'Could not open Google Maps navigation.');
    }
  };

  const handleAcceptTask = async () => {
    const res = await acceptTask(orderId);
    if (res.success) {
      setIsAccepted(true);
      if (task) {
        setTask({ ...task, status: 'In Progress' });
      }
      Alert.alert('Task Accepted', `Order ${orderId} has been accepted successfully!`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      {/* Top Header Bar */}
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          hitSlop={12}
          accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </Pressable>
        <Text style={styles.headerTitle}>Task Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: Math.max(insets.bottom, 20) + 24 },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Order ID & Status Badge */}
        <View style={styles.orderRow}>
          <View>
            <Text style={styles.orderLabel}>ORDER</Text>
            <Text style={styles.orderId}>{orderId}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              (isAccepted || status === 'In Progress') && styles.inProgressBadge,
            ]}>
            <View
              style={[
                styles.statusDot,
                (isAccepted || status === 'In Progress') && styles.inProgressDot,
              ]}
            />
            <Text
              style={[
                styles.statusText,
                (isAccepted || status === 'In Progress') && styles.inProgressText,
              ]}>
              {isAccepted ? 'In Progress' : status}
            </Text>
          </View>
        </View>

        {/* Customer Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <View style={styles.card}>
            <View style={styles.customerAvatar}>
              <Feather name="user" size={20} color="#2563eb" />
            </View>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{customerName}</Text>
              <Text style={styles.customerPhone}>{customerPhone}</Text>
            </View>
          </View>
        </View>

        {/* Pickup Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pickup</Text>
          <View style={styles.card}>
            <View style={styles.pickupIconContainer}>
              <View style={styles.pickupOuterRing}>
                <View style={styles.pickupInnerDot} />
              </View>
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationTitle}>Pickup Location</Text>
              <Text style={styles.locationAddress}>{pickupLocation}</Text>
            </View>
          </View>
        </View>

        {/* Delivery Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery</Text>
          <View style={styles.card}>
            <View style={styles.deliveryIconContainer}>
              <Ionicons name="location-outline" size={24} color="#2563eb" />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationTitle}>Delivery Location</Text>
              <Text style={styles.locationAddress}>{deliveryLocation}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons: View Map & Navigate to Pickup (Strictly matching Image 2) */}
        <View style={styles.actionButtonsRow}>
          <Pressable
            style={({ pressed }) => [
              styles.outlineButton,
              pressed && styles.outlineButtonPressed,
            ]}
            onPress={handleViewMap}>
            <Text style={styles.outlineButtonText}>View Map</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.outlineButton,
              pressed && styles.outlineButtonPressed,
            ]}
            onPress={handleNavigateToPickup}>
            <Text style={styles.outlineButtonText}>Navigate to Pickup</Text>
          </Pressable>
        </View>

        {/* Load Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Load Details</Text>
          <View style={styles.cardNoPadding}>
            {/* Table Header */}
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, styles.flexLeft]}>Material</Text>
              <Text style={[styles.tableHeaderCell, styles.flexCenter]}>Qty</Text>
              <Text style={[styles.tableHeaderCell, styles.flexRight]}>Unit</Text>
            </View>

            <View style={styles.divider} />

            {/* Table Rows */}
            {loadItems.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.tableDataRow,
                  index > 0 && { marginTop: 10 },
                ]}>
                <Text style={[styles.tableDataCell, styles.flexLeft]}>
                  {item.material}
                </Text>
                <Text style={[styles.tableDataCell, styles.flexCenter]}>
                  {item.qty}
                </Text>
                <Text style={[styles.tableDataCell, styles.flexRight]}>
                  {item.unit}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Accept Task Action Button */}
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            isAccepted && styles.acceptedButton,
            pressed && styles.pressed,
          ]}
          onPress={handleAcceptTask}
          disabled={isAccepted}>
          <Text style={styles.primaryButtonText}>
            {isAccepted ? 'Task in Progress' : 'Accept Task'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 2,
  },
  orderLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  orderId: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  inProgressBadge: {
    backgroundColor: '#dbeafe',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f59e0b',
    marginRight: 6,
  },
  inProgressDot: {
    backgroundColor: '#2563eb',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#b45309',
  },
  inProgressText: {
    color: '#1d4ed8',
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  cardNoPadding: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  customerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  customerPhone: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  pickupIconContainer: {
    marginRight: 14,
    marginTop: 2,
  },
  pickupOuterRing: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2.5,
    borderColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#16a34a',
  },
  deliveryIconContainer: {
    marginRight: 14,
    marginTop: 1,
  },
  locationInfo: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  locationAddress: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 3,
    lineHeight: 20,
  },

  /* Action Buttons: View Map & Navigate to Pickup (Strictly matching Image 2) */
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  outlineButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#2563eb',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  outlineButtonPressed: {
    backgroundColor: '#f0f7ff',
    opacity: 0.85,
  },
  outlineButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2563eb',
    textAlign: 'center',
  },

  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableHeaderCell: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableDataCell: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  flexLeft: {
    flex: 2,
    textAlign: 'left',
  },
  flexCenter: {
    flex: 1,
    textAlign: 'center',
  },
  flexRight: {
    flex: 1,
    textAlign: 'right',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  acceptedButton: {
    backgroundColor: '#94a3b8',
    elevation: 0,
    shadowOpacity: 0,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
});
