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

    request_id: Optional[str] = Field(default_factory=lambda: __import__('uuid').uuid4().hex)
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


class Goal(BaseModel):
    """YOLO mode goal definition"""
    description: str = Field(..., description="Goal description (e.g., 'Resolve shipping issue')")
    max_turns: int = Field(10, ge=1, le=50, description="Maximum conversation turns")


class GoalState(BaseModel):
    """Current state of goal progress"""
    active: bool = Field(True, description="Whether goal is still active")
    current_turn: int = Field(0, ge=0, description="Current turn number")
    progress: float = Field(0.0, ge=0.0, le=1.0, description="Progress toward goal (0.0-1.0)")


class SafetyConstraints(BaseModel):
    """Safety constraints for autonomous mode"""
    min_confidence: float = Field(0.7, ge=0.0, le=1.0, description="Minimum confidence to auto-respond")
    escalation_keywords: List[str] = Field(
        default_factory=lambda: ["angry", "frustrated", "manager", "lawsuit"],
        description="Keywords that trigger escalation"
    )
    stop_if_confused: bool = Field(True, description="Stop if AI is uncertain")


class AutonomousRequest(BaseModel):
    """Request for autonomous agent (YOLO mode)"""
    goal: Goal
    goal_state: GoalState
    safety_constraints: SafetyConstraints
    conversation_context: List[Message] = Field(..., min_length=1, max_length=50)
