import { createContext, useContext, useState, ReactNode, useCallback } from "react";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  timestamp: Date;
}

const NotificationContext = createContext<{
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Omit<Notification, "id" | "read" | "timestamp">) => void;
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

const initialNotifications: Notification[] = [
  { id: "1", title: "Meta atingida", message: "A meta de produção de abril foi alcançada!", type: "success", read: false, timestamp: new Date(Date.now() - 1000 * 60 * 5) },
  { id: "2", title: "Estoque baixo", message: "Item 'Parafuso M8' abaixo do nível mínimo.", type: "warning", read: false, timestamp: new Date(Date.now() - 1000 * 60 * 30) },
  { id: "3", title: "Nova tarefa atribuída", message: "Manutenção preventiva - Linha 3 foi atribuída a você.", type: "info", read: false, timestamp: new Date(Date.now() - 1000 * 60 * 60) },
];

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = useCallback((n: Omit<Notification, "id" | "read" | "timestamp">) => {
    setNotifications((prev) => [
      { ...n, id: crypto.randomUUID(), read: false, timestamp: new Date() },
      ...prev,
    ]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAsRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
};
