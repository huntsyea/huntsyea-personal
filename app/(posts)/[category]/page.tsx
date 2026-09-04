import type { Metadata } from "next";

import { Breadcrumb } from "@/components/breadcrumb";
import { Posts } from "@/components/posts";
import { contentCatalog } from "@/lib/content";
import { renderMarkdown } from "@/lib/content/renderer";
import { createSiteMetadata, siteProfile } from "@/lib/site/profile";

import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ category: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return contentCatalog
    .listCategories()
    .map((category) => ({ category: category.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const category = contentCatalog.getCategory(slug);

  if (!category) {
    notFound();
  }

  return createSiteMetadata({
    title: category.title,
    description: `Browse ${category.title.toLowerCase()} published with ${siteProfile.name}.`,
    path: `/${category.slug}`,
  });
}

export default async function Page({ params }: PageProps) {
  const { category: slug } = await params;
  const category = contentCatalog.getCategory(slug);

  if (!category) {
    notFound();
  }

  const intro = category.intro
    ? await renderMarkdown(category.intro)
    : undefined;

  return (
    <>
      <Breadcrumb
        items={[{ label: category.title, href: `/${category.slug}` }]}
      />
      {intro ? <div className="prose">{intro}</div> : null}
      <Posts category={category} asCategoryPage />
    </>
  );
}
