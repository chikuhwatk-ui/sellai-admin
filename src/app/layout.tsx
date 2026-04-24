import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToasterProvider } from "@/components/providers/ToasterProvider";
import { ConfirmDialogHost } from "@/components/ui/ConfirmDialog";

export const metadata: Metadata = {
  title: "Sellai Admin",
  description: "Sellai Admin Dashboard — Marketplace Operations & Analytics",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}>
      <head>
        <style>{`
          :root {
            --font-sans: ${GeistSans.style.fontFamily};
            --font-mono: ${GeistMono.style.fontFamily};
          }
        `}</style>
      </head>
      <body className="min-h-full bg-canvas text-fg">
        <ThemeProvider>
          {children}
          <ToasterProvider />
          <ConfirmDialogHost />
        </ThemeProvider>
      </body>
    </html>
  );
}
