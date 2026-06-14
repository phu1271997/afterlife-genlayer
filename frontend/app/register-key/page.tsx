"use client";

import { useEffect, useState } from "react";
import { KeyRound, ShieldCheck, Sparkles, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useAfterLifeStore } from "@/lib/store";
import { getOrCreateECDHKeypair } from "@/lib/encryption";
import { readRecipientPublicKey, registerRecipientPublicKeyOnChain } from "@/lib/afterlife-contract";
import { shortenAddress } from "@/lib/address";

export default function RegisterKeyPage() {
  const isConnected = useAfterLifeStore((state) => state.isConnected);
  const userAddress = useAfterLifeStore((state) => state.userAddress);
  const connectWallet = useAfterLifeStore((state) => state.connectWallet);

  const [isLoading, setIsLoading] = useState(false);
  const [onChainKey, setOnChainKey] = useState<string | null>(null);
  const [localKey, setLocalKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load keys
  const loadKeyStatus = async () => {
    if (!isConnected || !userAddress) return;
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch from chain
      const pubKey = await readRecipientPublicKey(userAddress);
      setOnChainKey(pubKey || null);

      // 2. Fetch local key (check if it exists or create one)
      const { publicKeyHex } = await getOrCreateECDHKeypair(userAddress);
      setLocalKey(publicKeyHex);
    } catch (err) {
      console.error("Failed to load key status:", err);
      setError("Could not retrieve key status from the contract.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadKeyStatus();
  }, [isConnected, userAddress]);

  const handleRegisterKey = async () => {
    if (!isConnected || !userAddress) {
      setError("Please connect your wallet first.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      // Get or create local keypair
      const { publicKeyHex } = await getOrCreateECDHKeypair(userAddress);
      setLocalKey(publicKeyHex);

      // Register on-chain
      await registerRecipientPublicKeyOnChain(publicKeyHex);
      setOnChainKey(publicKeyHex);
      setSuccess("Public key successfully registered on GenLayer!");
    } catch (err) {
      console.error("Failed to register key:", err);
      setError(err instanceof Error ? err.message : "Key registration transaction failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="section-shell py-14">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-2xl space-y-8"
      >
        <div>
          <div className="section-kicker">Privacy & security</div>
          <h1 className="mt-3 font-display text-5xl text-white md:text-6xl">
            Register message key.
          </h1>
          <p className="mt-4 text-lg leading-8 text-white/68">
            To receive end-to-end encrypted letters from will owners, register your elliptic curve public key on GenLayer.
          </p>
        </div>

        {error ? (
          <div className="rounded-[1.5rem] border border-alert/35 bg-alert/15 p-4 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-[1.5rem] border border-gold/30 bg-gold/10 p-4 text-sm text-gold">
            {success}
          </div>
        ) : null}

        <Card className="space-y-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-gold/25 bg-gold/10 text-gold shadow-candle">
            <KeyRound className="h-6 w-6" />
          </div>

          <CardTitle>Your Encryption Status</CardTitle>
          
          {!isConnected ? (
            <div className="space-y-4">
              <CardDescription className="leading-7">
                Connect your wallet to inspect if you have registered your public key for receiving private letters.
              </CardDescription>
              <Button onClick={connectWallet} className="w-full">
                Connect wallet
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4">
                <div className="rounded-[1.5rem] border border-white/10 bg-black/15 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-white/40">Connected Wallet</div>
                  <div className="mt-1 font-mono text-sm text-white">{shortenAddress(userAddress)}</div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/15 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-white/40">On-Chain Key Status</div>
                  {isLoading ? (
                    <div className="mt-2 flex items-center gap-2 text-sm text-white/60">
                      <Loader2 className="h-4 w-4 animate-spin text-gold" />
                      Loading contract state...
                    </div>
                  ) : onChainKey ? (
                    <div className="mt-2 flex items-center gap-2 text-sm text-gold">
                      <ShieldCheck className="h-5 w-5" />
                      Registered (`${onChainKey.slice(0, 16)}...`)
                    </div>
                  ) : (
                    <div className="mt-2 text-sm text-rose-200">
                      Not registered (Cannot receive encrypted letters)
                    </div>
                  )}
                </div>
              </div>

              {!onChainKey ? (
                <Button onClick={handleRegisterKey} disabled={isLoading} className="w-full gap-2">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Registering key...
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" />
                      Generate & Register Key
                    </>
                  )}
                </Button>
              ) : (
                <div className="flex items-center gap-3 rounded-[1.75rem] border border-gold/15 bg-gold/5 p-4 text-xs text-white/70">
                  <Sparkles className="h-4 w-4 text-gold flex-shrink-0" />
                  Your encryption key is safely registered. Will creators can automatically encrypt letters specifically for you, and only this browser profile will be able to unseal them.
                </div>
              )}
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
