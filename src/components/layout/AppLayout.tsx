import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { NetworkParticles } from "./NetworkParticles";

export const AppLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 text-foreground">
      <NetworkParticles />
      <div className="flex w-full min-h-screen">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 w-full transition-all duration-300">
          <TopBar />
          <main className="p-4 md:p-6 animate-fade-in overflow-x-hidden pb-24 md:pb-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
