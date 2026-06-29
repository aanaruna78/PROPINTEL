from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import AllowedRoles
from app.models.user import User
from app.schemas.ura import UraSyncResponse, UraStatusResponse, UraTransactionResponse
from app.services import ura_pipeline

router = APIRouter()

@router.post("/trigger-sync", response_model=UraSyncResponse)
def trigger_sync(
    use_mock: bool = Query(False, description="Force sync using mock transaction feed"),
    db: Session = Depends(get_db),
    current_user: User = Depends(AllowedRoles(["admin", "agency_manager"]))
):
    """
    Triggers URA transaction data synchronization.
    Fetches private residential property transactions, resolves projects, and processes updates.
    """
    try:
        result = ura_pipeline.sync_ura_data(db, use_mock=use_mock)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sync execution failed: {str(e)}")

@router.get("/status", response_model=UraStatusResponse)
def get_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(AllowedRoles(["admin", "agency_manager"]))
):
    """
    Gets the current ingestion status of the URA Data Pipeline.
    """
    try:
        return ura_pipeline.get_pipeline_status(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/transactions", response_model=List[UraTransactionResponse])
def list_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    district: str = Query(None, description="Filter by district (e.g. D01)"),
    project_name: str = Query(None, description="Filter by project name"),
    type_of_sale: str = Query(None, description="Filter by type of sale (e.g. New Sale, Resale)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(AllowedRoles(["admin", "agency_manager", "agent", "buyer", "seller", "investor", "tenant", "landlord"]))
):
    """
    Lists paginated and filtered property transactions.
    """
    try:
        return ura_pipeline.get_transactions(
            db,
            skip=skip,
            limit=limit,
            district=district,
            project_name=project_name,
            type_of_sale=type_of_sale
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
