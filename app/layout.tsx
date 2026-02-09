
import type { Metadata } from "next";
import { Josefin_Sans, Poppins } from "next/font/google"; // Import fonts
import "./globals.css";

const josefin = Josefin_Sans({
  subsets: ["latin"],
  variable: "--font-josefin",
});

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Roadmap builder",
  description: "Build the systems of your mind.",
};

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from 'sonner';

// ... existing imports

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-title" content="Roadmap builder" />
      </head>
      <body
        suppressHydrationWarning
        className={`${josefin.variable} ${poppins.variable} antialiased font-sans`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="bottom-right" theme="dark" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}


