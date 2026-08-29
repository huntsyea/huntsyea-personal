export type Favorite = {
  title: string;
  href: string;
  note: string;
};

export type FavoriteGroup = {
  title: string;
  items: readonly Favorite[];
};

export const favoritesDescription =
  "External articles and resources Hunter keeps coming back to.";

// ponytail: a typed const is the ceiling for this curated outbound list.
// Upgrade to a catalog category or CMS if favorites need MDX bodies,
// editorial workflow, or more than a short static inventory.
export const favoriteGroups = [
  {
    title: "Articles",
    items: [
      {
        title: "Designing for the Web Ought to Mean Making HTML and CSS",
        href: "https://chriscoyier.net/2025/01/05/designing-for-the-web/",
        note: "Chris makes a compelling case for designers learning to work directly with the materials of the web.",
      },
      {
        title: "The Grug Brained Developer",
        href: "https://grugbrain.dev/",
        note: "A satirical but insightful take on software complexity.",
      },
      {
        title: "Taste Is Eating Silicon Valley",
        href: "https://www.workingtheorys.com/p/taste-is-eating-silicon-valley",
        note: "As technical barriers lower, aesthetic judgment becomes the differentiator.",
      },
      {
        title: "Writing Tools I Learned from The Economist",
        href: "https://www.writingruxandrabio.com/p/writing-tools-i-learned-from-the",
        note: "Practical writing techniques from one of the world's most respected publications.",
      },
      {
        title: "The UX of UUIDs",
        href: "https://unkey.dev/blog/uuid-ux",
        note: "Small details in technical design have real UX implications.",
      },
      {
        title: "The Technium: 1000 True Fans",
        href: "https://kk.org/thetechnium/1000-true-fans/",
        note: "Kevin Kelly's classic essay on the economics of creative work.",
      },
      {
        title: "Maker's Schedule, Manager's Schedule",
        href: "http://www.paulgraham.com/makersschedule.html",
        note: "Paul Graham's essay on why creative work requires different time structures.",
      },
      {
        title: "How to Do Great Work",
        href: "http://www.paulgraham.com/greatwork.html",
        note: "A comprehensive guide to doing work that matters.",
      },
      {
        title: "Stevey's Google Platforms Rant",
        href: "https://gist.github.com/chitchcock/1281611",
        note: "Steve Yegge's accidentally public rant about Google vs Amazon's approach to platforms.",
      },
    ],
  },
  {
    title: "Resources",
    items: [
      {
        title: "A Software Design Blog You'll Actually Read",
        href: "https://www.hillelwayne.com/",
        note: "Hillel Wayne writes about formal methods and software correctness in surprisingly accessible ways.",
      },
      {
        title: "Shape Up: Stop Running in Circles",
        href: "https://basecamp.com/shapeup",
        note: "Basecamp's product development methodology.",
      },
      {
        title: "Refactoring UI",
        href: "https://www.refactoringui.com/",
        note: "Practical design tips for developers.",
      },
    ],
  },
] satisfies readonly FavoriteGroup[];

export const favorites: readonly Favorite[] = favoriteGroups.flatMap(
  (group) => group.items,
);
