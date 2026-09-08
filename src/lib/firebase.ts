import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, type Auth } from "firebase/auth";
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
} from "firebase/firestore";
import type { PlaceHit, SavedPlace } from "./types";

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function firebaseReady() {
  return Boolean(cfg.apiKey && cfg.projectId && cfg.appId);
}

export function getFirebase() {
  if (!firebaseReady()) return { app: null, auth: null, db: null };
  if (!app) {
    app = initializeApp(cfg);
    auth = getAuth(app);
    db = getFirestore(app);
  }
  return { app, auth, db };
}

export async function signInGoogle() {
  const { auth } = getFirebase();
  if (!auth) throw new Error("Firebase not configured");
  await signInWithPopup(auth, new GoogleAuthProvider());
}

export async function signOutUser() {
  const { auth } = getFirebase();
  if (auth) await signOut(auth);
}

export async function savePlace(uid: string, place: PlaceHit) {
  const { db } = getFirebase();
  if (!db) throw new Error("Firebase not configured");
  await addDoc(collection(db, "savedPlaces"), {
    uid,
    ...place,
    savedAt: Date.now(),
  });
}

export function watchSaved(uid: string, cb: (places: SavedPlace[]) => void) {
  const { db } = getFirebase();
  if (!db) return () => {};
  const q = query(collection(db, "savedPlaces"), where("uid", "==", uid));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SavedPlace, "id">) })));
  });
}

export async function removeSaved(id: string) {
  const { db } = getFirebase();
  if (!db) return;
  await deleteDoc(doc(db, "savedPlaces", id));
}
