'use server';

import { Client, TablesDB, Permission, Role, AppwriteException } from 'node-appwrite';
import { DATABASE_ID, DRIVER_LOCATIONS_TABLE_ID } from '@/lib/config';

function getAdminClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || '');
  return new TablesDB(client);
}

export async function updateDriverLocationAction(
  driverId: string,
  location: [number, number],
  available: boolean
) {
  const tablesDB = getAdminClient();
  try {
    await tablesDB.updateRow({
      databaseId: DATABASE_ID,
      tableId: DRIVER_LOCATIONS_TABLE_ID,
      rowId: driverId,
      data: { driverId, location, available },
    });
  } catch (error) {
    if (!(error instanceof AppwriteException) || error.code !== 404) {
      throw error;
    }
    await tablesDB.createRow({
      databaseId: DATABASE_ID,
      tableId: DRIVER_LOCATIONS_TABLE_ID,
      rowId: driverId,
      data: { driverId, location, available },
      permissions: [
        Permission.read(Role.users()),
        Permission.update(Role.user(driverId)),
        Permission.delete(Role.user(driverId)),
      ],
    });
  }
}

export async function setDriverAvailabilityAction(
  driverId: string,
  available: boolean
) {
  const tablesDB = getAdminClient();
  await tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: DRIVER_LOCATIONS_TABLE_ID,
    rowId: driverId,
    data: { available },
  });
}
