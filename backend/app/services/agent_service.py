from app.core.config import settings
from app.agents.suggestion_agent import SuggestionAgentService
from app.agents.autonomous_agent import AutonomousAgentService


class AgentService:
    """Unified service coordinating both ADK agents"""

    def __init__(self):
        self.suggestion_agent = SuggestionAgentService(
            project_id=settings.GCP_PROJECT_ID,
            location=settings.VERTEX_AI_LOCATION
        )

        self.autonomous_agent = AutonomousAgentService(
            project_id=settings.GCP_PROJECT_ID,
            location=settings.VERTEX_AI_LOCATION
        )

    async def generate_suggestion(self, request):
        return await self.suggestion_agent.generate_suggestion(request)

    async def generate_autonomous_response(self, request):
        return await self.autonomous_agent.process(request)
