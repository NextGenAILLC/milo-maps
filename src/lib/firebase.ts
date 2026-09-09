/**
 * Firebase initialization and Firestore operations for Milo Maps
 */

import {
  initializeApp,
  type FirebaseApp,
} from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  type Auth,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';
import type { PlaceHit, SavedPlace } from './types';

let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/**
 * Check if Firebase is properly configured
 */
export function firebaseReady(): boolean {
  return !!(config.apiKey && config.projectId);
}

/**
 * Initialize Firebase if not already done
 */
function initFirebase() {
  if (firebaseApp) return { app: firebaseApp, auth, firestore };

  if (!firebaseReady()) {
    return { app: null, auth: null, firestore: null };
  }

  try {
    firebaseApp = initializeApp(config);
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);
  } catch (error) {
    console.error('Firebase initialization failed:', error);
  }

  return { app: firebaseApp, auth, firestore };
}

/**
 * Get Firebase services
 */
export function getFirebase() {
  return initFirebase();
}

/**
 * Sign in with Google
 */
export async function signInGoogle() {
  const { auth: authInstance } = initFirebase();
  if (!authInstance) {
    throw new Error('Firebase not configured');
  }

  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(authInstance, provider);
    return result.user;
  } catch (error) {
    console.error('Sign-in failed:', error);
    throw error;
  }
}

/**
 * Sign out current user
 */
export async function signOutUser(): Promise<void> {
  const { auth: authInstance } = initFirebase();
  if (!authInstance) {
    throw new Error('Firebase not configured');
  }

  try {
    await signOut(authInstance);
  } catch (error) {
    console.error('Sign-out failed:', error);
    throw error;
  }
}

/**
 * Save a place to Firestore
 */
export async function savePlace(userId: string, place: PlaceHit): Promise<string> {
  const { firestore: firestoreInstance } = initFirebase();
  if (!firestoreInstance) {
    throw new Error('Firestore not configured');
  }

  try {
    const docRef = await addDoc(collection(firestoreInstance, 'saved_places'), {
      userId,
      name: place.name,
      url: place.url || null,
      placeId: place.placeId || null,
      lat: place.lat || null,
      lng: place.lng || null,
      savedAt: Date.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Save failed:', error);
    throw error;
  }
}

/**
 * Watch saved places for a user (real-time updates)
 */
export function watchSaved(
  userId: string,
  onUpdate: (places: SavedPlace[]) => void,
): Unsubscribe | null {
  const { firestore: firestoreInstance } = initFirebase();
  if (!firestoreInstance) return null;

  try {
    const q = query(
      collection(firestoreInstance, 'saved_places'),
      where('userId', '==', userId),
    );

    return onSnapshot(q, (snapshot) => {
      const places: SavedPlace[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        places.push({
          id: doc.id,
          userId: data.userId,
          name: data.name,
          url: data.url,
          placeId: data.placeId,
          lat: data.lat,
          lng: data.lng,
          savedAt: data.savedAt,
        });
      });
      onUpdate(places);
    });
  } catch (error) {
    console.error('Watch failed:', error);
    return null;
  }
}

/**
 * Remove a saved place
 */
export async function removeSaved(docId: string): Promise<void> {
  const { firestore: firestoreInstance } = initFirebase();
  if (!firestoreInstance) {
    throw new Error('Firestore not configured');
  }

  try {
    await deleteDoc(doc(firestoreInstance, 'saved_places', docId));
  } catch (error) {
    console.error('Remove failed:', error);
    throw error;
  }
}
