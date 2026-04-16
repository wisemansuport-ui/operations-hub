import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Production from "./pages/Production";
import Tasks from "./pages/Tasks";
import Inventory from "./pages/Inventory";
import Quality from "./pages/Quality";
import Maintenance from "./pages/Maintenance";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <NotificationProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppLayout>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/production" element={<Production />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/quality" element={<Quality />} />
                <Route path="/maintenance" element={<Maintenance />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>
          </BrowserRouter>
        </TooltipProvider>
      </NotificationProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
