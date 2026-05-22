export type WillStatus =
  | "ACTIVE"
  | "GRACE_PERIOD"
  | "EXECUTED"
  | "FRAUD_DETECTED";

export type VerificationVerdict =
  | "CONFIRMED_DEAD"
  | "ALIVE"
  | "INCONCLUSIVE"
  | "FRAUD_DETECTED";

export interface Beneficiary {
  id: string;
  name: string;
  relationship: string;
  address: string;
  share: number;
}

export interface DigitalAsset {
  id: string;
  type: string;
  label: string;
  description: string;
  amount: string;
}

export interface FinalMessage {
  id: string;
  recipientAddress: string;
  recipientName: string;
  title: string;
  body: string;
  mediaUrl?: string;
  sealedAt: string;
  deliveredAt?: string;
  opened?: boolean;
}

export interface VerificationRecord {
  status: VerificationVerdict;
  confidence: number;
  timestamp: string;
  evidence: string[];
  reasoning: string;
  redFlags: string[];
  obituaryUrl?: string;
}

export interface ActivityLogItem {
  id: string;
  date: string;
  label: string;
  detail: string;
}

export interface WillRecord {
  id: string;
  title: string;
  ownerName: string;
  ownerBirthYear: number;
  ownerCity: string;
  ownerAddress: string;
  cadenceDays: number;
  createdAt: string;
  lastCheckIn: string;
  nextCheckIn: string;
  status: WillStatus;
  graceEndsAt?: string;
  beneficiaries: Beneficiary[];
  assets: DigitalAsset[];
  finalMessages: FinalMessage[];
  socialLinks: string[];
  activity: ActivityLogItem[];
  verification?: VerificationRecord;
}

const demoOwner = "0xA11CE0B5F4A6D8C9E01234567890ABCDEF123456";

export const DEMO_USER_ADDRESS = demoOwner;

export const mockWills: WillRecord[] = [
  {
    id: "AL-001",
    title: "Sarah's Active Will",
    ownerName: "Sarah Winters",
    ownerBirthYear: 1989,
    ownerCity: "Seattle",
    ownerAddress: demoOwner,
    cadenceDays: 30,
    createdAt: "2026-03-01T10:00:00.000Z",
    lastCheckIn: "2026-05-20T08:10:00.000Z",
    nextCheckIn: "2026-06-19T08:10:00.000Z",
    status: "ACTIVE",
    beneficiaries: [
      {
        id: "ben-1",
        name: "Liam Winters",
        relationship: "Brother",
        address: "0x19a2c484d4f0000000000000000000000000be11",
        share: 60,
      },
      {
        id: "ben-2",
        name: "Maya Winters",
        relationship: "Niece",
        address: "0x53b7719ab7d0000000000000000000000000be22",
        share: 40,
      },
    ],
    assets: [
      {
        id: "asset-1",
        type: "ETH",
        label: "Ethereum Treasury",
        description: "Cold wallet reserve for family support.",
        amount: "12.4 ETH",
      },
      {
        id: "asset-2",
        type: "NFT",
        label: "On-chain art collection",
        description: "Curated generative pieces with provenance notes.",
        amount: "8 works",
      },
      {
        id: "asset-3",
        type: "DOMAIN",
        label: "Family archive domain",
        description: "afterwinter.org with memorial microsite access.",
        amount: "1 domain",
      },
    ],
    finalMessages: [
      {
        id: "msg-1",
        recipientAddress: "0x19a2c484d4f0000000000000000000000000be11",
        recipientName: "Liam Winters",
        title: "For Liam, when the time is right",
        body: "If you are reading this, I hope you begin with gentleness. Take the ring from mother's cedar box and tell Maya the stories I kept meaning to write down.",
        sealedAt: "2026-03-03T13:00:00.000Z",
      },
      {
        id: "msg-2",
        recipientAddress: "0x53b7719ab7d0000000000000000000000000be22",
        recipientName: "Maya Winters",
        title: "For Maya, on the day you need courage",
        body: "You never needed permission to become yourself. Keep painting in the morning light. The studio key is yours now.",
        mediaUrl: "https://example.com/maya-letter-video",
        sealedAt: "2026-03-05T19:00:00.000Z",
      },
    ],
    socialLinks: ["https://x.com/sarahwinters", "https://linkedin.com/in/sarahwinters"],
    activity: [
      {
        id: "act-1",
        date: "2026-05-20T08:10:00.000Z",
        label: "Proof of life received",
        detail: "Owner confirmed presence. Next check-in now due in 30 days.",
      },
      {
        id: "act-2",
        date: "2026-04-18T10:30:00.000Z",
        label: "Final message sealed",
        detail: "A message for Maya was added and sealed for future delivery.",
      },
    ],
  },
  {
    id: "AL-002",
    title: "John's Pending Will",
    ownerName: "John Mercer",
    ownerBirthYear: 1961,
    ownerCity: "Boston",
    ownerAddress: "0x9134a8d2c4e7000000000000000000000000de01",
    cadenceDays: 60,
    createdAt: "2026-01-10T09:00:00.000Z",
    lastCheckIn: "2026-01-20T09:00:00.000Z",
    nextCheckIn: "2026-03-20T09:00:00.000Z",
    status: "GRACE_PERIOD",
    graceEndsAt: "2026-05-31T23:59:59.000Z",
    beneficiaries: [
      {
        id: "ben-3",
        name: "Anna Mercer",
        relationship: "Daughter",
        address: "0x834a8d2c4e7000000000000000000000000de10",
        share: 70,
      },
      {
        id: "ben-4",
        name: "Elias Mercer",
        relationship: "Son",
        address: "0x834a8d2c4e7000000000000000000000000de11",
        share: 30,
      },
    ],
    assets: [
      {
        id: "asset-4",
        type: "BTC",
        label: "Bitcoin reserve",
        description: "Multi-year savings intended for tuition and care.",
        amount: "2.18 BTC",
      },
      {
        id: "asset-5",
        type: "STABLE",
        label: "Household trust pool",
        description: "USDC reserve for short-term family expenses.",
        amount: "94,000 USDC",
      },
    ],
    finalMessages: [
      {
        id: "msg-3",
        recipientAddress: "0x834a8d2c4e7000000000000000000000000de10",
        recipientName: "Anna Mercer",
        title: "For Anna",
        body: "If grief arrives like weather, let it. There is no prize for being composed too early.",
        sealedAt: "2026-02-01T12:00:00.000Z",
      },
    ],
    socialLinks: ["https://facebook.com/johnmercer.family"],
    activity: [
      {
        id: "act-3",
        date: "2026-05-17T17:20:00.000Z",
        label: "AI verification confirmed death",
        detail: "Multiple sources aligned. The 14-day grace period is now active.",
      },
    ],
    verification: {
      status: "CONFIRMED_DEAD",
      confidence: 93,
      timestamp: "2026-05-17T17:20:00.000Z",
      obituaryUrl: "https://legacy.example.com/john-mercer-obituary",
      evidence: [
        "Obituary on legacy-style memorial site matching name, age, and city",
        "Local paper funeral notice with service location in Boston",
        "Friends and family memorial posts across Facebook and LinkedIn",
      ],
      reasoning:
        "The obituary aligned with the owner's legal identity and city of residence, and independent memorial posts corroborated the event. No substantial fraud indicators were detected, so the system entered the reversible grace period.",
      redFlags: [],
    },
  },
  {
    id: "AL-003",
    title: "Mary's Executed Will",
    ownerName: "Mary Ito",
    ownerBirthYear: 1974,
    ownerCity: "San Francisco",
    ownerAddress: "0x0000000000000000000000000000000000mary3",
    cadenceDays: 90,
    createdAt: "2025-12-11T11:30:00.000Z",
    lastCheckIn: "2026-01-05T14:00:00.000Z",
    nextCheckIn: "2026-04-05T14:00:00.000Z",
    status: "EXECUTED",
    graceEndsAt: "2026-04-28T18:00:00.000Z",
    beneficiaries: [
      {
        id: "ben-5",
        name: "Lily Ito",
        relationship: "Daughter",
        address: "0x0000000000000000000000000000000000l1ly3",
        share: 100,
      },
    ],
    assets: [
      {
        id: "asset-6",
        type: "ETH",
        label: "Inheritance vault",
        description: "A memory fund earmarked for Lily's future.",
        amount: "18 ETH",
      },
      {
        id: "asset-7",
        type: "MEDIA",
        label: "Family archive",
        description: "Photos, videos, and journal extracts stored off-chain.",
        amount: "124 files",
      },
    ],
    finalMessages: [
      {
        id: "msg-4",
        recipientAddress: "0x0000000000000000000000000000000000l1ly3",
        recipientName: "Lily Ito",
        title: "For my daughter Lily, on your eighteenth birthday",
        body: "You do not need to become fearless. You only need to remember that love has always been larger than your fear. When you doubt yourself, make tea, open the windows, and begin again.",
        mediaUrl: "https://example.com/final-birthday-video",
        sealedAt: "2025-12-20T09:00:00.000Z",
        deliveredAt: "2026-05-02T12:00:00.000Z",
      },
    ],
    socialLinks: ["https://instagram.com/maryito.archive"],
    activity: [
      {
        id: "act-4",
        date: "2026-05-02T12:00:00.000Z",
        label: "Will executed",
        detail: "Assets were released and final messages were unsealed for beneficiaries.",
      },
    ],
    verification: {
      status: "CONFIRMED_DEAD",
      confidence: 97,
      timestamp: "2026-04-14T18:00:00.000Z",
      obituaryUrl: "https://citypaper.example.com/mary-ito-remembered",
      evidence: [
        "City paper obituary listing Mary Ito with matching age and family details",
        "Funeral home notice cross-referenced with service date",
        "Memorial posts from coworkers and family on Instagram and LinkedIn",
      ],
      reasoning:
        "The verification bundle was unusually strong, with consistent identity details across obituary, funeral, and social remembrance sources. No sign of forgery was present, so execution proceeded after the grace period elapsed.",
      redFlags: [],
    },
  },
  {
    id: "AL-004",
    title: "Fraud Attempt",
    ownerName: "David Rowan",
    ownerBirthYear: 1980,
    ownerCity: "Austin",
    ownerAddress: "0x0000000000000000000000000000000000davd4",
    cadenceDays: 30,
    createdAt: "2026-02-12T08:00:00.000Z",
    lastCheckIn: "2026-05-01T08:00:00.000Z",
    nextCheckIn: "2026-05-31T08:00:00.000Z",
    status: "FRAUD_DETECTED",
    beneficiaries: [
      {
        id: "ben-6",
        name: "Noah Rowan",
        relationship: "Cousin",
        address: "0x0000000000000000000000000000000000noah4",
        share: 100,
      },
    ],
    assets: [
      {
        id: "asset-8",
        type: "ETH",
        label: "Research treasury",
        description: "Long-term capital reserved for a public-interest archive.",
        amount: "5.8 ETH",
      },
    ],
    finalMessages: [],
    socialLinks: ["https://x.com/davidrowan"],
    activity: [
      {
        id: "act-5",
        date: "2026-05-15T16:40:00.000Z",
        label: "Fraud attempt blocked",
        detail: "The submitted obituary failed cross-reference checks and the verification fee was forfeited.",
      },
    ],
    verification: {
      status: "FRAUD_DETECTED",
      confidence: 9,
      timestamp: "2026-05-15T16:40:00.000Z",
      obituaryUrl: "https://free-obits-now.example.com/david-rowan",
      evidence: [
        "Submitted obituary domain lacked provenance and carried templated filler text",
        "Owner account showed recent activity after the alleged date of death",
      ],
      reasoning:
        "The supposed obituary appeared on a low-trust site and conflicted with recent owner activity. Because the evidence suggested manipulation rather than uncertainty, the attempt was flagged as fraudulent.",
      redFlags: [
        "Suspicious obituary domain with no funeral home attribution",
        "Recent owner activity contradicted death claim",
      ],
    },
  },
];
