import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <p className="marker-tag text-2xl text-barn">nothing here</p>
      <h1 className="mt-2 font-display text-4xl font-semibold italic text-espresso sm:text-5xl">
        Looks like this row&rsquo;s empty
      </h1>
      <p className="mt-4 text-lg text-espresso-soft">
        The page you&rsquo;re looking for isn&rsquo;t here. Head back and
        we&rsquo;ll point you toward the good stuff.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-md bg-barn px-5 py-3 text-sm font-semibold text-paper transition-colors hover:bg-barn-deep"
      >
        Back to the stand <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
