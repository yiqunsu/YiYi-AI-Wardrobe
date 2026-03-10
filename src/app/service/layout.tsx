/**
 * Service section layout [module: app / service]
 * Wraps all /service/* pages with: ProtectedRoute guard, ModelsProvider, HistoryProvider,
 * ServiceNavbar (top), ServiceSidebar (left), and ServiceFooter (bottom).
 */
"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ServiceNavbar from "@/components/layout/ServiceNavbar";
import ServiceSidebar from "@/components/layout/ServiceSidebar";
import ServiceFooter from "@/components/layout/ServiceFooter";
import { ModelsProvider } from "@/contexts/ModelsContext";
import { HistoryProvider } from "@/contexts/HistoryContext";

export default function ServiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <ModelsProvider>
        <HistoryProvider>
      <div className="h-screen w-full flex flex-col overflow-hidden bg-[#f7f1e8] font-display text-[#171412] dark:text-[#f7f1e8]">
        <ServiceNavbar />
        <div className="flex flex-1 min-h-0">
          <ServiceSidebar />
          <div className="flex-1 flex flex-col min-w-0 overflow-auto">
            {children}
          </div>
        </div>
        <ServiceFooter />
      </div>
        </HistoryProvider>
      </ModelsProvider>
    </ProtectedRoute>
  );
}
