import { expect, test } from "@playwright/test";

test("MDX links preserve internal, fragment, and external intent", async ({
  page,
}) => {
  await page.goto("/posts/project-structure");

  const internal = page.getByRole("link", {
    name: "Getting Started",
    exact: true,
  });
  await expect(internal).toHaveAttribute("href", "/posts/getting-started");
  await expect(internal).not.toHaveAttribute("target", "_blank");

  const external = page.getByRole("link", { name: "Next.js documentation" });
  await expect(external).not.toHaveAttribute("target", "_blank");
  await expect(external).not.toHaveAttribute("rel", /nofollow/);
});

test("content images use the optimizer and reject unconfigured origins", async ({
  page,
  request,
}) => {
  await page.goto("/posts/basic-writing-and-formatting-syntax");

  const image = page.getByRole("img", { name: "Placeholder" });
  await expect(image).toHaveAttribute("src", /\/_next\/image\?url=/);
  await expect(image).toHaveAttribute("width", "600");
  await expect(image).toHaveAttribute("height", "600");
  await expect(image).toHaveAttribute(
    "sizes",
    "(min-width: 768px) 640px, calc(100vw - 3rem)",
  );

  const rejected = await request.get(
    "/_next/image?url=https%3A%2F%2Fexample.org%2Fimage.png&w=640&q=75",
  );
  expect(rejected.status()).toBe(400);
});
