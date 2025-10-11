export type EventMode = "free" | "register" | "paid" | "stream";

export type TicketInfo = {
  currency?: string;
  price?: number; // in minor units or decimal depending on integration
  capacity?: number | null;
  sold?: number;
  buyUrl?: string;
};

export type Speaker = {
  id: string;
  name: string;
  bio?: string;
  avatarUrl?: string;
};

export type Session = {
  id: string;
  title: string;
  description?: string;
  start?: string; // ISO datetime
  end?: string; // ISO datetime
  track?: string;
  type?: "keynote" | "session" | "panel" | "workshop" | "stream";
  speakers?: Speaker[];
  streamUrl?: string | null;
  registrationRequired?: boolean;
};

export type EventBase = {
  id: string;
  title: string;
  description?: string;
  shortDescription?: string;
  start?: string;
  end?: string;
  mode: EventMode;
  venue?: string;
  organizerId?: string;
  coverImageUrl?: string;
  registrationUrl?: string;
  ticketInfo?: TicketInfo;
  // If an event has an agenda, sessions contains the agenda items
  sessions?: Session[];
  // Optional stream URL for single-stream events
  streamUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export const createEmptyEvent = (id = ""): EventBase => ({
  id,
  title: "",
  description: "",
  mode: "free",
  sessions: [],
});

export default EventBase;
