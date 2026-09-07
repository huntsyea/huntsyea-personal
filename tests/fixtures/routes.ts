export const siteRoutes = {
  home: "/",
  posts: "/posts",
  favorites: "/favorites",
  missingCategory: "/this-category-does-not-exist",
  missingPost: "/posts/this-post-does-not-exist",
} as const;

/**
 * Every route published in the Content catalog: the home page, each Category
 * and Post, and Favorites. The shell renders on every one of them except home.
 */
export const indexableRoutes = [
  siteRoutes.home,
  siteRoutes.posts,
  "/projects",
  "/posts/abstraction",
  "/posts/pi-fusion",
  "/projects/pi-fusion",
  siteRoutes.favorites,
] as const;

export const notFoundRoute = siteRoutes.missingCategory;

export const themeLabels = ["system", "dark", "light"] as const;
