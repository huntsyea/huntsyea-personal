export const siteRoutes = {
  home: "/",
  posts: "/posts",
  projects: "/projects",
  favorites: "/favorites",
  gettingStartedPost: "/posts/getting-started",
  projectStructurePost: "/posts/project-structure",
  writingPost: "/posts/basic-writing-and-formatting-syntax",
  projectPost: "/projects/component-showcase",
  missingCategory: "/this-category-does-not-exist",
  missingPost: "/posts/this-post-does-not-exist",
} as const;

export const postRoutes = [
  siteRoutes.gettingStartedPost,
  siteRoutes.projectStructurePost,
  siteRoutes.writingPost,
  siteRoutes.projectPost,
] as const;

export const indexableRoutes = [
  siteRoutes.home,
  siteRoutes.posts,
  siteRoutes.projects,
  siteRoutes.favorites,
  ...postRoutes,
];

export const themeLabels = ["system", "dark", "light"] as const;
