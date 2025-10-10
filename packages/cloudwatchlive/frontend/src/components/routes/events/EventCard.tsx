"use client";

import React from "react";
// Using a plain <img> gives a simple onError fallback for missing local files.
import Link from "next/link";
import { Button, Card, CardBody } from "@nextui-org/react";
import {
  MockEvent,
  imageSrc,
  SessionStub,
  FALLBACK_REMOTE_IMAGES,
  isRemoteSrc,
  PLACEHOLDER_IMAGE,
} from "./eventsUtils";

function RemoteImg({ initialSrc, alt }: { initialSrc: string; alt: string }) {
  const [src, setSrc] = React.useState<string>(initialSrc);
  const tried = React.useRef(new Set<string>());
  const onError = () => {
    tried.current.add(src);
    const next = FALLBACK_REMOTE_IMAGES.find((f) => !tried.current.has(f));
    if (next) setSrc(next);
    else setSrc(PLACEHOLDER_IMAGE);
  };
  // eslint-disable-next-line @next/next/no-img-element
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={onError}
      className="object-cover rounded-t-lg w-full h-full absolute inset-0"
    />
  );
}

function LocalImg({ initialSrc, alt }: { initialSrc: string; alt: string }) {
  const [src, setSrc] = React.useState<string>(initialSrc || PLACEHOLDER_IMAGE);
  const onError = () => {
    setSrc(PLACEHOLDER_IMAGE);
  };
  // eslint-disable-next-line @next/next/no-img-element
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={onError}
      className="object-cover rounded-t-lg w-full h-full absolute inset-0"
    />
  );
}

type Props = {
  event: MockEvent;
  variant?: "live" | "paid" | "free";
};

// eslint-disable-next-line sonarjs/cognitive-complexity
export default function EventCard({ event, variant = "free" }: Props) {
  const isSessionLive = React.useMemo(() => {
    try {
      if (!event.sessions || event.sessions.length === 0) return false;
      return (event.sessions as SessionStub[]).some((s) => {
        const now = Date.now();
        const start = s.start ? Date.parse(String(s.start)) : 0;
        const end = s.end ? Date.parse(String(s.end)) : 0;
        return start <= now && now <= end;
      });
    } catch {
      return false;
    }
  }, [event.sessions]);

  return (
    <Card
      key={event.id}
      className={`bg-white ${
        variant === "live"
          ? "border-2 border-red-500"
          : variant === "paid"
            ? "border-2 border-yellow-500"
            : ""
      }`}
    >
      <CardBody className="p-0 flex flex-col h-full">
        <div className="relative w-full h-48">
          {(() => {
            const initial = imageSrc(event.image);
            const remote = isRemoteSrc(initial);

            if (remote) {
              return (
                <RemoteImg
                  initialSrc={initial}
                  alt={String(event.title || "")}
                />
              );
            }

            // local path — render a local <img> with onError fallback to the placeholder
            return (
              <LocalImg initialSrc={initial} alt={String(event.title || "")} />
            );
          })()}

          <div className="absolute top-2 left-2 flex gap-2">
            {isSessionLive && (
              <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                LIVE
              </div>
            )}

            {event.requiresRegistration && (
              <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                REGISTER
              </div>
            )}

            {/* Show FREE pill for free access types or when the card variant is explicitly free */}
            {(variant === "free" ||
              String(event.accessType || "").startsWith("free")) && (
              <div className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                FREE
              </div>
            )}
          </div>

          {/* Price / Paid pill on the top-right */}
          <div className="absolute top-2 right-2">
            {variant === "paid" ||
            String(event.accessType || "").includes("paid")
              ? (() => {
                  const p =
                    (event.price as number | string | undefined) ??
                    event.ticketInfo?.price ??
                    "";
                  const priceStr =
                    typeof p === "number" ? `$${p}` : String(p || "PAID");
                  return (
                    <div className="bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold">
                      {priceStr}
                    </div>
                  );
                })()
              : null}
          </div>
        </div>

        <div className="p-4 flex flex-col flex-grow">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">
            {event.title}
          </h3>
          <p className="text-sm text-gray-700 mb-2 line-clamp-2">
            {String(event.shortDescription || event.description || "")}
          </p>
          <p className="text-sm text-gray-600 mb-1">{event.location}</p>
          <div className="mt-auto">
            <Button
              as={Link}
              href={`/event/${event.id}`}
              size="sm"
              className="font-semibold w-full"
            >
              {event.requiresRegistration
                ? "Register & Watch"
                : variant === "live"
                  ? "Watch Live"
                  : variant === "paid"
                    ? "Purchase Ticket"
                    : "Remind Me"}
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
