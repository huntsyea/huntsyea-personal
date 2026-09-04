import Link from "@/components/link";
import { siteProfile } from "@/lib/site/profile";

/**
 * The shared footer rendered by the root layout on every route: Contact links
 * as text links plus a copyright line. Home renders no footer of its own.
 */
export const SiteFooter = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="mx-auto w-full max-w-[36rem] px-6 pt-4 pb-[var(--space-page)] md:pb-[var(--space-page-desktop)]">
      <div className="border-border flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t pt-4">
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
        <p className="m-0 text-sm text-fg-muted">
          © {year} {siteProfile.name}
        </p>
      </div>
    </footer>
  );
};
