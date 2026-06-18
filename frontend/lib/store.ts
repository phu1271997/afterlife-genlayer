"use client";

import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

import {
  claimStarterTokensOnChain,
  createWillOnChain,
  executeWillOnChain,
  proofOfLifeOnChain,
  readBalance,
  readUserWillIds,
  readWill,
  triggerDeathVerificationOnChain,
  type OnChainWillState,
} from "@/lib/afterlife-contract";
import {
  DEMO_USER_ADDRESS,
  type FinalMessage,
  type VerificationRecord,
  type VerificationVerdict,
  type WillRecord,
  mockWills,
} from "@/lib/mockWills";
import { addressEquals } from "@/lib/address";
import { connectGenLayerWallet } from "@/lib/genlayer";

export interface CreateWillInput {
  ownerName: string;
  ownerBirthYear: number;
  ownerCity: string;
  cadenceDays: number;
  beneficiaries: WillRecord["beneficiaries"];
  assets: WillRecord["assets"];
  finalMessages: Omit<FinalMessage, "id" | "sealedAt">[];
  socialLinks: string[];
}

interface AfterLifeState {
  userAddress: string;
  balance: number;
  wills: WillRecord[];
  lastViewedWillId: string;
  isConnected: boolean;
  isWorking: boolean;
  connectWallet: () => Promise<void>;
  refreshOnChainState: () => Promise<void>;
  loadWillById: (willId: string) => Promise<WillRecord | null>;
  claimStarterTokens: () => Promise<void>;
  createWill: (input: CreateWillInput) => Promise<string>;
  proofOfLife: (willId: string) => Promise<void>;
  triggerVerification: (
    willId: string,
    obituaryUrl: string,
  ) => Promise<VerificationRecord & { willStatus: WillRecord["status"] }>;
  executeWill: (willId: string) => Promise<void>;
  openMessage: (willId: string, messageId: string) => void;
  setLastViewedWill: (willId: string) => void;
}

const memoryStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

function getStorage(): StateStorage {
  if (typeof window === "undefined") {
    return memoryStorage;
  }
  return window.localStorage;
}

function weightedVerdict(): VerificationVerdict {
  const roll = Math.random();
  if (roll < 0.05) return "CONFIRMED_DEAD";
  if (roll < 0.25) return "INCONCLUSIVE";
  if (roll < 0.95) return "ALIVE";
  return "FRAUD_DETECTED";
}

function randomVerification(obituaryUrl: string): VerificationRecord {
  const verdict = weightedVerdict();
  if (verdict === "CONFIRMED_DEAD") {
    return {
      status: verdict,
      confidence: 88,
      timestamp: new Date().toISOString(),
      obituaryUrl,
      evidence: [
        "Submitted obituary aligns with the owner's identity markers",
        "Memorial language was detected across linked social channels",
        "Signals appear consistent enough to begin the reversible grace period",
      ],
      reasoning:
        "The verification set contains enough aligned signals to justify a conservative confirmation and begin the 14-day grace period. Because the protocol remains reversible during that window, heirs are notified without immediate execution.",
      redFlags: [],
    };
  }
  if (verdict === "FRAUD_DETECTED") {
    return {
      status: verdict,
      confidence: 11,
      timestamp: new Date().toISOString(),
      obituaryUrl,
      evidence: [
        "Linked obituary content appears low-trust and highly templated",
        "Recent owner activity contradicts the claim of death",
      ],
      reasoning:
        "The submitted claim contained signals consistent with a fabricated obituary or a rushed impersonation attempt. Because the risk of harm to a living owner is too high, the system rejected the request and logged the incident.",
      redFlags: [
        "Suspicious low-provenance source",
        "Recent owner activity still visible",
      ],
    };
  }
  if (verdict === "INCONCLUSIVE") {
    return {
      status: verdict,
      confidence: 57,
      timestamp: new Date().toISOString(),
      obituaryUrl,
      evidence: [
        "Some matching details were found, but corroborating sources were incomplete",
        "Social patterns were quiet but not definitively memorial in tone",
      ],
      reasoning:
        "The evidence does not safely support either confirmation or rejection. AfterLife errs toward patience here and asks for stronger, more authoritative sources before any irreversible action is taken.",
      redFlags: ["Insufficient corroboration across independent sources"],
    };
  }
  return {
    status: verdict,
    confidence: 91,
    timestamp: new Date().toISOString(),
    obituaryUrl,
    evidence: [
      "Recent owner activity suggests the person is still alive",
      "No trustworthy obituary or memorial signals were confirmed",
    ],
    reasoning:
      "The available evidence points toward the owner still being alive, so the verification fee is refunded and the will remains active. No grace period begins.",
    redFlags: [],
  };
}

function mapStatus(rawStatus: string, deathVerdict: string): WillRecord["status"] {
  if (rawStatus === "EXECUTED") return "EXECUTED";
  if (rawStatus === "GRACE_PERIOD") return "GRACE_PERIOD";
  if (deathVerdict === "FRAUD_DETECTED") return "FRAUD_DETECTED";
  return "ACTIVE";
}

function toVerification(data: OnChainWillState): VerificationRecord | undefined {
  if (!data.death_verdict) {
    return undefined;
  }

  return {
    status: data.death_verdict as VerificationVerdict,
    confidence: Number(data.death_confidence ?? 0),
    timestamp: new Date().toISOString(),
    obituaryUrl: "",
    evidence: Array.isArray(data.death_evidence) ? data.death_evidence : [],
    reasoning: data.death_reasoning || "The on-chain contract returned a verdict without additional notes.",
    redFlags: Array.isArray(data.death_red_flags) ? data.death_red_flags : [],
  };
}

function buildWillRecordFromChain(data: OnChainWillState, previous?: WillRecord): WillRecord {
  const cadenceDays = Number(data.check_in_interval_days ?? previous?.cadenceDays ?? 30);
  const now = new Date();
  const lastCheckIn = previous?.lastCheckIn ?? now.toISOString();
  const nextCheckIn =
    previous?.nextCheckIn ??
    new Date(new Date(lastCheckIn).getTime() + cadenceDays * 24 * 60 * 60 * 1000).toISOString();
  const verification = toVerification(data);

  return {
    id: data.id,
    title: previous?.title ?? `${String(data.owner_full_name).split(" ")[0]}'s Digital Will`,
    ownerName: data.owner_full_name,
    ownerBirthYear: Number(data.owner_birth_year),
    ownerCity: data.owner_city,
    ownerAddress: data.owner_address,
    cadenceDays,
    createdAt: previous?.createdAt ?? now.toISOString(),
    lastCheckIn,
    nextCheckIn,
    status: mapStatus(data.status, data.death_verdict),
    graceEndsAt:
      data.status === "GRACE_PERIOD"
        ? previous?.graceEndsAt ?? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        : previous?.graceEndsAt,
    gracePeriodStartedBlock: data.grace_period_started_block,
    gracePeriodBlocks: 241920,
    beneficiaries: (data.beneficiaries ?? []).map((beneficiary, index) => ({
      id: previous?.beneficiaries[index]?.id ?? `${data.id}-beneficiary-${index + 1}`,
      name: beneficiary.name,
      relationship: previous?.beneficiaries[index]?.relationship ?? "Beneficiary",
      address: beneficiary.address,
      share: Number(beneficiary.share),
    })),
    assets: previous?.assets ?? [],
    finalMessages: previous?.finalMessages ?? [],
    socialLinks: Array.isArray(data.social_links) ? data.social_links : previous?.socialLinks ?? [],
    activity: previous?.activity ?? [],
    verification,
  };
}

function mergeWillRecord(nextWill: WillRecord, wills: WillRecord[]) {
  const existingIndex = wills.findIndex((will) => will.id === nextWill.id);
  if (existingIndex === -1) {
    return [nextWill, ...wills];
  }

  const cloned = [...wills];
  cloned[existingIndex] = nextWill;
  return cloned;
}

async function syncWillFromChain(willId: string, currentWills: WillRecord[]) {
  const previous = currentWills.find((will) => will.id === willId);
  const onChain = await readWill(willId);
  return buildWillRecordFromChain(onChain, previous);
}

export const useAfterLifeStore = create<AfterLifeState>()(
  persist(
    (set, get) => ({
      userAddress: DEMO_USER_ADDRESS,
      balance: 200,
      wills: mockWills,
      lastViewedWillId: "AL-001",
      isConnected: false,
      isWorking: false,
      connectWallet: async () => {
        set({ isWorking: true });
        try {
          const { address } = await connectGenLayerWallet();
          set({
            isConnected: true,
            userAddress: address,
          });
          await get().refreshOnChainState();
        } finally {
          set({ isWorking: false });
        }
      },
      refreshOnChainState: async () => {
        const { isConnected, userAddress, wills } = get();
        if (!isConnected) {
          return;
        }

        set({ isWorking: true });
        try {
          const [balance, liveWillIds] = await Promise.all([
            readBalance(userAddress),
            readUserWillIds(userAddress),
          ]);

          let nextWills = [...wills];

          for (const liveWillId of liveWillIds) {
            if (liveWillId) {
              const syncedWill = await syncWillFromChain(liveWillId, nextWills);
              nextWills = mergeWillRecord(syncedWill, nextWills);
            }
          }

          set({
            balance,
            wills: nextWills,
            lastViewedWillId: liveWillIds[0] || get().lastViewedWillId,
          });
        } finally {
          set({ isWorking: false });
        }
      },
      loadWillById: async (willId) => {
        const { isConnected, wills } = get();
        const existing = wills.find((will) => will.id === willId);
        if (!isConnected) {
          return existing ?? null;
        }

        try {
          const syncedWill = await syncWillFromChain(willId, wills);
          set((state) => ({
            wills: mergeWillRecord(syncedWill, state.wills),
          }));
          return syncedWill;
        } catch (error) {
          if (existing) {
            return existing;
          }
          const message = error instanceof Error ? error.message : "Unable to load will.";
          if (message.toLowerCase().includes("unknown will_id")) {
            return null;
          }
          throw error;
        }
      },
      claimStarterTokens: async () => {
        if (!get().isConnected) {
          set((state) => ({
            balance: state.balance > 0 ? state.balance : 200,
          }));
          return;
        }

        set({ isWorking: true });
        try {
          await claimStarterTokensOnChain();
          await get().refreshOnChainState();
        } finally {
          set({ isWorking: false });
        }
      },
      createWill: async (input) => {
        if (!get().isConnected) {
          const id = `AL-${String(get().wills.length + 1).padStart(3, "0")}`;
          const now = new Date();
          const next = new Date(now.getTime() + input.cadenceDays * 24 * 60 * 60 * 1000);
          const newWill: WillRecord = {
            id,
            title: `${input.ownerName.split(" ")[0]}'s Digital Will`,
            ownerName: input.ownerName,
            ownerBirthYear: input.ownerBirthYear,
            ownerCity: input.ownerCity,
            ownerAddress: get().userAddress,
            cadenceDays: input.cadenceDays,
            createdAt: now.toISOString(),
            lastCheckIn: now.toISOString(),
            nextCheckIn: next.toISOString(),
            status: "ACTIVE",
            beneficiaries: input.beneficiaries,
            assets: input.assets,
            finalMessages: input.finalMessages.map((message, index) => ({
              ...message,
              id: `${id}-msg-${index + 1}`,
              sealedAt: now.toISOString(),
            })),
            socialLinks: input.socialLinks,
            activity: [
              {
                id: `${id}-created`,
                date: now.toISOString(),
                label: "Will created",
                detail: "A new digital will was sealed and recorded for future execution.",
              },
            ],
          };
          set((state) => ({
            balance: Math.max(state.balance - 10, 0),
            wills: [newWill, ...state.wills],
            lastViewedWillId: id,
          }));
          return id;
        }

        set({ isWorking: true });
        try {
          const { willId, ownerAddress } = await createWillOnChain(input);
          const now = new Date();
          const next = new Date(now.getTime() + input.cadenceDays * 24 * 60 * 60 * 1000);
          const localWill: WillRecord = {
            id: willId,
            title: `${input.ownerName.split(" ")[0]}'s Digital Will`,
            ownerName: input.ownerName,
            ownerBirthYear: input.ownerBirthYear,
            ownerCity: input.ownerCity,
            ownerAddress,
            cadenceDays: input.cadenceDays,
            createdAt: now.toISOString(),
            lastCheckIn: now.toISOString(),
            nextCheckIn: next.toISOString(),
            status: "ACTIVE",
            beneficiaries: input.beneficiaries,
            assets: input.assets,
            finalMessages: input.finalMessages.map((message, index) => ({
              ...message,
              id: `${willId}-msg-${index + 1}`,
              sealedAt: now.toISOString(),
            })),
            socialLinks: input.socialLinks,
            activity: [
              {
                id: `${willId}-created`,
                date: now.toISOString(),
                label: "Will created on GenLayer",
                detail: "The will was written to the live AfterLife contract.",
              },
            ],
          };

          set((state) => ({
            wills: mergeWillRecord(localWill, state.wills),
            lastViewedWillId: willId,
          }));

          await get().refreshOnChainState();
          return willId;
        } finally {
          set({ isWorking: false });
        }
      },
      proofOfLife: async (willId) => {
        if (!get().isConnected) {
          set((state) => ({
            wills: state.wills.map((will) => {
              if (will.id !== willId) return will;
              const now = new Date();
              const next = new Date(now.getTime() + will.cadenceDays * 24 * 60 * 60 * 1000);
              return {
                ...will,
                status: "ACTIVE",
                lastCheckIn: now.toISOString(),
                nextCheckIn: next.toISOString(),
                activity: [
                  {
                    id: `${will.id}-proof-${now.getTime()}`,
                    date: now.toISOString(),
                    label: "Proof of life received",
                    detail: "The owner checked in and the verification clock was reset.",
                  },
                  ...will.activity,
                ],
              };
            }),
          }));
          return;
        }

        set({ isWorking: true });
        try {
          await proofOfLifeOnChain(willId);
          const previous = get().wills.find((will) => will.id === willId);
          if (previous) {
            const now = new Date();
            const next = new Date(now.getTime() + previous.cadenceDays * 24 * 60 * 60 * 1000);
            set((state) => ({
              wills: state.wills.map((will) =>
                will.id === willId
                  ? {
                      ...will,
                      status: "ACTIVE",
                      lastCheckIn: now.toISOString(),
                      nextCheckIn: next.toISOString(),
                      activity: [
                        {
                          id: `${will.id}-proof-${now.getTime()}`,
                          date: now.toISOString(),
                          label: "Proof of life received",
                          detail: "The owner checked in and the live contract was updated.",
                        },
                        ...will.activity,
                      ],
                    }
                  : will,
              ),
            }));
          }
          await get().loadWillById(willId);
          await get().refreshOnChainState();
        } finally {
          set({ isWorking: false });
        }
      },
      triggerVerification: async (willId, obituaryUrl) => {
        if (!get().isConnected) {
          const will = get().wills.find((entry) => entry.id === willId);
          if (!will) {
            throw new Error("Will not found");
          }
          const deterministic =
            will.verification && ["AL-002", "AL-003", "AL-004"].includes(will.id)
              ? will.verification
              : randomVerification(obituaryUrl);

          let nextStatus: WillRecord["status"] = "ACTIVE";
          if (deterministic.status === "CONFIRMED_DEAD") {
            nextStatus = "GRACE_PERIOD";
          } else if (deterministic.status === "FRAUD_DETECTED") {
            nextStatus = "FRAUD_DETECTED";
          }

          set((state) => ({
            balance:
              deterministic.status === "FRAUD_DETECTED"
                ? Math.max(state.balance - 5, 0)
                : state.balance,
            wills: state.wills.map((entry) => {
              if (entry.id !== willId) return entry;
              const graceEndsAt =
                nextStatus === "GRACE_PERIOD"
                  ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
                  : entry.graceEndsAt;
              return {
                ...entry,
                status: nextStatus,
                graceEndsAt,
                verification: deterministic,
                activity: [
                  {
                    id: `${entry.id}-verify-${Date.now()}`,
                    date: deterministic.timestamp,
                    label:
                      deterministic.status === "CONFIRMED_DEAD"
                        ? "AI verification confirmed death"
                        : deterministic.status === "FRAUD_DETECTED"
                          ? "Fraud attempt blocked"
                          : deterministic.status === "ALIVE"
                            ? "Verification returned owner alive"
                            : "Verification remained inconclusive",
                    detail: deterministic.reasoning,
                  },
                  ...entry.activity,
                ],
              };
            }),
          }));

          return { ...deterministic, willStatus: nextStatus };
        }

        set({ isWorking: true });
        try {
          await triggerDeathVerificationOnChain(willId, obituaryUrl);
          await get().loadWillById(willId);
          await get().refreshOnChainState();

          const refreshed = get().wills.find((will) => will.id === willId);
          const verification = refreshed?.verification;

          if (!refreshed || !verification) {
            throw new Error("The contract updated, but no verification result was returned.");
          }

          return {
            ...verification,
            willStatus: refreshed.status,
          };
        } finally {
          set({ isWorking: false });
        }
      },
      executeWill: async (willId) => {
        if (!get().isConnected) {
          set((state) => ({
            wills: state.wills.map((will) => {
              if (will.id !== willId) return will;
              const now = new Date().toISOString();
              return {
                ...will,
                status: "EXECUTED",
                finalMessages: will.finalMessages.map((message) => ({
                  ...message,
                  deliveredAt: message.deliveredAt ?? now,
                })),
                activity: [
                  {
                    id: `${will.id}-executed-${Date.now()}`,
                    date: now,
                    label: "Will executed",
                    detail: "Assets and final messages were released to beneficiaries.",
                  },
                  ...will.activity,
                ],
              };
            }),
          }));
          return;
        }

        set({ isWorking: true });
        try {
          await executeWillOnChain(willId);
          set((state) => ({
            wills: state.wills.map((will) => {
              if (will.id !== willId) return will;
              const now = new Date().toISOString();
              return {
                ...will,
                status: "EXECUTED",
                finalMessages: will.finalMessages.map((message) => ({
                  ...message,
                  deliveredAt: message.deliveredAt ?? now,
                })),
                activity: [
                  {
                    id: `${will.id}-executed-${Date.now()}`,
                    date: now,
                    label: "Will executed on GenLayer",
                    detail: "The live contract released the will into its executed state.",
                  },
                  ...will.activity,
                ],
              };
            }),
          }));
          await get().loadWillById(willId);
          await get().refreshOnChainState();
        } finally {
          set({ isWorking: false });
        }
      },
      openMessage: (willId, messageId) =>
        set((state) => ({
          wills: state.wills.map((will) => {
            if (will.id !== willId) return will;
            return {
              ...will,
              finalMessages: will.finalMessages.map((message) =>
                message.id === messageId ? { ...message, opened: true } : message,
              ),
            };
          }),
        })),
      setLastViewedWill: (willId) => set({ lastViewedWillId: willId }),
    }),
    {
      name: "afterlife-store",
      storage: createJSONStorage(getStorage),
      partialize: (state) => ({
        userAddress: state.userAddress,
        balance: state.balance,
        wills: state.wills,
        lastViewedWillId: state.lastViewedWillId,
      }),
    },
  ),
);
