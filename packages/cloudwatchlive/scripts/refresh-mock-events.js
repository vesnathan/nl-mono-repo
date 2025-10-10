const fs = require("fs");
const path = require("path");

const eventsPath = path.join(__dirname, "..", "dev-mocks", "mockEvents.json");
const raw = fs.readFileSync(eventsPath, "utf8");
const events = JSON.parse(raw);

const themes = [
  "AI Summit",
  "Design Workshop",
  "Indie Music Live",
  "Startup Pitch Night",
  "Product Launch",
  "Developer Conference",
  "Leadership Forum",
  "Health & Wellness Expo",
  "Marketing Masterclass",
  "Film Premiere",
  "Education Symposium",
  "SaaS Meetup",
  "Fintech Roundtable",
  "Climate Action Summit",
  "Art & Culture Live",
  "Gaming Tournament",
  "Food Festival Live",
  "Photography Workshop",
  "Investor Meetup",
  "Customer Stories",
  "Accessibility Panel",
  "Tech Deep Dive",
  "Women in Tech",
  "Community Townhall",
  "Networking Breakfast",
];

const adjectives = [
  "Global",
  "Virtual",
  "Live",
  "Interactive",
  "Exclusive",
  "Hands-on",
  "Annual",
  "Intensive",
  "Briefing",
  "Curated",
];
const images = [
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=500&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1515165562835-c6a36e1f1a0b?w=800&h=500&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1526481280698-9689030a0c2b?w=800&h=500&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&h=500&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&h=500&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=500&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?w=800&h=500&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=800&h=500&auto=format&fit=crop&q=80",
];

function choose(arr, i) {
  return arr[i % arr.length];
}

for (let i = 0; i < events.length; i++) {
  const e = events[i];
  // create a more human-friendly title
  const theme = choose(themes, i);
  const adj = choose(adjectives, i + 3);
  e.title = `${adj} ${theme}`;

  // shortDescription and description get richer text
  const suffixes = [
    "— join industry experts for a focused session.",
    "— practical takeaways and in-depth demos.",
    "— live talks, panels and networking opportunities.",
    "— hands-on sessions with Q&A and demos.",
    "— curated talks from industry leaders.",
  ];
  const suffix = suffixes[i % suffixes.length];
  e.shortDescription = `${adj} ${theme} ${suffix}`;
  e.description = `Join us for the ${adj.toLowerCase()} ${theme.toLowerCase()}. This event brings together practitioners, leaders, and enthusiasts to share insights, demos, and practical takeaways. Expect lightning talks, panel discussions, and networking opportunities.`;

  // rotate images to avoid repetition
  e.image = choose(images, i);

  // keep all other fields (id, startDate, owner, etc.) unchanged
}

fs.writeFileSync(eventsPath, JSON.stringify(events, null, 2), "utf8");
console.log("Refreshed", events.length, "events with varied titles and images");
