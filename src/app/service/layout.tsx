"use client";

import ProtectedRoute from "@/app/components/auth/ProtectedRoute";
import ServiceNavbar from "@/app/components/ai_service/ServiceNavbar";
import ServiceSidebar from "@/app/components/ai_service/ServiceSidebar";
import ServiceFooter from "@/app/components/ai_service/ServiceFooter";
import { ModelsProvider } from "@/app/contexts/ModelsContext";
import { HistoryProvider } from "@/app/contexts/HistoryContext";

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
