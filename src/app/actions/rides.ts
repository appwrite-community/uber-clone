'use server';

import { Client, TablesDB, ID, Query, Permission, Role } from 'node-appwrite';
import { DATABASE_ID, RIDES_TABLE_ID } from '@/lib/config';

function getAdminClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || '');
  return new TablesDB(client);
}

function generateOtp(): string {
  const crypto = require('crypto');
  return crypto.randomInt(100000, 1000000).toString();
}

export async function createRideAction(
  riderId: string,
  pickupLocation: [number, number],
  dropLocation: [number, number],
  pickupAddress: string,
  dropAddress: string
) {
  const tablesDB = getAdminClient();
  const otp = generateOtp();
  const row = await tablesDB.createRow({
    databaseId: DATABASE_ID,
    tableId: RIDES_TABLE_ID,
    rowId: ID.unique(),
    data: {
      riderId,
      driverId: null,
      pickupLocation,
      dropLocation,
      pickupAddress,
      dropAddress,
      status: 'pending',
      otp,
      driverLocation: null,
      riderLocation: null,
    },
    permissions: [
      Permission.read(Role.users()),
      Permission.update(Role.user(riderId)),
    ],
    // All users can read (for geo query discovery), only the rider can update
  });
  return JSON.parse(JSON.stringify(row));
}

export async function acceptRideAction(rideId: string, driverId: string) {
  const tablesDB = getAdminClient();

  // Read the ride to get the riderId for scoped permissions
  const current = await tablesDB.getRow({
    databaseId: DATABASE_ID,
    tableId: RIDES_TABLE_ID,
    rowId: rideId,
  });
  const riderId = current.riderId as string;

  // Use a transaction to prevent two drivers accepting the same ride
  const tx = await tablesDB.createTransaction();

  try {
    // Stage the update within the transaction
    await tablesDB.updateRow({
      databaseId: DATABASE_ID,
      tableId: RIDES_TABLE_ID,
      rowId: rideId,
      data: { driverId, status: 'accepted' },
      permissions: [
        Permission.read(Role.users()),
        Permission.update(Role.user(riderId)),
        Permission.update(Role.user(driverId)),
      ],
      transactionId: tx.$id,
    });

    // Commit - fails with conflict if the row was modified by another driver
    await tablesDB.updateTransaction({
      transactionId: tx.$id,
      commit: true,
    });

    // Read the committed row to return it
    const row = await tablesDB.getRow({
      databaseId: DATABASE_ID,
      tableId: RIDES_TABLE_ID,
      rowId: rideId,
    });
    return JSON.parse(JSON.stringify(row));
  } catch {
    // Roll back on any failure (conflict or otherwise)
    try {
      await tablesDB.updateTransaction({
        transactionId: tx.$id,
        rollback: true,
      });
    } catch {
      // Transaction may have already expired
    }
    throw new Error('Ride is no longer available');
  }
}

export async function verifyOtpAction(rideId: string, otp: string) {
  const tablesDB = getAdminClient();
  const ride = await tablesDB.getRow({
    databaseId: DATABASE_ID,
    tableId: RIDES_TABLE_ID,
    rowId: rideId,
  });

  if (ride.otp !== otp) {
    return false;
  }

  await tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: RIDES_TABLE_ID,
    rowId: rideId,
    data: { status: 'riding' },
  });
  return true;
}

export async function endRideAction(rideId: string) {
  const tablesDB = getAdminClient();
  const row = await tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: RIDES_TABLE_ID,
    rowId: rideId,
    data: { status: 'completed' },
  });
  return JSON.parse(JSON.stringify(row));
}

export async function cancelRideAction(rideId: string) {
  const tablesDB = getAdminClient();
  const row = await tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: RIDES_TABLE_ID,
    rowId: rideId,
    data: { status: 'cancelled' },
  });
  return JSON.parse(JSON.stringify(row));
}

export async function updateRideLocationAction(
  rideId: string,
  field: 'driverLocation' | 'riderLocation',
  location: [number, number]
) {
  const tablesDB = getAdminClient();
  await tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: RIDES_TABLE_ID,
    rowId: rideId,
    data: { [field]: location },
  });
}
