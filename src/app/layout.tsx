import type { Metadata } from "next";
import "./globals.css";
import localFont from "next/font/local";
import ClientLayout from "./client-layout";
import { Toaster } from 'react-hot-toast';

const burgerFont = localFont({
  src: "../../public/fonts/burger_free/Burger Free.ttf",
  variable: "--font-burger"
});

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
      <body className={burgerFont.className} suppressHydrationWarning>
        <ClientLayout>
          {children}
        </ClientLayout>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
