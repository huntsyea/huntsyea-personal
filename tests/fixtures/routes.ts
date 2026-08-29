export const siteRoutes = {
  home: "/",
  posts: "/posts",
  examples: "/examples",
  favorites: "/favorites",
  gettingStartedPost: "/posts/getting-started",
  projectStructurePost: "/posts/project-structure",
  writingPost: "/posts/basic-writing-and-formatting-syntax",
  examplePost: "/examples/component-showcase",
  missingCategory: "/this-category-does-not-exist",
  missingPost: "/posts/this-post-does-not-exist",
} as const;

export const postRoutes = [
  siteRoutes.gettingStartedPost,
  siteRoutes.projectStructurePost,
  siteRoutes.writingPost,
  siteRoutes.examplePost,
] as const;

export const indexableRoutes = [
  siteRoutes.home,
  siteRoutes.posts,
  siteRoutes.examples,
  siteRoutes.favorites,
  ...postRoutes,
];

export const themeLabels = ["system", "dark", "light"] as const;
