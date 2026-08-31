import { Favorites } from "@/components/favorites";
import { Footer } from "@/components/footer";
import * as FadeIn from "@/components/motion/staggers/fade";
import { Posts } from "@/components/posts";
import { contentCatalog } from "@/lib/content";
import { renderMarkdown } from "@/lib/content/renderer";
import { favoriteGroups } from "@/lib/favorites";
import { readHomeIntro } from "@/lib/home";

const Spacer = () => <div style={{ marginTop: "24px" }} />;

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
      {(title || tagline) && <Spacer />}
      {body ? (
        <FadeIn.Item>
          <div data-authored-content="body">{body}</div>
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
      <FadeIn.Item>
        <div data-authored-content="favorites">
          <Favorites groups={favoriteGroups} />
        </div>
      </FadeIn.Item>
      <Spacer />
      <FadeIn.Item>
        <Footer />
      </FadeIn.Item>
    </FadeIn.Container>
  );
}
