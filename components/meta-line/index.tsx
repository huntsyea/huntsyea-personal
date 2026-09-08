import type { ContentPost } from "@/lib/content/types";

import { formatter } from "@/lib/formatter";

import { readingTime } from "reading-time-estimator";

interface MetaProps {
  post: ContentPost;
}

interface MetaItem {
  label: string;
  value: React.ReactNode;
}

/**
 * The Post metadata block (published, updated, read time) in the sm text role
 * and muted colour role. Each item stacks its label above its value; spacing
 * alone separates neighbouring items.
 */
export const Meta = ({ post }: MetaProps) => {
  const items: MetaItem[] = [];

  if (post.createdAt) {
    items.push({
      label: "Published",
      value: (
        <time dateTime={post.time?.created}>
          {formatter.date(post.createdAt)}
        </time>
      ),
    });
  }

  if (post.updatedAt) {
    items.push({
      label: "Updated",
      value: (
        <time dateTime={post.time?.updated}>
          {formatter.date(post.updatedAt)}
        </time>
      ),
    });
  }

  items.push({
    label: "Read time",
    value: `${readingTime(post.content).minutes} minutes`,
  });

  return (
    <div className="mt-1 flex flex-wrap gap-x-6 gap-y-2 text-fg-muted text-sm">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col">
          <span>{item.label}</span>
          <span className="text-fg">{item.value}</span>
        </div>
      ))}
    </div>
  );
};
