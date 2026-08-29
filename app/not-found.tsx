import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex min-h-64 flex-col justify-center gap-4">
      <p className="text-muted text-small">404</p>
      <h1>Page not found</h1>
      <p className="max-w-md text-muted">
        This category, post, or page does not exist in the published content
        catalog.
      </p>
      <Link className="w-fit underline underline-offset-4" href="/">
        Return home
      </Link>
    </section>
  );
}
