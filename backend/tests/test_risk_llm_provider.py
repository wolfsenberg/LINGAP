"""Tests for the provider-agnostic LLM config + LLMEngine client wiring.

Covers two slices:
1. ``Settings.effective_*`` resolvers prefer new LLM_* names, fall back to
   legacy OPENAI_* names so existing .env files keep working.
2. ``LLMEngine`` uses the resolved api_key / base_url / model when calling
   the OpenAI-compatible client. We monkeypatch ``AsyncOpenAI`` so the
   test never makes a network call.
"""
from __future__ import annotations

from types import SimpleNamespace

import pytest

from app.config import Settings


def test_effective_keys_prefer_llm_new_names():
    s = Settings(
        LLM_API_KEY="gsk_new",
        LLM_BASE_URL="https://api.groq.com/openai/v1",
        LLM_MODEL="llama-3.1-8b-instant",
        OPENAI_API_KEY="sk_legacy",
        OPENAI_MODEL="gpt-4o-mini",
    )
    assert s.effective_api_key == "gsk_new"
    assert s.effective_base_url == "https://api.groq.com/openai/v1"
    assert s.effective_model == "llama-3.1-8b-instant"


def test_effective_keys_fall_back_to_legacy_openai():
    s = Settings(
        LLM_API_KEY="",
        LLM_MODEL="",
        OPENAI_API_KEY="sk_legacy",
        OPENAI_MODEL="gpt-4o-mini",
    )
    assert s.effective_api_key == "sk_legacy"
    # When falling back to legacy OpenAI key, base_url should be empty so the
    # client uses OpenAI's default endpoint instead of pointing at Groq.
    assert s.effective_base_url == ""
    assert s.effective_model == "gpt-4o-mini"


def test_effective_model_default_when_all_empty():
    s = Settings(LLM_API_KEY="", LLM_MODEL="", OPENAI_API_KEY="", OPENAI_MODEL="")
    assert s.effective_api_key == ""
    assert s.effective_model == "llama-3.1-8b-instant"


@pytest.mark.asyncio
async def test_llm_engine_passes_groq_base_url(monkeypatch):
    """LLMEngine must hand the resolved base_url to AsyncOpenAI."""
    from app.ai import llm as llm_module
    from app.ai.base import RiskFeatures

    captured: dict = {}

    class FakeCompletions:
        async def create(self, **kwargs):
            captured["model"] = kwargs.get("model")
            return SimpleNamespace(
                choices=[
                    SimpleNamespace(
                        message=SimpleNamespace(
                            content='{"score": 12, "level": "low", "flags": [], "reasoning": "ok"}'
                        )
                    )
                ]
            )

    class FakeChat:
        completions = FakeCompletions()

    class FakeAsyncOpenAI:
        def __init__(self, *, api_key, base_url):
            captured["api_key"] = api_key
            captured["base_url"] = base_url
            self.chat = FakeChat()

    monkeypatch.setattr(llm_module.settings, "LLM_API_KEY", "gsk_test_key")
    monkeypatch.setattr(llm_module.settings, "LLM_BASE_URL", "https://api.groq.com/openai/v1")
    monkeypatch.setattr(llm_module.settings, "LLM_MODEL", "llama-3.1-8b-instant")
    monkeypatch.setattr(llm_module.settings, "LLM_PROVIDER", "groq")
    monkeypatch.setattr(llm_module.settings, "OPENAI_API_KEY", "")
    monkeypatch.setattr(llm_module.settings, "OPENAI_MODEL", "")

    import openai

    monkeypatch.setattr(openai, "AsyncOpenAI", FakeAsyncOpenAI)

    features = RiskFeatures(
        aid_request_id="r1",
        requested_amount=100.0,
        asset="XLM",
        purpose="medical bills",
        age_seconds=60.0,
        beneficiary_id="b1",
        beneficiary_verified=True,
        beneficiary_total_received=0.0,
        beneficiary_location="Manila",
        proofs=[],
        prior_flags_open=0,
        recent_request_count=0,
        velocity_window_seconds=86400.0,
    )

    result = await llm_module.llm_engine.assess(features)

    assert captured["api_key"] == "gsk_test_key"
    assert captured["base_url"] == "https://api.groq.com/openai/v1"
    assert captured["model"] == "llama-3.1-8b-instant"
    assert result.model_version == "groq:llama-3.1-8b-instant"


@pytest.mark.asyncio
async def test_llm_engine_uses_openai_default_when_legacy_only(monkeypatch):
    """When only OPENAI_API_KEY is set, base_url must be None (OpenAI default)."""
    from app.ai import llm as llm_module
    from app.ai.base import RiskFeatures

    captured: dict = {}

    class FakeAsyncOpenAI:
        def __init__(self, *, api_key, base_url):
            captured["api_key"] = api_key
            captured["base_url"] = base_url
            self.chat = SimpleNamespace(
                completions=SimpleNamespace(
                    create=self._create
                )
            )

        async def _create(self, **kwargs):
            captured["model"] = kwargs.get("model")
            return SimpleNamespace(
                choices=[
                    SimpleNamespace(
                        message=SimpleNamespace(
                            content='{"score": 5, "level": "low", "flags": [], "reasoning": "ok"}'
                        )
                    )
                ]
            )

    monkeypatch.setattr(llm_module.settings, "LLM_API_KEY", "")
    monkeypatch.setattr(llm_module.settings, "LLM_MODEL", "")
    monkeypatch.setattr(llm_module.settings, "LLM_PROVIDER", "openai")
    monkeypatch.setattr(llm_module.settings, "OPENAI_API_KEY", "sk_legacy")
    monkeypatch.setattr(llm_module.settings, "OPENAI_MODEL", "gpt-4o-mini")

    import openai

    monkeypatch.setattr(openai, "AsyncOpenAI", FakeAsyncOpenAI)

    features = RiskFeatures(
        aid_request_id="r1",
        requested_amount=100.0,
        asset="XLM",
        purpose="medical bills",
        age_seconds=60.0,
        beneficiary_id="b1",
        beneficiary_verified=True,
        beneficiary_total_received=0.0,
        beneficiary_location="Manila",
        proofs=[],
        prior_flags_open=0,
        recent_request_count=0,
        velocity_window_seconds=86400.0,
    )

    await llm_module.llm_engine.assess(features)

    assert captured["api_key"] == "sk_legacy"
    assert captured["base_url"] is None
    assert captured["model"] == "gpt-4o-mini"
