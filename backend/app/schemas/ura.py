from pydantic import BaseModel, ConfigDict
from typing import Optional, List

class UraSyncResponse(BaseModel):
    status: str
    new_projects_created: int
    new_transactions_ingested: int
    duplicates_skipped: int
    errors: List[str] = []

class UraStatusResponse(BaseModel):
    total_projects: int
    total_transactions: int
    last_sync_timestamp: Optional[str] = None
    status: str

class UraTransactionResponse(BaseModel):
    id: int
    project_id: int
    project_name: str
    district: str
    contract_date: str
    price: float
    area_sqm: float
    area_sqft: float
    psf: float
    property_type: str
    tenure: str
    floor_range: str
    type_of_sale: str
    no_of_units: int
    type_of_area: str
    nett_price: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)
