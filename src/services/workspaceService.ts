import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize firebase elements
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Provider setup for Workspace scopes
export const googleWorkspaceProvider = new GoogleAuthProvider();
googleWorkspaceProvider.addScope('https://www.googleapis.com/auth/spreadsheets');
googleWorkspaceProvider.addScope('https://www.googleapis.com/auth/gmail.readonly');
googleWorkspaceProvider.addScope('https://www.googleapis.com/auth/calendar');

// State caches
let activeGoogleToken: string | null = null;
let activeFirebaseUser: FirebaseUser | null = null;

// Error Handling block requested by firebase-integration skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('Firestore Error log:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Workspace API Integrations
export async function linkGoogleWorkspace(): Promise<{ user: FirebaseUser; accessToken: string }> {
  try {
    const result = await signInWithPopup(auth, googleWorkspaceProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Authorized credentials yielded no access token.');
    }
    activeGoogleToken = credential.accessToken;
    activeFirebaseUser = result.user;

    // Save user profile to Firestore
    const userPath = `users/${result.user.uid}`;
    try {
      await setDoc(doc(db, 'users', result.user.uid), {
        userId: result.user.uid,
        email: result.user.email,
        fullName: result.user.displayName || 'Google User',
        avatarUrl: result.user.photoURL || '',
        onboardingCompleted: true,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (fsErr) {
      handleFirestoreError(fsErr, OperationType.WRITE, userPath);
    }

    return { user: result.user, accessToken: activeGoogleToken };
  } catch (err) {
    console.error('Core Google Connection failed:', err);
    throw err;
  }
}

export function getActiveWorkspaceToken(): string | null {
  return activeGoogleToken;
}

export function getActiveFirebaseUser(): FirebaseUser | null {
  return activeFirebaseUser || auth.currentUser;
}

// Helper to log a sync event in Firestore
export async function logSyncEvent(service: string, status: 'success' | 'failed', recordsSyncedCount: number) {
  const user = getActiveFirebaseUser();
  if (!user) return;

  const path = `users/${user.uid}/syncs`;
  try {
    await addDoc(collection(db, 'users', user.uid, 'syncs'), {
      syncId: Math.random().toString(36).substring(2, 11),
      userId: user.uid,
      service,
      status,
      recordsSyncedCount,
      lastSyncedAt: new Date().toISOString()
    });
  } catch (fsErr) {
    handleFirestoreError(fsErr, OperationType.CREATE, path);
  }
}

// Read Sync items
export async function fetchSyncHistory(): Promise<any[]> {
  const user = getActiveFirebaseUser();
  if (!user) return [];

  const path = `users/${user.uid}/syncs`;
  try {
    const qSnapshot = await getDocs(
      query(collection(db, 'users', user.uid, 'syncs'), orderBy('lastSyncedAt', 'desc'), limit(15))
    );
    return qSnapshot.docs.map(doc => doc.data());
  } catch (fsErr) {
    handleFirestoreError(fsErr, OperationType.GET, path);
    return [];
  }
}

// 1. Fetch Google Sheets Spreedsheet Values
export async function getGoogleSheetValues(spreadsheetId: string, range: string): Promise<any> {
  const token = activeGoogleToken;
  if (!token) throw new Error('No active Google authentication token. Sign in first.');

  const cleanId = spreadsheetId.trim();
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(range)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errText = await res.text();
    await logSyncEvent('Google Sheets', 'failed', 0);
    throw new Error(`Google Sheets API Error: ${res.statusText}. Details: ${errText}`);
  }

  const data = await res.json();
  const rowCount = data.values ? data.values.length : 0;
  await logSyncEvent('Google Sheets', 'success', rowCount);
  return data;
}

// 2. Fetch Google Calendar Events
export async function getGoogleCalendarEvents(): Promise<any[]> {
  const token = activeGoogleToken;
  if (!token) throw new Error('No active Google authentication token. Sign in first.');

  const timeMin = new Date().toISOString();
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=8&orderBy=startTime&singleEvents=true&timeMin=${encodeURIComponent(timeMin)}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    await logSyncEvent('Google Calendar', 'failed', 0);
    throw new Error(`Google Calendar API Error: ${res.statusText}. Details: ${errText}`);
  }

  const data = await res.json();
  const events = data.items || [];
  await logSyncEvent('Google Calendar', 'success', events.length);
  return events;
}

// 3. Fetch Gmail Messages (Headers, Subjects, Snippets)
export async function getRecentGmailMessages(): Promise<any[]> {
  const token = activeGoogleToken;
  if (!token) throw new Error('No active Google authentication token. Sign in first.');

  // Step 1: List messages
  const listRes = await fetch(
    `https://gmail.googleapis.com/v1/users/me/messages?maxResults=5`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  if (!listRes.ok) {
    const errText = await listRes.text();
    await logSyncEvent('Gmail', 'failed', 0);
    throw new Error(`Gmail API List Error: ${listRes.statusText}. Details: ${errText}`);
  }

  const listData = await listRes.json();
  const messagesList = listData.messages || [];

  const detailedMessages: any[] = [];
  
  // Step 2: Fetch details of each message
  for (const msgBrief of messagesList) {
    const detailRes = await fetch(
      `https://gmail.googleapis.com/v1/users/me/messages/${msgBrief.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    if (detailRes.ok) {
      const detailed = await detailRes.json();
      
      const headers = detailed.payload?.headers || [];
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
      const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown Sender';
      const date = headers.find((h: any) => h.name === 'Date')?.value || '';

      detailedMessages.push({
        id: detailed.id,
        snippet: detailed.snippet,
        subject,
        from,
        date
      });
    }
  }

  await logSyncEvent('Gmail', 'success', detailedMessages.length);
  return detailedMessages;
}
