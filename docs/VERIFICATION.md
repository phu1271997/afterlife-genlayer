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

## Reviewer resubmission evidence 2026-07-16

- **Commit SHA**: `604006e23f03bfe38a68b556f8f533230a1db4a8`
- **Live App URL**: https://afterlife-genlayer-app.vercel.app
- **Verification Timestamp**: 2026-07-16 10:33:00 UTC+7
- **RPC Output (`get_contract_info`)**:
  ```json
  {
    "class": "AfterLife",
    "confirmed_dead_min_confidence": 85,
    "features": [
      "address_normalization",
      "comparative_death_verification",
      "grace_period_block_enforcement",
      "recipient_public_keys",
      "client_encrypted_final_messages"
    ],
    "grace_period_blocks": 241920,
    "methods": [
      "claim_starter_tokens",
      "create_will",
      "proof_of_life",
      "add_final_message",
      "register_recipient_public_key",
      "get_recipient_public_key",
      "trigger_death_verification",
      "execute_will",
      "get_will",
      "get_final_message",
      "get_user_will_ids",
      "get_user_will_id",
      "get_balance",
      "get_grace_period_blocks",
      "get_contract_info"
    ],
    "name": "AfterLife",
    "network": "studionet",
    "source": "contracts/afterlife.py"
  }
  ```

### Checklist items verified:
1. **Case-Insensitive Address Comparison** (✅ Item 1): Implemented normalizing functions and the `addressEquals` helper logic in `frontend/app/my-will/page.tsx` line 29.
2. **Contract Class Rename** (✅ Item 2): Renamed `class Contract` to `class AfterLife(gl.Contract)` in `contracts/afterlife.py` line 100.
3. **Comparative Death Verification** (✅ Item 3): Validators independently run web.render and call the LLM (`_independently_analyze_death()` in `contracts/afterlife.py` line 535) rather than just validating the format.
4. **Grace Period Enforcement** (✅ Item 4): `execute_will` now checks if the elapsed blocks are greater than or equal to `grace_period_blocks` (241,920 blocks, or ~30 days) in `contracts/afterlife.py` lines 635-643.
5. **Message Encryption** (✅ Item 5): Implemented `ENC:v2` ECIES envelopes in `frontend/lib/encryption.ts` and strict checks in `contracts/afterlife.py`.
6. **Address Pinning** (✅ Item 6): Updated the deployed contract address `0x13Ca19F9D1Ae9888dc5E65f7353400Db3DD7c891` in `README.md`, `frontend/.env.example`, and frontend footer config.
