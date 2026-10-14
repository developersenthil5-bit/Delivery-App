/**
 * Delivery App - Mock Data Store
 * 
 * All initial and fallback application data is stored here.
 * When switching to a live API, you only need to change API_BASE_URL
 * in src/services/api.ts.
 */

export const driverProfile = {
  id: 'YP-1082',
  partnerId: '#YP-1082',
  name: 'Senthil Nathan',
  firstName: 'Senthil',
  phone: '+91 98765 43210',
  email: 'senthil@yetlo.com',
  isOnline: true,
  statusTitle: "You're Online",
  statusSubtitle: 'Ready to receive new order',
  verified: true,
  avatarInitials: 'SN',
  vehicle: {
    model: 'Honda Activa 6G',
    plateNumber: 'TN 01 AB 1234',
    type: 'Two Wheeler',
    details: 'Honda Activa 6G • TN 01 AB 1234',
  },
  stats: {
    completed: 142,
    rating: 4.9,
    onTimeRate: '98%',
    earnings: '₹18.4k',
    todayEarnings: '₹1,250',
  },
};

export const todayActivity = {
  assigned: 2,
  completed: 0,
  inProgress: 0,
};

export const currentTask = null; // null represents "No Active Tasks"

export const mockTasks = [
  {
    id: '1',
    orderId: '#YL-10001',
    customerName: 'Arun Kumar',
    customerPhone: '9876543210',
    packagesCount: 3,
    packageText: '3 packages',
    status: 'Assigned',
    statusColor: '#f59e0b',
    pickupLocation: 'Yetlo Hub, Gugai, Salem',
    pickupCoordinates: {
      latitude: 11.6448,
      longitude: 78.1485,
    },
    deliveryLocation: 'Military Road, Johnsonpet, Salem',
    deliveryCoordinates: {
      latitude: 11.6668,
      longitude: 78.1745,
    },
    loadItems: [
      { material: 'Cement', qty: 2, unit: 'Bags' },
      { material: 'Bricks', qty: 5000, unit: 'Nos' },
    ],
    assignedTime: '10:30 AM',
    notes: 'Handle with care. Call customer 10 mins before arrival.',
  },
  {
    id: '2',
    orderId: '#YL-10002',
    customerName: 'Priya S',
    customerPhone: '9876543211',
    packagesCount: 2,
    packageText: '2 packages',
    status: 'Assigned',
    statusColor: '#f59e0b',
    pickupLocation: 'Yetlo Hub, Gugai, Salem',
    pickupCoordinates: {
      latitude: 11.6448,
      longitude: 78.1485,
    },
    deliveryLocation: 'Five Roads, Junction, Salem',
    deliveryCoordinates: {
      latitude: 11.6710,
      longitude: 78.1340,
    },
    loadItems: [
      { material: 'Steel Rods', qty: 10, unit: 'Bundles' },
      { material: 'Sand', qty: 1, unit: 'Tonne' },
    ],
    assignedTime: '11:15 AM',
    notes: 'Deliver at back gate.',
  },
];

const MockData = {
  driverProfile,
  todayActivity,
  tasks: mockTasks,
  currentTask,
};

export default MockData;
