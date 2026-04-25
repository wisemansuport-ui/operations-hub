import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { NetworkParticles } from "./NetworkParticles";

export const AppLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20 text-foreground">
      <NetworkParticles />
      <div className="relative z-10 flex w-full min-h-screen">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 w-full transition-all duration-300">
          <TopBar />
          <main className="p-4 md:p-6 animate-fade-in relative z-20 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
