'use client';

import { Client, Account, TablesDB, Realtime, Channel, ID, Query } from 'appwrite';
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID } from './config';

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

const account = new Account(client);
const tablesDB = new TablesDB(client);
const realtime = new Realtime(client);

export { client, account, tablesDB, realtime, Channel, ID, Query };
