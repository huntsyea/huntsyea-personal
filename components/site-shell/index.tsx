import { Entrance } from "@/components/motion/entrance";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

interface SiteShellProps {
  children: React.ReactNode;
  /**
   * Whether to wrap the page in the shared header and footer. Home turns this
   * off: its identity block and contact pills already carry what the shell
   * repeats, so the front door is content only.
   */
  chrome?: boolean;
}

/**
 * The page frame shared by every route: the reading column with the route
 * entrance, optionally between the shared header and footer.
 */
export const SiteShell = ({ children, chrome = true }: SiteShellProps) => {
  return (
    <>
      {chrome ? <SiteHeader /> : null}
      <main className="mx-auto w-full max-w-column px-6 py-section">
        <Entrance>{children}</Entrance>
      </main>
      {chrome ? <SiteFooter /> : null}
    </>
  );
};
