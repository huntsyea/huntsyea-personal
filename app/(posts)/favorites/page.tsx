import type { Metadata } from "next";

import { Favorites } from "@/components/favorites";
import { renderCategoryIntro } from "@/lib/content/renderer";
import { favoritesDescription, favoritesIndex } from "@/lib/favorites";
import { createSiteMetadata } from "@/lib/site/profile";

export const metadata: Metadata = createSiteMetadata({
  title: "Favorites",
  description: favoritesDescription,
  path: "/favorites",
});

export default async function Page() {
  const intro =
    favoritesIndex.intro && favoritesIndex.introSourcePath
      ? await renderCategoryIntro(
          favoritesIndex.intro,
          favoritesIndex.introSourcePath,
        )
      : undefined;

  return (
    <>
      {intro ? <div className="prose">{intro}</div> : null}
      <Favorites groups={favoritesIndex.groups} asPage />
    </>
  );
}
