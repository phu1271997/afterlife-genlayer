# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import json


def normalize_address(value: str) -> str:
    """Normalize an address to lowercase hex string for consistent storage."""
    try:
        return str(Address(str(value))).lower()
    except Exception:
        return str(value).strip().lower()


def safe_address(value: str) -> str:
    """Normalize an address string and fail with a user-facing error if invalid."""
    try:
        return normalize_address(Address(value))
    except Exception:
        raise gl.vm.UserError(f"Invalid address: {value}")


def coerce_confidence(value) -> int:
    """Convert model confidence to an int between 0 and 100 without exposing decimal public types."""
    try:
        text = str(value).strip()
        if text == "":
            return 0
        if "." in text:
            whole, frac = text.split(".", 1)
            base = int(whole or "0")
            first_decimal = int(frac[:1] or "0")
            confidence = base + (1 if first_decimal >= 5 else 0)
        else:
            confidence = int(text)
    except Exception:
        confidence = 0
    if confidence < 0:
        return 0
    if confidence > 100:
        return 100
    return confidence


def normalize_death_verdict(raw: dict) -> dict:
    """Sanitize AI death verification output into a bounded, known schema."""
    valid_verdicts = ["CONFIRMED_DEAD", "ALIVE", "INCONCLUSIVE", "FRAUD_DETECTED"]
    verdict = str(raw.get("verdict", "INCONCLUSIVE")).upper()
    if verdict not in valid_verdicts:
        verdict = "INCONCLUSIVE"

    evidence = raw.get("evidence_sources", [])
    if not isinstance(evidence, list):
        evidence = []
    evidence_strs = [str(item).strip() for item in evidence if str(item).strip()][:8]

    red_flags = raw.get("red_flags", [])
    if not isinstance(red_flags, list):
        red_flags = []
    flags = [str(item).strip() for item in red_flags if str(item).strip()][:5]

    return {
        "verdict": verdict,
        "confidence": coerce_confidence(raw.get("confidence", 0)),
        "evidence_sources": evidence_strs,
        "red_flags": flags,
        "reasoning": str(raw.get("reasoning", "No reasoning provided.")).strip()[:3000],
        "estimated_death_date": str(raw.get("estimated_death_date", "")).strip()[:50],
    }


def verdict_is_valid(data) -> bool:
    """Validator check that ensures the returned schema stays inside safe bounds."""
    if not isinstance(data, dict):
        return False
    if str(data.get("verdict", "")).upper() not in [
        "CONFIRMED_DEAD",
        "ALIVE",
        "INCONCLUSIVE",
        "FRAUD_DETECTED",
    ]:
        return False
    confidence = coerce_confidence(data.get("confidence", -1))
    if confidence < 0 or confidence > 100:
        return False
    return True


def _current_block() -> u256:
    """Get current block number safely. Raises gl.vm.UserError if unavailable."""
    if not hasattr(gl.message, "block_number"):
        raise gl.vm.UserError(
            "gl.message.block_number not available in this genvm version. "
            "Update to genvm v0.2.16+ for block-based grace period enforcement."
        )
    return u256(int(gl.message.block_number))


class AfterLife(gl.Contract):
    """
    AfterLife — AI-verified digital will protocol on GenLayer.

    Manages 3-phase death verification protocol:
    1. ACTIVE (proof-of-life)
    2. VERIFICATION_PENDING → AI consensus
    3. GRACE_PERIOD (14-day reversibility window)
    4. EXECUTED (assets distributed, messages unsealed)
    """

    wills: TreeMap[str, str]
    beneficiary_claims: TreeMap[str, str]
    balances: TreeMap[str, u256]
    user_wills: TreeMap[str, str]  # sender -> JSON array of will_ids
    final_messages: TreeMap[str, str]
    recipient_public_keys: TreeMap[str, str]  # recipient address -> ECDH public key hex

    total_supply: u256
    token_symbol: str
    will_counter: u256
    message_counter: u256
    initial_grant: u256
    creation_fee: u256
    verification_fee: u256
    grace_period_blocks: u256

    def __init__(self):
        super().__init__()
        # GenLayer storage collections auto-initialize; only assign primitives here.
        self.total_supply = u256(0)
        self.token_symbol = "LIFE"
        self.will_counter = u256(0)
        self.message_counter = u256(0)
        self.initial_grant = u256(200)
        self.creation_fee = u256(10)
        self.verification_fee = u256(5)
        # Default 14 days × 24h × 60min × 60sec / ~5sec per block ≈ 241,920 blocks
        self.grace_period_blocks = u256(241920)

    @gl.public.write
    def claim_starter_tokens(self) -> str:
        sender = normalize_address(gl.message.sender_address)
        current_balance = self.balances.get(sender, u256(0))
        if current_balance > u256(0):
            raise gl.vm.UserError("Already claimed starter tokens")

        self.balances[sender] = self.initial_grant
        self.total_supply = self.total_supply + self.initial_grant

        return json.dumps(
            {
                "status": "granted",
                "amount": int(self.initial_grant),
                "balance": int(self.initial_grant),
            },
            sort_keys=True,
        )

    @gl.public.write
    def create_will(
        self,
        will_id: str,
        owner_full_name: str,
        owner_birth_year: int,
        owner_city: str,
        check_in_interval_days: int,
        beneficiaries_json: str,
        digital_assets_json: str,
        social_links_json: str,
    ) -> str:
        will_id = will_id.strip()
        owner_full_name = owner_full_name.strip()
        owner_city = owner_city.strip()

        if will_id == "":
            raise gl.vm.UserError("will_id required")
        if self.wills.get(will_id, "") != "":
            raise gl.vm.UserError("will_id already exists")
        if owner_full_name == "":
            raise gl.vm.UserError("Owner full name required for verification")
        if owner_birth_year < 1900 or owner_birth_year > 2026:
            raise gl.vm.UserError("Invalid birth year")
        if check_in_interval_days not in [30, 60, 90]:
            raise gl.vm.UserError("check_in_interval_days must be 30, 60, or 90")

        try:
            beneficiaries = json.loads(beneficiaries_json)
            if not isinstance(beneficiaries, list) or len(beneficiaries) == 0:
                raise gl.vm.UserError("At least one beneficiary required")
            total_share = 0
            for beneficiary in beneficiaries:
                if not isinstance(beneficiary, dict):
                    raise gl.vm.UserError("Invalid beneficiary entry")
                total_share += int(beneficiary.get("share", 0))
                beneficiary["address"] = safe_address(str(beneficiary.get("address", "")))
                beneficiary["name"] = str(beneficiary.get("name", "")).strip()[:120]
            if total_share != 100:
                raise gl.vm.UserError(f"Beneficiary shares must total 100, got {total_share}")
        except json.JSONDecodeError:
            raise gl.vm.UserError("Invalid beneficiaries JSON")
        except gl.vm.UserError:
            raise
        except Exception as error:
            raise gl.vm.UserError(f"Beneficiary validation failed: {str(error)[:100]}")

        try:
            digital_assets = json.loads(digital_assets_json) if digital_assets_json.strip() else []
            if not isinstance(digital_assets, list):
                raise gl.vm.UserError("digital_assets_json must decode to a list")
        except json.JSONDecodeError:
            raise gl.vm.UserError("Invalid digital assets JSON")

        try:
            social_links = json.loads(social_links_json) if social_links_json.strip() else []
            if not isinstance(social_links, list):
                raise gl.vm.UserError("social_links_json must decode to a list")
        except json.JSONDecodeError:
            raise gl.vm.UserError("Invalid social links JSON")

        sender = normalize_address(gl.message.sender_address)
        balance = self.balances.get(sender, u256(0))
        if balance < self.creation_fee:
            raise gl.vm.UserError("Insufficient LIFE balance to create will")

        self.balances[sender] = balance - self.creation_fee
        self.will_counter = self.will_counter + u256(1)

        block_number = int(_current_block())

        will = {
            "id": will_id,
            "owner_address": sender,
            "owner_full_name": owner_full_name,
            "owner_birth_year": owner_birth_year,
            "owner_city": owner_city,
            "check_in_interval_days": check_in_interval_days,
            "beneficiaries": beneficiaries,
            "digital_assets": digital_assets,
            "social_links": social_links,
            "status": "ACTIVE",
            "last_check_in_block": block_number,
            "check_ins_count": 1,
            "death_verdict": "",
            "death_confidence": 0,
            "death_evidence": [],
            "death_red_flags": [],
            "death_reasoning": "",
            "estimated_death_date": "",
            "verification_triggered_by": "",
            "grace_period_started_block": 0,
            "executed_block": 0,
            "fee_paid": int(self.creation_fee),
            "will_number": int(self.will_counter),
        }

        self.wills[will_id] = json.dumps(will, sort_keys=True)

        # Append to user wills list
        existing_str = self.user_wills.get(sender, "[]")
        try:
            existing_list = json.loads(existing_str)
            if not isinstance(existing_list, list):
                existing_list = []
        except Exception:
            existing_list = []

        if will_id not in existing_list:
            existing_list.append(will_id)
        self.user_wills[sender] = json.dumps(existing_list, sort_keys=True)

        return json.dumps(
            {
                "status": "created",
                "will_id": will_id,
                "will_number": int(self.will_counter),
                "balance_remaining": int(self.balances[sender]),
            },
            sort_keys=True,
        )

    @gl.public.write
    def proof_of_life(self, will_id: str) -> str:
        will_raw = self.wills.get(will_id, "")
        if will_raw == "":
            raise gl.vm.UserError("Unknown will_id")

        will = json.loads(will_raw)
        sender = normalize_address(gl.message.sender_address)
        if normalize_address(will["owner_address"]) != sender:
            raise gl.vm.UserError("Only will owner can check in")
        if will["status"] not in ["ACTIVE", "VERIFICATION_PENDING", "GRACE_PERIOD"]:
            raise gl.vm.UserError("Will is not in a state that accepts check-ins")

        if will["status"] in ["VERIFICATION_PENDING", "GRACE_PERIOD"]:
            will["status"] = "ACTIVE"
            will["death_verdict"] = ""
            will["death_confidence"] = 0
            will["death_evidence"] = []
            will["death_red_flags"] = []
            will["death_reasoning"] = ""
            will["estimated_death_date"] = ""
            will["verification_triggered_by"] = ""
            will["grace_period_started_block"] = 0

        block_number = int(_current_block())
        will["last_check_in_block"] = block_number
        will["check_ins_count"] = int(will["check_ins_count"]) + 1

        self.wills[will_id] = json.dumps(will, sort_keys=True)

        return json.dumps(
            {
                "status": "checked_in",
                "will_id": will_id,
                "check_ins_count": int(will["check_ins_count"]),
                "will_status": will["status"],
            },
            sort_keys=True,
        )

    @gl.public.write
    def add_final_message(
        self,
        will_id: str,
        recipient_address: str,
        message_text: str,
        media_url: str,
    ) -> str:
        will_raw = self.wills.get(will_id, "")
        if will_raw == "":
            raise gl.vm.UserError("Unknown will_id")

        will = json.loads(will_raw)
        sender = normalize_address(gl.message.sender_address)
        if normalize_address(will["owner_address"]) != sender:
            raise gl.vm.UserError("Only will owner can add messages")

        recipient = safe_address(recipient_address)
        trimmed_message = message_text.strip()[:15000]  # Allow larger limits for encrypted blocks
        if trimmed_message == "":
            raise gl.vm.UserError("Message text required")

        self.message_counter = self.message_counter + u256(1)
        message_id = f"MSG-{int(self.message_counter):06d}"

        message = {
            "message_id": message_id,
            "will_id": will_id,
            "from_address": sender,
            "from_name": will["owner_full_name"],
            "to_address": recipient,
            "message_text": trimmed_message,
            "media_url": media_url.strip()[:500],
            "sealed": True,
            "created_will_check_in": int(will["check_ins_count"]),
        }

        self.final_messages[message_id] = json.dumps(message, sort_keys=True)

        return json.dumps({"status": "sealed", "message_id": message_id}, sort_keys=True)

    @gl.public.write
    def register_recipient_public_key(self, public_key: str) -> str:
        sender = normalize_address(gl.message.sender_address)
        pk = public_key.strip()
        if pk == "" or len(pk) < 32:
            raise gl.vm.UserError("Invalid public key")
        self.recipient_public_keys[sender] = pk
        return json.dumps({"status": "registered", "address": sender}, sort_keys=True)

    @gl.public.view
    def get_recipient_public_key(self, address: str) -> str:
        addr = normalize_address(address)
        return self.recipient_public_keys.get(addr, "")

    @gl.public.write
    def trigger_death_verification(self, will_id: str, obituary_url: str) -> str:
        will_raw = self.wills.get(will_id, "")
        if will_raw == "":
            raise gl.vm.UserError("Unknown will_id")

        will = json.loads(will_raw)
        if will["status"] != "ACTIVE":
            raise gl.vm.UserError("Will is not in ACTIVE state")

        sender = normalize_address(gl.message.sender_address)
        beneficiaries = will["beneficiaries"]
        is_beneficiary = any(normalize_address(beneficiary.get("address", "")) == sender for beneficiary in beneficiaries)
        if not is_beneficiary:
            raise gl.vm.UserError("Only beneficiaries can trigger verification")

        balance = self.balances.get(sender, u256(0))
        if balance < self.verification_fee:
            raise gl.vm.UserError("Insufficient LIFE balance for verification fee")

        self.balances[sender] = balance - self.verification_fee

        owner_name = str(will["owner_full_name"])
        owner_birth_year = int(will["owner_birth_year"])
        owner_city = str(will["owner_city"])
        social_links = will["social_links"]
        social_links_json = json.dumps(social_links)

        def leader_fn():
            obituary_content = ""
            try:
                obituary_content = gl.nondet.web.render(obituary_url, mode="text")[:2000]
            except Exception:
                obituary_content = "[Unable to fetch obituary URL]"

            social_evidence = ""
            try:
                if isinstance(social_links, list) and len(social_links) > 0:
                    social_evidence = gl.nondet.web.render(str(social_links[0]), mode="text")[:1500]
                else:
                    social_evidence = "[No social media data available]"
            except Exception:
                social_evidence = "[Unable to fetch social media evidence]"

            prompt = f"""
You are an AI death verification validator for AfterLife, a decentralized digital will protocol.

YOUR MISSION: Determine whether the owner of this will has truly passed away. You must be conservative because a false confirmation can trigger irreversible inheritance.

WILL OWNER DETAILS:
- Full Name: {owner_name}
- Birth Year: {owner_birth_year}
- City: {owner_city}
- Social Media: {social_links_json}

CLAIMED OBITUARY URL: {obituary_url}

OBITUARY CONTENT RETRIEVED:
{obituary_content}

SOCIAL MEDIA STATE:
{social_evidence}

CHECKLIST:
1. Verify obituary authenticity, name, age, and city alignment.
2. Cross-reference memorial activity and account silence.
3. Look for fraud indicators, vague details, or suspicious domains.
4. Default to INCONCLUSIVE when evidence is weak.

CLASSIFICATION RULES:
- CONFIRMED_DEAD: confidence 85 or higher, multiple sources agree, no serious fraud indicators
- ALIVE: evidence suggests the owner is still active
- INCONCLUSIVE: evidence is insufficient or conflicting
- FRAUD_DETECTED: strong evidence of manipulation or fake documents

RETURN STRICT JSON:
{{
  "verdict": "CONFIRMED_DEAD" | "ALIVE" | "INCONCLUSIVE" | "FRAUD_DETECTED",
  "confidence": integer 0-100,
  "evidence_sources": ["Specific source 1", "Specific source 2"],
  "red_flags": ["Concern 1"],
  "reasoning": "3-5 sentence explanation of verdict with key evidence",
  "estimated_death_date": "YYYY-MM-DD or empty string if unknown"
}}
""".strip()

            raw_verdict = gl.nondet.exec_prompt(prompt, response_format="json")
            return normalize_death_verdict(raw_verdict)

        # Real validator consensus principle enforcement (Yêu cầu #3)
        comparative_principle = (
            "Validators MUST agree on the death verdict. This is irreversible "
            "inheritance — accuracy is critical. "
            "(1) verdict EXACT MATCH required between validators: "
            "    CONFIRMED_DEAD ≠ ALIVE ≠ INCONCLUSIVE ≠ FRAUD_DETECTED. "
            "    Any verdict disagreement → consensus FAILS. "
            "(2) confidence — within ±15 points AND must be consistent with verdict: "
            "    CONFIRMED_DEAD requires confidence ≥ 85 (per contract rule). "
            "    If one validator says CONFIRMED_DEAD with conf 90 and another "
            "    says CONFIRMED_DEAD with conf 60, that's still a MISMATCH because "
            "    the 60-confidence validator would not trigger grace period. "
            "(3) red_flags must agree on existence of fraud indicators: "
            "    if one validator detects 'fake obituary domain' and another "
            "    doesn't, the disagreement is meaningful — consensus FAILS. "
            "(4) Each validator MUST independently fetch the obituary URL and "
            "    social media, NOT blindly accept the leader's evidence. "
            "Minor wording differences in 'reasoning' are acceptable, but the "
            "verdict and confidence band must align. "
            "If a validator's web.render fails for the obituary URL, it must "
            "default to INCONCLUSIVE — NEVER blanket-accept leader's CONFIRMED_DEAD."
        )

        verdict = gl.eq_principle.prompt_comparative(leader_fn, principle=comparative_principle)

        refund = u256(0)
        if verdict["verdict"] == "CONFIRMED_DEAD" and int(verdict["confidence"]) >= 85:
            will["status"] = "GRACE_PERIOD"
            will["grace_period_started_block"] = int(_current_block())
            self.balances[sender] = self.balances.get(sender, u256(0)) + self.verification_fee
            refund = self.verification_fee
        elif verdict["verdict"] == "FRAUD_DETECTED":
            will["status"] = "ACTIVE"
            # Bug #8: Prevent underflow of total_supply
            if int(self.total_supply) >= int(self.verification_fee):
                self.total_supply = self.total_supply - self.verification_fee
            else:
                self.total_supply = u256(0)
        elif verdict["verdict"] == "ALIVE":
            will["status"] = "ACTIVE"
            self.balances[sender] = self.balances.get(sender, u256(0)) + self.verification_fee
            refund = self.verification_fee
        else:
            will["status"] = "ACTIVE"
            # Bug #7: u256 division fix
            half_fee = u256(int(self.verification_fee) // 2)
            self.balances[sender] = self.balances.get(sender, u256(0)) + half_fee
            refund = half_fee

        will["death_verdict"] = verdict["verdict"]
        will["death_confidence"] = int(verdict["confidence"])
        will["death_evidence"] = verdict["evidence_sources"]
        will["death_red_flags"] = verdict["red_flags"]
        will["death_reasoning"] = verdict["reasoning"]
        will["estimated_death_date"] = verdict["estimated_death_date"]
        will["verification_triggered_by"] = sender
        self.wills[will_id] = json.dumps(will, sort_keys=True)

        return json.dumps(
            {
                "status": will["status"],
                "will_id": will_id,
                "verdict": verdict["verdict"],
                "confidence": int(verdict["confidence"]),
                "fee_refunded": int(refund),
                "grace_period_blocks": int(self.grace_period_blocks),
                "full_verification": verdict,
            },
            sort_keys=True,
        )

    @gl.public.write
    def execute_will(self, will_id: str) -> str:
        will_raw = self.wills.get(will_id, "")
        if will_raw == "":
            raise gl.vm.UserError("Unknown will_id")

        will = json.loads(will_raw)
        if will["status"] != "GRACE_PERIOD":
            raise gl.vm.UserError("Will is not in grace period")

        sender = normalize_address(gl.message.sender_address)
        beneficiaries = will["beneficiaries"]
        is_beneficiary = any(normalize_address(beneficiary.get("address", "")) == sender for beneficiary in beneficiaries)
        if not is_beneficiary:
            raise gl.vm.UserError("Only beneficiaries can execute will")

        # === CRITICAL FIX: ENFORCE GRACE PERIOD (Yêu cầu #4) ===
        current_block = _current_block()
        grace_started = u256(int(will["grace_period_started_block"]))

        if grace_started == u256(0):
            raise gl.vm.UserError("Grace period start block not recorded. Will cannot be executed.")

        blocks_elapsed = current_block - grace_started
        if blocks_elapsed < self.grace_period_blocks:
            blocks_remaining = int(self.grace_period_blocks) - int(blocks_elapsed)
            raise gl.vm.UserError(
                f"Grace period not yet elapsed. "
                f"Current block: {int(current_block)}, "
                f"Grace started: {int(grace_started)}, "
                f"Blocks remaining: {blocks_remaining}, "
                f"Required: {int(self.grace_period_blocks)} blocks"
            )

        will["status"] = "EXECUTED"
        will["executed_block"] = int(current_block)
        self.wills[will_id] = json.dumps(will, sort_keys=True)

        return json.dumps(
            {
                "status": "executed",
                "will_id": will_id,
                "beneficiaries_count": len(beneficiaries),
                "messages_unlocked": True,
                "executed_by": sender,
                "grace_period_elapsed_blocks": int(blocks_elapsed),
            },
            sort_keys=True,
        )

    @gl.public.view
    def get_will(self, will_id: str) -> str:
        will_raw = self.wills.get(will_id, "")
        if will_raw == "":
            raise gl.vm.UserError("Unknown will_id")
        return will_raw

    @gl.public.view
    def get_final_message(self, message_id: str) -> str:
        msg_raw = self.final_messages.get(message_id, "")
        if msg_raw == "":
            raise gl.vm.UserError("Unknown message_id")

        message = json.loads(msg_raw)
        will_raw = self.wills.get(str(message["will_id"]), "")
        if will_raw == "":
            return json.dumps({"error": "Associated will not found"}, sort_keys=True)

        will = json.loads(will_raw)
        if will["status"] != "EXECUTED":
            message["message_text"] = "[SEALED - Unlocks when will is executed]"
            message["media_url"] = ""
            message["sealed"] = True
        else:
            message["sealed"] = False

        return json.dumps(message, sort_keys=True)

    @gl.public.view
    def get_user_will_ids(self, address: str) -> str:
        addr = normalize_address(address)
        return self.user_wills.get(addr, "[]")

    @gl.public.view
    def get_user_will_id(self, address: str) -> str:
        """Maintain backward compatibility by returning the first will_id in user's list."""
        addr = normalize_address(address)
        arr_str = self.user_wills.get(addr, "[]")
        try:
            arr = json.loads(arr_str)
            if isinstance(arr, list) and len(arr) > 0:
                return str(arr[0])
        except Exception:
            pass
        return ""

    @gl.public.view
    def get_balance(self, address: str) -> u256:
        addr = normalize_address(address)
        return self.balances.get(addr, u256(0))

    @gl.public.view
    def get_total_supply(self) -> u256:
        return self.total_supply

    @gl.public.view
    def get_will_count(self) -> u256:
        return self.will_counter

    @gl.public.write
    def transfer(self, to: str, amount: u256) -> str:
        recipient = safe_address(to)
        sender = normalize_address(gl.message.sender_address)
        if amount <= u256(0):
            raise gl.vm.UserError("Amount must be positive")

        sender_balance = self.balances.get(sender, u256(0))
        if sender_balance < amount:
            raise gl.vm.UserError("Insufficient balance")

        self.balances[sender] = sender_balance - amount
        self.balances[recipient] = self.balances.get(recipient, u256(0)) + amount

        return json.dumps(
            {
                "status": "transferred",
                "from": sender,
                "to": recipient,
                "amount": int(amount),
            },
            sort_keys=True,
        )
