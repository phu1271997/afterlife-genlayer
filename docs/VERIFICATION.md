# Verification pack — AfterLife (judge / resubmission)

## Feedback addressed

| # | Issue | Fix |
|---|---|---|
| 1 | Live/deployed contract outdated | Redeploy `contracts/afterlife.py` (class `AfterLife`) and set `NEXT_PUBLIC_AFTERLIFE_CONTRACT_ADDRESS` |
| 2 | `will.ownerAddress === userAddress` case-sensitive | `addressEquals()` / lowercase normalize |
| 3 | Class named `Contract` | Renamed to **`AfterLife(gl.Contract)`** |
| 4 | Validator only checked format | Validators **re-fetch URL + re-run LLM**; match verdict exact, confidence ±15 |
| 5 | Grace period not enforced | `execute_will` requires elapsed blocks ≥ `grace_period_blocks` |
| 6 | Plaintext messages on-chain | Client encrypts `ENC:v2:…`; contract rejects plaintext |
| 7 | Address missing from docs | README + `.env.example` + footer |

## Deployed contract (update after Studio redeploy)

| Field | Value |
|---|---|
| Class | `AfterLife` |
| Source | `contracts/afterlife.py` |
| Address | `0x13Ca19F9D1Ae9888dc5E65f7353400Db3DD7c891` |
| Network | GenLayer Studionet |
| RPC | `https://studio.genlayer.com/api` |
| Live app | https://afterlife-genlayer-app.vercel.app |
| GitHub | https://github.com/phu1271997/afterlife-genlayer |

### Public methods (expected schema)

`claim_starter_tokens`, `create_will`, `proof_of_life`, `add_final_message`,  
`register_recipient_public_key`, `get_recipient_public_key`,  
`trigger_death_verification`, `execute_will`,  
`get_will`, `get_final_message`, `get_user_will_ids`, `get_user_will_id`,  
`get_balance`, `get_grace_period_blocks`, `get_contract_info`

## E2E reviewer path

1. Connect wallet → claim starter LIFE  
2. Beneficiary visits `/register-key` → register ECDH public key  
3. Owner creates will with that beneficiary + final message (auto-encrypted)  
4. Proof of life check-in  
5. Beneficiary triggers death verification with public obituary URL  
6. If `CONFIRMED_DEAD` + confidence ≥ 85 → GRACE_PERIOD starts  
7. Immediate `execute_will` **must fail** (grace not elapsed)  
8. After grace blocks (or test with reduced `grace_period_blocks` in Studio) → execute  
9. Recipient decrypts sealed letter in UI  

## Reply template

```text
Thanks — AfterLife resubmitted with the repaired contract + live binding.

1) Class: AfterLife (not Contract)
2) Comparative death verification: each validator re-fetches the obituary and re-runs the LLM; verdict must match (±15 confidence)
3) Grace period: execute_will blocked until block delta ≥ grace_period_blocks
4) Recipient keys + client ECIES encryption (ENC:v2:); plaintext rejected on-chain
5) Frontend address comparisons are case-insensitive (addressEquals)
6) Contract address: 0x13Ca19F9D1Ae9888dc5E65f7353400Db3DD7c891 on Studionet
   Live: https://afterlife-genlayer-app.vercel.app
   Source: contracts/afterlife.py
```
