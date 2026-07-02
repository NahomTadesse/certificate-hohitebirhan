import AppProvider from "@/components/AppProvider";
import HydrationClient from "@/components/HydrationClient";
import { Metadata } from "next";
import { ReactNode } from "react";
import { Toaster } from "sonner";
import "@fontsource/inter/latin.css";
import "./globals.css";
import { RouteProvider } from '@/contexts/RouteContext';
export const metadata: Metadata = {
  title: "Certeficate-dashboard Dashboard",
  description: "Certeficate-dashboard Managment",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body>
        <RouteProvider>
        <AppProvider>
          <HydrationClient />
          {children}
          <Toaster richColors position="top-center" />
        </AppProvider>
        </RouteProvider>
      </body>
    </html>
  );
}
