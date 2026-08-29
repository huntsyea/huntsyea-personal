import { contentCatalog } from "@/lib/content";
import { createOpenGraphImage, OPEN_GRAPH_SIZE } from "@/lib/site/opengraph";
import { siteProfile } from "@/lib/site/profile";

import { notFound } from "next/navigation";

export const size = OPEN_GRAPH_SIZE;
export const contentType = "image/png";

export function generateImageMetadata({
  params,
}: {
  params: { category: string };
}) {
  const category = contentCatalog.getCategory(params.category);

  if (!category) {
    return [];
  }

  return [
    {
      id: "card",
      alt: `${category.title} | ${siteProfile.name}`,
      size,
      contentType,
    },
  ];
}

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const category = contentCatalog.getCategory(slug);

  if (!category) {
    notFound();
  }

  return createOpenGraphImage({
    title: category.title,
    description: `Browse ${category.title.toLowerCase()} published with ${siteProfile.name}.`,
  });
}
