import { DeployButton } from "@/components/deploy";
import { Favorites } from "@/components/favorites";
import { Footer } from "@/components/footer";
import * as FadeIn from "@/components/motion/staggers/fade";
import { Posts } from "@/components/posts";
import { contentCatalog } from "@/lib/content";
import { getDeployUrl } from "@/lib/site/profile";

const Spacer = () => <div style={{ marginTop: "24px" }} />;

export default function Home() {
  const guides = contentCatalog.getCategory("guides");
  const examples = contentCatalog.getCategory("examples");
  return (
    <FadeIn.Container>
      <FadeIn.Item>
        <div className="flex justify-between">
          <div>
            <h1>Sylph</h1>
            <h2>Next.js Portfolio Starter</h2>
          </div>
        </div>
      </FadeIn.Item>
      <Spacer />
      <FadeIn.Item>
        <p>
          Sylph is a Next.js Portfolio Starter that you can use to create your
          own portfolio website. It is designed to be minimal, lightweight, and
          fast. It is also highly customizable, so you can easily make it your
          own. Sylph is perfect for developers, designers, and other creatives
          who want to showcase their work. To start using Sylph, you can follow
          the guides below.
        </p>
      </FadeIn.Item>
      {guides && (
        <FadeIn.Item>
          <Posts category={guides} />
        </FadeIn.Item>
      )}
      {examples && (
        <FadeIn.Item>
          <Posts category={examples} />
        </FadeIn.Item>
      )}
      <FadeIn.Item>
        <Favorites />
      </FadeIn.Item>
      <Spacer />
      <FadeIn.Item>
        <Footer />
      </FadeIn.Item>
      <DeployButton href={getDeployUrl().toString()} />
    </FadeIn.Container>
  );
}
