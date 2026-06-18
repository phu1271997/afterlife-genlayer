# 👻 AfterLife

*Your legacy. On-chain. Forever. Even after you're gone.*

AfterLife is an AI-verified digital will protocol built for GenLayer. It exists for a quiet but enormous problem: people die, and their digital lives often die with them. Wallets become inaccessible. Family archives disappear. Final words remain unwritten or unrecoverable. AfterLife turns that inevitability into a dignified, auditable protocol.

## 🔗 Deployed Contract

| Network    | Address                                    | Explorer                                     |
|------------|--------------------------------------------|----------------------------------------------|
| studionet  | `0x202a6d57DFf6617B034eA327f06e834929B06ABF` | [View in Studio](https://studio.genlayer.com/?import-contract=0x202a6d57DFf6617B034eA327f06e834929B06ABF) |

**Live App**: https://afterlife-genlayer-app.vercel.app  
**Deployed at**: 2026-06-18  
**Class Name**: `AfterLife` (renamed from `Contract` per GenLayer linter)  
**Reproducible Steps**: See [deployment/REPRODUCIBLE_STEPS.md](deployment/REPRODUCIBLE_STEPS.md)

---

## The Quiet Crisis

- Cerulli Associates estimates that roughly `$68 trillion` will move between generations by 2045.
- Chainalysis has repeatedly highlighted how much crypto is effectively lost forever because owners passed without sharing keys or recovery plans.
- The QuadrigaCX collapse exposed the chaos that follows when digital assets depend on a single deceased operator.
- Mircea Popescu's reported Bitcoin fortune became a cultural symbol for the risk of self-custody without inheritance planning.
- Most crypto holders still have no formal inheritance path for wallets, NFTs, domains, or digital archives.

AfterLife is designed for that exact gap.

## The Solution

AfterLife introduces a 3-layer death verification protocol:

1. Proof of life
   The owner checks in every 30, 60, or 90 days.
2. AI death verification
   Beneficiaries submit an obituary URL and GenLayer validators cross-reference memorial evidence.
3. Time-locked confirmation
   Even a confirmed verdict only begins a 14-day grace period before execution.

The result is a protocol that is cautious, reversible, and better aligned with the emotional stakes of inheritance.

## Why GenLayer

This project only makes sense on GenLayer because Intelligent Contracts can read the web and reason about ambiguity inside consensus.

```python
obituary_content = gl.nondet.web.render(obituary_url, mode="text")[:2000]
```

```python
raw_verdict = gl.nondet.exec_prompt(prompt, response_format="json")
verdict = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
```

That combination means the contract can:

- read obituary pages directly
- inspect memorial language from public web sources
- ask AI validators whether the evidence is sufficient, suspicious, or inconclusive
- do all of it without a single trusted oracle

## Features

- Digital will creation with beneficiary allocations
- Proof-of-life check-ins for the owner
- AI death verification using multi-source evidence
- Reversible 14-day grace period
- Final sealed messages for loved ones
- Mock asset inventory for crypto, NFTs, domains, and archives
- `$LIFE` token loop for will creation and verification

## Security & Trust

- Conservative AI verdict rules favor `INCONCLUSIVE` over accidental execution
- All nondeterministic calls are wrapped in `gl.vm.run_nondet_unsafe(...)`
- Beneficiaries cannot trigger execution directly from a single obituary
- The owner can return during the grace period and reset the will to active
- Fraud attempts can be detected and penalized

See [docs/SECURITY.md](/Users/peter/AI/AfterLife/docs/SECURITY.md) for the full threat model.

## Privacy

- Final messages can be encrypted in production deployments
- Off-chain media can be referenced without placing raw files on-chain
- Identity details are minimized to what verification needs: name, birth year, and city

## Tokenomics

`$LIFE` is the demo utility token used to model participation:

- `200 LIFE` starter grant for a new user
- `10 LIFE` to create a will
- `5 LIFE` to trigger verification
- Fraudulent verification forfeits the fee
- Correct or safe outcomes refund fully or partially depending on verdict

## Tech Stack

| Layer | Stack |
| --- | --- |
| Smart contract | GenLayer Intelligent Contract in Python |
| Frontend | Next.js 14 App Router, TypeScript, Tailwind CSS |
| Motion | Framer Motion |
| State | Zustand with localStorage persistence |
| Design language | Cormorant Garamond, Inter, Spectral, starfield + parchment aesthetic |
| Docs | Markdown with Mermaid diagrams |

## Live Demo

Placeholder: `https://afterlife-demo.example`

## Local Setup

```bash
cd "/Users/peter/AI/AfterLife/frontend"
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## GenLayer Contract Deployment Guide

1. Open [GenLayer Studio](https://studio.genlayer.com/run-debug)
2. Go to `Settings -> Reset Storage -> Confirm`
3. Hard refresh the Studio page
4. Deploy [contracts/storage_test.py](/Users/peter/AI/AfterLife/contracts/storage_test.py) first
5. Verify deployment succeeds
6. Deploy [contracts/afterlife.py](/Users/peter/AI/AfterLife/contracts/afterlife.py)
7. Call `claim_starter_tokens()` to receive `200 LIFE`
8. Call `create_will(...)` with sample data
9. Call `proof_of_life(will_id)` to demonstrate the ritual check-in
10. Call `add_final_message(...)` to seal a message
11. Call `trigger_death_verification(...)` to demonstrate the AI verdict path

## Roadmap

- Q1: Harden the core will protocol and encryption scheme
- Q2: Mobile proof-of-life app and beneficiary notifications
- Q3: Exchange and custodian integrations
- Q4: Traditional estate planning bridge and hybrid legal wrappers

## The Philosophy Behind AfterLife

Most dApps are about speculation, speed, or extraction. AfterLife is about responsibility. It treats death not as a growth hack or scare tactic, but as a condition every family will eventually face. Planning for that moment can be an act of tenderness.

Read the longer meditation in [docs/PHILOSOPHY.md](/Users/peter/AI/AfterLife/docs/PHILOSOPHY.md).

## Hackathon Submission Info

- Event: GenLayer Foundation hackathon
- Theme: AI-native smart contracts with meaningful real-world use
- Submission type: Full-stack demo dApp + Intelligent Contract + narrative documentation

## License

MIT
