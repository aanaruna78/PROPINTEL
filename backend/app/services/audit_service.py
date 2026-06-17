import os
import json
import datetime
from typing import List, Dict, Any

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
AUDIT_LOG_DIR = os.getenv("AUDIT_LOG_DIR", os.path.join(BACKEND_DIR, "logs"))
AUDIT_LOG_FILE = os.path.join(AUDIT_LOG_DIR, "audit_events.log")

# In-memory history for quick compliance inspection / testing
AUDIT_EVENT_HISTORY: List[Dict[str, Any]] = []

def log_audit_event(event: str, email: str, details: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Log a security or session compliance event to the audit file and in-memory tracker.
    """
    # Ensure logs directory exists
    os.makedirs(AUDIT_LOG_DIR, exist_ok=True)
    
    timestamp = datetime.datetime.utcnow().isoformat()
    log_entry = {
        "timestamp": timestamp,
        "event": event,
        "email": email,
        "details": details or {}
    }
    
    # Save to in-memory list (limit to 100 events)
    AUDIT_EVENT_HISTORY.insert(0, log_entry)
    if len(AUDIT_EVENT_HISTORY) > 100:
        AUDIT_EVENT_HISTORY.pop()
        
    # Append to local file
    try:
        with open(AUDIT_LOG_FILE, "a") as f:
            f.write(json.dumps(log_entry) + "\n")
    except Exception as e:
        print(f"[AUDIT ERROR] Failed to write audit log entry: {e}")
        
    # Print to console for server visibility
    print(f"[AUDIT LOG] {timestamp} | Event: {event} | User: {email} | Details: {json.dumps(details)}")
    
    return log_entry

def get_audit_history() -> List[Dict[str, Any]]:
    """
    Return recent in-memory audit logs.
    """
    return AUDIT_EVENT_HISTORY
