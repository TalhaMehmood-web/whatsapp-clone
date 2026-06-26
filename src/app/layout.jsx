import { Poppins } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/providers/app-providers";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata = {
  title: "WhatsApp",
  description: "WhatsApp Web clone built with Next.js",
  manifest: "/manifest.webmanifest",
  applicationName: "WhatsApp",
  appleWebApp: {
    capable: true,
    title: "WhatsApp",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b141a" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={poppins.variable}
      suppressHydrationWarning
    >
      <body className="h-full font-sans antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
