import Link from "next/link";
import { segmentBody } from "@/lib/format";

/** Post text with links and @mentions — rendered as React nodes, never raw HTML. */
export function PostBody({ body }: { body: string }) {
  if (!body) return null;
  return (
    <p className="mt-1 whitespace-pre-wrap break-words text-[0.98rem] leading-relaxed">
      {segmentBody(body).map((segment, i) => {
        if (segment.type === "link") {
          return (
            <a
              key={i}
              href={segment.href}
              target="_blank"
              rel="nofollow ugc noopener noreferrer"
              className="text-accent underline-offset-2 hover:underline"
            >
              {segment.value.replace(/^https?:\/\//, "")}
            </a>
          );
        }
        if (segment.type === "mention") {
          return (
            <Link key={i} href={`/u/${segment.username}`} className="text-accent hover:underline">
              {segment.value}
            </Link>
          );
        }
        return <span key={i}>{segment.value}</span>;
      })}
    </p>
  );
}
