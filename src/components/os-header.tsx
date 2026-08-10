"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

// Full menu — shown in the mobile drawer, grouped by function.
type NavGroup = { heading: string; links: { label: string; href: string }[] };
const NAV_GROUPS: NavGroup[] = [
  {
    heading: "Get Growing",
    links: [
      { label: "Start Here", href: "/start" },
      { label: "Knowledge OS", href: "/guides" },
      { label: "Grow Like the Greats", href: "/grow-like-the-greats" },
      { label: "Build My Grow", href: "/build-my-grow" },
      { label: "My Grows", href: "/grows" },
    ],
  },
  {
    heading: "Explore Genetics",
    links: [
      { label: "Strains", href: "/strains" },
      { label: "Strain Finder Quiz", href: "/strain-finder" },
      { label: "Strain Directory", href: "/strain-directory" },
      { label: "Terpenes", href: "/terpenes" },
      { label: "Seeds & Breeders", href: "/seeds" },
    ],
  },
  {
    heading: "Tools & Help",
    links: [
      { label: "Grow Tools", href: "/tools" },
      { label: "Visual Diagnose", href: "/diagnose" },
      { label: "AI Plant Doctor", href: "/plant-doctor" },
      { label: "Soil Lab", href: "/frostybuds-soil" },
    ],
  },
  {
    heading: "More",
    links: [
      { label: "Recipes & Preparations", href: "/recipes" },
      { label: "Gear Index", href: "/gear" },
      { label: "Local NY Hub", href: "/local-ny" },
      { label: "Medical Card", href: "/medical-card" },
    ],
  },
];
const NAV = NAV_GROUPS.flatMap((g) => g.links);

// Curated primary set — shown in the desktop bar (the rest live in the drawer,
// the homepage modules, and the footer).
const PRIMARY_HREFS = [
  "/start",
  "/guides",
  "/grow-like-the-greats",
  "/build-my-grow",
  "/tools",
  "/strains",
  "/diagnose",
  "/plant-doctor",
];
const PRIMARY_NAV = NAV.filter((n) => PRIMARY_HREFS.includes(n.href));

function Emblem() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <Image
        src="/icon-180.png"
        alt="Lake Erie Cannabis"
        width={38}
        height={38}
        priority
        className="rounded-lg ring-1 ring-white/10"
      />
      <span className="leading-tight">
        <span className="block font-display text-lg font-semibold tracking-tight text-frost">
          Lake Erie <span className="iris-text">Cannabis</span>
        </span>
        <span className="block font-mono text-[8px] uppercase tracking-[0.22em] text-frost-dim">
          Premium quality · Rooted in excellence
        </span>
      </span>
    </Link>
  );
}

export function OsHeader() {
  const [isMember, setIsMember] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/auth/get-session", { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => {
        if (s?.user) setIsMember(true);
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-4">
      <div className="glass mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-full px-4 py-2 sm:px-6">
        <Emblem />

        {/* desktop nav — curated primary set */}
        <nav className="hidden items-center gap-5 xl:flex">
          {PRIMARY_NAV.map((n) => (
            <Link
              key={n.label}
              href={n.href}
              className="whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.1em] text-frost-dim transition hover:text-frost"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 xl:flex">
          {isMember ? (
            <Link
              href="/account"
              className="iris-border rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-frost transition hover:brightness-110"
            >
              My Sanctuary
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="font-mono text-[11px] uppercase tracking-[0.12em] text-frost-dim transition hover:text-frost"
              >
                Sign in
              </Link>
              <Link
                href="/join"
                className="btn-iris rounded-full px-5 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] transition hover:brightness-110"
              >
                Join now
              </Link>
            </>
          )}
        </div>

        {/* mobile toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-frost xl:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          <div className="space-y-1.5">
            <span
              className={`block h-0.5 w-5 bg-current transition ${open ? "translate-y-2 rotate-45" : ""}`}
            />
            <span
              className={`block h-0.5 w-5 bg-current transition ${open ? "opacity-0" : ""}`}
            />
            <span
              className={`block h-0.5 w-5 bg-current transition ${open ? "-translate-y-2 -rotate-45" : ""}`}
            />
          </div>
        </button>
      </div>

      {/* mobile drawer */}
      {open ? (
        <div className="glass mx-auto mt-2 max-w-7xl rounded-2xl p-4 xl:hidden">
          <nav className="flex flex-col gap-5">
            {NAV_GROUPS.map((group) => (
              <div key={group.heading}>
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-cyan">
                  {group.heading}
                </p>
                <div className="mt-2 flex flex-col">
                  {group.links.map((n) => (
                    <Link
                      key={n.label}
                      href={n.href}
                      onClick={() => setOpen(false)}
                      className="border-b border-white/5 py-2.5 font-mono text-[12px] uppercase tracking-[0.12em] text-frost-dim transition hover:text-frost"
                    >
                      {n.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-3">
            {isMember ? (
              <Link
                href="/account"
                onClick={() => setOpen(false)}
                className="iris-border rounded-full px-4 py-3 text-center font-mono text-[11px] uppercase tracking-[0.12em] text-frost"
              >
                My Sanctuary
              </Link>
            ) : (
              <>
                <Link
                  href="/join"
                  onClick={() => setOpen(false)}
                  className="btn-iris rounded-full px-5 py-3 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.12em]"
                >
                  Join now
                </Link>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-white/15 px-5 py-3 text-center font-mono text-[11px] uppercase tracking-[0.12em] text-frost"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
