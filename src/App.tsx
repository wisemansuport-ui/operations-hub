import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { useEffect } from "react";
import OneSignal from "react-onesignal";
import { registerDeviceTag } from "@/lib/notifications";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { useLocalStorage } from "./hooks/useLocalStorage";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Production from "./pages/Production";
import Tasks from "./pages/Tasks";
import Networks from "./pages/Networks";
import PixKeys from "./pages/PixKeys";
import Quality from "./pages/Quality";
import Reports from "./pages/Reports";
import Operators from "./pages/Operators";
import OperatorExtract from "./pages/OperatorExtract";
import Tutorial from "./pages/Tutorial";
import Costs from "./pages/Costs";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const [user] = useLocalStorage<any>('nytzer-user', null);
  const isDevelopment = false;
  if (!user && !isDevelopment) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
};

const App = () => {
  const [user] = useLocalStorage<any>('nytzer-user', null);

  useEffect(() => {
    OneSignal.init({
      appId: "25bd7404-9856-4021-bbb4-3260a00197f4",
      allowLocalhostAsSecureOrigin: true,
      notifyButton: { enable: false } as any,
    } as any).then(() => {
      // Tag device immediately after init if user is logged in
      if (user?.username) {
        registerDeviceTag(user.username, user.role || 'OPERADOR');
      }

      // Also listen for when the user grants permission (subscription created/changed)
      // This ensures tagging happens even if permission was granted before login
      OneSignal.User.PushSubscription.addEventListener('change', (event: any) => {
        if (event?.current?.isSubscribed && user?.username) {
          console.log('[OneSignal] Subscription changed — re-tagging device...');
          registerDeviceTag(user.username, user.role || 'OPERADOR');
        }
      });
    }).catch(e => console.error("OneSignal init error:", e));
  }, []);

  useEffect(() => {
    if (user?.username) {
      // Re-register tags on login or account change (with delay to ensure init is done)
      setTimeout(() => {
        registerDeviceTag(user.username, user.role || 'OPERADOR');
      }, 2000);
    } else {
      OneSignal.logout().catch(e => console.warn("OneSignal logout error:", e));
    }
  }, [user?.username]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <NotificationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/" element={<PrivateRoute><Index /></PrivateRoute>} />
                  <Route path="/production" element={<PrivateRoute><Production /></PrivateRoute>} />
                  <Route path="/tasks" element={<PrivateRoute><Tasks /></PrivateRoute>} />
                  <Route path="/networks" element={<PrivateRoute><Networks /></PrivateRoute>} />
                  <Route path="/pix" element={<PrivateRoute><PixKeys /></PrivateRoute>} />
                  <Route path="/quality" element={<PrivateRoute><Quality /></PrivateRoute>} />
                  <Route path="/costs" element={<PrivateRoute><Costs /></PrivateRoute>} />
                  <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
                  <Route path="/operators" element={<PrivateRoute><Operators /></PrivateRoute>} />
                  <Route path="/me" element={<PrivateRoute><OperatorExtract /></PrivateRoute>} />
                  <Route path="/tutorial" element={<PrivateRoute><Tutorial /></PrivateRoute>} />
                  <Route path="/costs" element={<PrivateRoute><Costs /></PrivateRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </NotificationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
