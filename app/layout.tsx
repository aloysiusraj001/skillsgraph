import type { Metadata } from "next";
import localFont from "next/font/local";
import { FirebaseProvider } from "@/components/firebase-provider";
import "./globals.css";

const lexend = localFont({
  src: "./fonts/lexend-latin.woff2",
  weight: "400 700",
  style: "normal",
  display: "swap",
  variable: "--font-lexend",
});

const atkinson = localFont({
  src: [
    {
      path: "./fonts/atkinson-hyperlegible-latin-400.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/atkinson-hyperlegible-latin-700.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-atkinson",
});

export const metadata: Metadata = {
  title: "C60 · What's the problem",
  description: "A shared classroom board for five students and one teacher. Map who is affected, why it happens, and three five-blank problem statements.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${lexend.variable} ${atkinson.variable}`}>
      <body className="antialiased">
        <FirebaseProvider>{children}</FirebaseProvider>
      </body>
    </html>
  );
}
