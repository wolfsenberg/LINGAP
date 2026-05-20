"""Alembic migration for on-chain certificate schema."""
# Usage: alembic revision --autogenerate -m "Add on-chain certificate fields"
# Then run: alembic upgrade head

# This is a template migration. For your project's migration directory:
# backend/app/migrations/versions/XXX_add_onchain_certificate_fields.py


"""Add on-chain certificate verification fields.

Revision ID: add_onchain_cert_001
Revises: 
Create Date: 2025-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "add_onchain_cert_001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add new columns for on-chain certificate verification."""
    
    # Add new columns to donation_certificates table
    op.add_column(
        'donation_certificates',
        sa.Column('svg_s3_url', sa.String(length=1024), nullable=True)
    )
    op.add_column(
        'donation_certificates',
        sa.Column('svg_hash', sa.String(length=64), nullable=True)
    )
    op.add_column(
        'donation_certificates',
        sa.Column('stellar_tx_hash', sa.String(length=64), nullable=True, unique=True)
    )
    op.add_column(
        'donation_certificates',
        sa.Column('merkle_proof', sa.Text(), nullable=True)
    )
    op.add_column(
        'donation_certificates',
        sa.Column('onchain_hash', sa.String(length=64), nullable=True)
    )
    op.add_column(
        'donation_certificates',
        sa.Column('verified', sa.Boolean(), nullable=False, server_default='false')
    )
    
    # Create indexes for frequently queried columns
    op.create_index(
        'idx_certificates_stellar_tx',
        'donation_certificates',
        ['stellar_tx_hash'],
        unique=True
    )
    op.create_index(
        'idx_certificates_svg_hash',
        'donation_certificates',
        ['svg_hash']
    )


def downgrade() -> None:
    """Remove on-chain certificate columns."""
    
    op.drop_index('idx_certificates_svg_hash', table_name='donation_certificates')
    op.drop_index('idx_certificates_stellar_tx', table_name='donation_certificates')
    
    op.drop_column('donation_certificates', 'verified')
    op.drop_column('donation_certificates', 'onchain_hash')
    op.drop_column('donation_certificates', 'merkle_proof')
    op.drop_column('donation_certificates', 'stellar_tx_hash')
    op.drop_column('donation_certificates', 'svg_hash')
    op.drop_column('donation_certificates', 'svg_s3_url')
