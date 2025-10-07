import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "./client-layout";
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: "BunkerHouse - Menú Digital",
  description: "Menú digital de BunkerHouse",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="font-sans" suppressHydrationWarning>
        <ClientLayout>
          {children}
        </ClientLayout>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
