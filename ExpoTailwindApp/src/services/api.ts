import MockData, {
  DriverProfile,
  TodayActivity,
  Task,
  driverProfile as defaultProfile,
  todayActivity as defaultActivity,
  mockTasks as defaultTasks,
} from '@/data/MockData';

/**
 * ==============================================================================
 * SINGLE-POINT API CONFIGURATION
 * ==============================================================================
 * In the future, change this URL in one place to point to your live backend API!
 * 
 * - If API_BASE_URL is empty ('') or null:
 *     The app uses the local data from `src/data/MockData.js`.
 * 
 * - If API_BASE_URL is set (e.g. 'https://api.yourdomain.com/v1'):
 *     The entire app automatically fetches real data from the live API endpoints:
 *       • GET  ${API_BASE_URL}/driver/profile
 *       • GET  ${API_BASE_URL}/driver/activity/today
 *       • GET  ${API_BASE_URL}/tasks
 *       • GET  ${API_BASE_URL}/tasks/:orderId
 *       • POST ${API_BASE_URL}/driver/status
 *       • POST ${API_BASE_URL}/tasks/:orderId/accept
 * ==============================================================================
 */
export const API_BASE_URL = ''; // <-- CHANGE THIS SINGLE URL TO SWITCH TO REAL API

// In-memory runtime state for mock fallback so mutations persist across screen navigation
let runtimeProfile: DriverProfile = { ...defaultProfile };
let runtimeActivity: TodayActivity = { ...defaultActivity };
let runtimeTasks: Task[] = [...defaultTasks];

/**
 * Fetch Driver Profile
 */
export async function getDriverProfile(): Promise<DriverProfile> {
  if (API_BASE_URL) {
    try {
      const response = await fetch(`${API_BASE_URL}/driver/profile`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      console.warn(`[API] Failed to fetch profile: ${response.status}`);
    } catch (error) {
      console.warn('[API] Network error fetching profile, using mock data:', error);
    }
  }
  return { ...runtimeProfile };
}

/**
 * Fetch Today's Activity Summary
 */
export async function getTodayActivity(): Promise<TodayActivity> {
  if (API_BASE_URL) {
    try {
      const response = await fetch(`${API_BASE_URL}/driver/activity/today`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      console.warn(`[API] Failed to fetch activity: ${response.status}`);
    } catch (error) {
      console.warn('[API] Network error fetching activity, using mock data:', error);
    }
  }
  return { ...runtimeActivity };
}

/**
 * Fetch All Assigned Delivery Tasks
 */
export async function getTasks(): Promise<Task[]> {
  if (API_BASE_URL) {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`);
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data : data.tasks || [];
      }
      console.warn(`[API] Failed to fetch tasks: ${response.status}`);
    } catch (error) {
      console.warn('[API] Network error fetching tasks, using mock data:', error);
    }
  }
  return [...runtimeTasks];
}

/**
 * Fetch a Single Task by Order ID
 */
export async function getTaskById(orderId?: string): Promise<Task> {
  const defaultSalemPickup = { latitude: 11.6448, longitude: 78.1485 };
  const defaultSalemDelivery = { latitude: 11.6668, longitude: 78.1745 };
  const fallbackTask = runtimeTasks[0] || {
    id: '1',
    orderId: '#YL-10001',
    customerName: 'Arun Kumar',
    customerPhone: '9876543210',
    packagesCount: 3,
    packageText: '3 packages',
    status: 'Assigned',
    statusColor: '#f59e0b',
    pickupLocation: 'Yetlo Hub, Gugai, Salem',
    pickupCoordinates: defaultSalemPickup,
    deliveryLocation: 'Military Road, Johnsonpet, Salem',
    deliveryCoordinates: defaultSalemDelivery,
    loadItems: [
      { material: 'Cement', qty: 2, unit: 'Bags' },
      { material: 'Bricks', qty: 5000, unit: 'Nos' },
    ],
    assignedTime: '10:30 AM',
  };

  if (!orderId) {
    return { ...fallbackTask };
  }

  if (API_BASE_URL) {
    try {
      const normalizedId = encodeURIComponent(String(orderId));
      const response = await fetch(`${API_BASE_URL}/tasks/${normalizedId}`);
      if (response.ok) {
        const data = await response.json();
        return {
          ...data,
          pickupCoordinates: data.pickupCoordinates || defaultSalemPickup,
          deliveryCoordinates: data.deliveryCoordinates || defaultSalemDelivery,
        };
      }
      console.warn(`[API] Failed to fetch task ${orderId}: ${response.status}`);
    } catch (error) {
      console.warn(`[API] Network error fetching task ${orderId}, using mock data:`, error);
    }
  }

  // Lookup in runtime tasks
  const strId = String(orderId);
  const cleanId = strId.replace(/^#/, '');
  const found = runtimeTasks.find(
    (t) => t.orderId === strId || t.orderId?.replace(/^#/, '') === cleanId || t.id === strId
  );

  const matched = found || fallbackTask;
  return {
    ...matched,
    pickupCoordinates: matched.pickupCoordinates || defaultSalemPickup,
    deliveryCoordinates: matched.deliveryCoordinates || defaultSalemDelivery,
  };
}

/**
 * Accept a Task
 */
export async function acceptTask(orderId: string): Promise<{ success: boolean; task?: Task }> {
  if (API_BASE_URL) {
    try {
      const normalizedId = encodeURIComponent(orderId);
      const response = await fetch(`${API_BASE_URL}/tasks/${normalizedId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        return { success: true, task: data };
      }
      console.warn(`[API] Failed to accept task ${orderId}: ${response.status}`);
    } catch (error) {
      console.warn(`[API] Network error accepting task ${orderId}:`, error);
    }
  }

  // Update in runtime state
  const taskIndex = runtimeTasks.findIndex(
    (t) => t.orderId === orderId || t.orderId.replace(/^#/, '') === orderId.replace(/^#/, '')
  );
  if (taskIndex !== -1) {
    runtimeTasks[taskIndex] = {
      ...runtimeTasks[taskIndex],
      status: 'In Progress',
      statusColor: '#2563eb',
    };
    return { success: true, task: runtimeTasks[taskIndex] };
  }

  return { success: true };
}

/**
 * Update Driver Online / Offline Status
 */
export async function setDriverOnlineStatus(
  isOnline: boolean
): Promise<{ success: boolean; isOnline: boolean }> {
  if (API_BASE_URL) {
    try {
      const response = await fetch(`${API_BASE_URL}/driver/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnline }),
      });
      if (response.ok) {
        const data = await response.json();
        return { success: true, isOnline: data.isOnline ?? isOnline };
      }
      console.warn(`[API] Failed to update driver status: ${response.status}`);
    } catch (error) {
      console.warn('[API] Network error updating driver status:', error);
    }
  }

  // Update runtime state
  runtimeProfile.isOnline = isOnline;
  runtimeProfile.statusTitle = isOnline ? "You're Online" : "You're Offline";
  runtimeProfile.statusSubtitle = isOnline
    ? 'Ready to receive new order'
    : 'Turn on to get new orders';

  return { success: true, isOnline };
}
