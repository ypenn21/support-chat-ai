"""Response models for API endpoints"""

from typing import List, Optional

from pydantic import BaseModel, Field


class Suggestion(BaseModel):
    """A single response suggestion"""

    id: str
    content: str = Field(..., min_length=1)
    confidence: float = Field(..., ge=0.0, le=1.0)
    reasoning: Optional[str] = None


class Metadata(BaseModel):
    """Metadata about the suggestion generation"""

    model_used: str
    latency: float = Field(..., ge=0.0)
    token_count: int = Field(..., ge=0)


class SuggestResponse(BaseModel):
    """Response containing generated suggestions"""

    suggestions: List[Suggestion] = Field(..., min_length=1)
    metadata: Metadata

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "suggestions": [
                        {
                            "id": "sugg_123",
                            "content": "Thank you for providing your order number. I've checked on order #12345 and I can see it's currently in transit. It should arrive within 2-3 business days. Would you like me to send you the tracking information?",
                            "confidence": 0.92,
                            "reasoning": "Acknowledges the order number, provides status update, sets expectations, and offers next steps",
                        }
                    ],
                    "metadata": {
                        "model_used": "gemini-1.5-pro",
                        "latency": 1.23,
                        "token_count": 156,
                    },
                }
            ]
        }
    }
