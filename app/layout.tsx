import "@/styles/main.css";

import type { Metadata } from "next";

import { Entrance } from "@/components/motion/entrance";
import { Providers } from "@/components/providers";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
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
          <SiteHeader />
          <main className="mx-auto w-full max-w-[36rem] px-6 py-[var(--space-page)] md:py-[var(--space-page-desktop)]">
            <Entrance>{children}</Entrance>
          </main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
