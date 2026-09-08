import Link from "@/components/link";
import { contentCatalog } from "@/lib/content";
import { siteProfile } from "@/lib/site/profile";

/**
 * The shared header rendered by SiteShell on every route except home: the site
 * name on the left and one nav link per catalog Category plus Favorites on the
 * right, on a single row at every width. The Theme control lives in the footer.
 */
export const SiteHeader = () => {
  const categories = contentCatalog.listCategories();

  return (
    <header className="mx-auto flex w-full max-w-column flex-wrap items-center justify-between gap-x-4 gap-y-3 px-6 pt-[var(--space-page)] md:pt-[var(--space-page-desktop)]">
      <Link href="/" variant="quiet" className="font-semibold text-fg">
        {siteProfile.name}
      </Link>

      <nav aria-label="Primary">
        <ul className="m-0 flex list-none flex-wrap gap-x-4 p-0">
          {categories.map((category) => (
            <li key={category.slug} className="m-0 p-0 list-none">
              <Link href={`/${category.slug}`} variant="nav">
                {category.title}
              </Link>
            </li>
          ))}
          <li className="m-0 p-0 list-none">
            <Link href="/favorites" variant="nav">
              Favorites
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};
