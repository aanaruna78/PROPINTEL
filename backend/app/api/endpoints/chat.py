from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse
from app.services import chat_service

router = APIRouter()

@router.post("/message", response_model=ChatResponse)
def get_chat_response(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a natural language response from the AI Property Advisor,
    tailored by user role and context history.
    """
    try:
        response = chat_service.process_chat_message(db, request, current_user)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process chat message: {str(e)}")
