import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { OperationMeta } from '../pages/Tasks';

export const useFirestoreData = () => {
  const [metas, setMetas] = useState<OperationMeta[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [costs, setCosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let metasLoaded = false;
    let usersLoaded = false;
    let costsLoaded = false;

    const checkLoading = () => {
      if (metasLoaded && usersLoaded && costsLoaded) setLoading(false);
    };

    const unsubMetas = onSnapshot(collection(db, 'metas'), (snapshot) => {
      const metasData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as OperationMeta));
      setMetas(metasData.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      metasLoaded = true;
      checkLoading();
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(usersData);
      usersLoaded = true;
      checkLoading();
    });

    const unsubCosts = onSnapshot(collection(db, 'costs'), (snapshot) => {
      const costsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort by date descending
      setCosts(costsData.sort((a,b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));
      costsLoaded = true;
      checkLoading();
    });

    return () => {
      unsubMetas();
      unsubUsers();
      unsubCosts();
    };
  }, []);

  return { metas, users, costs, loading };
};
