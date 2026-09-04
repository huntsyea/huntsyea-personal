import { Footer } from "@/components/footer";
import Link from "@/components/link";
import * as FadeIn from "@/components/motion/staggers/fade";
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
    <FadeIn.Container>
      {(title || tagline) && (
        <FadeIn.Item>
          <div
            className="flex justify-between"
            data-authored-content="identity"
          >
            <div>
              {title ? <h1>{title}</h1> : null}
              {tagline ? <h2>{tagline}</h2> : null}
            </div>
          </div>
        </FadeIn.Item>
      )}
      <FadeIn.Item>
        <nav
          aria-label="Contact and social links"
          className="mt-6 flex flex-wrap gap-2"
        >
          {siteProfile.contactLinks.map(({ label, href, newTab }) => (
            <Link
              key={label}
              href={href}
              newTab={newTab}
              className="inline-flex h-10 items-center gap-3 rounded-medium border border-border-strong bg-bg px-3 font-medium text-base text-fg transition-colors hover:bg-bg-subtle"
            >
              {label}
              <span
                aria-hidden="true"
                className="flex size-5 items-center justify-center rounded-full border border-focus text-fg-muted"
              >
                <ArrowRightIcon />
              </span>
            </Link>
          ))}
        </nav>
      </FadeIn.Item>
      <div aria-hidden="true" className="mt-stack" />
      {body ? (
        <FadeIn.Item>
          <div data-authored-content="body" className="prose">
            {body}
          </div>
        </FadeIn.Item>
      ) : null}
      {posts && (
        <FadeIn.Item>
          <div data-authored-content="posts">
            <Posts category={posts} />
          </div>
        </FadeIn.Item>
      )}
      {projects && (
        <FadeIn.Item>
          <div data-authored-content="projects">
            <Posts category={projects} />
          </div>
        </FadeIn.Item>
      )}
      <div aria-hidden="true" className="mt-stack" />
      <FadeIn.Item>
        <Footer />
      </FadeIn.Item>
    </FadeIn.Container>
  );
}
