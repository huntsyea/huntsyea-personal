import Link from "@/components/link";
import { AppThemeSwitcher } from "@/components/theme";
import { contentCatalog } from "@/lib/content";
import { siteProfile } from "@/lib/site/profile";

/**
 * The shared header rendered by SiteShell on every route except home: the site
 * name, one nav link per catalog Category plus Favorites, and the Theme control.
 * The name and the Theme control share the first row at every width; the nav
 * sits between them at md and wraps onto its own row below.
 */
export const SiteHeader = () => {
  const categories = contentCatalog.listCategories();

  return (
    <header className="mx-auto flex w-full max-w-column flex-wrap items-center gap-x-4 gap-y-3 px-6 pt-[var(--space-page)] md:pt-[var(--space-page-desktop)]">
      <Link href="/" variant="quiet" className="font-semibold text-fg">
        {siteProfile.name}
      </Link>

      <nav
        aria-label="Primary"
        className="order-last basis-full md:order-none md:ml-auto md:basis-auto"
      >
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

      <div className="ml-auto md:ml-0">
        <AppThemeSwitcher />
      </div>
    </header>
  );
};
