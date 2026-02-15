import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { CategorySidebar } from "@/components/category-sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JichanPark Tech Blog",
  description: "JichanPark Tech Blog",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          <main className="flex-1 container mx-auto max-w-screen-2xl px-4 py-6 md:py-10">
            <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] lg:grid-cols-[240px_1fr_240px] gap-10">
              <aside className="hidden md:block">
                <CategorySidebar />
              </aside>
              <div className="min-w-0 w-full max-w-4xl mx-auto">{children}</div>
              <div className="hidden lg:block" aria-hidden="true" />
            </div>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
