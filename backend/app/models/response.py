"""Response models for API endpoints"""

from typing import List, Optional, Dict, Any

from pydantic import BaseModel, Field


class Suggestion(BaseModel):
    """A single response suggestion"""

    text: str = Field(..., min_length=1, description="Suggested response text")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score")
    reasoning: Optional[str] = Field(None, description="Explanation of suggestion")


class Metadata(BaseModel):
    """Metadata about the suggestion generation"""

    request_id: str
    processing_time_ms: int = Field(..., ge=0)
    model_used: str
    timestamp: int


class SuggestResponse(BaseModel):
    """Response containing generated suggestions"""

    suggestions: List[Suggestion] = Field(..., min_length=1)
    metadata: Metadata


class AutonomousResponse(BaseModel):
    """Response from autonomous agent (YOLO mode)"""

    action: str = Field(..., description="Action taken: respond, escalate, or goal_complete")
    response_text: Optional[str] = Field(None, description="Generated response (if action=respond)")
    updated_state: BaseModel = Field(..., description="Updated goal state")
    reasoning: str = Field(..., description="Explanation of decision")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence in decision")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
