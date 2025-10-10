import React from "react";
import Link from "next/link";
import DevEvents from "@cwl/dev-mocks/mockEvents.json";
import { MainLayout } from "@/components/layout/MainLayout/MainLayout";

type MockEvent = {
  id: string;
  title?: string;
  accessType?: string;
  shortDescription?: string;
};

const EVENTS: MockEvent[] = DevEvents as unknown as MockEvent[];

// Helper to safely extract Next page props without widespread `any`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractProps(p: unknown): {
  params?: Record<string, unknown> | undefined;
  searchParams?: Record<string, unknown> | undefined;
} {
  return (p as Record<string, unknown>) || {};
}

export default function Page(props: unknown) {
  const { params, searchParams } = extractProps(props);
  const { category } = params || {};
  const page = parseInt((searchParams?.page as string) || "1", 10) || 1;
  const pageSize = 8;

  const filtered = EVENTS.filter((e) => {
    if (category === "live") return true; // simple for now
    if (category === "free")
      return ["free", "free-register"].includes(e.accessType || "");
    if (category === "paid") return (e.accessType || "") === "paid";
    return true;
  });

  const start = (page - 1) * pageSize;
  const pageEvents = filtered.slice(start, start + pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  return (
    <MainLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">
          Events — {`${category || "all"}`}
        </h1>
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
          <div className="flex gap-2 items-center">
            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1;
              return (
                <Link
                  key={p}
                  href={`/discover/events/${encodeURIComponent(String(category || "all"))}/page/${p}`}
                  className={`px-2 py-1 rounded ${p === page ? "bg-gray-200 font-semibold" : "hover:underline"}`}
                >
                  {p}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="mr-2">Go to page</div>
            <select
              aria-label="Go to page"
              value={String(page)}
              onChange={(e) => {
                const p = e.target.value;
                window.location.href = `/discover/events/${encodeURIComponent(String(category || "all"))}/page/${p}`;
              }}
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
