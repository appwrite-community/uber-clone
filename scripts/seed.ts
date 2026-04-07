/**
 * Seed script for the Uber Clone database.
 *
 * Creates the database, tables, columns, indexes, and permissions.
 * Run with: pnpm seed
 *
 * Requires NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID,
 * and APPWRITE_API_KEY in .env.local
 */

import { Client, TablesDB, Permission, Role } from 'node-appwrite';
import { config } from 'dotenv';

config({ path: '.env.local' });

const DATABASE_ID = 'uber-clone';

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_API_KEY || '');

const tablesDB = new TablesDB(client);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function safe(label: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  OK: ${label}`);
  } catch (e: any) {
    if (e.code === 409) {
      console.log(`  SKIP: ${label} (already exists)`);
    } else {
      throw e;
    }
  }
}

async function seed() {
  console.log('Seeding Uber Clone database...\n');

  // Database
  await safe('Database uber-clone', () =>
    tablesDB.create({ databaseId: DATABASE_ID, name: 'Uber Clone' }) as any
  );

  // --- Profiles table ---
  console.log('\nProfiles:');
  await safe('Table profiles', () =>
    tablesDB.createTable({
      databaseId: DATABASE_ID,
      tableId: 'profiles',
      name: 'Profiles',
      permissions: [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
      ],
      rowSecurity: true,
    }) as any
  );
  await safe('Column userId', () =>
    tablesDB.createVarcharColumn({ databaseId: DATABASE_ID, tableId: 'profiles', key: 'userId', size: 255, required: true }) as any
  );
  await safe('Column name', () =>
    tablesDB.createVarcharColumn({ databaseId: DATABASE_ID, tableId: 'profiles', key: 'name', size: 255, required: true }) as any
  );
  await safe('Column role', () =>
    tablesDB.createEnumColumn({ databaseId: DATABASE_ID, tableId: 'profiles', key: 'role', elements: ['driver', 'rider'], required: true }) as any
  );
  await sleep(3000);
  await safe('Index idx_userId', () =>
    tablesDB.createIndex({ databaseId: DATABASE_ID, tableId: 'profiles', key: 'idx_userId', type: 'unique', columns: ['userId'], orders: ['ASC'] }) as any
  );

  // --- Driver Locations table ---
  console.log('\nDriver Locations:');
  await safe('Table driver-locations', () =>
    tablesDB.createTable({
      databaseId: DATABASE_ID,
      tableId: 'driver-locations',
      name: 'Driver Locations',
      permissions: [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
      ],
      rowSecurity: true,
    }) as any
  );
  await safe('Column driverId', () =>
    tablesDB.createVarcharColumn({ databaseId: DATABASE_ID, tableId: 'driver-locations', key: 'driverId', size: 255, required: true }) as any
  );
  await safe('Column location', () =>
    tablesDB.createPointColumn({ databaseId: DATABASE_ID, tableId: 'driver-locations', key: 'location', required: true }) as any
  );
  await safe('Column available', () =>
    tablesDB.createBooleanColumn({ databaseId: DATABASE_ID, tableId: 'driver-locations', key: 'available', required: true }) as any
  );
  await sleep(3000);
  await safe('Index idx_driverId', () =>
    tablesDB.createIndex({ databaseId: DATABASE_ID, tableId: 'driver-locations', key: 'idx_driverId', type: 'unique', columns: ['driverId'], orders: ['ASC'] }) as any
  );
  await safe('Index idx_location (spatial)', () =>
    tablesDB.createIndex({ databaseId: DATABASE_ID, tableId: 'driver-locations', key: 'idx_location', type: 'spatial', columns: ['location'] }) as any
  );

  // --- Rides table ---
  console.log('\nRides:');
  await safe('Table rides', () =>
    tablesDB.createTable({
      databaseId: DATABASE_ID,
      tableId: 'rides',
      name: 'Rides',
      permissions: [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
      ],
      rowSecurity: true,
    }) as any
  );
  await safe('Column riderId', () =>
    tablesDB.createVarcharColumn({ databaseId: DATABASE_ID, tableId: 'rides', key: 'riderId', size: 255, required: true }) as any
  );
  await safe('Column driverId', () =>
    tablesDB.createVarcharColumn({ databaseId: DATABASE_ID, tableId: 'rides', key: 'driverId', size: 255, required: false }) as any
  );
  await safe('Column pickupAddress', () =>
    tablesDB.createVarcharColumn({ databaseId: DATABASE_ID, tableId: 'rides', key: 'pickupAddress', size: 512, required: true }) as any
  );
  await safe('Column dropAddress', () =>
    tablesDB.createVarcharColumn({ databaseId: DATABASE_ID, tableId: 'rides', key: 'dropAddress', size: 512, required: true }) as any
  );
  await safe('Column otp', () =>
    tablesDB.createVarcharColumn({ databaseId: DATABASE_ID, tableId: 'rides', key: 'otp', size: 6, required: true }) as any
  );
  await safe('Column pickupLocation', () =>
    tablesDB.createPointColumn({ databaseId: DATABASE_ID, tableId: 'rides', key: 'pickupLocation', required: true }) as any
  );
  await safe('Column dropLocation', () =>
    tablesDB.createPointColumn({ databaseId: DATABASE_ID, tableId: 'rides', key: 'dropLocation', required: true }) as any
  );
  await safe('Column driverLocation', () =>
    tablesDB.createPointColumn({ databaseId: DATABASE_ID, tableId: 'rides', key: 'driverLocation', required: false }) as any
  );
  await safe('Column riderLocation', () =>
    tablesDB.createPointColumn({ databaseId: DATABASE_ID, tableId: 'rides', key: 'riderLocation', required: false }) as any
  );
  await safe('Column status', () =>
    tablesDB.createEnumColumn({ databaseId: DATABASE_ID, tableId: 'rides', key: 'status', elements: ['pending', 'accepted', 'riding', 'completed', 'cancelled'], required: true }) as any
  );
  await sleep(3000);
  await safe('Index idx_status', () =>
    tablesDB.createIndex({ databaseId: DATABASE_ID, tableId: 'rides', key: 'idx_status', type: 'key', columns: ['status'], orders: ['ASC'] }) as any
  );
  await safe('Index idx_riderId', () =>
    tablesDB.createIndex({ databaseId: DATABASE_ID, tableId: 'rides', key: 'idx_riderId', type: 'key', columns: ['riderId'], orders: ['ASC'] }) as any
  );
  await safe('Index idx_driverId', () =>
    tablesDB.createIndex({ databaseId: DATABASE_ID, tableId: 'rides', key: 'idx_driverId', type: 'key', columns: ['driverId'], orders: ['ASC'] }) as any
  );
  await safe('Index idx_pickupLocation (spatial)', () =>
    tablesDB.createIndex({ databaseId: DATABASE_ID, tableId: 'rides', key: 'idx_pickupLocation', type: 'spatial', columns: ['pickupLocation'] }) as any
  );

  console.log('\nSeed complete!');
}

seed().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
