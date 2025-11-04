from typing import List, Dict
import re


def process_conversation_context(messages: List[Dict]) -> Dict:
    """
    Process conversation context (ADK tool function)

    Args:
        messages: List of message dicts with role, content, timestamp

    Returns:
        Dict with processed_messages, intent, and extracted entities
    """
    if not messages or len(messages) > 50:
        return {"error": "Invalid message count"}

    processed = []
    entities = {"order_numbers": [], "emails": []}

    for msg in messages:
        content = msg.get("content", "").strip()
        processed.append({
            "role": msg.get("role"),
            "content": content,
            "timestamp": msg.get("timestamp")
        })

        # Extract entities
        entities["order_numbers"].extend(re.findall(r'#\d+', content))
        entities["emails"].extend(re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', content))

    # Detect intent
    all_content = " ".join([m["content"] for m in processed]).lower()
    intent = "general_inquiry"
    if any(w in all_content for w in ["order", "shipping", "delivery"]):
        intent = "order_inquiry"
    elif any(w in all_content for w in ["refund", "return", "cancel"]):
        intent = "refund_request"

    return {
        "processed_messages": processed,
        "intent": intent,
        "entities": entities
    }
