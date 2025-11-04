from google.adk.agents import Agent
from app.agents.tools.goal_tools import track_goal_progress
from app.agents.tools.safety_tools import check_safety_constraints
from app.models.request import AutonomousRequest, GoalState
from app.models.response import AutonomousResponse
import os
import time
import uuid


class AutonomousAgentService:
    """Single-agent service for YOLO Mode (Gemini 2.5 Flash)"""

    def __init__(self, project_id: str, location: str):
        # Set environment variables for ADK
        os.environ["GOOGLE_CLOUD_PROJECT"] = project_id
        os.environ["GOOGLE_CLOUD_REGION"] = location

        # Single agent with Gemini 2.5 Flash and safety tools
        self.agent = Agent(
            name="autonomous_agent",
            model="gemini-2.5-flash",
            instruction="""You are an autonomous customer support agent.
            Analyze the goal, check safety constraints, and decide the next action.
            Use tools to track progress and validate safety before responding.""",
            description="Handles autonomous YOLO mode responses",
            tools=[track_goal_progress, check_safety_constraints]
        )

    async def process(self, request: AutonomousRequest) -> AutonomousResponse:
        """Process autonomous request with single agent"""
        # Build prompt with goal and safety context
        messages_text = "\n".join([
            f"{msg.role.upper()}: {msg.content}"
            for msg in request.conversation_context
        ])

        prompt = f"""Autonomous support task:

Goal: {request.goal.description} (Max turns: {request.goal.max_turns})
Current Turn: {request.goal_state.current_turn}/{request.goal.max_turns}
Progress: {request.goal_state.progress:.1%}

Safety Constraints:
- Min confidence: {request.safety_constraints.min_confidence}
- Escalation keywords: {', '.join(request.safety_constraints.escalation_keywords)}

Conversation:
{messages_text}

Decide: respond, escalate, or goal_complete"""

        # TODO: Actual ADK agent invocation with tool calls
        # The agent will:
        # 1. Call track_goal_progress() to update state
        # 2. Generate response
        # 3. Call check_safety_constraints() to validate
        # 4. Return action decision

        # Placeholder response with safety check
        response_text = "I'm here to help resolve your issue. Let me gather some information."
        
        # Check safety
        safety_result = check_safety_constraints(
            response_text,
            request.safety_constraints.dict(),
            0.8
        )

        if safety_result["decision"] == "escalate":
            action = "escalate"
            response_text = None
        else:
            action = "respond"

        # Update goal state
        updated_state = track_goal_progress(
            request.goal.dict(),
            request.goal_state.dict(),
            action
        )

        return AutonomousResponse(
            action=action,
            response_text=response_text,
            updated_state=GoalState(**updated_state),
            reasoning=f"Decision based on goal and safety analysis: {safety_result['reason']}",
            confidence=0.8,
            metadata={
                "request_id": str(uuid.uuid4()),
                "processing_time_ms": 1500,
                "model_used": "gemini-2.5-flash",
                "timestamp": int(time.time())
            }
        )
