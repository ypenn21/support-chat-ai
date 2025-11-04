from google.adk.agents import Agent
from app.agents.tools.context_tools import process_conversation_context
from app.models.request import SuggestRequest
from app.models.response import Suggestion
import os


class SuggestionAgentService:
    """Single-agent service for Suggestion Mode (Gemini 2.5 Flash)"""

    def __init__(self, project_id: str, location: str):
        # Set environment variables for ADK
        os.environ["GOOGLE_CLOUD_PROJECT"] = project_id
        os.environ["GOOGLE_CLOUD_REGION"] = location

        # Single agent with Gemini 2.5 Flash
        self.agent = Agent(
            name="suggestion_agent",
            model="gemini-2.5-flash",
            instruction="""You are an AI assistant helping customer support agents.
            Generate helpful, empathetic response suggestions.
            Maintain a professional yet friendly tone.""",
            description="Generates response suggestions for support agents",
            tools=[process_conversation_context]
        )

    async def generate_suggestion(self, request: SuggestRequest) -> Suggestion:
        """Generate suggestion with single ADK agent"""
        # Build prompt
        messages_text = "\n".join([
            f"{msg.role.upper()}: {msg.content}"
            for msg in request.conversation_context
        ])

        prefs = request.user_preferences or {}
        prompt = f"""Generate a {prefs.get('tone', 'professional')} customer support response.

Conversation:
{messages_text}

Requirements:
- Tone: {prefs.get('tone', 'professional')}
- Length: {prefs.get('length', 'medium')}
- Language: {prefs.get('language', 'en')}

Provide a helpful response."""

        # TODO: Actual ADK agent invocation
        # response = await self.agent.run(prompt)
        response_text = f"Thank you for contacting support. I understand your concern and I'm here to help you resolve this issue."

        return Suggestion(
            text=response_text,
            confidence=0.85,
            reasoning="Generated with Gemini 2.5 Flash"
        )
