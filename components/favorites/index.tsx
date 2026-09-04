import type { Favorite, FavoriteGroup } from "@/lib/favorites";

import { EntryList, EntryRow } from "@/components/entry-list";
import { SectionHeading } from "@/components/section-heading";

interface FavoritesProps {
  groups: readonly FavoriteGroup[];
  asPage?: boolean;
}

function favoriteCaption(item: Favorite) {
  return item.note || new URL(item.href).hostname.replace(/^www\./, "");
}

function FavoriteList({ items }: { items: readonly Favorite[] }) {
  return (
    <EntryList>
      {items.map((item) => (
        <EntryRow
          key={item.href}
          title={item.title}
          href={item.href}
          caption={favoriteCaption(item)}
          newTab
        />
      ))}
    </EntryList>
  );
}

export const Favorites = ({ groups, asPage = false }: FavoritesProps) => {
  const favorites = groups.flatMap((group) => group.items);

  return (
    <section className="mt-6 flex flex-col">
      <SectionHeading
        title="Favorites"
        href={asPage ? undefined : "/favorites"}
        asPage={asPage}
      />

      {asPage ? (
        groups.map((group, index) => (
          <div key={group.title} className={index > 0 ? "mt-6" : undefined}>
            <SectionHeading title={group.title} />
            <FavoriteList items={group.items} />
          </div>
        ))
      ) : (
        <FavoriteList items={favorites} />
      )}
    </section>
  );
};
