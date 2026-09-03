import type { AnchorHTMLAttributes } from "react";

import clsx from "clsx";
import NextLink from "next/link";

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  text?: string;
  underline?: boolean;
  newTab?: boolean;
  className?: string;
}

function isExternalUrl(href: string) {
  try {
    const url = new URL(href);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const Link = ({
  text,
  href,
  underline,
  newTab = false,
  className,
  children,
  target,
  rel,
  ...props
}: LinkProps) => {
  const linkClassName = clsx(className, {
    "underline decoration-1 decoration-fg-subtle underline-offset-2": underline,
  });
  const content = text || children;

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
        {content}
      </a>
    );
  }

  if (!isExternalUrl(href)) {
    return (
      <NextLink className={linkClassName} href={href} {...props}>
        {content}
      </NextLink>
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
      {content}
    </a>
  );
};

export default Link;
