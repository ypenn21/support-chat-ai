from fastapi import APIRouter, HTTPException
from app.models.request import SuggestRequest
from app.models.response import SuggestResponse, Metadata
from app.services.agent_service import AgentService
import time
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
agent_service = AgentService()


@router.post("/suggest-response", response_model=SuggestResponse)
async def suggest_response(request: SuggestRequest):
    """Generate AI suggestion for support agent (Suggestion Mode)"""
    try:
        start_time = time.time()
        
        # Validate conversation context
        if not request.conversation_context:
            raise HTTPException(status_code=400, detail="Conversation context required")
        
        # Generate suggestion using agent service
        suggestion = await agent_service.generate_suggestion(request)
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return SuggestResponse(
            suggestions=[suggestion],
            metadata=Metadata(
                request_id=request.request_id,
                processing_time_ms=processing_time,
                model_used="gemini-2.5-flash",
                timestamp=int(time.time())
            )
        )
    
    except Exception as e:
        logger.error(f"Error generating suggestion: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate suggestion: {str(e)}")
