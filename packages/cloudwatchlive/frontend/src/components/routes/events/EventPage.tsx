"use client";

import React, { useEffect, useState } from "react";
import { EventBase, Session, Speaker } from "@/types/EventTypes";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@nextui-org/react";
import type { CWLUser } from "@/types/gqlTypes";

// Use canonical dev-mocks JSON directly for frontend testing
// eslint-disable-next-line import/no-extraneous-dependencies
import DevEvents from "@cwl/dev-mocks/mockEvents.json";
// eslint-disable-next-line import/no-extraneous-dependencies
import DevUsers from "@cwl/dev-mocks/mockUsers.json";

/*
  The dev-mocks are static JSON fixtures used only in local/dev mode.
  They carry untyped shapes; cast to unknown and to the expected shapes
  here. We intentionally allow some any usage for mapping convenience.
*/
/**
 * Types for the dev-mocks JSON blobs. These mirror the fields consumed
 * by the frontend mapping code below; they're intentionally permissive
 * (optional fields) so the fixtures can be edited without strict schema
 * churn while still avoiding `any`.
 */
type MockEventOwner = {
  ownerUserId?: string;
  ownerEmail?: string;
  ownerCompany?: string;
  ownerName?: string;
};

export type MockEvent = {
  id: string;
  title?: string;
  shortDescription?: string;
  description?: string;
  accessType?: "free" | "free-register" | "paid" | "invite-paid" | string;
  registrationUrl?: string | null;
  ticketInfo?: {
    currency?: string;
    price?: number | string;
    buyUrl?: string;
  } | null;
  streamUrl?: string | null;
  sessions?: unknown; // normalized into Session[] later
  image?: string | null;
  eventOwner?: MockEventOwner | null;
  eventOwnerEmail?: string | null; // legacy field
  template?: { accentColor?: string; logo?: string } | null;
  requiresRegistration?: boolean;
};

const MOCK_USERS = DevUsers as unknown as CWLUser[];
const MOCK_EVENTS = DevEvents as unknown as MockEvent[];

type Props = {
  eventId: string;
};

type LocalEvent = EventBase & {
  image?: string | null;
  owner?: { name?: string; company?: string } | null;
  templateId?: number;
  template?: { accentColor?: string; logo?: string } | null;
};

// Temporary mock fetch - replace with real GraphQL/AJAX call
// eslint-disable-next-line complexity
const fetchEvent = async (eventId: string): Promise<LocalEvent | null> => {
  const found = MOCK_EVENTS.find((e) => e.id === String(eventId)) as
    | MockEvent
    | undefined;
  if (!found) return null;

  const owner = resolveOwner(found);
  const templateId = calculateTemplateId(found.id);
  const sessions = normalizeSessions(found.sessions);

  return mapEvent(found, owner, templateId, sessions);
};

const resolveOwner = (found: MockEvent): CWLUser | null => {
  const ownerUserId = found.eventOwner?.ownerUserId;
  const fallbackOwnerEmail =
    found.eventOwner?.ownerEmail || found.eventOwnerEmail;

  if (ownerUserId) {
    return MOCK_USERS.find((u) => u.userId === ownerUserId) || null;
  }

  if (fallbackOwnerEmail) {
    return MOCK_USERS.find((u) => u.userEmail === fallbackOwnerEmail) || null;
  }

  if (found.eventOwner) {
    return {
      __typename: "CWLUser",
      userId: "00000000-0000-0000-0000-000000000000",
      organizationId: found.eventOwner.ownerCompany || "",
      privacyPolicy: true,
      termsAndConditions: true,
      userAddedById: "00000000-0000-0000-0000-000000000000",
      userCreated: new Date().toISOString(),
      userEmail: "",
      userTitle: "",
      userFirstName: found.eventOwner.ownerName || "",
      userLastName: "",
      userPhone: "",
      userRole: "User",
      clientType: [],
      userProfilePicture: null,
    };
  }

  return null;
};

const calculateTemplateId = (id: string | number): number => {
  const numeric = parseInt(String(id).replace(/\D/g, ""), 10) || 0;
  return numeric % 3;
};

const normalizeSessions = (s: unknown): Session[] => {
  if (!Array.isArray(s)) return [];
  return s.map((ss) => normalizeSession(ss));
};

const normalizeSession = (ss: unknown): Session => {
  const obj = (ss as Record<string, unknown>) || {};
  const speakers = normalizeSpeakers(obj.speakers);
  const type = isSessionType(obj.type)
    ? obj.type
    : ("session" as Session["type"]);

  return {
    id: String(obj.id ?? ""),
    title: String(obj.title ?? ""),
    description:
      typeof obj.description === "string" ? obj.description : undefined,
    start: typeof obj.start === "string" ? obj.start : undefined,
    end: typeof obj.end === "string" ? obj.end : undefined,
    track: typeof obj.track === "string" ? obj.track : undefined,
    type,
    speakers,
    streamUrl: typeof obj.streamUrl === "string" ? obj.streamUrl : null,
    registrationRequired: Boolean(obj.registrationRequired),
  };
};

const normalizeSpeakers = (speakersRaw: unknown): Speaker[] => {
  if (!Array.isArray(speakersRaw)) return [];
  return speakersRaw.map((sp) => {
    const spObj = sp as Record<string, unknown>;
    return {
      id: String(spObj.id ?? ""),
      name: String(spObj.name ?? ""),
      bio: typeof spObj.bio === "string" ? spObj.bio : undefined,
      avatarUrl:
        typeof spObj.avatarUrl === "string" ? spObj.avatarUrl : undefined,
    };
  });
};

const isSessionType = (v: unknown): v is Session["type"] =>
  v === "stream" ||
  v === "keynote" ||
  v === "session" ||
  v === "panel" ||
  v === "workshop";

const normalizeTicketInfo = (
  ti: MockEvent["ticketInfo"],
): { currency?: string; price?: number; buyUrl?: string } | undefined => {
  if (!ti) return undefined;
  const priceRaw = ti.price as unknown;
  let priceNum: number | undefined;
  if (typeof priceRaw === "number") priceNum = priceRaw;
  else if (typeof priceRaw === "string") {
    const p = parseFloat(priceRaw);
    if (!Number.isNaN(p)) priceNum = p;
  }
  return { currency: ti.currency, price: priceNum, buyUrl: ti.buyUrl };
};

const mapOwnerForUi = (
  owner: CWLUser | null,
  rawOwner: MockEvent["eventOwner"] | undefined | null,
): { name?: string | undefined; company?: string } => {
  if (owner) {
    return {
      name: owner.userFirstName
        ? `${owner.userFirstName} ${owner.userLastName || ""}`.trim()
        : undefined,
      company: owner.organizationId,
    };
  }
  return { company: rawOwner?.ownerCompany || "" };
};

const mapEvent = (
  found: MockEvent,
  owner: CWLUser | null,
  templateId: number,
  sessions: Session[],
): LocalEvent => ({
  id: found.id,
  title: found.title ?? "",
  shortDescription: found.shortDescription,
  description: found.description,
  mode:
    found.accessType === "paid"
      ? "paid"
      : found.accessType === "free-register" ||
          found.accessType === "invite-free"
        ? "register"
        : "free",
  registrationUrl: found.registrationUrl ?? undefined,
  ticketInfo: normalizeTicketInfo(found.ticketInfo),
  streamUrl: found.streamUrl ?? undefined,
  sessions,
  image: found.image ?? null,
  owner: mapOwnerForUi(owner, found.eventOwner),
  template: found.template
    ? {
        accentColor: found.template.accentColor,
        logo: found.template.logo ?? undefined,
      }
    : undefined,
  templateId,
});

const EventPage: React.FC<Props> = ({ eventId }) => {
  const [event, setEvent] = useState<LocalEvent | null | undefined>(undefined);

  useEffect(() => {
    setEvent(undefined);
    fetchEvent(eventId).then((e) => setEvent(e));
  }, [eventId]);

  if (event === undefined) return <div>Loading event...</div>;
  if (event === null)
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">Event not found</h1>
        <p className="mb-4">
          We couldn&apos;t find the event you&apos;re looking for.
        </p>
        <Link href="/" className="text-blue-600 underline">
          Back to home
        </Link>
      </div>
    );

  const renderHeader = () => {
    const accentColor = event.template?.accentColor ?? undefined;
    const logoUrl = event.template?.logo ?? undefined;

    // Minimal header variations by templateId. We intentionally keep the
    // header simple (title + optional image/logo) and avoid showing owner
    // information on the public event page for privacy.
    if (event.templateId === 2) {
      return (
        <header
          className="p-6 text-white rounded mb-4"
          style={{
            background: accentColor ?? "linear-gradient(90deg,#7c3aed,#ec4899)",
          }}
        >
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <Image
                src={logoUrl || ""}
                alt="logo"
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
              />
            ) : (
              <div className="h-10 w-10 rounded bg-white/20 flex items-center justify-center font-bold">
                EV
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold">{event.title}</h1>
            </div>
          </div>
        </header>
      );
    }

    if (event.templateId === 1) {
      return (
        <header className="p-6 bg-gray-100 rounded mb-4">
          <div className="flex items-center gap-4 mb-3">
            {logoUrl ? (
              <Image
                src={logoUrl || ""}
                alt="logo"
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
              />
            ) : (
              <div className="h-10 w-10 rounded bg-gray-300 flex items-center justify-center font-bold">
                EV
              </div>
            )}
            <div>
              <h1 className="text-3xl font-extrabold">{event.title}</h1>
            </div>
          </div>
        </header>
      );
    }

    return (
      <header className="p-0 mb-4">
        <div className="relative">
          {event.image ? (
            <Image
              src={event.image}
              alt={event.title}
              width={800}
              height={256}
              className="w-full h-64 object-cover rounded"
            />
          ) : (
            <div className="w-full h-64 bg-gray-200 rounded" />
          )}
          <div className="absolute left-6 bottom-6 bg-white/70 py-2 px-3 rounded">
            <div className="text-lg font-semibold">{event.title}</div>
          </div>
        </div>
      </header>
    );
  };

  return (
    <div className="p-6">
      {renderHeader()}

      <p className="mb-4">
        {event.shortDescription ?? event.description ?? ""}
      </p>

      {event.mode === "free" && (
        <div className="mb-4">
          <strong>Free event</strong>
          <p>Join for free — no registration required.</p>
        </div>
      )}

      {event.mode === "register" && (
        <div className="mb-4">
          <strong>Registration required</strong>
          <p>
            Please register to attend.{" "}
            <a href={event.registrationUrl}>Register</a>
          </p>
        </div>
      )}

      {event.mode === "paid" && (
        <div className="mb-4">
          <strong>Paid event</strong>
          <p>
            Tickets available — price: {event.ticketInfo?.currency}{" "}
            {event.ticketInfo?.price}
          </p>
          {event.ticketInfo?.buyUrl && (
            <div className="mt-2">
              <Button
                as={Link}
                href={event.ticketInfo.buyUrl}
                size="md"
                color="warning"
                className="font-semibold"
              >
                Buy ticket
              </Button>
            </div>
          )}
        </div>
      )}

      {event.streamUrl && (
        <div className="mb-4">
          <strong>Live Stream</strong>
          <div>
            <a href={event.streamUrl} className="text-blue-600 underline">
              Watch stream
            </a>
          </div>
        </div>
      )}

      <div className="mt-6">
        <Link href="/" className="text-blue-600 underline">
          &larr; Back to home
        </Link>
      </div>

      {/* Agenda */}
      {event.sessions && event.sessions.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-2">Agenda</h2>
          <ul className="space-y-3">
            {event.sessions.map((s) => {
              const isLive = (() => {
                try {
                  if (!s.start || !s.end) return false;
                  const startMs = Date.parse(String(s.start));
                  const endMs = Date.parse(String(s.end));
                  const now = Date.now();
                  return startMs <= now && now <= endMs;
                } catch {
                  return false;
                }
              })();

              return (
                <li key={s.id} className="p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <div className="font-semibold">{s.title}</div>
                    {isLive && (
                      <div className="text-xs bg-red-500 text-white px-2 py-0.5 rounded font-bold">
                        LIVE
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">{s.type}</div>
                  <div>{s.description}</div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
};

export default EventPage;
