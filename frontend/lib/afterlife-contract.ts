"use client";

import { ExecutionResult, TransactionStatus, type Address, type Hash } from "genlayer-js/types";

import type { CreateWillInput } from "@/lib/store";
import {
  AFTERLIFE_CONTRACT_ADDRESS,
  connectGenLayerWallet,
  createReadClient,
} from "@/lib/genlayer";
import { encryptMessageForRecipient } from "@/lib/encryption";

export interface OnChainWillState {
  id: string;
  owner_address: string;
  owner_full_name: string;
  owner_birth_year: number;
  owner_city: string;
  check_in_interval_days: number;
  beneficiaries: Array<{ address: string; name: string; share: number }>;
  digital_assets: unknown[];
  social_links: string[];
  status: string;
  last_check_in_block: number;
  check_ins_count: number;
  death_verdict: string;
  death_confidence: number;
  death_evidence: string[];
  death_red_flags?: string[];
  death_reasoning: string;
  estimated_death_date?: string;
  verification_triggered_by: string;
  grace_period_started_block: number;
  executed_block: number;
  fee_paid: number;
  will_number: number;
}

function extractRevertReason(receipt: unknown): string | null {
  // GenLayer receipts nest the UserError message inside
  // consensus_data.leader_receipt[i].error (string|null). Read the typed field
  // first, then fall back to a JSON scrape for older shapes.
  try {
    const r = receipt as {
      consensus_data?: {
        leader_receipt?: Array<{ error?: string | null }>;
      };
    };
    const leaderReceipts = r?.consensus_data?.leader_receipt ?? [];
    for (const entry of leaderReceipts) {
      const raw = entry?.error;
      if (!raw || typeof raw !== "string") continue;
      const cleaned = cleanReceiptError(raw);
      if (cleaned) return cleaned;
    }
  } catch {
    /* ignore */
  }

  try {
    const dump = JSON.stringify(receipt);
    // Match a UserError anywhere in the dump, e.g. `UserError("Only will owner
    // can add messages")` or JSON-encoded variants. Prefer longer, punctuated
    // messages so we don't return a stray 4-char match like "only".
    const patterns: RegExp[] = [
      /UserError\(\s*[\\"']*([^"'\\)]{4,})/i,
      /"error"\s*:\s*"([^"\\]{4,})"/i,
      /"message"\s*:\s*"([^"\\]{4,})"/i,
      /"reason"\s*:\s*"([^"\\]{4,})"/i,
    ];
    for (const pattern of patterns) {
      const match = dump.match(pattern);
      if (match?.[1]) {
        return match[1].trim();
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

function cleanReceiptError(raw: string): string {
  // Genvm sometimes wraps the message as `UserError("actual text")` or
  // `Rollback("actual text")`. Peel that outer layer so the UI shows the
  // actual message.
  const wrapper = raw.match(/^\s*(?:UserError|Rollback|Error)\(\s*["']?(.*?)["']?\s*\)\s*$/i);
  if (wrapper?.[1]) return wrapper[1].trim();
  return raw.trim();
}

async function waitForSuccessfulWrite(txHash: `0x${string}`) {
  const readClient = createReadClient();
  const receipt = await readClient.waitForTransactionReceipt({
    hash: txHash as Hash,
    status: TransactionStatus.FINALIZED,
    interval: 3_000,
    retries: 120,
  });

  if (receipt.txExecutionResultName !== ExecutionResult.FINISHED_WITH_RETURN) {
    console.error("GenLayer transaction execution failed, receipt:", receipt);
    const revertReason = extractRevertReason(receipt);
    const suffix = revertReason ? ` Reason: ${revertReason}` : "";
    throw new Error(
      `The transaction finalized, but contract execution did not succeed.${suffix}`,
    );
  }

  return receipt;
}

export async function readBalance(address: string) {
  const readClient = createReadClient();
  const result = await readClient.readContract({
    address: AFTERLIFE_CONTRACT_ADDRESS,
    functionName: "get_balance",
    args: [address],
  });
  return Number(result ?? 0);
}

export async function readUserWillId(address: string) {
  const readClient = createReadClient();
  const result = await readClient.readContract({
    address: AFTERLIFE_CONTRACT_ADDRESS,
    functionName: "get_user_will_id",
    args: [address],
  });
  return String(result ?? "");
}

export async function readUserWillIds(address: string): Promise<string[]> {
  const readClient = createReadClient();
  try {
    const result = await readClient.readContract({
      address: AFTERLIFE_CONTRACT_ADDRESS,
      functionName: "get_user_will_ids",
      args: [address],
    });
    if (!result) return [];
    const arr = JSON.parse(String(result));
    return Array.isArray(arr) ? arr : [];
  } catch (err) {
    console.error("Failed to read user will ids, falling back:", err);
    // Fallback to reading the single will id
    const single = await readUserWillId(address);
    return single ? [single] : [];
  }
}

export async function readWill(willId: string) {
  const readClient = createReadClient();
  const raw = await readClient.readContract({
    address: AFTERLIFE_CONTRACT_ADDRESS,
    functionName: "get_will",
    args: [willId],
  });
  return JSON.parse(String(raw)) as OnChainWillState;
}

export async function readFinalMessage(messageId: string) {
  const readClient = createReadClient();
  const raw = await readClient.readContract({
    address: AFTERLIFE_CONTRACT_ADDRESS,
    functionName: "get_final_message",
    args: [messageId],
  });
  return JSON.parse(String(raw));
}


export async function claimStarterTokensOnChain() {
  const { client } = await connectGenLayerWallet();
  const txHash = await client.writeContract({
    address: AFTERLIFE_CONTRACT_ADDRESS,
    functionName: "claim_starter_tokens",
    args: [],
    value: BigInt(0),
  });
  await waitForSuccessfulWrite(txHash);
}

export async function readRecipientPublicKey(address: string): Promise<string> {
  const readClient = createReadClient();
  try {
    const result = await readClient.readContract({
      address: AFTERLIFE_CONTRACT_ADDRESS,
      functionName: "get_recipient_public_key",
      args: [address],
    });
    return String(result ?? "");
  } catch (err) {
    console.error("Failed to read recipient public key:", err);
    return "";
  }
}

export async function registerRecipientPublicKeyOnChain(publicKeyHex: string) {
  const { client } = await connectGenLayerWallet();
  const txHash = await client.writeContract({
    address: AFTERLIFE_CONTRACT_ADDRESS,
    functionName: "register_recipient_public_key",
    args: [publicKeyHex],
    value: BigInt(0),
  });
  await waitForSuccessfulWrite(txHash);
}

export async function createWillOnChain(input: CreateWillInput) {
  const { client, address } = await connectGenLayerWallet();
  const willId = `AL-${Date.now().toString().slice(-8)}`;

  const txHash = await client.writeContract({
    address: AFTERLIFE_CONTRACT_ADDRESS,
    functionName: "create_will",
    args: [
      willId,
      input.ownerName,
      input.ownerBirthYear,
      input.ownerCity,
      input.cadenceDays,
      JSON.stringify(
        input.beneficiaries.map((beneficiary) => ({
          address: beneficiary.address.toLowerCase(),
          name: beneficiary.name,
          share: beneficiary.share,
        })),
      ),
      JSON.stringify(input.assets),
      JSON.stringify(input.socialLinks),
    ],
    value: BigInt(0),
  });

  await waitForSuccessfulWrite(txHash);

  for (const message of input.finalMessages) {
    // REQUIRED: client-side ECIES encryption — contract rejects non-ENC:v2: payloads
    const recipientPubKey = await readRecipientPublicKey(message.recipientAddress);
    if (!recipientPubKey || recipientPubKey.trim() === "") {
      throw new Error(
        `Recipient ${message.recipientAddress} has not registered a public key. ` +
          "They must visit /register-key before you can seal an encrypted final message."
      );
    }

    let encryptedBody: string;
    try {
      encryptedBody = await encryptMessageForRecipient(message.body, recipientPubKey);
    } catch (err) {
      throw new Error(
        `Failed to encrypt final message for ${message.recipientAddress}: ` +
          (err instanceof Error ? err.message : String(err))
      );
    }
    if (!encryptedBody.startsWith("ENC:v2:")) {
      throw new Error("Encryption produced an invalid envelope (expected ENC:v2:…).");
    }

    const messageHash = await client.writeContract({
      address: AFTERLIFE_CONTRACT_ADDRESS,
      functionName: "add_final_message",
      args: [
        willId,
        message.recipientAddress.toLowerCase(),
        encryptedBody,
        message.mediaUrl ?? "",
      ],
      value: BigInt(0),
    });
    await waitForSuccessfulWrite(messageHash);
  }

  return {
    willId,
    ownerAddress: address,
  };
}

export async function proofOfLifeOnChain(willId: string) {
  const { client } = await connectGenLayerWallet();
  const txHash = await client.writeContract({
    address: AFTERLIFE_CONTRACT_ADDRESS,
    functionName: "proof_of_life",
    args: [willId],
    value: BigInt(0),
  });
  await waitForSuccessfulWrite(txHash);
}

export async function triggerDeathVerificationOnChain(willId: string, obituaryUrl: string) {
  const { client } = await connectGenLayerWallet();
  const txHash = await client.writeContract({
    address: AFTERLIFE_CONTRACT_ADDRESS,
    functionName: "trigger_death_verification",
    args: [willId, obituaryUrl],
    value: BigInt(0),
  });
  await waitForSuccessfulWrite(txHash);
}

export async function executeWillOnChain(willId: string) {
  const { client } = await connectGenLayerWallet();
  const txHash = await client.writeContract({
    address: AFTERLIFE_CONTRACT_ADDRESS,
    functionName: "execute_will",
    args: [willId],
    value: BigInt(0),
  });
  await waitForSuccessfulWrite(txHash);
}

export function getContractAddress() {
  return AFTERLIFE_CONTRACT_ADDRESS as Address;
}
