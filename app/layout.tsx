import "@/styles/main.css";

import type { Metadata } from "next";

import { Providers } from "@/components/providers";
import { createSiteMetadata } from "@/lib/site/profile";

import clsx from "clsx";
import localFont from "next/font/local";

export const metadata: Metadata = createSiteMetadata();

const inter = localFont({
  src: [
    {
      path: "../public/assets/inter/regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/assets/inter/medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/assets/inter/semi-bold.ttf",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-inter",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={clsx(inter.className, inter.variable)}
      suppressHydrationWarning
    >
      <body>
        <Providers>
          <main className="mx-auto max-w-screen-sm overflow-x-hidden px-6 py-24 md:overflow-x-visible">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
