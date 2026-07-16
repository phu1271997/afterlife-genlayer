"use client";

import { createClient } from "genlayer-js";
import { localnet, studionet, testnetAsimov, testnetBradbury } from "genlayer-js/chains";
import type { Address } from "genlayer-js/types";
import { installEthereumSnapsPolyfill, wrapWithSnapsBypass } from "./snapsBypass";
import { normalizeAddress } from "./address";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

// Fallback address — always override with NEXT_PUBLIC_AFTERLIFE_CONTRACT_ADDRESS after redeploy
const DEFAULT_CONTRACT_ADDRESS = "0x35669C1599e43604C863dD48dB491684A27cB810";
const DEFAULT_NETWORK = "studionet";
const DEFAULT_RPC = "https://studio.genlayer.com/api";

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

export const AFTERLIFE_RPC =
  process.env.NEXT_PUBLIC_GENLAYER_RPC || DEFAULT_RPC;

export function getGenLayerChain() {
  return CHAIN_BY_NETWORK[AFTERLIFE_NETWORK] ?? studionet;
}

export function createReadClient() {
  return createClient({
    chain: getGenLayerChain(),
    endpoint: AFTERLIFE_RPC,
  });
}

/**
 * Connect wallet for writes.
 * Do NOT call client.connect(network) — that path uses MetaMask Snaps
 * (wallet_getSnaps) which regular MetaMask rejects.
 */
export async function connectGenLayerWallet() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask or another injected EVM wallet is required.");
  }

  installEthereumSnapsPolyfill();

  const accounts = (await window.ethereum.request({
    method: "eth_requestAccounts",
  })) as string[];
  const address = accounts?.[0] as Address | undefined;

  if (!address) {
    throw new Error("No wallet account was returned.");
  }

  const provider = wrapWithSnapsBypass(window.ethereum);

  // Best-effort chain switch without Snaps
  try {
    const chain = getGenLayerChain();
    const chainIdHex = `0x${Number(chain.id).toString(16)}`;
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
  } catch {
    /* user may reject; writes may still work if already on network */
  }

  const client = createClient({
    chain: getGenLayerChain(),
    endpoint: AFTERLIFE_RPC,
    account: address,
    provider: provider as never,
  });

  // Intentionally NO client.connect(AFTERLIFE_NETWORK) — avoids wallet_getSnaps

  return {
    address: normalizeAddress(address) as Address,
    client,
  };
}
