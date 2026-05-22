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

## Privacy Considerations

- final messages should be encrypted in production
- off-chain media should be referenced, not embedded directly on-chain
- only minimal identity fields are needed for cross-reference
- public verification should expose verdicts and evidence summaries, not intimate message content

## Operational Guidance

- treat owner identity collection as sensitive data
- avoid overfitting prompts to a single obituary source
- maintain transparent logs for verification attempts
- keep fee design aligned with abuse prevention rather than revenue extraction
