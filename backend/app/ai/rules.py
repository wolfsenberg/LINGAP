"""Deterministic rule-based risk engine.

Always available, no external dependencies. Used as a baseline whenever
the LLM engine is unconfigured or errors out, and as a lower-bound during
LLM scoring so heuristics can't be silenced by a bad model response.
"""
from __future__ import annotations

import re

from .base import RiskEngine, RiskFeatures, RiskFlag, RiskResult, score_to_level

MODEL_VERSION = "rules-v1"

VAGUE_PURPOSE_KEYWORDS = {"help", "support", "donate", "money", "need", "urgent", "please"}
MIN_PURPOSE_LENGTH = 20

UNVERIFIED_AMOUNT_THRESHOLD = 5_000.0
LARGE_AMOUNT_THRESHOLD = 100_000.0
VARIANCE_THRESHOLD = 0.25  # 25% variance triggers a flag
VELOCITY_THRESHOLD = 3  # >3 requests in 24h is suspicious
RECEIPT_GRACE_SECONDS = 72 * 3600  # 72h to upload a receipt


def _claimed_total(features: RiskFeatures) -> float:
    return sum((p.claimed_amount or 0.0) for p in features.proofs)


def _vague_purpose_score(features: RiskFeatures) -> tuple[float, RiskFlag | None]:
    text = (features.purpose or "").strip().lower()
    if len(text) < MIN_PURPOSE_LENGTH:
        return 25.0, RiskFlag(
            type="vague_purpose",
            severity="medium",
            reason=f"Purpose too short ({len(text)} chars)",
        )
    tokens = re.findall(r"[a-z]+", text)
    if tokens and len(set(tokens) & VAGUE_PURPOSE_KEYWORDS) / max(1, len(tokens)) > 0.4:
        return 15.0, RiskFlag(
            type="vague_purpose",
            severity="low",
            reason="Purpose dominated by vague keywords",
        )
    return 0.0, None


def _unverified_beneficiary(features: RiskFeatures) -> tuple[float, RiskFlag | None]:
    if features.beneficiary_verified:
        return 0.0, None
    if features.requested_amount > UNVERIFIED_AMOUNT_THRESHOLD:
        sev = "critical" if features.requested_amount > LARGE_AMOUNT_THRESHOLD else "high"
        return 35.0 if sev == "critical" else 20.0, RiskFlag(
            type="unverified_beneficiary_large_ask",
            severity=sev,
            reason=(
                f"Unverified beneficiary requesting {features.requested_amount:.2f} "
                f"> threshold {UNVERIFIED_AMOUNT_THRESHOLD:.2f}"
            ),
        )
    return 10.0, RiskFlag(
        type="unverified_beneficiary",
        severity="low",
        reason="Beneficiary KYC/verification not complete",
    )


def _variance(features: RiskFeatures) -> tuple[float, RiskFlag | None]:
    claimed = _claimed_total(features)
    if claimed <= 0 or features.requested_amount <= 0:
        return 0.0, None
    variance = abs(features.requested_amount - claimed) / features.requested_amount
    if variance > VARIANCE_THRESHOLD:
        sev = "high" if variance > 0.5 else "medium"
        return 25.0 if sev == "high" else 12.0, RiskFlag(
            type="spending_variance",
            severity=sev,
            reason=(
                f"Claimed total {claimed:.2f} vs requested "
                f"{features.requested_amount:.2f} ({variance:.0%} variance)"
            ),
            details={"variance_pct": round(variance * 100, 2)},
        )
    return 0.0, None


def _velocity(features: RiskFeatures) -> tuple[float, RiskFlag | None]:
    if features.recent_request_count > VELOCITY_THRESHOLD:
        return 20.0, RiskFlag(
            type="request_velocity",
            severity="high",
            reason=(
                f"{features.recent_request_count} requests for this beneficiary "
                f"in the last 24h"
            ),
        )
    return 0.0, None


def _missing_receipts(features: RiskFeatures) -> tuple[float, RiskFlag | None]:
    if features.age_seconds > RECEIPT_GRACE_SECONDS and not features.proofs:
        return 20.0, RiskFlag(
            type="missing_receipts",
            severity="medium",
            reason="No proofs uploaded after 72h",
        )
    return 0.0, None


def _prior_flags(features: RiskFeatures) -> tuple[float, RiskFlag | None]:
    if features.prior_flags_open > 0:
        return 15.0, RiskFlag(
            type="prior_open_flags",
            severity="medium",
            reason=f"{features.prior_flags_open} open scam flag(s) already on this request",
        )
    return 0.0, None


class RulesEngine:
    name = "rules"

    async def assess(self, features: RiskFeatures) -> RiskResult:
        flags: list[RiskFlag] = []
        score = 0.0
        for rule in (
            _vague_purpose_score,
            _unverified_beneficiary,
            _variance,
            _velocity,
            _missing_receipts,
            _prior_flags,
        ):
            delta, flag = rule(features)
            score += delta
            if flag:
                flags.append(flag)
        score = min(100.0, score)
        reasoning = (
            f"Rules baseline = {score:.1f} from {len(flags)} flag(s)"
            if flags
            else "Rules baseline = 0; no heuristic triggered"
        )
        return RiskResult(
            score=score,
            level=score_to_level(score),
            flags=flags,
            reasoning=reasoning,
            model_version=MODEL_VERSION,
        )


# Module-level singleton, conforms to RiskEngine protocol.
rules_engine: RiskEngine = RulesEngine()
