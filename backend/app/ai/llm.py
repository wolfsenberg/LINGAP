"""OpenAI-backed risk engine.

Wraps an OpenAI chat completion that returns a JSON-schema-shaped risk
verdict. Falls back to the rules engine on any error (missing key,
network, schema violation) so the API never breaks because of an LLM
outage.
"""
from __future__ import annotations

import json
import logging
from typing import Any

from app.config import settings

from .base import RiskFeatures, RiskFlag, RiskResult, score_to_level
from .rules import rules_engine

log = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "You are a senior fraud-risk analyst for a humanitarian aid platform "
    "(LINGAP). You receive structured features about an aid request: who "
    "the beneficiary is, what they're asking for, what proofs (receipts, "
    "documents, photos) have been uploaded, and historical patterns. "
    "Return a STRICT JSON object matching the provided schema. Be skeptical "
    "of vague purposes, large unverified asks, missing receipts, and rapid "
    "request velocity. Severity scale: low, medium, high, critical."
)

RESPONSE_SCHEMA: dict[str, Any] = {
    "type": "object",
    "additionalProperties": False,
    "required": ["score", "level", "flags", "reasoning"],
    "properties": {
        "score": {"type": "integer", "minimum": 0, "maximum": 100},
        "level": {"type": "string", "enum": ["low", "medium", "high", "critical"]},
        "flags": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["type", "severity", "reason"],
                "properties": {
                    "type": {"type": "string"},
                    "severity": {
                        "type": "string",
                        "enum": ["low", "medium", "high", "critical"],
                    },
                    "reason": {"type": "string"},
                },
            },
        },
        "reasoning": {"type": "string"},
    },
}


def _features_payload(features: RiskFeatures) -> dict[str, Any]:
    return {
        "aid_request_id": features.aid_request_id,
        "requested_amount": features.requested_amount,
        "asset": features.asset,
        "purpose": features.purpose,
        "age_seconds": features.age_seconds,
        "beneficiary": {
            "id": features.beneficiary_id,
            "verified": features.beneficiary_verified,
            "total_received": features.beneficiary_total_received,
            "location": features.beneficiary_location,
        },
        "proofs": [
            {
                "id": p.id,
                "kind": p.kind,
                "mime": p.mime,
                "size_bytes": p.size_bytes,
                "claimed_amount": p.claimed_amount,
            }
            for p in features.proofs
        ],
        "prior_flags_open": features.prior_flags_open,
        "recent_request_count": features.recent_request_count,
        "velocity_window_seconds": features.velocity_window_seconds,
    }


class LLMEngine:
    name = "llm"

    async def assess(self, features: RiskFeatures) -> RiskResult:
        if not settings.OPENAI_API_KEY:
            log.info("OPENAI_API_KEY empty; falling back to rules engine")
            return await rules_engine.assess(features)

        try:
            from openai import AsyncOpenAI
        except ImportError:
            log.warning("openai package not installed; falling back to rules engine")
            return await rules_engine.assess(features)

        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        payload = _features_payload(features)

        try:
            completion = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": (
                            "Assess this aid request. Reply with ONLY JSON "
                            "matching the schema.\n\n"
                            f"SCHEMA:\n{json.dumps(RESPONSE_SCHEMA)}\n\n"
                            f"FEATURES:\n{json.dumps(payload)}"
                        ),
                    },
                ],
                response_format={"type": "json_object"},
                temperature=0,
            )
            content = completion.choices[0].message.content or "{}"
            data = json.loads(content)
        except Exception as exc:  # noqa: BLE001 — broad fallback intentional
            log.exception("LLM risk assessment failed; falling back to rules: %s", exc)
            return await rules_engine.assess(features)

        try:
            score = float(data["score"])
            level_raw = str(data["level"]).lower()
            reasoning = str(data.get("reasoning", ""))
            raw_flags = data.get("flags") or []
            flags = [
                RiskFlag(
                    type=str(f["type"]),
                    severity=str(f["severity"]).lower(),
                    reason=str(f["reason"]),
                )
                for f in raw_flags
                if isinstance(f, dict) and {"type", "severity", "reason"} <= f.keys()
            ]
        except (KeyError, TypeError, ValueError) as exc:
            log.warning("LLM returned malformed risk payload (%s); using rules", exc)
            return await rules_engine.assess(features)

        # Lower-bound: never let the LLM under-call obvious heuristic flags.
        rules_result = await rules_engine.assess(features)
        score = max(score, rules_result.score)
        merged_flag_types = {f.type for f in flags}
        for rf in rules_result.flags:
            if rf.type not in merged_flag_types:
                flags.append(rf)

        try:
            level = score_to_level(score)
        except Exception:  # noqa: BLE001
            level = score_to_level(score)

        # Use the model-provided level only if it equals or exceeds derived.
        from app.models.aid_request import RiskLevel

        order = {RiskLevel.low: 0, RiskLevel.medium: 1, RiskLevel.high: 2, RiskLevel.critical: 3}
        try:
            llm_level = RiskLevel(level_raw)
            if order[llm_level] > order[level]:
                level = llm_level
        except ValueError:
            pass

        return RiskResult(
            score=score,
            level=level,
            flags=flags,
            reasoning=reasoning or rules_result.reasoning,
            model_version=f"openai:{settings.OPENAI_MODEL}",
        )


llm_engine = LLMEngine()
