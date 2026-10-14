import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';

import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { getTasks } from '@/services/api';
import { Task } from '@/data/MockData';

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };

  const loadTasksData = useCallback(async () => {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (e) {
      console.warn('Failed to load tasks:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTasksData();
    }, [loadTasksData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasksData();
    setRefreshing(false);
  };

  const handleOpenTask = (task: Task) => {
    router.push({
      pathname: '/taskdetails',
      params: {
        orderId: task.orderId,
        customerName: task.customerName,
        customerPhone: task.customerPhone,
        pickupLocation: task.pickupLocation,
        deliveryLocation: task.deliveryLocation,
        status: task.status,
      },
    });
  };

  return (
    <ScrollView
      style={styles.scrollView}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerStyle={[
        styles.contentContainer,
        {
          paddingTop: Math.max(safeAreaInsets.top, 16) + 4,
          paddingBottom: insets.bottom + 100,
        },
      ]}>
      <View style={styles.container}>
        {/* Header */}
        <Text style={styles.screenTitle}>My Tasks</Text>
        <Text style={styles.screenSubtitle}>
          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} assigned
        </Text>

        {/* Task Cards */}
        {tasks.map((task) => (
          <View key={task.orderId || task.id} style={styles.card}>
            {/* Top Row: Order label, ID and Status Badge */}
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.orderLabel}>Order</Text>
                <Text style={styles.orderId}>{task.orderId}</Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>{task.status}</Text>
              </View>
            </View>

            {/* Customer Avatar & Details Row */}
            <View style={styles.customerRow}>
              <View style={styles.customerAvatar}>
                <Feather name="user" size={18} color="#2563eb" />
              </View>
              <View style={styles.customerDetails}>
                <Text style={styles.customerName}>{task.customerName}</Text>
                <Text style={styles.packageCountText}>{task.packageText}</Text>
              </View>
            </View>

            {/* Route Timeline: Pickup & Delivery with connecting line */}
            <View style={styles.timelineContainer}>
              {/* Left Column: Indicators & Connector line */}
              <View style={styles.timelineIndicatorColumn}>
                <View style={styles.pickupOuterRing}>
                  <View style={styles.pickupInnerDot} />
                </View>
                <View style={styles.timelineConnector} />
                <View style={styles.deliveryIconWrapper}>
                  <Ionicons name="location-outline" size={18} color="#2563eb" />
                </View>
              </View>

              {/* Right Column: Address information */}
              <View style={styles.timelineDetailsColumn}>
                <View style={styles.locationGroup}>
                  <Text style={styles.locationLabel}>PICKUP</Text>
                  <Text style={styles.locationText} numberOfLines={1}>
                    {task.pickupLocation}
                  </Text>
                </View>

                <View style={[styles.locationGroup, { marginTop: 10 }]}>
                  <Text style={styles.locationLabel}>DELIVERY</Text>
                  <Text style={styles.locationText} numberOfLines={1}>
                    {task.deliveryLocation}
                  </Text>
                </View>
              </View>
            </View>

            {/* View Task Button - Always visible full-width button */}
            <Pressable
              style={({ pressed }) => [
                styles.viewTaskButton,
                pressed && styles.pressed,
              ]}
              onPress={() => handleOpenTask(task)}>
              <Text style={styles.viewTaskButtonText}>View Task</Text>
            </Pressable>
          </View>
        ))}

        {!loading && tasks.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkbox-outline" size={48} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No Tasks Assigned</Text>
            <Text style={styles.emptySubtitle}>
              New tasks assigned to you will appear here.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  container: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  screenSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#64748b',
    marginTop: 2,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  orderId: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 1,
  },
  statusBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
  },
  statusBadgeText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#2563eb',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  customerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  customerDetails: {
    justifyContent: 'center',
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  packageCountText: {
    fontSize: 12.5,
    color: '#64748b',
    marginTop: 1,
  },
  timelineContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timelineIndicatorColumn: {
    alignItems: 'center',
    width: 20,
    marginRight: 10,
  },
  pickupOuterRing: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  pickupInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
  },
  timelineConnector: {
    width: 1.5,
    height: 20,
    backgroundColor: '#cbd5e1',
    marginVertical: 2,
  },
  deliveryIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDetailsColumn: {
    flex: 1,
    justifyContent: 'space-between',
  },
  locationGroup: {
    justifyContent: 'center',
  },
  locationLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  locationText: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#0f172a',
    lineHeight: 18,
  },
  viewTaskButton: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  viewTaskButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: 'transparent',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    maxWidth: 260,
  },
});
