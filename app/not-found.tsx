import Link from "@/components/link";

export default function NotFound() {
  return (
    <section className="flex min-h-64 flex-col justify-center gap-4">
      <p className="text-fg-muted text-sm">404</p>
      <h1>Page not found</h1>
      <p className="max-w-md text-fg-muted">
        This category, post, or page does not exist in the published content
        catalog.
      </p>
      <Link className="w-fit" href="/" variant="inline">
        Return home
      </Link>
    </section>
  );
}
