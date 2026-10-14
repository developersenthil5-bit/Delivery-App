export interface LoadItem {
  material: string;
  qty: string | number;
  unit: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Task {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  packagesCount: number;
  packageText: string;
  status: string;
  statusColor: string;
  pickupLocation: string;
  pickupCoordinates: Coordinates;
  deliveryLocation: string;
  deliveryCoordinates: Coordinates;
  loadItems: LoadItem[];
  assignedTime?: string;
  notes?: string;
}

export interface Vehicle {
  model: string;
  plateNumber: string;
  type: string;
  details: string;
}

export interface DriverStats {
  completed: number;
  rating: number;
  onTimeRate: string;
  earnings: string;
  todayEarnings?: string;
}

export interface DriverProfile {
  id: string;
  partnerId: string;
  name: string;
  firstName: string;
  phone: string;
  email: string;
  isOnline: boolean;
  statusTitle: string;
  statusSubtitle: string;
  verified: boolean;
  avatarInitials: string;
  vehicle: Vehicle;
  stats: DriverStats;
}

export interface TodayActivity {
  assigned: number;
  completed: number;
  inProgress: number;
}

export declare const driverProfile: DriverProfile;
export declare const todayActivity: TodayActivity;
export declare const mockTasks: Task[];
export declare const currentTask: Task | null;

declare const MockData: {
  driverProfile: DriverProfile;
  todayActivity: TodayActivity;
  tasks: Task[];
  currentTask: Task | null;
};

export default MockData;
