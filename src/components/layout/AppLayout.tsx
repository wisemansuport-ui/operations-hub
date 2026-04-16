import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";

export const AppLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className="ml-60 transition-all duration-300">
        <TopBar />
        <main className="p-6 animate-fade-in">{children}</main>
      </div>
    </div>
  );
};
