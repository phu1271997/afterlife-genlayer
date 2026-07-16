/**
 * MetaMask Snaps polyfill — genlayer-js connect() calls wallet_getSnaps.
 * AfterLife never needs Snaps for writes; we stub the RPC so residual probes fail soft.
 */

const GENLAYER_SNAP_NPM = "npm:genlayer-wallet-plugin";

const MOCK_SNAP = {
  id: GENLAYER_SNAP_NPM,
  version: "0.0.0-afterlife-polyfill",
  enabled: true,
  blocked: false,
};

function isSnapsMethod(method: string) {
  return (
    method === "wallet_getSnaps" ||
    method === "wallet_requestSnaps" ||
    method === "wallet_invokeSnap" ||
    method === "wallet_snap"
  );
}

function mockGetSnaps(params?: any) {
  if (params && typeof params === "object" && !Array.isArray(params)) {
    const out: Record<string, typeof MOCK_SNAP> = {};
    for (const id of Object.keys(params)) {
      out[id] = { ...MOCK_SNAP, id };
    }
    if (Object.keys(out).length) return out;
  }
  return { [GENLAYER_SNAP_NPM]: { ...MOCK_SNAP } };
}

function patchProvider(provider: any): any {
  if (!provider || typeof provider.request !== "function") return provider;
  if (provider.__afterlifeSnapsPatched) return provider;

  const originalRequest = provider.request.bind(provider);
  const patched = async (args: { method: string; params?: any }) => {
    if (isSnapsMethod(args?.method)) {
      if (args.method === "wallet_invokeSnap" || args.method === "wallet_snap") {
        throw new Error(
          "GenLayer MetaMask Snap is not required for AfterLife. Use standard wallet signing."
        );
      }
      return mockGetSnaps(args?.params);
    }
    try {
      return await originalRequest(args);
    } catch (err: any) {
      const msg = String(err?.message || err || "");
      if (
        msg.includes("wallet_getSnaps") ||
        msg.includes("doesn't has corresponding handler") ||
        msg.includes("does not have a corresponding handler")
      ) {
        return mockGetSnaps(args?.params);
      }
      throw err;
    }
  };

  try {
    provider.request = patched;
    provider.__afterlifeSnapsPatched = true;
    return provider;
  } catch {
    return new Proxy(provider, {
      get(target, prop, receiver) {
        if (prop === "request") return patched;
        if (prop === "__afterlifeSnapsPatched") return true;
        return Reflect.get(target, prop, receiver);
      },
    });
  }
}

export function installEthereumSnapsPolyfill(): void {
  if (typeof window === "undefined") return;
  const w = window as any;
  if (w.ethereum) {
    w.ethereum = patchProvider(w.ethereum);
    if (Array.isArray(w.ethereum?.providers)) {
      w.ethereum.providers = w.ethereum.providers.map(patchProvider);
    }
  }
}

export function wrapWithSnapsBypass(provider: any) {
  installEthereumSnapsPolyfill();
  return patchProvider(provider);
}
