import asyncio
import uuid
from sqlalchemy import text
from app.core.database import AsyncSessionLocal

async def mint_mock():
    async with AsyncSessionLocal() as session:
        # Get ALL users
        res = await session.execute(text("SELECT id, name FROM users"))
        users = res.fetchall()
        
        for user_row in users:
            donor_id = str(user_row[0])
            donor_name = user_row[1]
            
            # Create a mock donation to attach the certificates to
            donation_id_1 = str(uuid.uuid4())
            tx_hash_1 = f"tx_abc123_{donor_id[:8]}"
            await session.execute(text(f"""
                INSERT INTO donations (id, donor_id, amount, asset, purpose, stellar_tx_hash, blockchain_confirmed, disbursed, disbursed_amount, created_at, updated_at)
                VALUES ('{donation_id_1}', '{donor_id}', 12000, 'XLM', 'Typhoon Relief 2026', '{tx_hash_1}', true, false, 0, now(), now())
            """))
            
            donation_id_2 = str(uuid.uuid4())
            tx_hash_2 = f"tx_def456_{donor_id[:8]}"
            await session.execute(text(f"""
                INSERT INTO donations (id, donor_id, amount, asset, purpose, stellar_tx_hash, blockchain_confirmed, disbursed, disbursed_amount, created_at, updated_at)
                VALUES ('{donation_id_2}', '{donor_id}', 8500, 'XLM', 'Child Education Fund', '{tx_hash_2}', true, false, 0, now(), now())
            """))

            # Create certificate 1
            cert_id_1 = str(uuid.uuid4())
            await session.execute(text(f"""
                INSERT INTO donation_certificates (
                    id, donation_id, s3_url, pdf_hash, is_public, 
                    donor_name, amount, beneficiary_name, milestone_description, 
                    lives_touched, total_donated, stellar_tx_hash, verified, created_at, updated_at
                ) VALUES (
                    '{cert_id_1}', '{donation_id_1}', 'http://mock1', 'mockpdf1', true,
                    '{donor_name}', 12000, 'Typhoon Relief Fund', 'Emergency food packs deployed',
                    120, 12000, '{tx_hash_1}', true, now(), now()
                )
            """))
            
            # Create certificate 2
            cert_id_2 = str(uuid.uuid4())
            await session.execute(text(f"""
                INSERT INTO donation_certificates (
                    id, donation_id, s3_url, pdf_hash, is_public, 
                    donor_name, amount, beneficiary_name, milestone_description, 
                    lives_touched, total_donated, stellar_tx_hash, verified, created_at, updated_at
                ) VALUES (
                    '{cert_id_2}', '{donation_id_2}', 'http://mock2', 'mockpdf2', true,
                    '{donor_name}', 8500, 'LINGAP Education Network', 'Tuition escrow funded for Q1',
                    5, 20500, '{tx_hash_2}', true, now(), now()
                )
            """))
            
        await session.commit()
        print(f"SUCCESS: Minted 2 mock certificates for ALL {len(users)} users.")

if __name__ == "__main__":
    asyncio.run(mint_mock())
