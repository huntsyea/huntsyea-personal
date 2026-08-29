import type { Metadata } from "next";

import { Layout } from "@/components/screens/posts";
import { contentCatalog } from "@/lib/content";
import { getPostDescription } from "@/lib/site/post";
import { createSiteMetadata } from "@/lib/site/profile";

import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ category: string; slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return contentCatalog.listPosts().map((post) => ({
    category: post.category,
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category, slug } = await params;
  const result = contentCatalog.getPost(category, slug);

  if (result.kind !== "found") {
    notFound();
  }

  const { post } = result;

  return createSiteMetadata({
    title: post.seo?.title ?? post.title,
    description: getPostDescription(post),
    path: `/${post.category}/${post.slug}`,
    type: "article",
    publishedTime: post.time.created,
    modifiedTime: post.time.updated,
  });
}

export default async function Page({ params }: PageProps) {
  const { category, slug } = await params;
  const result = contentCatalog.getPost(category, slug);

  if (result.kind !== "found") {
    notFound();
  }

  const { post } = result;
  const adjacent = contentCatalog.getAdjacent(category, slug) ?? {
    previous: undefined,
    next: undefined,
  };

  return <Layout post={post} adjacent={adjacent} />;
}
