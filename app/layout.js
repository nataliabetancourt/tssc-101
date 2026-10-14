import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import AppIntlProvider from "@/context/IntlProvider";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Tire Store 101",
  description: "Internal employee training for TSSC tire and auto service.",
  appleWebApp: {
    capable: true,
    title: "Tire Store 101",
    statusBarStyle: "default",
  },
};

export const viewport = {
  themeColor: "#F7F7F8",
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} min-h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col overflow-x-hidden bg-canvas font-sans text-ink">
        <AuthProvider>
          <AppIntlProvider>{children}</AppIntlProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
