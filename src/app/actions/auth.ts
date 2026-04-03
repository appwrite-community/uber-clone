'use server';

import { Client, TablesDB, ID, Permission, Role } from 'node-appwrite';
import { DATABASE_ID, PROFILES_TABLE_ID } from '@/lib/config';

function getAdminClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || '');
  return new TablesDB(client);
}

export async function createProfileAction(
  userId: string,
  name: string,
  role: 'driver' | 'rider'
) {
  const tablesDB = getAdminClient();
  const row = await tablesDB.createRow({
    databaseId: DATABASE_ID,
    tableId: PROFILES_TABLE_ID,
    rowId: userId,
    data: { userId, name, role },
    permissions: [
      Permission.read(Role.users()),
      Permission.update(Role.user(userId)),
    ],
  });
  return JSON.parse(JSON.stringify(row));
}
