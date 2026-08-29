import type { Metadata } from "next";

import { Favorites } from "@/components/favorites";
import { favoritesDescription } from "@/lib/favorites";
import { createSiteMetadata } from "@/lib/site/profile";

export const metadata: Metadata = createSiteMetadata({
  title: "Favorites",
  description: favoritesDescription,
  path: "/favorites",
});

export default function Page() {
  return <Favorites asPage />;
}
