import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "MovieStream",
  description: "MovieStream — MongoDB document model explorer",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-950 text-gray-100 font-sans antialiased">
        <nav className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center gap-6 sticky top-0 z-50">
          <Link href="/" className="text-xl font-bold text-indigo-400 tracking-tight hover:text-indigo-300 transition-colors">
            🎬 MovieStream
          </Link>
          <div className="flex gap-6 ml-4">
            <Link href="/movies" className="text-sm text-gray-300 hover:text-white transition-colors font-medium">
              Películas
            </Link>
            <Link href="/customers" className="text-sm text-gray-300 hover:text-white transition-colors font-medium">
              Clientes
            </Link>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
