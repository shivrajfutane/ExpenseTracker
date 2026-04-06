import type { Metadata } from "next";
import { Inter as InterFont } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Using Inter from Google Fonts via standard Next.js 14 conventions if possible, 
// otherwise standard sans-serif is fine as Tailwind handles it.
// Actually, next/font/google is better.

const inter = InterFont({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ExpenseTracker | Smart Financial Management",
  description: "Track your expenses with ease and precision using our premium dashboard.",
};

import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="antialiased">
      <body className={inter.className}>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            {children}
            <Toaster position="top-center" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
