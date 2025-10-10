const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function uuidToBytes(uuid) {
  return Buffer.from(uuid.replace(/-/g, ""), "hex");
}

function bytesToUuid(buf) {
  const hex = buf.toString("hex");
  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    hex.substring(12, 16),
    hex.substring(16, 20),
    hex.substring(20, 32),
  ].join("-");
}

function uuidv5(name, namespace) {
  const nsbuf = uuidToBytes(namespace);
  const namebuf = Buffer.from(name, "utf8");
  const hash = crypto
    .createHash("sha1")
    .update(Buffer.concat([nsbuf, namebuf]))
    .digest();
  const bytes = Buffer.from(hash.slice(0, 16));
  // set version to 5
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  // set variant to RFC4122
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return bytesToUuid(bytes);
}

const NS = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

const first = [
  "Ava",
  "Liam",
  "Olivia",
  "Noah",
  "Emma",
  "Oliver",
  "Charlotte",
  "Elijah",
  "Amelia",
  "William",
  "Sophia",
  "James",
  "Isabella",
  "Benjamin",
  "Mia",
  "Lucas",
  "Harper",
  "Henry",
  "Evelyn",
  "Alexander",
  "Grace",
  "Daniel",
  "Abigail",
  "Matthew",
  "Emily",
];
const last = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin",
  "Clark",
  "Lee",
  "Walker",
  "Hall",
  "Allen",
];
const companies = [
  "Elite Events Co.",
  "Premier Productions",
  "Creative Spaces Events",
  "Global Tech Ltd.",
  "Startup Hub Pty",
  "Dev Agency",
  "Conference Corp",
  "Summit Organisers",
  "Event Innovators",
  "StreamWorks Pty",
];

const clientTypes = [
  "EventCompanyMainAdmin",
  "EventCompanyAdmin",
  "EventCompanyStaff",
  "TechCompanyAdmin",
  "TechCompanyStaff",
  "RegisteredAttendee",
  "UnregisteredAttendee",
];

// Generate 100 users
const users = [];
const adminId = uuidv5("seed-admin@system", NS);
for (let i = 1; i <= 100; i++) {
  const fn = first[(i - 1) % first.length];
  const ln = last[(i - 1) % last.length];
  const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@example.com`;
  const comp = companies[(i - 1) % companies.length];
  const userId = uuidv5(email, NS);
  const orgId = uuidv5(comp, NS);
  const clientType = [clientTypes[(i - 1) % clientTypes.length]];
  users.push({
    __typename: "CWLUser",
    userId,
    organizationId: orgId,
    privacyPolicy: true,
    termsAndConditions: true,
    userAddedById: adminId,
    userCreated: "2025-10-09T00:00:00.000Z",
    userEmail: email,
    userTitle: i % 2 ? "Mr" : "Ms",
    userFirstName: fn,
    userLastName: ln,
    userPhone: `+614${String(100000 + i).slice(-6)}`,
    userRole: "User",
    clientType,
    userProfilePicture: null,
  });
}

// Generate 500 events distributed among the 100 users
const events = [];
const base = new Date("2025-10-01T08:00:00Z").getTime();
// try to read available local images so generated mocks use local files when possible
const imagesDir = path.join(__dirname, "..", "frontend", "public", "images");
let imageFiles = [];
try {
  imageFiles = fs.readdirSync(imagesDir).filter((f) => !f.startsWith('.'));
} catch (err) {
  // ignore - generator can still run and fall back to placeholder
  imageFiles = [];
}
for (let j = 0; j < 500; j++) {
  const owner = users[j % users.length];
  const start = new Date(base + j * 1000 * 60 * 60 * 6); // every 6 hours
  const end = new Date(start.getTime() + 1000 * 60 * 60 * 2); // 2 hours long
  const id = uuidv5(`event-${j + 1}`, NS);
  const access = j % 3 === 0 ? "free" : j % 3 === 1 ? "free-register" : "paid";
  const price = access === "paid" ? "$" + (25 + (j % 5) * 10) : "";
  const ev = {
    id,
    title: `Mock Event ${j + 1}`,
    shortDescription: `Short desc for ${j + 1}`,
    description: `Full description for event ${j + 1}`,
    location: "Melbourne, Australia",
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    accessType: access,
    requiresRegistration: access !== "free",
    price: price,
    // prefer a local image from the frontend public images dir; fall back to the placeholder
    image: imageFiles.length
      ? `/images/${imageFiles[j % imageFiles.length]}`
      : "/images/event-placeholder.svg",
    eventOwner: {
      ownerUserId: owner.userId,
      ownerCompany: owner.organizationId,
    },
    template: {
      id: j % 4,
      accentColor: ["#0ea5a4", "#f97316", "#6366f1", "#ef4444"][j % 4],
      logo: null,
    },
  };
  if (j % 7 === 0) {
    ev.streamUrl = `https://demo.stream/${j + 1}`;
    ev.sessions = [{ id: `s${j + 1}`, title: "Session 1", type: "talk" }];
  }
  if (access === "paid") {
    ev.ticketInfo = {
      price: parseInt((price || "$49").replace("$", "")) || 49,
      currency: "AUD",
      buyUrl: `https://buy.ticket/${j + 1}`,
    };
  }
  events.push(ev);
}

const outUsers = path.join(__dirname, "..", "dev-mocks", "mockUsers.json");
const outEvents = path.join(__dirname, "..", "dev-mocks", "mockEvents.json");

fs.writeFileSync(outUsers, JSON.stringify(users, null, 2), "utf8");
fs.writeFileSync(outEvents, JSON.stringify(events, null, 2), "utf8");

console.log(
  "Wrote",
  outUsers,
  "and",
  outEvents,
  "with",
  users.length,
  "users and",
  events.length,
  "events",
);
