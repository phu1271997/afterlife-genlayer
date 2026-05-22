"use client";

import { createClient } from "genlayer-js";
import { localnet, studionet, testnetAsimov, testnetBradbury } from "genlayer-js/chains";
import type { Address } from "genlayer-js/types";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

const DEFAULT_CONTRACT_ADDRESS = "0x202a6d57DFf6617B034eA327f06e834929B06ABF";
const DEFAULT_NETWORK = "studionet";

const CHAIN_BY_NETWORK = {
  localnet,
  studionet,
  testnetAsimov,
  testnetBradbury,
} as const;

export type SupportedGenLayerNetwork = keyof typeof CHAIN_BY_NETWORK;

export const AFTERLIFE_CONTRACT_ADDRESS = (
  process.env.NEXT_PUBLIC_AFTERLIFE_CONTRACT_ADDRESS || DEFAULT_CONTRACT_ADDRESS
) as Address;

export const AFTERLIFE_NETWORK = (
  process.env.NEXT_PUBLIC_GENLAYER_NETWORK || DEFAULT_NETWORK
) as SupportedGenLayerNetwork;

export function getGenLayerChain() {
  return CHAIN_BY_NETWORK[AFTERLIFE_NETWORK] ?? studionet;
}

export function createReadClient() {
  return createClient({
    chain: getGenLayerChain(),
  });
}

export async function connectGenLayerWallet() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask or another injected EVM wallet is required.");
  }

  const accounts = (await window.ethereum.request({
    method: "eth_requestAccounts",
  })) as string[];
  const address = accounts?.[0] as Address | undefined;

  if (!address) {
    throw new Error("No wallet account was returned.");
  }

  const client = createClient({
    chain: getGenLayerChain(),
    account: address,
    provider: window.ethereum as never,
  });

  await client.connect(AFTERLIFE_NETWORK);

  return {
    address,
    client,
  };
}
