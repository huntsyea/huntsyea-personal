import Link from "@/components/link";
import { AppThemeSwitcher } from "@/components/theme";
import { contentCatalog } from "@/lib/content";
import { siteProfile } from "@/lib/site/profile";

/**
 * The shared header rendered by the root layout on every route: the site name,
 * one nav link per catalog Category plus Favorites, and the Theme control.
 */
export const SiteHeader = () => {
  const categories = contentCatalog.listCategories();

  return (
    <header className="mx-auto flex w-full max-w-column flex-wrap items-center justify-between gap-x-4 gap-y-3 px-6 pt-[var(--space-page)] pb-6 md:pt-[var(--space-page-desktop)]">
      <Link href="/" variant="quiet" className="font-semibold text-fg">
        {siteProfile.name}
      </Link>

      <div className="flex items-center gap-4">
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
        <AppThemeSwitcher />
      </div>
    </header>
  );
};
