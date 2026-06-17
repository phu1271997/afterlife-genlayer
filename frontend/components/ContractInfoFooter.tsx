"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { AFTERLIFE_CONTRACT_ADDRESS } from "@/lib/genlayer";

export function ContractInfoFooter() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(AFTERLIFE_CONTRACT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <footer className="border-t border-white/5 bg-black/40 py-6 mt-12 text-xs text-white/45">
      <div className="section-shell flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="space-y-1">
          <p className="font-semibold text-white/60">Connected to AfterLife on GenLayer studionet</p>
          <p className="font-mono">{AFTERLIFE_CONTRACT_ADDRESS}</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 hover:bg-white/10 text-white/70 transition"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-lime-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-gold" />
                <span>Copy Address</span>
              </>
            )}
          </button>
          <a
            href={`https://studio.genlayer.com/?import-contract=${AFTERLIFE_CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 hover:bg-white/10 text-white/70 transition"
          >
            <ExternalLink className="h-3.5 w-3.5 text-gold" />
            <span>Open in Studio</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
