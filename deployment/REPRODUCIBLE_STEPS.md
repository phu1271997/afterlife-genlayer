# AfterLife Contract Deployment & Run Steps

This guide details the steps to compile, deploy, test, and run the AfterLife project on GenLayer studionet.

---

## 1. Smart Contract Deployment (GenLayer Studio)

To deploy the **AfterLife** intelligent contract on **studionet**:

1. **Reset GenLayer Studio Storage**:
   - Open [GenLayer Studio](https://studio.genlayer.com/run-debug).
   - Navigate to `Settings` -> `Reset Storage` -> `Confirm`.
   - Perform a hard refresh on the Studio page.
2. **Deploy Storage Mock**:
   - Deploy `contracts/storage_test.py` first to ensure the environment is healthy.
   - Verify deployment output.
3. **Deploy AfterLife Contract**:
   - Open and copy the contents of `contracts/afterlife.py`.
   - Create a new file named `afterlife.py` inside the Studio editor.
   - Deploy `afterlife.py`.
   - Copy the deployed contract address and set it as `NEXT_PUBLIC_AFTERLIFE_CONTRACT_ADDRESS` inside the frontend `.env` configuration.

---

## 2. Running Contract Tests Locally

To verify all contract logic (address normalization, consensus principality, block height grace enforcement, public key registry, underflow security):

```bash
# Run pytest excluding gltest plugin conflicts
PYTHONPATH=. pytest -p no:gltest tests/
```

Expected output:
```text
tests/test_afterlife.py ...... [100%]
====== 6 passed in 0.01s ======
```

---

## 3. Running the Frontend App

To start the local Next.js development server:

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the dApp.

---

## 4. Pre-seeded Demo Walkthrough

Navigate to `/demo` inside the app:
1. **Scenario 1 (Evelyn's Will)**:
   - Connect wallet.
   - Register public key under `/register-key`.
   - Create a will with an encrypted letter.
   - Trigger death verification by submitting an obituary URL.
   - Let validators check and vote `CONFIRMED_DEAD`.
   - Observe block-based countdown, wait for grace blocks, and execute.
2. **Scenario 2 (Fraud Detection)**:
   - Create will with $LIFE tokens staked.
   - Attacker attempts early claim with a fake obituary.
   - Observe AI Consensus returning `FRAUD_DETECTED` and slashing the staked fee. Will remains active.
