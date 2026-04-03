export interface Profile {
  userId: string;
  name: string;
  role: 'driver' | 'rider';
}

export interface DriverLocation {
  $id: string;
  driverId: string;
  location: [number, number]; // [lng, lat]
  available: boolean;
}

export type RideStatus =
  | 'pending'
  | 'accepted'
  | 'riding'
  | 'completed'
  | 'cancelled';

export interface Ride {
  $id: string;
  riderId: string;
  driverId: string | null;
  pickupLocation: [number, number]; // [lng, lat]
  dropLocation: [number, number]; // [lng, lat]
  pickupAddress: string;
  dropAddress: string;
  status: RideStatus;
  otp: string;
  driverLocation: [number, number] | null; // [lng, lat]
  riderLocation: [number, number] | null; // [lng, lat]
}
