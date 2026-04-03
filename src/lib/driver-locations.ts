'use client';

import { tablesDB, Query } from './appwrite';
import { DATABASE_ID, DRIVER_LOCATIONS_TABLE_ID } from './config';
import type { DriverLocation } from './types';

export async function getNearbyDrivers(
  location: [number, number],
  radiusMeters: number = 5000
): Promise<DriverLocation[]> {
  const result = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: DRIVER_LOCATIONS_TABLE_ID,
    queries: [
      Query.equal('available', true),
      Query.distanceLessThan('location', location, radiusMeters),
    ],
  });
  return result.rows as unknown as DriverLocation[];
}
