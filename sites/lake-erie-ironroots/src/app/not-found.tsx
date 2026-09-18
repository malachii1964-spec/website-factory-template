import Link from "next/link";

export default function NotFound() {
  return (
    <section className="sheet band-record">
      <p className="fig text-ink-2">Not found</p>
      <h1 className="display mt-4 max-w-[20ch] text-4xl text-ink md:text-6xl">
        That page is not in the book.
      </h1>
      <p className="prose-farm mt-5 text-lg">
        Two pages matter here: the register of what is growing, and how to find
        us.
      </p>
      <ul className="mt-9 flex list-none flex-col gap-3 p-0">
        <li>
          <Link href="/" className="link text-lg">
            The register
          </Link>
        </li>
        <li>
          <Link href="/visit" className="link text-lg">
            Hours and directions
          </Link>
        </li>
      </ul>
    </section>
  );
}
