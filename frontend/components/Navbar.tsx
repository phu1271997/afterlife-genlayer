"use client";

import Link from "next/link";
import { HeartHandshake, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useAfterLifeStore } from "@/lib/store";
import { shortenAddress, normalizeAddress } from "@/lib/address";

export function Navbar() {
  const balance = useAfterLifeStore((state) => state.balance);
  const balanceLoaded = useAfterLifeStore((state) => state.balanceLoaded);
  const address = useAfterLifeStore((state) => state.userAddress);
  const isConnected = useAfterLifeStore((state) => state.isConnected);
  const isWorking = useAfterLifeStore((state) => state.isWorking);
  const connectWallet = useAfterLifeStore((state) => state.connectWallet);
  const claimStarterTokens = useAfterLifeStore((state) => state.claimStarterTokens);
  const [isPending, setIsPending] = useState(false);

  async function handleConnect() {
    try {
      setIsPending(true);
      await connectWallet();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Wallet connection failed.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleClaim() {
    try {
      setIsPending(true);
      await claimStarterTokens();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Starter token claim failed.");
    } finally {
      setIsPending(false);
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const provider = window.ethereum as
      | {
          on?: (event: string, handler: (...args: unknown[]) => void) => void;
          removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
        }
      | undefined;
    if (!provider?.on) return;

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = (args[0] as string[] | undefined) ?? [];
      const next = accounts[0];
      // Reset store state on account switch/disconnect so the header stops
      // showing a stale balance for a wallet the user no longer controls.
      if (!next) {
        useAfterLifeStore.setState({
          isConnected: false,
          balance: 0,
          balanceLoaded: false,
        });
        return;
      }
      const normalized = normalizeAddress(next);
      if (normalized !== useAfterLifeStore.getState().userAddress) {
        useAfterLifeStore.setState({
          userAddress: normalized,
          balance: 0,
          balanceLoaded: false,
        });
        useAfterLifeStore.getState().refreshOnChainState().catch(() => {});
      }
    };

    const handleChainChanged = () => {
      // Chain switches invalidate our contract read cache.
      useAfterLifeStore.setState({ balanceLoaded: false });
      if (useAfterLifeStore.getState().isConnected) {
        useAfterLifeStore.getState().refreshOnChainState().catch(() => {});
      }
    };

    provider.on("accountsChanged", handleAccountsChanged);
    provider.on("chainChanged", handleChainChanged);
    return () => {
      provider.removeListener?.("accountsChanged", handleAccountsChanged);
      provider.removeListener?.("chainChanged", handleChainChanged);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-midnight/70 backdrop-blur-xl">
      <div className="section-shell flex h-20 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold shadow-candle">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-2xl tracking-[0.14em] text-white">
              AfterLife
            </div>
            <div className="text-[10px] uppercase tracking-[0.35em] text-white/45">
              Legacy protocol
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-white/70 md:flex">
          <Link href="/how-it-works" className="hover:text-white">
            How it works
          </Link>
          <Link href="/create-will" className="hover:text-white">
            Create will
          </Link>
          <Link href="/my-will" className="hover:text-white">
            My will
          </Link>
          <Link href="/verify-death" className="hover:text-white">
            Verify death
          </Link>
          <Link href="/register-key" className="hover:text-gold text-white/90">
            Register key
          </Link>
          <Link href="/demo" className="hover:text-gold text-white/90">
            Demo Walkthrough
          </Link>
        </nav>

        {isConnected ? (
          <div className="flex items-center gap-3">
            {balanceLoaded && balance === 0 ? (
              <Button variant="secondary" size="sm" onClick={handleClaim} disabled={isPending || isWorking}>
                {isPending || isWorking ? "Claiming…" : "Claim 200 LIFE"}
              </Button>
            ) : null}
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70">
              <HeartHandshake className="h-4 w-4 text-gold" />
              <span>{balanceLoaded ? `${balance} LIFE` : "… LIFE"}</span>
              <span className="hidden text-white/40 md:inline">{shortenAddress(address)}</span>
            </div>
          </div>
        ) : (
          <Button variant="secondary" size="sm" onClick={handleConnect} disabled={isPending || isWorking}>
            Connect Wallet
          </Button>
        )}
      </div>
    </header>
  );
}
