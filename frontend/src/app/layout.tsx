import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext"; // <--- 1. IMPORT NOVO

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tesouraria DeMolay", // <--- 2. TÍTULO PROFISSIONAL
  description: "Sistema Financeiro Integrado - Capítulo Unidos da Esperança",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br"> {/* <--- 3. IDIOMA CORRETO */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 dark:bg-[#050505] transition-colors duration-300`}
      >
        <ThemeProvider> {/* <--- 4. ENVELOPANDO A APLICAÇÃO */}
            {children}
        </ThemeProvider>
      </body>
    </html>
  );
}