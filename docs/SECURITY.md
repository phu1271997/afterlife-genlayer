# Security and Threat Model

## Threat Model

AfterLife is built around a harsh constraint: a false positive death verdict is more dangerous than a false negative. The protocol is intentionally conservative.

## Attack #1: Premature death claim

Threat:
A beneficiary or attacker submits an obituary while the owner is still alive.

Mitigation:
- owner must miss repeated check-ins before verification becomes narratively plausible
- AI verification cross-references identity details and memorial signals
- confirmed verdict only starts a 14-day grace period
- owner can cancel the process by checking in during that window

## Attack #2: Fake obituary

Threat:
An heir fabricates or submits a low-trust obituary page.

Mitigation:
- validators inspect provenance and wording
- AI looks for templated filler text, weak domain trust, vague details, and conflicting activity
- explicit `FRAUD_DETECTED` verdict path forfeits the fee and logs the attempt

## Attack #3: Heir collusion

Threat:
Multiple heirs coordinate around a false claim.

Mitigation:
- no single heir controls consensus
- multi-source verification reduces reliance on user-submitted evidence
- grace period provides time for disputes and owner reappearance

## Attack #4: Compromised owner wallet

Threat:
An attacker controlling the owner's wallet modifies the will or abuses proof-of-life.

Mitigation:
- future roadmap includes multisig configuration and social recovery
- owner-side wallet hygiene remains important
- high-value deployments should support hardware wallet and guardian flows

## Attack #5: AI hallucination

Threat:
A model reaches an incorrect conclusion from noisy evidence.

Mitigation:
- bounded JSON schema
- validator consensus rather than single-model authority
- conservative prompt design
- default preference for `INCONCLUSIVE`

## Attack #6: 51% validator attack or consensus corruption

Threat:
The underlying network fails to preserve honest consensus.

Mitigation:
- inherits GenLayer's network-level security assumptions
- AfterLife adds grace-period reversibility to reduce blast radius even after a bad confirmation

## Privacy Considerations & ECIES Encryption

To protect the confidentiality of sensitive final words, AfterLife implements a client-side **ECIES (Elliptic Curve Integrated Encryption Scheme)** hybrid encryption pattern:

1. **Key Registry**: Every recipient generates an ECDH P-256 keypair. The public key is registered in the smart contract via `register_recipient_public_key`, while the private key remains stored securely in their browser's local storage.
2. **Client-Side Encryption**: When the owner seals a final message for a recipient, the frontend fetches the recipient's registered public key, generates an ephemeral ECDH keypair, derives a shared AES-GCM 256 key, and encrypts the message. Only the ciphertext, IV, and ephemeral public key are sent to the contract (`ENC:v2:ivHex:ephemeralPubKeyHex:ciphertextHex`).
3. **Decryption on execution**: The plaintext message is never stored on-chain. When the will is executed, the recipient reads the ciphertext from the contract and decrypts it using their local ECDH private key.
4. **Threat Mitigations**:
   - *Threat: Chain explorer reading plaintext* → **ELIMINATED** via ECIES ciphertext storage.
   - *Threat: Recipient losing private key/browser storage* → **MITIGATED** by encouraging backups of the private key JWK. Without it, messages are permanently unrecoverable (by design).
   - *Threat: Incorrect recipient public key* → **MITIGATED** by checking public key existence on the contract before sealing messages.
   - *Threat: Re-encryption fallback* → **LEGACY PLAIN TEXT** messages are flagged as legacy unencrypted when unsealed.


## Operational Guidance

- treat owner identity collection as sensitive data
- avoid overfitting prompts to a single obituary source
- maintain transparent logs for verification attempts
- keep fee design aligned with abuse prevention rather than revenue extraction

## Auditor resubmission controls (2026)

### Address normalization
All storage keys and comparisons use lowercase hex addresses (`normalize_address` / frontend `addressEquals`) so MetaMask checksum vs lowercasing cannot hide a will on My Will.

### Real validator consensus
`trigger_death_verification` uses `gl.vm.run_nondet_unsafe`:
- leader runs full `web.render(obituary)` + social fetch + `exec_prompt`
- each validator re-runs the **same full analysis** (not schema-only)
- accept only if verdict matches exactly and confidence within ±15
- `CONFIRMED_DEAD` requires confidence ≥ 85 on both sides

### Grace period block enforcement
`execute_will` requires:
`current_block - grace_period_started_block >= grace_period_blocks`
Immediate execution after AI verdict is rejected on-chain.

### Encrypted final messages
Contract rejects any `add_final_message` payload that is not `ENC:v2:…`.
Frontend encrypts with recipient ECDH public key registered via `register_recipient_public_key`.
Private keys never leave the recipient browser (localStorage JWK).
