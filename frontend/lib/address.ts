import { getAddress, isAddress } from "viem";

/**
 * Normalize address to lowercase for consistent comparison.
 * CRITICAL: never use strict === on raw addresses (MetaMask checksum vs lower).
 * Use addressEquals() for all owner / beneficiary filters.
 */
export function normalizeAddress(addr: string | undefined | null): string {
  if (!addr) return "";
  try {
    const trimmed = addr.trim();
    if (!isAddress(trimmed)) return trimmed.toLowerCase();
    // Always lowercase for equality — do not keep EIP-55 for comparisons
    return getAddress(trimmed).toLowerCase();
  } catch {
    return String(addr).toLowerCase();
  }
}

/**
 * Compare two addresses case-insensitively.
 * Returns true if they represent the same address.
 */
export function addressEquals(a: string | undefined | null, b: string | undefined | null): boolean {
  if (!a || !b) return false;
  return normalizeAddress(a) === normalizeAddress(b);
}

/**
 * Get EIP-55 checksum format for display (e.g., in UI).
 */
export function toChecksumAddress(addr: string): string {
  try {
    const trimmed = addr.trim();
    return getAddress(trimmed);
  } catch {
    return addr;
  }
}

/**
 * Truncate address for UI display: 0xAbCd...1234
 */
export function shortenAddress(addr: string): string {
  if (!addr) return "";
  const checksum = toChecksumAddress(addr);
  if (checksum.length < 10) return checksum;
  return `${checksum.slice(0, 6)}...${checksum.slice(-4)}`;
}
