import type { Metadata } from "next";
import "./globals.css";
import localFont from "next/font/local";
import ClientLayout from "./client-layout";
import Link from 'next/link';
import { FaUtensils, FaUserTie } from 'react-icons/fa';
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
        <nav className="bg-black/90 backdrop-blur-sm border-b border-gray-800 fixed w-full z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Link href="/" className="text-white font-bold text-xl">
                  Bunkerhouse
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  href="/"
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                >
                  <FaUtensils />
                  <span>Menú</span>
                </Link>
                <Link
                  href="/rate-waiters"
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                >
                  <FaUserTie />
                  <span>Valorar Mozos</span>
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <div className="pt-16">
          <ClientLayout>
            {children}
          </ClientLayout>
        </div>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
