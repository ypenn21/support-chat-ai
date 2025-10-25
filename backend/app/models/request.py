"""Request models for API endpoints"""

from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class Message(BaseModel):
    """A single message in the conversation"""

    role: Literal["agent", "customer"]
    content: str = Field(..., min_length=1, max_length=10000)
    timestamp: int = Field(..., gt=0)


class UserPreferences(BaseModel):
    """User preferences for response generation"""

    tone: Optional[Literal["professional", "friendly", "empathetic"]] = None
    length: Optional[Literal["short", "medium", "long"]] = None
    include_greeting: Optional[bool] = None


class SuggestRequest(BaseModel):
    """Request for generating response suggestions"""

    platform: Literal["zendesk", "intercom", "generic"]
    conversation_context: List[Message] = Field(..., min_length=1, max_length=50)
    user_preferences: Optional[UserPreferences] = None

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "platform": "zendesk",
                    "conversation_context": [
                        {
                            "role": "customer",
                            "content": "My order hasn't arrived yet",
                            "timestamp": 1704067200,
                        },
                        {
                            "role": "agent",
                            "content": "I'd be happy to help. Could you provide your order number?",
                            "timestamp": 1704067260,
                        },
                        {
                            "role": "customer",
                            "content": "It's #12345",
                            "timestamp": 1704067320,
                        },
                    ],
                    "user_preferences": {
                        "tone": "empathetic",
                        "length": "medium",
                        "include_greeting": False,
                    },
                }
            ]
        }
    }
