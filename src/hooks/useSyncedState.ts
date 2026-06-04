import { useState, useEffect } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useLocalStorage } from './useLocalStorage';

export function useSyncedState<T>(key: string, initialValue: T, syncEnabled: boolean = true): [T, (value: T | ((val: T) => T)) => void] {
  const [user] = useLocalStorage<any>('nytzer-user', null);
  const username = user?.username;
  const safeKey = key.replace(/\s+/g, '_');

  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    if (!syncEnabled) return initialValue;

    // Only load data scoped to the current user — never share between users
    if (username) {
      const localSynced = window.localStorage.getItem(`sync-${username}-${safeKey}`);
      if (localSynced) {
        try { return JSON.parse(localSynced); } catch(e) {}
      }
    }

    return initialValue;
  });

  useEffect(() => {
    if (!username || !syncEnabled) return;

    const docRef = doc(db, 'user_data', `${username}_${safeKey}`);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data().value;
        setState(data);
        window.localStorage.setItem(`sync-${username}-${safeKey}`, JSON.stringify(data));
      } else {
        // No data in Firestore for this user — keep initialValue (empty state)
        // Do NOT read generic localStorage keys to avoid data leaking between users
      }
    }, (error) => {
      console.warn("Firestore sync error:", error);
    });

    return () => unsubscribe();
  }, [key, username, safeKey]);

  const setSyncedState = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(state) : value;
      setState(valueToStore);
      if (syncEnabled && username) {
         window.localStorage.setItem(`sync-${username}-${safeKey}`, JSON.stringify(valueToStore));
         setDoc(doc(db, 'user_data', `${username}_${safeKey}`), { value: valueToStore }).catch(e => console.warn(e));
      }
    } catch (error) {
      console.warn(`Error setting synced state for key "${key}":`, error);
    }
  };

  return [state, setSyncedState];
}
