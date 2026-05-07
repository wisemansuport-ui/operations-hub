import { useState, useEffect } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useLocalStorage } from './useLocalStorage';

export function useSyncedState<T>(key: string, initialValue: T, syncEnabled: boolean = true): [T, (value: T | ((val: T) => T)) => void] {
  const [user] = useLocalStorage<any>('nytzer-user', null);
  const username = user?.username;
  const role = user?.role;
  const safeKey = key.replace(/\s+/g, '_');

  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    
    if (!syncEnabled) return initialValue;

    // Always check the synced key first
    if (username) {
      const localSynced = window.localStorage.getItem(`sync-${username}-${safeKey}`);
      if (localSynced) {
        try { return JSON.parse(localSynced); } catch(e) {}
      }
    }
    
    // If Admin, try to fallback to the old key for migration
    if (role === 'ADMIN') {
      const oldLocal = window.localStorage.getItem(key);
      if (oldLocal) {
        try { return JSON.parse(oldLocal); } catch(e) {}
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
        // Migration logic for ADMIN only
        if (role === 'ADMIN') {
          const oldLocal = window.localStorage.getItem(key);
          if (oldLocal) {
            try {
              const parsed = JSON.parse(oldLocal);
              setState(parsed);
              setDoc(docRef, { value: parsed });
            } catch(e) {}
          }
        }
      }
    }, (error) => {
      console.warn("Firestore sync error:", error);
    });

    return () => unsubscribe();
  }, [key, username, role, safeKey]);

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
