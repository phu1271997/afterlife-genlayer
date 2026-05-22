# AfterLife Architecture

## System Overview

```mermaid
flowchart LR
    U["Owner or Beneficiary"] --> F["Next.js Frontend"]
    F --> C["GenLayer Intelligent Contract"]
    C --> V["AI Validators"]
    V --> O["Obituary Sites"]
    V --> S["Social Media Memorials"]
    V --> G["Government or Public Records"]
    O --> V
    S --> V
    G --> V
    V --> C
    C --> P["Grace Period State"]
    P --> E["Will Execution"]
    E --> M["Final Messages Unsealed"]
```

## Lifecycle Sequence

```mermaid
sequenceDiagram
    participant Owner
    participant Frontend
    participant Contract
    participant Validators
    participant Web
    participant Beneficiary

    Owner->>Frontend: Create will
    Frontend->>Contract: create_will(...)
    Contract-->>Frontend: Will sealed

    loop Periodic presence
        Owner->>Frontend: Press proof-of-life
        Frontend->>Contract: proof_of_life(will_id)
        Contract-->>Frontend: Check-in recorded
    end

    Beneficiary->>Frontend: Submit obituary URL
    Frontend->>Contract: trigger_death_verification(...)
    Contract->>Validators: run_nondet_unsafe(...)
    Validators->>Web: render obituary + memorial sources
    Validators->>Validators: exec_prompt consensus
    Validators-->>Contract: Structured verdict
    Contract-->>Frontend: ACTIVE or GRACE_PERIOD

    alt Confirmed and grace period completes
        Beneficiary->>Frontend: Execute will
        Frontend->>Contract: execute_will(will_id)
        Contract-->>Frontend: EXECUTED
        Frontend-->>Beneficiary: Final messages unlocked
    else Owner returns during grace period
        Owner->>Frontend: proof_of_life(will_id)
        Frontend->>Contract: proof_of_life(...)
        Contract-->>Frontend: ACTIVE restored
    end
```

## Smart Contract State Diagram

```mermaid
stateDiagram-v2
    [*] --> ACTIVE
    ACTIVE --> GRACE_PERIOD: confirmed death verdict
    ACTIVE --> FRAUD_DETECTED: fraudulent evidence detected
    ACTIVE --> ACTIVE: alive or inconclusive verdict
    GRACE_PERIOD --> ACTIVE: owner proof_of_life
    GRACE_PERIOD --> EXECUTED: execute_will
    FRAUD_DETECTED --> ACTIVE: future clean verification or owner activity
```

## Three-Layer Verification Architecture

### Layer 1: Proof of life

- Owner must check in every 30, 60, or 90 days
- Missing three cycles is the trigger for scrutiny
- This prevents immediate execution based on silence alone

### Layer 2: AI death verification

- Beneficiary submits obituary URL
- GenLayer validators render the obituary page natively
- Validators optionally inspect linked social profiles for memorial signals
- AI returns one of four bounded verdicts:
  - `CONFIRMED_DEAD`
  - `ALIVE`
  - `INCONCLUSIVE`
  - `FRAUD_DETECTED`

### Layer 3: Grace period

- A confirmed verdict does not execute immediately
- The will enters a 14-day reversible state
- Owner proof-of-life can cancel execution during the grace window

## Privacy Model

| Data Type | On-chain | Encrypted | Off-chain |
| --- | --- | --- | --- |
| Will metadata | Yes | Optional in future | No |
| Beneficiary addresses | Yes | No | No |
| Final message payloads | Demo: plain JSON | Production: yes | Optional |
| Photo/video links | Reference only | Recommended | Yes |
| Obituary and social evidence | No persistent raw storage | N/A | Read at verification time |

## Comparison

| Solution | Verifies death itself | Reversible | Trust assumptions |
| --- | --- | --- | --- |
| AfterLife | Yes, via GenLayer AI + web access | Yes | Validator consensus |
| Safe Haven style dead-man's switch | No | Weak | Timer or operator |
| Sarcophagus style access release | No true death check | Partial | Embalmers / network actors |
| Traditional wills | Human court process | Slow | Lawyers, probate, local law |

## Frontend Architecture

- `app/`: App Router pages for landing, creation, owner dashboard, verification, claims, and messages
- `components/`: reusable cards, badges, countdowns, envelopes, and the verification modal
- `lib/mockWills.ts`: seeded demo data with four narrative paths
- `lib/store.ts`: Zustand store with persistence, simulation logic, and execution actions

## Contract Notes

- All GenLayer deployment constraints from the brief were preserved
- Storage uses `TreeMap` fields only
- Public method signatures avoid `float`
- All `gl.nondet.*` calls are wrapped in `gl.vm.run_nondet_unsafe(...)`
