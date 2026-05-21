"""Production-grade PNG certificate generation using Pillow.

Hydrates dynamic donor/donation text onto the static `lingap-bg-cert.png` template.
Uses bundled Poppins + RobotoMono TTF fonts for consistent rendering across environments.
"""
from __future__ import annotations

import logging
import textwrap
import time
from io import BytesIO
from datetime import datetime
from functools import lru_cache
from pathlib import Path
from typing import Optional

from PIL import Image, ImageDraw, ImageFont

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Template & font asset paths (relative to this file)
# ---------------------------------------------------------------------------
_ASSETS_DIR = Path(__file__).parent.parent / "assets"
_FONT_DIR = _ASSETS_DIR / "fonts"
_DEFAULT_TEMPLATE = Path(__file__).parent.parent.parent.parent / "lingap-bg-cert.png"

# ---------------------------------------------------------------------------
# Layout constants  (calibrated against 1600 × 1200 template)
# ---------------------------------------------------------------------------
# Dynamic text fill zones — all left-aligned at x=130
_LEFT_MARGIN = 130

# Maximum width (px) for dynamic text before wrapping — prevents overflow
# into the squirrel mascot area on the right side (~x=750)
_MAX_TEXT_WIDTH = 600

# Vertical positions (y-coordinate for top of text)
_Y_DONOR_NAME = 455       # Below pre-rendered "DONOR" label (ends ~y=447)
_Y_AMOUNT = 635           # Below pre-rendered "CONTRIBUTION AMOUNT" label (ends ~y=619)
_Y_MILESTONE = 843        # Below pre-rendered "PROJECT MILESTONE" label block

# Audit / metadata block — values positioned right of pre-rendered labels
_Y_DATE = 910             # "DATE:" label row
_X_DATE_VAL = 220         # After "DATE:" label ends

_Y_MERKLE = 935           # "MERKLE PROOF:" label row
_X_MERKLE_VAL = 330       # After "MERKLE PROOF:" label ends

_Y_TX_ID = 958            # "TX ID:" label row
_X_TX_ID_VAL = 210        # After "TX ID:" label ends

_Y_CONSENSUS = 982        # "CONSENSUS HASH:" label row
_X_CONSENSUS_VAL = 360    # After "CONSENSUS HASH:" label ends

# ---------------------------------------------------------------------------
# Font sizes
# ---------------------------------------------------------------------------
_FONT_SIZE_DONOR = 36     # Poppins-Bold for donor name
_FONT_SIZE_AMOUNT = 32    # Poppins-SemiBold for contribution amount
_FONT_SIZE_MILESTONE = 16 # Poppins-Regular for milestone description
_FONT_SIZE_AUDIT = 13     # RobotoMono-Regular for audit/hash values

# ---------------------------------------------------------------------------
# Colors (RGB) — matched to the template palette
# ---------------------------------------------------------------------------
_COLOR_BROWN = (90, 56, 19)       # Dark brown for donor name / milestone
_COLOR_DARK_GREEN = (27, 78, 52)  # Forest green for amount value
_COLOR_TEXT = (80, 68, 55)        # Medium brown for audit metadata


@lru_cache(maxsize=1)
def _load_template(template_path: str) -> Image.Image:
    """Load and cache the base template image in memory.

    Uses lru_cache so the 1.7 MB PNG is decoded once, then reused for every
    certificate generated during the process lifetime.
    """
    path = Path(template_path)
    if not path.exists():
        raise FileNotFoundError(f"Certificate template not found: {path}")

    img = Image.open(path).convert("RGBA")
    logger.info(
        "Certificate template loaded: %s (%dx%d)",
        path.name, img.width, img.height,
    )
    return img


def _load_font(name: str, size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    """Load a TTF font from the bundled fonts directory.

    Falls back to Pillow's built-in default font if the TTF file is missing,
    with a warning log so operators know the certificate will look degraded.
    """
    font_path = _FONT_DIR / name
    try:
        font = ImageFont.truetype(str(font_path), size)
        return font
    except (FileNotFoundError, OSError) as exc:
        logger.warning(
            "Font %s not found at %s (%s) — falling back to default bitmap font. "
            "Certificate text will look degraded. Bundle TTF fonts in %s.",
            name, font_path, exc, _FONT_DIR,
        )
        return ImageFont.load_default()


class PNGCertificateHydrator:
    """Hydrate dynamic text onto the static lingap-bg-cert.png template.

    Thread-safe: the base template is cached and copied per-call.
    """

    def __init__(self, template_path: str | Path | None = None):
        """Initialize hydrator.

        Args:
            template_path: Absolute path to the base PNG template.
                          Auto-detects from repo root if None.
        """
        if template_path is None:
            template_path = _DEFAULT_TEMPLATE

        self._template_path = str(Path(template_path))

        # Pre-validate the template exists
        if not Path(self._template_path).exists():
            raise FileNotFoundError(
                f"Certificate template not found at {self._template_path}"
            )

        # Pre-load fonts
        self._font_donor = _load_font("Poppins-Bold.ttf", _FONT_SIZE_DONOR)
        self._font_amount = _load_font("Poppins-SemiBold.ttf", _FONT_SIZE_AMOUNT)
        self._font_milestone = _load_font("Poppins-Regular.ttf", _FONT_SIZE_MILESTONE)
        self._font_audit = _load_font("RobotoMono-Regular.ttf", _FONT_SIZE_AUDIT)

        logger.info(
            "PNGCertificateHydrator initialized (template=%s)", self._template_path,
        )

    # ------------------------------------------------------------------
    # Text helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _truncate(text: str, max_chars: int, suffix: str = "...") -> str:
        """Truncate text to max_chars, appending suffix if truncated."""
        if len(text) <= max_chars:
            return text
        return text[: max_chars - len(suffix)] + suffix

    def _wrap_text(
        self,
        draw: ImageDraw.ImageDraw,
        text: str,
        font: ImageFont.FreeTypeFont | ImageFont.ImageFont,
        max_width: int,
    ) -> list[str]:
        """Word-wrap text so each line fits within max_width pixels."""
        words = text.split()
        lines: list[str] = []
        current_line = ""

        for word in words:
            test_line = f"{current_line} {word}".strip()
            bbox = draw.textbbox((0, 0), test_line, font=font)
            line_width = bbox[2] - bbox[0]

            if line_width <= max_width:
                current_line = test_line
            else:
                if current_line:
                    lines.append(current_line)
                current_line = word

        if current_line:
            lines.append(current_line)

        return lines or [text]

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def generate(
        self,
        donor_name: str,
        amount: float,
        beneficiary_name: str,
        milestone_description: str,
        donation_date: datetime,
        stellar_tx_hash: str,
        merkle_proof: Optional[str] = None,
        onchain_hash: Optional[str] = None,
    ) -> BytesIO:
        """Generate a certificate PNG by overlaying dynamic text on the template.

        Args:
            donor_name: Donor's display name.
            amount: Donation amount (XLM).
            beneficiary_name: Beneficiary name (context for milestone).
            milestone_description: Project milestone text.
            donation_date: When the donation was made.
            stellar_tx_hash: Stellar blockchain tx hash.
            merkle_proof: Optional merkle proof hash.
            onchain_hash: Optional on-chain consensus hash.

        Returns:
            BytesIO buffer positioned at 0, containing the PNG image data.
        """
        start = time.monotonic()

        # Copy cached template so we don't mutate the original
        img = _load_template(self._template_path).copy()
        draw = ImageDraw.Draw(img)

        # --- Donor name ---
        donor_display = self._truncate(donor_name, 30)
        draw.text(
            (_LEFT_MARGIN, _Y_DONOR_NAME),
            donor_display,
            font=self._font_donor,
            fill=_COLOR_BROWN,
        )

        # --- Contribution amount ---
        formatted_amount = f"{amount:,.2f} XLM"
        draw.text(
            (_LEFT_MARGIN, _Y_AMOUNT),
            formatted_amount,
            font=self._font_amount,
            fill=_COLOR_DARK_GREEN,
        )

        # --- Project milestone (with word-wrap for long descriptions) ---
        milestone_text = milestone_description or f"Donation for {beneficiary_name}"
        lines = self._wrap_text(draw, milestone_text, self._font_milestone, _MAX_TEXT_WIDTH)
        # Limit to 3 lines max
        if len(lines) > 3:
            lines = lines[:3]
            lines[2] = self._truncate(lines[2], len(lines[2]) - 3) + "..."

        y_offset = _Y_MILESTONE
        line_height = _FONT_SIZE_MILESTONE + 6
        for line in lines:
            draw.text(
                (_LEFT_MARGIN, y_offset),
                line,
                font=self._font_milestone,
                fill=_COLOR_BROWN,
            )
            y_offset += line_height

        # --- Audit metadata block ---
        # DATE
        date_str = donation_date.strftime("%B %d, %Y")
        draw.text(
            (_X_DATE_VAL, _Y_DATE),
            date_str,
            font=self._font_audit,
            fill=_COLOR_TEXT,
        )

        # MERKLE PROOF
        if merkle_proof:
            merkle_display = self._truncate(merkle_proof, 35)
            draw.text(
                (_X_MERKLE_VAL, _Y_MERKLE),
                merkle_display,
                font=self._font_audit,
                fill=_COLOR_TEXT,
            )

        # TX ID
        tx_display = self._truncate(stellar_tx_hash, 35)
        draw.text(
            (_X_TX_ID_VAL, _Y_TX_ID),
            tx_display,
            font=self._font_audit,
            fill=_COLOR_TEXT,
        )

        # CONSENSUS HASH
        if onchain_hash:
            hash_display = self._truncate(onchain_hash, 30)
            draw.text(
                (_X_CONSENSUS_VAL, _Y_CONSENSUS),
                hash_display,
                font=self._font_audit,
                fill=_COLOR_TEXT,
            )

        # --- Output ---
        buffer = BytesIO()
        # Optimize: convert to RGB (drop alpha) and use PNG compression
        rgb_img = img.convert("RGB")
        rgb_img.save(buffer, format="PNG", optimize=True)
        buffer.seek(0)

        elapsed_ms = (time.monotonic() - start) * 1000
        logger.info(
            "Certificate generated for donor=%s amount=%.2f in %.1fms (size=%d bytes)",
            donor_name, amount, elapsed_ms, buffer.getbuffer().nbytes,
        )

        return buffer

    def generate_bytes(
        self,
        donor_name: str,
        amount: float,
        beneficiary_name: str,
        milestone_description: str,
        donation_date: datetime,
        stellar_tx_hash: str,
        merkle_proof: Optional[str] = None,
        onchain_hash: Optional[str] = None,
    ) -> bytes:
        """Generate certificate PNG as raw bytes.

        Convenience wrapper around generate() for callers that don't need
        a seekable buffer.
        """
        buffer = self.generate(
            donor_name=donor_name,
            amount=amount,
            beneficiary_name=beneficiary_name,
            milestone_description=milestone_description,
            donation_date=donation_date,
            stellar_tx_hash=stellar_tx_hash,
            merkle_proof=merkle_proof,
            onchain_hash=onchain_hash,
        )
        return buffer.getvalue()
