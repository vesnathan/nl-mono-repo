"use client";

import React from "react";
import Link from "next/link";
import { MainLayout } from "@/components/layout/MainLayout/MainLayout";
import { useRouter } from "next/navigation";
import DevEvents from "@cwl/dev-mocks/mockEvents.json";

type MockEvent = {
  id: string;
  title?: string;
  accessType?: string;
  shortDescription?: string;
};

const EVENTS: MockEvent[] = DevEvents as unknown as MockEvent[];

export default function Page(props: unknown) {
  const router = useRouter();
  const { params } = (props as Record<string, unknown>) || {};
  const { category, page: pageStr } =
    (params as { category?: string; page?: string }) || {};
  const categoryStr = String(category || "all");
  const page = parseInt(pageStr || "1", 10) || 1;
  const pageSize = 8;

  const filtered = EVENTS.filter((e) => {
    if (category === "live") return true;
    if (category === "free")
      return ["free", "free-register"].includes(e.accessType || "");
    if (category === "paid") return (e.accessType || "") === "paid";
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (page - 1) * pageSize;
  const pageEvents = filtered.slice(start, start + pageSize);

  // Build page list with ellipses for large totals; maxVisible controls max buttons shown
  // eslint-disable-next-line sonarjs/cognitive-complexity
  const buildPageList = (current: number, total: number, maxVisible = 7) => {
    if (total <= maxVisible)
      return Array.from({ length: total }, (_, i) => i + 1);
    const delta = Math.floor((maxVisible - 3) / 2) || 1;
    const range: Array<number | string> = [];
    let l: number | null = null;
    for (let i = 1; i <= total; i += 1) {
      if (
        i === 1 ||
        i === total ||
        (i >= current - delta && i <= current + delta)
      ) {
        if (l && i - (l as number) > 1) {
          if (i - (l as number) === 2) {
            range.push((l as number) + 1);
          } else {
            // emit a unique ellipses token so keys don't rely on array index
            range.push(`...${i}`);
          }
        }
        range.push(i);
        l = i;
      }
    }
    return range;
  };

  const pageList = buildPageList(page, totalPages, 7);

  const navigate = (p: number | string) => {
    // normalize and navigate using Next's router
    const url = `/discover/events/${encodeURIComponent(categoryStr)}/page/${String(p)}`;
    router.push(url);
    // router.push may not return a promise in this runtime; focus after a short delay
    setTimeout(() => {
      const h = document.getElementById("events-heading");
      if (h) h.focus();
    }, 250);
  };

  return (
    <MainLayout>
      <a
        href="#events-list"
        className="sr-only focus:not-sr-only focus:block px-4 py-2"
      >
        Skip to events
      </a>

      <div className="p-6">
        <div className="flex items-center gap-4">
          <h1
            id="events-heading"
            tabIndex={-1}
            className="text-2xl font-bold mb-4"
          >
            Events — {categoryStr}
          </h1>
          <Link href="/events" className="ml-2 text-sm underline">
            View all
          </Link>
        </div>
        <ul className="space-y-4">
          {pageEvents.map((e) => (
            <li key={e.id} className="p-3 border rounded">
              <Link href={`/event/${e.id}`} className="text-lg font-semibold">
                {e.title}
              </Link>
              <p className="text-sm text-gray-600">
                {String(e.shortDescription || "")}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex items-center gap-4">
          {page > 1 && (
            <button
              type="button"
              onClick={() => navigate(page - 1)}
              className="underline"
            >
              Prev
            </button>
          )}

          <nav aria-label="Pagination" className="flex gap-2 items-center">
            {pageList.map((p) => {
              if (typeof p === "string") {
                const label = String(p).startsWith("...") ? "..." : String(p);
                return (
                  <span key={p} className="px-2">
                    {label}
                  </span>
                );
              }
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => navigate(p)}
                  aria-current={p === page ? "page" : undefined}
                  className={`px-2 py-1 rounded ${p === page ? "bg-gray-200 font-semibold" : "hover:underline"}`}
                >
                  {p}
                </button>
              );
            })}
          </nav>

          {start + pageSize < filtered.length && (
            <button
              type="button"
              onClick={() => navigate(page + 1)}
              className="underline"
            >
              Next
            </button>
          )}

          <div className="ml-4 flex items-center gap-2">
            <div className="mr-2">Go to page</div>
            <select
              aria-label="Go to page"
              value={String(page)}
              onChange={(e) => navigate(Number(e.target.value))}
              className="border px-2 py-1 rounded"
            >
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                return (
                  <option key={p} value={p}>
                    {p}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
