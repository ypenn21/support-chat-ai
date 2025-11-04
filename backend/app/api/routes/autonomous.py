from fastapi import APIRouter, HTTPException
from app.models.request import AutonomousRequest
from app.models.response import AutonomousResponse
from app.services.agent_service import AgentService
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
agent_service = AgentService()


@router.post("/autonomous-response", response_model=AutonomousResponse)
async def autonomous_response(request: AutonomousRequest):
    """Generate autonomous AI response (YOLO Mode)"""
    try:
        # Validate goal and constraints
        if not request.goal or not request.goal.description:
            raise HTTPException(status_code=400, detail="Goal description required")
        
        if not request.safety_constraints:
            raise HTTPException(status_code=400, detail="Safety constraints required")
        
        # Validate turn limits
        if request.goal_state.current_turn >= request.goal.max_turns:
            raise HTTPException(
                status_code=400,
                detail=f"Max turns ({request.goal.max_turns}) reached"
            )
        
        # Process autonomous request
        response = await agent_service.generate_autonomous_response(request)
        
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in autonomous mode: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Autonomous processing failed: {str(e)}")
