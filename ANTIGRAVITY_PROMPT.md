# Prompt for Antigravity — AfterLife finish (bind new contract + public deploy)

Copy everything below the line into Antigravity.

---

## Task

Ship the repaired AfterLife dApp so GenLayer judges can verify the **new** deployed contract (renamed class, comparative death verification, grace-period blocks, recipient keys, encryption, address normalization).

Local repo (code already fixed):

`/Users/peter/Downloads/AI/Genlayer/afterlife-genlayer`

GitHub: https://github.com/phu1271997/afterlife-genlayer  
Live target: https://afterlife-genlayer-app.vercel.app  

## Deployed contract (authoritative — already deployed)

| Field | Value |
|---|---|
| Address | `0x13Ca19F9D1Ae9888dc5E65f7353400Db3DD7c891` |
| Class | `AfterLife` (not `Contract`) |
| Source | `contracts/afterlife.py` |
| Network | GenLayer Studionet |
| RPC | `https://studio.genlayer.com/api` |
| Explorer / Studio | https://studio.genlayer.com/?import-contract=0x13Ca19F9D1Ae9888dc5E65f7353400Db3DD7c891 |

### Expected methods (must appear in schema)

`claim_starter_tokens`, `create_will`, `proof_of_life`, `add_final_message`,  
`register_recipient_public_key`, `get_recipient_public_key`,  
`trigger_death_verification`, `execute_will`,  
`get_will`, `get_final_message`, `get_user_will_ids`, `get_user_will_id`,  
`get_balance`, `get_grace_period_blocks`, `get_contract_info`

Old address `0x202a6d57…` is obsolete — do **not** use it.

## Env (must bake into Next.js build)

```text
NEXT_PUBLIC_AFTERLIFE_CONTRACT_ADDRESS=0x13Ca19F9D1Ae9888dc5E65f7353400Db3DD7c891
NEXT_PUBLIC_GENLAYER_NETWORK=studionet
NEXT_PUBLIC_GENLAYER_RPC=https://studio.genlayer.com/api
```

## Steps (do in order)

### 1. Confirm local wiring

Working dir: `/Users/peter/Downloads/AI/Genlayer/afterlife-genlayer`

Ensure these contain `0x13Ca19F9D1Ae9888dc5E65f7353400Db3DD7c891`:

- `frontend/.env.local` (local; gitignored OK)
- `frontend/.env.example`
- `frontend/lib/genlayer.ts` → `DEFAULT_CONTRACT_ADDRESS`
- `deployment/deployed_addresses.json`
- `README.md`, `docs/VERIFICATION.md`

Optional schema check:

```bash
curl -s -X POST "https://studio.genlayer.com/api" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"gen_getContractSchema","params":["0x13Ca19F9D1Ae9888dc5E65f7353400Db3DD7c891"],"id":1}'
```

Must include `register_recipient_public_key`, `get_contract_info`, `get_grace_period_blocks` (proves repaired deploy, not old one).

### 2. Build frontend

```bash
cd /Users/peter/Downloads/AI/Genlayer/afterlife-genlayer/frontend
npm install
npm run build
```

Confirm production output embeds the new address:

```bash
# Next may put env into server/client chunks
grep -R "0x13Ca19F9D1Ae9888dc5E65f7353400Db3DD7c891" .next 2>/dev/null | head -5 && echo "OK address in build"
```

Fix any TypeScript/build errors before continuing.

### 3. Commit + push public GitHub

```bash
cd /Users/peter/Downloads/AI/Genlayer/afterlife-genlayer
git status
git add -A
# keep node_modules / .next / .env.local ignored

git commit -m "$(cat <<'EOF'
fix: AfterLife auditor resubmission + bind 0x13Ca19F9…

Comparative death verification, grace-period blocks, recipient keys,
client encryption, case-insensitive addresses; wire new Studionet deploy.
EOF
)"

git push origin main
```

Use **real** `git rev-parse HEAD` for the full SHA (do not invent padding).  
Repo must stay public. No force-push unless necessary and confirmed.

### 4. Vercel public production deploy

Project for **https://afterlife-genlayer-app.vercel.app** (or create/link it).

| Setting | Value |
|---|---|
| Repository | `phu1271997/afterlife-genlayer` |
| Root Directory | **`frontend`** |
| Framework | Next.js |
| Build | `npm run build` / `next build` |
| Deployment Protection | **OFF** |

Env **Production + Preview**:

```text
NEXT_PUBLIC_AFTERLIFE_CONTRACT_ADDRESS=0x13Ca19F9D1Ae9888dc5E65f7353400Db3DD7c891
NEXT_PUBLIC_GENLAYER_NETWORK=studionet
NEXT_PUBLIC_GENLAYER_RPC=https://studio.genlayer.com/api
```

**Redeploy production after setting env** (Next inlines `NEXT_PUBLIC_*` at build time).

```bash
cd /Users/peter/Downloads/AI/Genlayer/afterlife-genlayer/frontend
vercel link --yes --project afterlife-genlayer-app   # if needed
vercel --prod --yes
```

### 5. Hard verification (must pass)

```bash
LIVE=https://afterlife-genlayer-app.vercel.app
curl -sI "$LIVE" | head -12
# HTTP 200, NOT 302 to vercel.com/sso-api

# Footer / page should reference new address when loaded
curl -s "$LIVE" | grep -o "0x13Ca19F9D1Ae9888dc5E65f7353400Db3DD7c891" | head -1 || true
```

Incognito UI smoke:

1. Live app loads without SSO.  
2. Footer / ContractInfo shows `0x13Ca19F9D1Ae9888dc5E65f7353400Db3DD7c891`.  
3. Connect wallet → claim starter LIFE (if needed).  
4. `/register-key` — register ECDH public key.  
5. Create will path available; My Will uses case-insensitive owner match.  
6. Optional: confirm `get_contract_info` via Studio import of the address.

### 6. Return to the human

Paste back:

1. GitHub commit URL + **full** SHA from `git rev-parse HEAD`  
2. Final public live URL  
3. `curl -sI` proof (no SSO)  
4. Confirmation live app shows `0x13Ca19F9D1Ae9888dc5E65f7353400Db3DD7c891`  
5. Confirmation Vercel env uses the new address (not `0x202a6d57…`)  
6. Any blockers  

## Out of scope

- Do not point env back at `0x13Ca19F9D1Ae9888dc5E65f7353400Db3DD7c891`.  
- Do not reintroduce class name `Contract`.  
- Do not store plaintext final messages (must stay ENC:v2).  
- Do not enable Vercel SSO.  
- Do not use localnet RPC on Vercel.  

## Success criteria

- [ ] Public GitHub has repaired contract source + new address docs  
- [ ] Vercel Production env = `0x13Ca19F9D1Ae9888dc5E65f7353400Db3DD7c891`  
- [ ] Live app public and bound to that address  
- [ ] Schema includes recipient keys + get_contract_info (repaired features)  

---

End of Antigravity prompt.
