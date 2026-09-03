import type { Favorite, FavoriteGroup } from "@/lib/favorites";

import Link from "@/components/link";

import { Link as NextViewTransition } from "next-view-transitions";

interface FavoritesProps {
  groups: readonly FavoriteGroup[];
  asPage?: boolean;
}

function favoriteCaption(item: Favorite) {
  return item.note || new URL(item.href).hostname.replace(/^www\./, "");
}

function FavoriteRows({ items }: { items: readonly Favorite[] }) {
  return (
    <ul className="m-0 list-none p-0">
      {items.map((item) => (
        <li key={item.href} className="m-0 list-none border-border border-t">
          <Link href={item.href} newTab className="flex w-full flex-col py-2">
            <span>{item.title}</span>
            <span className="text-fg-muted">{favoriteCaption(item)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export const Favorites = ({ groups, asPage = false }: FavoritesProps) => {
  const favorites = groups.flatMap((group) => group.items);
  const count = favorites.length;

  return (
    <section className="mt-6 flex flex-col">
      {asPage ? (
        <h1 className="py-2">Favorites {count > 0 && `(${count})`}</h1>
      ) : (
        <NextViewTransition href="/favorites" className="flex justify-between">
          <h2 className="py-2 text-fg-muted">
            Favorites {count > 0 && `(${count})`}
          </h2>
        </NextViewTransition>
      )}

      {asPage ? (
        groups.map((group, index) => (
          <div key={group.title} className={index > 0 ? "mt-6" : undefined}>
            <h2 className="py-2 text-fg-muted">{group.title}</h2>
            <FavoriteRows items={group.items} />
          </div>
        ))
      ) : (
        <FavoriteRows items={favorites} />
      )}
    </section>
  );
};
