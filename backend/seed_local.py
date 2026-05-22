import asyncio
import json
from decimal import Decimal
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.models.beneficiary import Beneficiary
from app.models.aid_request import AidRequest, AidRequestStatus
from app.models.donation import Donation
from app.models.donation_certificate import DonationCertificate
from app.models.user import User
from app.models.progress_update import ProgressUpdate, VerifierConfirmation
from app.models.verification import Verification
from app.models.proof_artifact import ProofArtifact
from app.models.provenance import ProvenanceRecord
from app.config import settings

async def seed():
    engine = create_async_engine(settings.DATABASE_URL)
    session_maker = async_sessionmaker(engine)
    
    with open("app/data/seed_campaigns.json", "r") as f:
        data = json.load(f)

    async with session_maker() as session:
        for item in data:
            b_data = item["beneficiary"]
            a_data = item["aid_request"]

            # Set Manila coordinates so it shows up in "Trending Now" /near endpoint
            b = Beneficiary(
                id=b_data["id"],
                name=b_data["name"],
                national_id=b_data["national_id"],
                location=b_data["location"],
                category=b_data["category"],
                need_level=b_data["need_level"],
                verified=b_data["verified"],
                latitude=Decimal("14.5995"),
                longitude=Decimal("120.9842")
            )
            
            # Use 'approved' status since geo.py filters for 'approved' by default
            req = AidRequest(
                id=a_data["id"],
                beneficiary_id=b_data["id"],
                requested_amount=a_data["requested_amount"],
                asset=a_data["asset"],
                purpose=a_data["purpose"],
                status=AidRequestStatus.approved
            )

            session.add(b)
            session.add(req)
        
        await session.commit()
    print("Database successfully seeded with trending campaigns!")

if __name__ == "__main__":
    asyncio.run(seed())
