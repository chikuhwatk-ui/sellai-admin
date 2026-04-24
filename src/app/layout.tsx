import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Fraunces } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToasterProvider } from "@/components/providers/ToasterProvider";
import { ConfirmDialogHost } from "@/components/ui/ConfirmDialog";

// Display serif used ONLY for page titles. Fraunces gives the admin a
// single editorial moment per page without replacing the body/mono
// stack, and without the ~$700 Söhne license. Scoped via the
// `--font-display` CSS variable + the `.font-display` utility.
//
// Loaded as a variable font (no `weight` list) so the `opsz` + `SOFT`
// axes can be driven from CSS via `font-variation-settings`. Mixing
// `weight: [...]` with `axes: [...]` is a next/font build error —
// pick one or the other.
const fraunces = Fraunces({
    subsets: ["latin"],
    axes: ["opsz", "SOFT"],
    display: "swap",
    variable: "--font-display",
});

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
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <head>
        <style>{`
          :root {
            --font-sans: ${GeistSans.style.fontFamily};
            --font-mono: ${GeistMono.style.fontFamily};
            --font-display: ${fraunces.style.fontFamily};
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
