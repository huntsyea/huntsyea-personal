import { Breadcrumb } from "@/components/breadcrumb";
import { contentCatalog } from "@/lib/content";

import { notFound } from "next/navigation";
import React from "react";

type PostLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ category: string; slug: string }>;
};

export default async function PostLayout({
  children,
  params,
}: PostLayoutProps) {
  const { category, slug } = await params;
  const result = contentCatalog.getPost(category, slug);

  if (result.kind !== "found") {
    notFound();
  }

  const { post } = result;
  const parent = contentCatalog.getCategory(post.category);

  return (
    <React.Fragment>
      <Breadcrumb
        items={[
          {
            label: parent?.title ?? post.category,
            href: `/${post.category}`,
          },
          { label: post.title, href: `/${post.category}/${post.slug}` },
        ]}
      />
      {children}
    </React.Fragment>
  );
}
