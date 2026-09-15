import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <section className="mx-auto w-full max-w-6xl pr-5 pl-9 py-24 md:pr-8 md:pl-28 md:py-32">
        <p className="label">Nothing here</p>
        <h1 className="display mt-5 text-4xl md:text-6xl">
          That row was never planted
        </h1>
        <p className="prose-farm mt-6">
          The page you asked for does not exist. The two that matter are what is
          ready this week and how to find the stand.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/#ready"
            className="bg-ember px-6 py-4 text-sm font-medium tracking-wide text-pier uppercase transition-opacity hover:opacity-90"
          >
            What&rsquo;s ready
          </Link>
          <Link
            href="/visit"
            className="edge-lit px-6 py-4 text-sm font-medium tracking-wide text-parchment uppercase transition-colors hover:text-gold-lit"
          >
            Visit the stand
          </Link>
        </div>
      </section>
    </>
  );
}
