import Link from "@/components/link";
import { AppThemeSwitcher } from "@/components/theme";
import { siteProfile } from "@/lib/site/profile";

/**
 * The shared footer rendered by SiteShell on every route except home: Contact
 * links as text links with the Theme control opposite, and a copyright line
 * beneath. Home's contact pills already carry the same links, so it renders
 * no footer.
 */
export const SiteFooter = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="mx-auto w-full max-w-column px-6 pb-[var(--space-page)] md:pb-[var(--space-page-desktop)]">
      <div className="border-border flex flex-col gap-y-3 border-t pt-4">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <nav aria-label="Contact links">
            <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0">
              {siteProfile.contactLinks.map(({ label, href, newTab }) => (
                <li key={label} className="m-0 p-0 list-none">
                  <Link href={href} newTab={newTab} variant="nav">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <AppThemeSwitcher />
        </div>
        <p className="m-0 text-sm text-fg-muted">
          © {year} {siteProfile.name}
        </p>
      </div>
    </footer>
  );
};
