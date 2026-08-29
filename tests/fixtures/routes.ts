export const siteRoutes = {
  home: "/",
  guides: "/guides",
  examples: "/examples",
  favorites: "/favorites",
  guidePost: "/guides/getting-started",
  projectStructurePost: "/guides/project-structure",
  writingPost: "/guides/basic-writing-and-formatting-syntax",
  examplePost: "/examples/component-showcase",
  missingCategory: "/this-category-does-not-exist",
  missingPost: "/guides/this-post-does-not-exist",
} as const;

export const postRoutes = [
  siteRoutes.guidePost,
  siteRoutes.projectStructurePost,
  siteRoutes.writingPost,
  siteRoutes.examplePost,
] as const;

export const indexableRoutes = [
  siteRoutes.home,
  siteRoutes.guides,
  siteRoutes.examples,
  siteRoutes.favorites,
  ...postRoutes,
];

export const themeLabels = ["system", "dark", "light"] as const;
