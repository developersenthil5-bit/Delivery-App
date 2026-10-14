import React, { useState, useCallback } from 'react';
import { StyleSheet, Pressable, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import {
  getDriverProfile,
  getTodayActivity,
  getTasks,
  setDriverOnlineStatus,
} from '@/services/api';
import { DriverProfile, TodayActivity, Task } from '@/data/MockData';

export default function HomeScreen() {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [activity, setActivity] = useState<TodayActivity | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [profData, actData, tasksData] = await Promise.all([
        getDriverProfile(),
        getTodayActivity(),
        getTasks(),
      ]);
      setProfile(profData);
      setActivity(actData);
      const inProgressOrAssigned = tasksData.find((t) => t.status === 'In Progress');
      setActiveTask(inProgressOrAssigned || null);
    } catch (e) {
      console.warn('Failed to load home screen data:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleToggleOnline = async () => {
    if (!profile) return;
    const newStatus = !profile.isOnline;
    await setDriverOnlineStatus(newStatus);
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            isOnline: newStatus,
            statusTitle: newStatus ? "You're Online" : "You're Offline",
            statusSubtitle: newStatus
              ? 'Ready to receive new order'
              : 'Turn on to get new orders',
          }
        : null
    );
  };

  const handleOpenCurrentTask = () => {
    if (activeTask) {
      router.push({
        pathname: '/taskdetails',
        params: {
          orderId: activeTask.orderId,
          customerName: activeTask.customerName,
          customerPhone: activeTask.customerPhone,
          pickupLocation: activeTask.pickupLocation,
          deliveryLocation: activeTask.deliveryLocation,
          status: activeTask.status,
        },
      });
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          <ThemedView style={styles.heroSection}>
            <ThemedText style={styles.heading}>Good Morning</ThemedText>
            <ThemedText style={styles.texts}>
              {profile?.firstName || 'Senthil'}
            </ThemedText>

            {/* Online Status Card */}
            <ThemedView style={styles.code}>
              <ThemedView>
                <ThemedText style={styles.status2}>
                  {profile?.statusTitle || "You're Online"}
                </ThemedText>
              </ThemedView>
              <ThemedText style={styles.status1}>
                {profile?.statusSubtitle || 'Ready to receive new order'}
              </ThemedText>
              <Pressable onPress={handleToggleOnline} hitSlop={10}>
                <ThemedText
                  style={[
                    styles.status,
                    { color: profile?.isOnline ? '#ef4444' : '#16a34a' },
                  ]}>
                  {profile?.isOnline ? 'Go offline' : 'Go online'}
                </ThemedText>
              </Pressable>
            </ThemedView>

            {/* Today's Activity */}
            <ThemedText style={styles.text}>Today's Activity</ThemedText>
            <ThemedView style={styles.texts}>
              <ThemedView style={styles.activity}>
                <ThemedText style={styles.numbers}>
                  {activity?.assigned ?? 2}
                </ThemedText>
                <ThemedText style={styles.Taskstatus}>Assigned</ThemedText>
              </ThemedView>
              <ThemedView style={styles.activity}>
                <ThemedText style={styles.numbers}>
                  {activity?.completed ?? 0}
                </ThemedText>
                <ThemedText style={styles.Taskstatus}>completed</ThemedText>
              </ThemedView>
            </ThemedView>

            {/* Current Task */}
            <ThemedText style={styles.text}>Current Task</ThemedText>
            <ThemedView>
              <ThemedView style={styles.texts}>
                {activeTask ? (
                  <Pressable
                    style={[styles.CurrentTask, styles.activeTaskBox]}
                    onPress={handleOpenCurrentTask}>
                    <ThemedView style={styles.activeTaskHeader}>
                      <ThemedText style={styles.activeTaskId}>
                        {activeTask.orderId}
                      </ThemedText>
                      <ThemedText style={styles.activeTaskStatus}>
                        {activeTask.status}
                      </ThemedText>
                    </ThemedView>
                    <ThemedText style={styles.activeTaskCustomer}>
                      {activeTask.customerName} • {activeTask.packageText}
                    </ThemedText>
                    <ThemedText
                      style={styles.activeTaskLocation}
                      numberOfLines={1}>
                      {activeTask.deliveryLocation}
                    </ThemedText>
                  </Pressable>
                ) : (
                  <ThemedView style={styles.CurrentTask}>
                    <ThemedText style={styles.currenttaskstatus}>
                      No Active Tasks
                    </ThemedText>
                    <ThemedText style={styles.Taskstatus}>
                      New task assignment will appear here
                    </ThemedText>
                  </ThemedView>
                )}
              </ThemedView>
            </ThemedView>
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f2f2ff'
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    paddingBottom: BottomTabInset,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 10,
    flex: 1,
    gap: Spacing.two,
    backgroundColor: '#f6f2f2ff'

  },
    text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    backgroundColor: '#f6f2f2ff',
    top: 4,
    alignSelf: 'flex-start',
  },
  CurrentTask: {
    backgroundColor: '#fff',
    fontSize: 16,
    top: 4,
    width: 350,
    height: 100,
    borderRadius: 10,
    justifyContent: 'center',
  },
  currenttakstext: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    top: 4,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'light',
    color: '#000',
    top: 24,
    paddingBottom: 24,
    alignSelf: 'flex-start',
  },
  numbers: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#7473c3ff',
    alignSelf: 'center',
  },
  texts: {
    flexDirection: 'row',
    fontSize: 22,
    gap: 12,
    fontWeight: 'bold',
    color: '#000',
    backgroundColor: '#f6f2f2ff',
    alignSelf: 'flex-start',
  },
  code: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    padding:10,
    height: 90,
    borderRadius:10,
    width:345,
    fontSize: 8
  },
  Taskstatus: {
    flexDirection: 'column',
    fontSize: 12,
    fontWeight: 'light',
    color: '#000',
    alignSelf: 'center',
    marginTop: 10,
  },
  currenttaskstatus: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    alignSelf: 'center',
    marginTop: 10,
  },
  status: {
    left: '80%',
    fontSize: 12,
    bottom: 35,
    fontWeight: 'bold',
    textTransform:"uppercase"
  },
  activity: {
    flexDirection: 'column',
    gap: Spacing.two,
    marginTop: 10,
    backgroundColor: '#fff',
    alignContent: 'center',
    justifyContent: 'center',
    fontSize: 8,
    width: 168,
    height: 100,
    borderRadius: 10,
  },
  status1: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    padding: Spacing.one,
    paddingRight: 70,
    fontSize: 12
  },
  status2: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    padding: Spacing.one,
    paddingRight: 70,
    fontSize: 18
  },
  stepContainer: {
    gap: Spacing.three,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
  activeTaskBox: {
    padding: 14,
    justifyContent: 'space-between',
    borderColor: '#e2e8f0',
    borderWidth: 1,
  },
  activeTaskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  activeTaskId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  activeTaskStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activeTaskCustomer: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginTop: 4,
  },
  activeTaskLocation: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
});
