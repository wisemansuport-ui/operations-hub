import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import OneSignal from "react-onesignal";
import { registerDeviceTag } from "@/lib/notifications";
import { playClickSound } from "@/lib/audio";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { RouteTransition } from "@/components/layout/RouteTransition";
import { useLocalStorage } from "./hooks/useLocalStorage";
import NotFound from "./pages/NotFound";
import NotificationPrompt from "@/components/NotificationPrompt";
import { SubscriptionGuard } from "@/components/layout/SubscriptionGuard";

// Lazy-loaded routes — keeps the initial bundle small and navigation snappy on mobile
const Login = lazy(() => import("./pages/Login"));
const Landing = lazy(() => import("./pages/Landing"));
const Index = lazy(() => import("./pages/Index"));
const Production = lazy(() => import("./pages/Production"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Networks = lazy(() => import("./pages/Networks"));
const PixKeys = lazy(() => import("./pages/PixKeys"));
const Quality = lazy(() => import("./pages/Quality"));
const Reports = lazy(() => import("./pages/Reports"));
const Operators = lazy(() => import("./pages/Operators"));
const OperatorExtract = lazy(() => import("./pages/OperatorExtract"));
const Tutorial = lazy(() => import("./pages/Tutorial"));
const Costs = lazy(() => import("./pages/Costs"));
const Goals = lazy(() => import("./pages/Goals"));
const Subscription = lazy(() => import("./pages/Subscription"));
const MasterPanel = lazy(() => import("./pages/MasterPanel"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="min-h-[40vh] flex items-center justify-center">
    <div className="w-6 h-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
  </div>
);

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const [user] = useLocalStorage<any>('nytzer-user', null);
  const isDevelopment = false;
  if (!user && !isDevelopment) return <Navigate to="/login" replace />;
  return (
    <SubscriptionGuard>
      <AppLayout>
        <Suspense fallback={<RouteFallback />}>{children}</Suspense>
      </AppLayout>
      <NotificationPrompt />
    </SubscriptionGuard>
  );
};

const App = () => {
  const [user] = useLocalStorage<any>('nytzer-user', null);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('input') || target.closest('textarea')) return;
      const isClickable = target.closest('button') || target.closest('a') || target.closest('[role="button"]') || target.closest('.cursor-pointer');
      if (isClickable) playClickSound();
    };
    document.addEventListener('click', handleGlobalClick);

    OneSignal.init({
      appId: "25bd7404-9856-4021-bbb4-3260a00197f4",
      allowLocalhostAsSecureOrigin: true,
      notifyButton: { enable: false } as any,
      autoRegister: false,
      autoResubscribe: true,
      promptOptions: { slidedown: { prompts: [] } } as any,
      serviceWorkerParam: { scope: "/" } as any,
      serviceWorkerPath: "/OneSignalSDKWorker.js" as any,
    } as any).then(() => {
      if (user?.username) {
        registerDeviceTag(user.username, user.role || 'OPERADOR');
      }
      OneSignal.User.PushSubscription.addEventListener('change', (event: any) => {
        if (event?.current?.isSubscribed && user?.username) {
          console.log('[OneSignal] Subscription changed — re-tagging device...');
          registerDeviceTag(user.username, user.role || 'OPERADOR');
        }
      });
    }).catch(e => console.error("OneSignal init error:", e));

    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  useEffect(() => {
    if (user?.username) {
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
                <RouteTransition>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/" element={<Landing />} />
                  <Route path="/app" element={<PrivateRoute><Index /></PrivateRoute>} />
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
                  <Route path="/goals" element={<PrivateRoute><Goals /></PrivateRoute>} />
                  <Route path="/subscription" element={<PrivateRoute><Subscription /></PrivateRoute>} />
                  <Route path="/master" element={<PrivateRoute><MasterPanel /></PrivateRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                </RouteTransition>
            </BrowserRouter>
          </TooltipProvider>
        </NotificationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
