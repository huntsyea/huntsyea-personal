import { SiteShell } from "@/components/site-shell";

/**
 * Every route except home: the shared header and footer around the content.
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
