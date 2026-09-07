import { Pill } from "@/components/pill";
import { Posts } from "@/components/posts";
import { contentCatalog } from "@/lib/content";
import { renderMarkdown } from "@/lib/content/renderer";
import { readHomeIntro } from "@/lib/home";
import { siteProfile } from "@/lib/site/profile";

import { ArrowRightIcon } from "@radix-ui/react-icons";

export default async function Home() {
  const intro = readHomeIntro();
  const title = intro?.title;
  const tagline = intro?.tagline;
  const body = intro?.body ? await renderMarkdown(intro.body) : undefined;
  const posts = contentCatalog.getCategory("posts");
  const projects = contentCatalog.getCategory("projects");

  return (
    <>
      {(title || tagline) && (
        <div className="flex justify-between" data-authored-content="identity">
          <div>
            {title ? <h1 className="text-2xl">{title}</h1> : null}
            {tagline ? <p className="text-fg-muted">{tagline}</p> : null}
          </div>
        </div>
      )}
      <nav
        aria-label="Contact and social links"
        className="mt-6 flex flex-wrap gap-2"
      >
        {siteProfile.contactLinks.map(({ label, href, newTab }) => (
          <Pill key={label} href={href} newTab={newTab}>
            {label}
            <ArrowRightIcon aria-hidden="true" className="text-fg-muted" />
          </Pill>
        ))}
      </nav>
      {body ? (
        <div data-authored-content="body" className="prose mt-stack">
          {body}
        </div>
      ) : null}
      {posts && (
        <div data-authored-content="posts">
          <Posts category={posts} />
        </div>
      )}
      {projects && (
        <div data-authored-content="projects">
          <Posts category={projects} />
        </div>
      )}
    </>
  );
}
