"""Deterministic beneficiary credibility scoring engine (v1).

The engine reads existing tables only (no LLM). Each signal contributes a
positive or negative delta capped at its weight. The final score is clamped
to ``[0, 100]`` and mapped to a tier. Snapshots are persisted by
``CredibilityService``.

Signal weights (max contribution each):
    KYC verified                     +15
    Proof submission rate            +20  (proofs per aid request, sigmoid)
    Verifier confirmation rate       +25  (confirmed / (confirmed + disputed))
    Successful disbursements         +15  (count, sigmoid)
    Historical risk profile          +15  (100 - avg recent risk score, scaled)
    Open scam flags                  -10  (per flag, capped at -30)
    Account age (months)             +10  (sigmoid on months)
"""
from __future__ import annotations

import hashlib
import json
import math
from dataclasses import asdict, dataclass, field

from app.models.credibility import CredibilityTier

ENGINE_VERSION = "v1"

TIER_THRESHOLDS = {
    CredibilityTier.verified_partner: 85.0,
    CredibilityTier.trusted: 65.0,
    CredibilityTier.building: 35.0,
    CredibilityTier.new: 0.0,
}


@dataclass
class CredibilityFeatures:
    beneficiary_id: str
    kyc_verified: bool
    aid_request_count: int
    proof_count: int
    disbursed_count: int
    rejected_count: int
    confirmed_verifications: int
    disputed_verifications: int
    avg_recent_risk_score: float | None
    open_scam_flags: int
    account_age_months: float

    def stable_hash(self) -> str:
        payload = json.dumps(asdict(self), sort_keys=True, default=str)
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()


@dataclass
class SignalContribution:
    name: str
    weight: float
    value: float


@dataclass
class CredibilityResult:
    score: float
    tier: CredibilityTier
    signals: list[SignalContribution] = field(default_factory=list)

    def to_breakdown(self) -> dict:
        return {
            "score": round(self.score, 2),
            "tier": self.tier.value,
            "engine_version": ENGINE_VERSION,
            "signals": [
                {"name": s.name, "weight": s.weight, "value": round(s.value, 2)}
                for s in self.signals
            ],
        }


def _sigmoid(x: float, midpoint: float, steepness: float = 1.0) -> float:
    """Logistic curve scaled to ``[0, 1]``. Output is 0.5 at ``midpoint``."""
    try:
        return 1.0 / (1.0 + math.exp(-steepness * (x - midpoint)))
    except OverflowError:
        return 0.0 if x < midpoint else 1.0


def score_to_tier(score: float) -> CredibilityTier:
    for tier, threshold in TIER_THRESHOLDS.items():
        if score >= threshold:
            return tier
    return CredibilityTier.new


def compute(features: CredibilityFeatures) -> CredibilityResult:
    signals: list[SignalContribution] = []

    kyc_value = 15.0 if features.kyc_verified else 0.0
    signals.append(SignalContribution("kyc_verified", 15.0, kyc_value))

    if features.aid_request_count > 0:
        ratio = features.proof_count / features.aid_request_count
        proof_value = 20.0 * min(1.0, ratio / 2.0)
    else:
        proof_value = 0.0
    signals.append(SignalContribution("proof_submission_rate", 20.0, proof_value))

    total_verifications = features.confirmed_verifications + features.disputed_verifications
    if total_verifications > 0:
        confirm_ratio = features.confirmed_verifications / total_verifications
        confidence = min(1.0, total_verifications / 5.0)
        verify_value = 25.0 * confirm_ratio * confidence
    else:
        verify_value = 0.0
    signals.append(SignalContribution("verifier_confirmation_rate", 25.0, verify_value))

    disbursed_value = 15.0 * _sigmoid(features.disbursed_count, midpoint=2.0, steepness=1.2)
    signals.append(SignalContribution("successful_disbursements", 15.0, disbursed_value))

    if features.avg_recent_risk_score is not None:
        risk_value = 15.0 * (1.0 - max(0.0, min(100.0, features.avg_recent_risk_score)) / 100.0)
    else:
        risk_value = 0.0
    signals.append(SignalContribution("historical_risk_profile", 15.0, risk_value))

    flag_penalty = max(-30.0, -10.0 * features.open_scam_flags)
    signals.append(SignalContribution("open_scam_flags", -30.0, flag_penalty))

    age_value = 10.0 * _sigmoid(features.account_age_months, midpoint=3.0, steepness=0.7)
    signals.append(SignalContribution("account_age", 10.0, age_value))

    score = sum(s.value for s in signals)
    score = max(0.0, min(100.0, score))
    tier = score_to_tier(score)
    return CredibilityResult(score=score, tier=tier, signals=signals)
