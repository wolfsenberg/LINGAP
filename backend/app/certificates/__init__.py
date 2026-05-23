"""Certificate PDF generation using reportlab."""
from io import BytesIO
from datetime import datetime

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

from app.config import settings


def generate_certificate_pdf(
    donor_name: str,
    amount: float,
    beneficiary_name: str,
    milestone_description: str,
    lives_touched: int,
    total_donated: float,
    current_donation: float,
    donation_date: datetime,
    stellar_tx_hash: str,
) -> bytes:
    """Generate certificate PDF using template.

    Args:
        donor_name: Name of donor
        amount: Donation amount
        beneficiary_name: Beneficiary name
        milestone_description: Milestone description (e.g., "Chemo Cycle 3")
        lives_touched: Count of beneficiaries helped
        total_donated: Total amount donated by this donor
        current_donation: This specific donation amount
        donation_date: Date of donation
        stellar_tx_hash: Stellar blockchain transaction hash

    Returns:
        PDF content as bytes
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=0.75 * inch, leftMargin=0.75 * inch, topMargin=0.5 * inch, bottomMargin=0.5 * inch)

    styles = getSampleStyleSheet()
    story = []

    emerald = HexColor("#10B891")
    navy = HexColor("#0F172A")
    text_color = HexColor("#4B5563")

    title_style = ParagraphStyle(
        "CertTitle",
        parent=styles["Heading1"],
        fontSize=14,
        textColor=emerald,
        spaceAfter=6,
        alignment=TA_CENTER,
        fontName=settings.CERTIFICATE_TITLE_FONT,
    )

    cert_name_style = ParagraphStyle(
        "CertName",
        parent=styles["Normal"],
        fontSize=24,
        textColor=navy,
        spaceAfter=12,
        alignment=TA_CENTER,
        fontName=settings.CERTIFICATE_TITLE_FONT,
    )

    donor_name_style = ParagraphStyle(
        "DonorName",
        parent=styles["Normal"],
        fontSize=28,
        textColor=navy,
        spaceAfter=12,
        alignment=TA_CENTER,
        fontName=settings.CERTIFICATE_TITLE_FONT,
        bold=True,
    )

    amount_style = ParagraphStyle(
        "Amount",
        parent=styles["Normal"],
        fontSize=32,
        textColor=emerald,
        spaceAfter=12,
        alignment=TA_CENTER,
        fontName=settings.CERTIFICATE_TITLE_FONT,
        bold=True,
    )

    body_style = ParagraphStyle(
        "BodyText",
        parent=styles["Normal"],
        fontSize=12,
        textColor=text_color,
        spaceAfter=8,
        alignment=TA_CENTER,
        fontName=settings.CERTIFICATE_BODY_FONT,
    )

    milestone_style = ParagraphStyle(
        "Milestone",
        parent=styles["Normal"],
        fontSize=14,
        textColor=navy,
        spaceAfter=12,
        alignment=TA_CENTER,
        fontName=settings.CERTIFICATE_TITLE_FONT,
        bold=True,
    )

    footer_style = ParagraphStyle(
        "Footer",
        parent=styles["Normal"],
        fontSize=10,
        textColor=text_color,
        spaceAfter=4,
        alignment=TA_CENTER,
        fontName=settings.CERTIFICATE_BODY_FONT,
    )

    story.append(Spacer(1, 0.3 * inch))

    story.append(Paragraph("CERTIFICATE OF HUMANITARIAN IMPACT", title_style))
    story.append(Spacer(1, 0.1 * inch))

    story.append(Paragraph("LINGAP", cert_name_style))
    story.append(Paragraph("Ledger for Integrity, Need-based Giving, Aid Provenance & Protection", footer_style))

    story.append(Spacer(1, 0.3 * inch))

    story.append(Paragraph("This certifies that", body_style))
    story.append(Spacer(1, 0.08 * inch))

    story.append(Paragraph(donor_name, donor_name_style))

    story.append(Spacer(1, 0.12 * inch))
    story.append(Paragraph("has made a verified, blockchain-recorded donation of", body_style))

    story.append(Spacer(1, 0.12 * inch))
    story.append(Paragraph(f"₱{current_donation:,.2f}", amount_style))

    story.append(Spacer(1, 0.12 * inch))
    story.append(Paragraph("in support of the verified campaign", body_style))

    story.append(Spacer(1, 0.08 * inch))
    story.append(Paragraph(f"<b>{beneficiary_name}</b>", milestone_style))

    story.append(Spacer(1, 0.12 * inch))
    story.append(Paragraph(f"<b>Milestone:</b> {milestone_description}", milestone_style))

    story.append(Spacer(1, 0.2 * inch))

    metrics_data = [
        ["Lives Touched", "Total Donated", "This Donation"],
        [str(lives_touched), f"₱{total_donated:,.2f}", f"₱{current_donation:,.2f}"],
    ]

    metrics_table = Table(metrics_data, colWidths=[2 * inch, 1.5 * inch, 1.5 * inch])
    metrics_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), HexColor("#F0F9F7")),
                ("TEXTCOLOR", (0, 0), (-1, 0), emerald),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("FONTNAME", (0, 0), (-1, 0), settings.CERTIFICATE_TITLE_FONT),
                ("FONTSIZE", (0, 0), (-1, 0), 11),
                ("FONTSIZE", (0, 1), (-1, 1), 12),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
                ("TOPPADDING", (0, 1), (-1, 1), 8),
                ("GRID", (0, 0), (-1, -1), 1, HexColor("#E5E7EB")),
            ]
        )
    )

    story.append(metrics_table)

    story.append(Spacer(1, 0.2 * inch))

    story.append(Paragraph("STELLAR BLOCKCHAIN TRANSACTION REFERENCE", footer_style))
    story.append(Paragraph(f"<b>Tx Hash:</b> {stellar_tx_hash[:32]}...", footer_style))
    story.append(Paragraph(f"<b>Date:</b> {donation_date.strftime('%B %d, %Y at %H:%M %Z')}", footer_style))

    story.append(Spacer(1, 0.15 * inch))

    story.append(Paragraph("Immutable Record • Publicly Verifiable • Blockchain-Backed", footer_style))

    doc.build(story)

    buffer.seek(0)
    return buffer.getvalue()
