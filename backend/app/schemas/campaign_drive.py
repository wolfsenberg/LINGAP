from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.models.campaign_drive import CampaignDriveStatus


class CampaignDriveCreate(BaseModel):
    title: str
    description: str
    category: str
    institution: str
    location: str
    goal_amount: float
    image_src: str | None = None


class CampaignDriveRead(BaseModel):
    id: str
    organizer_id: UUID | None = None
    title: str
    description: str = ""
    category: str
    status: str
    raised_amount: float
    goal_amount: float
    progress: int
    donors: int
    institution: str
    location: str = ""
    image_src: str | None = None
    updated_at: datetime
    source: str = "database"


class CampaignDriveUpdateStatus(BaseModel):
    status: CampaignDriveStatus
