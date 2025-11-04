from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging
import uuid

logger = logging.getLogger(__name__)
router = APIRouter()


class ConversationLog(BaseModel):
    log_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    mode: str = Field(..., description="suggestion or autonomous")
    goal_description: Optional[str] = None
    conversation_context: List[Dict[str, Any]]
    actions_taken: List[Dict[str, Any]]
    outcome: str = Field(..., description="completed, escalated, or interrupted")
    timestamp: int = Field(default_factory=lambda: int(datetime.now().timestamp()))
    metadata: Optional[Dict[str, Any]] = None


class LogResponse(BaseModel):
    log_id: str
    status: str
    message: str


class LogsListResponse(BaseModel):
    logs: List[ConversationLog]
    total: int
    page: int
    page_size: int


# In-memory storage for demo (replace with Firestore in production)
conversation_logs_storage: Dict[str, ConversationLog] = {}


@router.post("/conversation-logs", response_model=LogResponse)
async def save_conversation_log(log: ConversationLog):
    """Save conversation log (primarily for YOLO mode audit trail)"""
    try:
        # Validate mode
        if log.mode not in ["suggestion", "autonomous"]:
            raise HTTPException(status_code=400, detail="Mode must be 'suggestion' or 'autonomous'")
        
        # Validate outcome
        if log.outcome not in ["completed", "escalated", "interrupted"]:
            raise HTTPException(
                status_code=400,
                detail="Outcome must be 'completed', 'escalated', or 'interrupted'"
            )
        
        # TODO: Store in Firestore
        # For now, store in memory
        conversation_logs_storage[log.log_id] = log
        
        logger.info(
            f"Conversation log saved: {log.log_id} | "
            f"Session: {log.session_id} | "
            f"Mode: {log.mode} | "
            f"Outcome: {log.outcome}"
        )
        
        return LogResponse(
            log_id=log.log_id,
            status="success",
            message="Conversation log saved successfully"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving conversation log: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save log: {str(e)}")


@router.get("/conversation-logs", response_model=LogsListResponse)
async def get_conversation_logs(
    session_id: Optional[str] = Query(None, description="Filter by session ID"),
    mode: Optional[str] = Query(None, description="Filter by mode (suggestion/autonomous)"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page")
):
    """Retrieve conversation logs with optional filters"""
    try:
        # Filter logs
        filtered_logs = list(conversation_logs_storage.values())
        
        if session_id:
            filtered_logs = [log for log in filtered_logs if log.session_id == session_id]
        
        if mode:
            if mode not in ["suggestion", "autonomous"]:
                raise HTTPException(status_code=400, detail="Mode must be 'suggestion' or 'autonomous'")
            filtered_logs = [log for log in filtered_logs if log.mode == mode]
        
        # Sort by timestamp (newest first)
        filtered_logs.sort(key=lambda x: x.timestamp, reverse=True)
        
        # Paginate
        total = len(filtered_logs)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated_logs = filtered_logs[start_idx:end_idx]
        
        return LogsListResponse(
            logs=paginated_logs,
            total=total,
            page=page,
            page_size=page_size
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving conversation logs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve logs: {str(e)}")
