import pytest
import json
from genlayer import gl, Address

def test_claim_starter_tokens(contract):
    # Setup caller
    gl.message.sender_address = Address("0x1111111111111111111111111111111111111111")
    
    # Claim first time
    res = contract.claim_starter_tokens()
    data = json.loads(res)
    assert data["status"] == "granted"
    assert data["amount"] == 200
    assert contract.get_balance(gl.message.sender_address) == 200
    
    # Claim second time should raise error
    with pytest.raises(Exception, match="Already claimed starter tokens"):
        contract.claim_starter_tokens()


def test_create_will_address_normalization_and_multiple_wills(contract):
    owner = "0x1111111111111111111111111111111111111111"
    beneficiary = "0x2222222222222222222222222222222222222222"
    
    gl.message.sender_address = Address(owner)
    
    # Give owner balance
    contract.claim_starter_tokens()
    
    # Create first will
    will_id_1 = "WILL-001"
    beneficiaries = [{"address": beneficiary.upper(), "name": "Beneficiary 1", "share": 100}]
    
    res = contract.create_will(
        will_id=will_id_1,
        owner_full_name="Evelyn Winters",
        owner_birth_year=1945,
        owner_city="Boston",
        check_in_interval_days=30,
        beneficiaries_json=json.dumps(beneficiaries),
        digital_assets_json="[]",
        social_links_json="[]"
    )
    
    data = json.loads(res)
    assert data["status"] == "created"
    assert data["will_id"] == will_id_1
    assert contract.get_balance(owner) == 190 # 200 - 10 creation fee
    
    # Create second will (Bug #10 support)
    will_id_2 = "WILL-002"
    contract.create_will(
        will_id=will_id_2,
        owner_full_name="Evelyn Winters",
        owner_birth_year=1945,
        owner_city="Boston",
        check_in_interval_days=60,
        beneficiaries_json=json.dumps(beneficiaries),
        digital_assets_json="[]",
        social_links_json="[]"
    )
    
    # Verify both will IDs are tracked in user_wills
    will_ids_json = contract.get_user_will_ids(owner)
    will_ids = json.loads(will_ids_json)
    assert will_id_1 in will_ids
    assert will_id_2 in will_ids
    assert len(will_ids) == 2
    
    # Verify backward compatibility
    assert contract.get_user_will_id(owner) == will_id_1


def test_proof_of_life_resets_grace_period(contract):
    owner = "0x1111111111111111111111111111111111111111"
    beneficiary = "0x2222222222222222222222222222222222222222"
    gl.message.sender_address = Address(owner)
    
    contract.claim_starter_tokens()
    contract.create_will(
        will_id="WILL-001",
        owner_full_name="Evelyn Winters",
        owner_birth_year=1945,
        owner_city="Boston",
        check_in_interval_days=30,
        beneficiaries_json=json.dumps([{"address": beneficiary, "name": "Ben", "share": 100}]),
        digital_assets_json="[]",
        social_links_json="[]"
    )
    
    # Trigger verification as beneficiary
    gl.message.sender_address = Address(beneficiary)
    contract.claim_starter_tokens()
    
    # Mock AI response to CONFIRMED_DEAD
    gl.message.block_number = 105
    res = contract.trigger_death_verification("WILL-001", "https://obits.com/evelyn")
    res_data = json.loads(res)
    assert res_data["status"] == "GRACE_PERIOD"
    
    # Verify will is in GRACE_PERIOD
    will = json.loads(contract.get_will("WILL-001"))
    assert will["status"] == "GRACE_PERIOD"
    assert will["grace_period_started_block"] == 105
    
    # Owner checks in (Proof of life should reset status to ACTIVE)
    gl.message.sender_address = Address(owner)
    contract.proof_of_life("WILL-001")
    
    will = json.loads(contract.get_will("WILL-001"))
    assert will["status"] == "ACTIVE"
    assert will["grace_period_started_block"] == 0


def test_grace_period_block_enforcement(contract):
    owner = "0x1111111111111111111111111111111111111111"
    beneficiary = "0x2222222222222222222222222222222222222222"
    
    # Evelyn creates will
    gl.message.sender_address = Address(owner)
    contract.claim_starter_tokens()
    contract.create_will(
        will_id="WILL-001",
        owner_full_name="Evelyn",
        owner_birth_year=1945,
        owner_city="Boston",
        check_in_interval_days=30,
        beneficiaries_json=json.dumps([{"address": beneficiary, "name": "Liam", "share": 100}]),
        digital_assets_json="[]",
        social_links_json="[]"
    )
    
    # Set grace period to 10 blocks for testing
    contract.grace_period_blocks = 10
    
    # Liam triggers verification at block 100
    gl.message.sender_address = Address(beneficiary)
    contract.claim_starter_tokens()
    gl.message.block_number = 100
    contract.trigger_death_verification("WILL-001", "https://obituary")
    
    # Liam tries to execute immediately at block 105 (less than 10 blocks elapsed)
    gl.message.block_number = 105
    with pytest.raises(Exception, match="Grace period not yet elapsed"):
        contract.execute_will("WILL-001")
        
    # Liam executes at block 110 (exactly 10 blocks elapsed)
    gl.message.block_number = 110
    res = contract.execute_will("WILL-001")
    res_data = json.loads(res)
    assert res_data["status"] == "executed"
    
    will = json.loads(contract.get_will("WILL-001"))
    assert will["status"] == "EXECUTED"
    assert will["executed_block"] == 110


def test_recipient_public_key_registry(contract):
    user = "0x2222222222222222222222222222222222222222"
    gl.message.sender_address = Address(user)
    
    # Register public key
    pk = "04fcae1289ab7cdef1394a737890bcdef1234567890abcdeffab12345678"
    contract.register_recipient_public_key(pk)
    
    # Retrieve public key
    assert contract.get_recipient_public_key(user) == pk
    assert contract.get_recipient_public_key(user.upper()) == pk


def test_fraud_slashing_underflow_protection(contract):
    owner = "0x1111111111111111111111111111111111111111"
    beneficiary = "0x2222222222222222222222222222222222222222"
    gl.message.sender_address = Address(owner)
    contract.claim_starter_tokens()
    contract.create_will(
        will_id="WILL-001",
        owner_full_name="Evelyn",
        owner_birth_year=1945,
        owner_city="Boston",
        check_in_interval_days=30,
        beneficiaries_json=json.dumps([{"address": beneficiary, "name": "Liam", "share": 100}]),
        digital_assets_json="[]",
        social_links_json="[]"
    )
    
    # Attacker triggers verification
    gl.message.sender_address = Address(beneficiary)
    contract.claim_starter_tokens()
    
    # Mock AI response to FRAUD_DETECTED
    gl.nondet.exec_prompt = lambda prompt, response_format=None: {
        "verdict": "FRAUD_DETECTED",
        "confidence": 99,
        "evidence_sources": ["Fake domain"],
        "red_flags": ["Impersonation attempt"],
        "reasoning": "Obituary submitted is fake.",
        "estimated_death_date": ""
    }
    
    # Setup initial supply to be small to test underflow protection
    contract.total_supply = 2 # lower than verification fee (5)
    
    gl.message.block_number = 120
    contract.trigger_death_verification("WILL-001", "https://fakeobits.com/evelyn")
    
    # Verify total supply is 0, not underflowed
    assert contract.get_total_supply() == 0
    
    # Will is still ACTIVE
    will = json.loads(contract.get_will("WILL-001"))
    assert will["status"] == "ACTIVE"
