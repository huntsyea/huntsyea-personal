export const siteRoutes = {
  home: "/",
  favorites: "/favorites",
  missingCategory: "/this-category-does-not-exist",
  missingPost: "/posts/this-post-does-not-exist",
} as const;

export const indexableRoutes = [siteRoutes.home, siteRoutes.favorites];

export const themeLabels = ["system", "dark", "light"] as const;
