import { contentCatalog } from "@/lib/content";
import { createOpenGraphImage, OPEN_GRAPH_SIZE } from "@/lib/site/opengraph";
import { getPostDescription } from "@/lib/site/post";
import { siteProfile } from "@/lib/site/profile";

import { notFound } from "next/navigation";

export const size = OPEN_GRAPH_SIZE;
export const contentType = "image/png";

export function generateImageMetadata({
  params,
}: {
  params: { category: string; slug: string };
}) {
  const result = contentCatalog.getPost(params.category, params.slug);

  if (result.kind !== "found") {
    return [];
  }

  return [
    {
      id: "card",
      alt: `${result.post.title} | ${siteProfile.name}`,
      size,
      contentType,
    },
  ];
}

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{
    category: string;
    slug: string;
  }>;
}) {
  const { category, slug } = await params;
  const result = contentCatalog.getPost(category, slug);

  if (result.kind !== "found") {
    notFound();
  }

  const { post } = result;

  return createOpenGraphImage({
    title: post.seo?.title ?? post.title,
    description: getPostDescription(post),
  });
}
