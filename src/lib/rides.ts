'use client';

import { tablesDB, Query } from './appwrite';
import { DATABASE_ID, RIDES_TABLE_ID } from './config';
import type { Ride } from './types';

export async function getRide(rideId: string): Promise<Ride> {
  const row = await tablesDB.getRow({
    databaseId: DATABASE_ID,
    tableId: RIDES_TABLE_ID,
    rowId: rideId,
  });
  return row as unknown as Ride;
}

export async function getActiveRideForRider(
  riderId: string
): Promise<Ride | null> {
  const result = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: RIDES_TABLE_ID,
    queries: [
      Query.equal('riderId', riderId),
      Query.notEqual('status', 'completed'),
      Query.notEqual('status', 'cancelled'),
      Query.limit(1),
    ],
  });
  if (result.rows.length > 0) {
    return result.rows[0] as unknown as Ride;
  }
  return null;
}

export async function getActiveRideForDriver(
  driverId: string
): Promise<Ride | null> {
  const result = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: RIDES_TABLE_ID,
    queries: [
      Query.equal('driverId', driverId),
      Query.notEqual('status', 'completed'),
      Query.notEqual('status', 'cancelled'),
      Query.limit(1),
    ],
  });
  if (result.rows.length > 0) {
    return result.rows[0] as unknown as Ride;
  }
  return null;
}

export async function getNearbyPendingRides(
  driverLocation: [number, number],
  radiusMeters: number = 5000
): Promise<Ride[]> {
  const result = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: RIDES_TABLE_ID,
    queries: [
      Query.equal('status', 'pending'),
      Query.distanceLessThan(
        'pickupLocation',
        driverLocation,
        radiusMeters
      ),
    ],
  });
  return result.rows as unknown as Ride[];
}
