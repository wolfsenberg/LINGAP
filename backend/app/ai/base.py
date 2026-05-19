"""Engine-agnostic risk types.

Both the rules engine and the OpenAI engine return a ``RiskResult`` that
the ``RiskService`` persists as a ``RiskAssessment`` + derived
``ScamFlag`` rows.
"""
from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass, field
from typing import Protocol

from app.models.aid_request import RiskLevel


@dataclass
class ProofSummary:
    id: str
    kind: str
    mime: str
    size_bytes: int
    claimed_amount: float | None
    sha256: str


@dataclass
class RiskFeatures:
    aid_request_id: str
    requested_amount: float
    asset: str
    purpose: str
    age_seconds: float
    beneficiary_id: str
    beneficiary_verified: bool
    beneficiary_total_received: float
    beneficiary_location: str
    proofs: list[ProofSummary] = field(default_factory=list)
    prior_flags_open: int = 0
    recent_request_count: int = 0
    velocity_window_seconds: float = 0

    def stable_hash(self) -> str:
        payload = json.dumps(
            {
                "aid_request_id": self.aid_request_id,
                "requested_amount": self.requested_amount,
                "purpose": self.purpose,
                "proof_count": len(self.proofs),
                "proof_shas": sorted(p.sha256 for p in self.proofs),
                "proof_claimed_sum": sum(
                    (p.claimed_amount or 0.0) for p in self.proofs
                ),
                "beneficiary_verified": self.beneficiary_verified,
                "beneficiary_total_received": self.beneficiary_total_received,
                "prior_flags_open": self.prior_flags_open,
            },
            sort_keys=True,
            default=str,
        ).encode("utf-8")
        return hashlib.sha256(payload).hexdigest()


@dataclass
class RiskFlag:
    type: str
    severity: str  # low | medium | high | critical
    reason: str
    details: dict | None = None


@dataclass
class RiskResult:
    score: float  # 0..100; higher = riskier
    level: RiskLevel
    flags: list[RiskFlag]
    reasoning: str
    model_version: str


class RiskEngine(Protocol):
    name: str

    async def assess(self, features: RiskFeatures) -> RiskResult: ...


def score_to_level(score: float) -> RiskLevel:
    if score >= 80:
        return RiskLevel.critical
    if score >= 60:
        return RiskLevel.high
    if score >= 35:
        return RiskLevel.medium
    return RiskLevel.low
