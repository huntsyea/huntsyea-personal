import type { AnchorHTMLAttributes } from "react";

import clsx from "clsx";
import { Link as ViewTransitionLink } from "next-view-transitions";

type LinkVariant = "inline" | "nav" | "quiet";

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: LinkVariant;
  newTab?: boolean;
  className?: string;
}

const variantClasses: Record<LinkVariant, string> = {
  inline:
    "underline underline-offset-2 decoration-1 decoration-fg-subtle transition-colors hover:decoration-accent hover:text-accent-fg",
  nav: "text-fg-muted transition-colors hover:text-fg",
  quiet: "",
};

function isExternalUrl(href: string) {
  try {
    const url = new URL(href);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const Link = ({
  variant = "quiet",
  href,
  newTab = false,
  className,
  children,
  target,
  rel,
  ...props
}: LinkProps) => {
  const linkClassName = clsx(variantClasses[variant], className);

  if (
    !href ||
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  ) {
    return (
      <a
        className={linkClassName}
        href={href}
        target={target}
        rel={rel}
        {...props}
      >
        {children}
      </a>
    );
  }

  if (!isExternalUrl(href)) {
    return (
      <ViewTransitionLink className={linkClassName} href={href} {...props}>
        {children}
      </ViewTransitionLink>
    );
  }

  return (
    <a
      target={newTab ? "_blank" : target}
      rel={newTab || target === "_blank" ? (rel ?? "noopener noreferrer") : rel}
      className={linkClassName}
      href={href}
      {...props}
    >
      {children}
    </a>
  );
};

export default Link;
