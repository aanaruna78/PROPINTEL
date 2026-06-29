from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any

class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str
    metadata: Optional[Dict[str, Any]] = None

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []

class ChatResponse(BaseModel):
    response: str
    intent: str  # "search_properties" | "hdb_intel" | "market_pulse" | "general"
    metadata: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)
