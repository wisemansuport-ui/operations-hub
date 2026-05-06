import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { OperationMeta } from '../pages/Tasks';

export const useFirestoreData = () => {
  const [metas, setMetas] = useState<OperationMeta[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let metasLoaded = false;
    let usersLoaded = false;

    const checkLoading = () => {
      if (metasLoaded && usersLoaded) setLoading(false);
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

    return () => {
      unsubMetas();
      unsubUsers();
    };
  }, []);

  return { metas, users, loading };
};
