import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import Header from "@/components/Header/header";

import Providers from "./providers";



const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "Datara",
  title: "Datara",
  description: "Sales Analytics Dashboard",
  manifest: "/manifest-light.webmanifest",
};

export default function RootLayout({
  
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <link
          data-datara-static-icon="light"
          href="/datara-favicon-light.svg"
          media="(prefers-color-scheme: light)"
          rel="icon"
          type="image/svg+xml"
        />
        <link
          data-datara-static-icon="dark"
          href="/datara-favicon-light.svg"
          media="(prefers-color-scheme: dark)"
          rel="icon"
          type="image/svg+xml"
        />
        <meta
          content="#ffffff"
          data-datara-static-theme-color="light"
          media="(prefers-color-scheme: light)"
          name="theme-color"
        />
        <meta
          content="#050b12"
          data-datara-static-theme-color="dark"
          media="(prefers-color-scheme: dark)"
          name="theme-color"
        />
      </head>
      <body>
          <AppRouterCacheProvider>
      <Providers>
          <Header />   
          {children}
        </Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
