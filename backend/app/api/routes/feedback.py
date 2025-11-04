from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import logging
import uuid
import time

logger = logging.getLogger(__name__)
router = APIRouter()


class FeedbackRequest(BaseModel):
    request_id: str = Field(..., description="Original request ID")
    rating: int = Field(..., ge=1, le=5, description="Rating 1-5")
    feedback_text: Optional[str] = Field(None, description="Optional feedback text")
    suggestion_used: bool = Field(..., description="Whether suggestion was used")
    modified: bool = Field(False, description="Whether suggestion was modified")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")


class FeedbackResponse(BaseModel):
    feedback_id: str
    status: str
    message: str


@router.post("/feedback", response_model=FeedbackResponse)
async def submit_feedback(feedback: FeedbackRequest):
    """Submit feedback on AI suggestions"""
    try:
        feedback_id = str(uuid.uuid4())
        
        # TODO: Store feedback in Firestore or analytics system
        # For now, just log it
        logger.info(
            f"Feedback received: {feedback_id} | "
            f"Request: {feedback.request_id} | "
            f"Rating: {feedback.rating} | "
            f"Used: {feedback.suggestion_used} | "
            f"Modified: {feedback.modified}"
        )
        
        if feedback.feedback_text:
            logger.info(f"Feedback text: {feedback.feedback_text}")
        
        return FeedbackResponse(
            feedback_id=feedback_id,
            status="success",
            message="Feedback recorded successfully"
        )
    
    except Exception as e:
        logger.error(f"Error recording feedback: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to record feedback: {str(e)}")
