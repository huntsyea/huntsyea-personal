import { Breadcrumb } from "@/components/breadcrumb";

import React from "react";

export default function FavoritesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <React.Fragment>
      <Breadcrumb items={[{ label: "Favorites", href: "/favorites" }]} />
      {children}
    </React.Fragment>
  );
}
