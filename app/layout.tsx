import type { Metadata } from "next";
import { Inter, Poppins, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-logo",
  subsets: ["latin"],
  weight: ["600"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FriendChise",
  description: "Franchise management made simple.",
};

/**
 * Root HTML shell shared by every page.
 *
 * Responsibilities:
 * - Injects Geist Sans and Geist Mono CSS variables for the design system.
 * - Wraps the tree in `TooltipProvider` so any component can render a tooltip
 *   without mounting its own provider.
 * - Mounts the Sonner `Toaster` globally so server actions and client code can
 *   call `toast()` from anywhere.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${poppins.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <TooltipProvider>
          {children}
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </body>
    </html>
  );
}
