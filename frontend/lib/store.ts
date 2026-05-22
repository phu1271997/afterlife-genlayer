"use client";

import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

import {
  DEMO_USER_ADDRESS,
  type FinalMessage,
  type VerificationRecord,
  type VerificationVerdict,
  type WillRecord,
  mockWills,
} from "@/lib/mockWills";

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
  claimStarterTokens: () => void;
  createWill: (input: CreateWillInput) => string;
  proofOfLife: (willId: string) => void;
  triggerVerification: (
    willId: string,
    obituaryUrl: string,
  ) => VerificationRecord & { willStatus: WillRecord["status"] };
  executeWill: (willId: string) => void;
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

export const useAfterLifeStore = create<AfterLifeState>()(
  persist(
    (set, get) => ({
      userAddress: DEMO_USER_ADDRESS,
      balance: 200,
      wills: mockWills,
      lastViewedWillId: "AL-001",
      claimStarterTokens: () =>
        set((state) => ({
          balance: state.balance > 0 ? state.balance : 200,
        })),
      createWill: (input) => {
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
      },
      proofOfLife: (willId) =>
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
        })),
      triggerVerification: (willId, obituaryUrl) => {
        const will = get().wills.find((entry) => entry.id === willId);
        if (!will) {
          throw new Error("Will not found");
        }
        const deterministic = will.verification && ["AL-002", "AL-003", "AL-004"].includes(will.id)
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
      },
      executeWill: (willId) =>
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
        })),
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
