import { favoritesDescription } from "@/lib/favorites";
import { createOpenGraphImage, OPEN_GRAPH_SIZE } from "@/lib/site/opengraph";
import { siteProfile } from "@/lib/site/profile";

export const alt = `Favorites | ${siteProfile.name}`;
export const size = OPEN_GRAPH_SIZE;
export const contentType = "image/png";

export default function OpenGraphImage() {
  return createOpenGraphImage({
    title: "Favorites",
    description: favoritesDescription,
  });
}
