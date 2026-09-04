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
            {title ? <h1>{title}</h1> : null}
            {tagline ? <h2>{tagline}</h2> : null}
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
            <span
              aria-hidden="true"
              className="flex size-5 items-center justify-center rounded-full border border-focus text-fg-muted"
            >
              <ArrowRightIcon />
            </span>
          </Pill>
        ))}
      </nav>
      <div aria-hidden="true" className="mt-stack" />
      {body ? (
        <div data-authored-content="body" className="prose">
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
