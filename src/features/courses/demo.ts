import type { Course, Category } from "./types";
export const demoCategories: Category[] = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    name: "Technology",
    slug: "technology",
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    name: "Digital safety",
    slug: "digital-safety",
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    name: "Productivity",
    slug: "productivity",
  },
];
export const demoCourses: Course[] = [
  {
    id: "20000000-0000-4000-8000-000000000001",
    category_id: demoCategories[0].id,
    title: "Networking Basics",
    slug: "networking-basics",
    summary:
      "Make sense of the connections around you. Learn how devices, addresses and networks work together, one practical step at a time.",
    outcomes: [
      "Explain how devices communicate on a local network",
      "Distinguish IP addresses, DNS and routers",
      "Troubleshoot a connection with a repeatable checklist",
    ],
    course_type: "Certificate",
    duration_minutes: 90,
    status: "published",
    edition: 1,
    categories: demoCategories[0],
  },
  {
    id: "20000000-0000-4000-8000-000000000002",
    category_id: demoCategories[1].id,
    title: "Cybersecurity Fundamentals",
    slug: "cybersecurity-fundamentals",
    summary:
      "Build safer digital habits for work and everyday life. Spot suspicious messages, protect accounts and respond to common threats.",
    outcomes: [
      "Recognize phishing and social engineering",
      "Protect accounts using passphrases and MFA",
      "Build a practical incident response checklist",
    ],
    course_type: "Diploma",
    duration_minutes: 240,
    status: "published",
    edition: 1,
    categories: demoCategories[1],
  },
  {
    id: "20000000-0000-4000-8000-000000000003",
    category_id: demoCategories[2].id,
    title: "Excel for Beginners",
    slug: "excel-for-beginners",
    summary:
      "Turn everyday data into something useful. Get comfortable with spreadsheets, simple formulas and clear, reliable summaries.",
    outcomes: [
      "Organize data in a tidy worksheet",
      "Write and copy useful formulas",
      "Summarize information and check your results",
    ],
    course_type: "Certificate",
    duration_minutes: 120,
    status: "published",
    edition: 1,
    categories: demoCategories[2],
  },
];
