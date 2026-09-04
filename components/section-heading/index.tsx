import Link from "@/components/link";

interface SectionHeadingProps {
  title: string;
  /** When set, the heading becomes a quiet link to this path. */
  href?: string;
  /** When true, renders a page-level h1 instead of a section h2. */
  asPage?: boolean;
}

/**
 * List heading names without counts. Used by every list on the Site so the
 * heading is simply the name of the collection.
 */
export const SectionHeading = ({
  title,
  href,
  asPage = false,
}: SectionHeadingProps) => {
  if (asPage) {
    return <h1 className="py-2">{title}</h1>;
  }

  const heading = <h2 className="py-2 text-fg-muted">{title}</h2>;

  if (href) {
    return (
      <Link href={href} variant="quiet" className="flex justify-between">
        {heading}
      </Link>
    );
  }

  return heading;
};
