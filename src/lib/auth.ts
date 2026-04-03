'use client';

import { account, tablesDB, ID } from './appwrite';
import { DATABASE_ID, PROFILES_TABLE_ID } from './config';
import { createProfileAction } from '@/app/actions/auth';
import type { Profile } from './types';

export async function signup(
  email: string,
  password: string,
  name: string,
  role: 'driver' | 'rider'
) {
  await account.create({ userId: ID.unique(), email, password, name });
  await account.createEmailPasswordSession({ email, password });
  const user = await account.get();

  // Create profile via server action (sets proper permissions)
  await createProfileAction(user.$id, name, role);

  return user;
}

export async function login(email: string, password: string) {
  await account.createEmailPasswordSession({ email, password });
  return account.get();
}

export async function logout() {
  await account.deleteSession({ sessionId: 'current' });
}

export async function getUser() {
  try {
    return await account.get();
  } catch {
    return null;
  }
}

export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    const row = await tablesDB.getRow({
      databaseId: DATABASE_ID,
      tableId: PROFILES_TABLE_ID,
      rowId: userId,
    });
    return {
      userId: row.userId as string,
      name: row.name as string,
      role: row.role as 'driver' | 'rider',
    };
  } catch {
    return null;
  }
}
