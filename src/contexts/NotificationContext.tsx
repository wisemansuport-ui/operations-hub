import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import { collection, onSnapshot, addDoc, updateDoc, doc, writeBatch, query, orderBy, limit } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useLocalStorage } from "../hooks/useLocalStorage";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  timestamp: string; // ISO string for Firestore compatibility
  targetRole?: "ADMIN" | "OPERADOR" | "ALL";
  targetUser?: string;
}

const NotificationContext = createContext<{
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (n: Omit<AppNotification, "id" | "read" | "timestamp">) => void;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
}>({
  notifications: [],
  unreadCount: 0,
  addNotification: () => {},
  markAsRead: () => {},
  markAllRead: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [user] = useLocalStorage<any>('nytzer-user', null);
  const [role] = useLocalStorage<'ADMIN' | 'OPERADOR'>('nytzer-role', 'ADMIN');

  useEffect(() => {
    // Listen to Firebase 'notifications' collection
    const q = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'), limit(50));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));
      
      // Filter notifications based on user role/username
      const visibleNotifs = notifsData.filter(n => {
        if (n.targetRole === 'ALL' || !n.targetRole) return true;
        if (n.targetRole === 'ADMIN' && role === 'ADMIN') return true;
        if (n.targetUser === user?.username) return true;
        return false;
      });
      
      setNotifications(visibleNotifs);
    });

    return () => unsubscribe();
  }, [role, user?.username]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = useCallback(async (n: Omit<AppNotification, "id" | "read" | "timestamp">) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        ...n,
        read: false,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error("Erro ao salvar notificação:", e);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (e) {
      console.error("Erro ao marcar como lida:", e);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      const unreadNotifs = notifications.filter(n => !n.read);
      if (unreadNotifs.length === 0) return;

      const batch = writeBatch(db);
      unreadNotifs.forEach(n => {
        const ref = doc(db, 'notifications', n.id);
        batch.update(ref, { read: true });
      });
      await batch.commit();
    } catch (e) {
      console.error("Erro ao marcar todas como lidas:", e);
    }
  }, [notifications]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAsRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
};
