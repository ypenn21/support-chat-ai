from typing import Dict


def check_safety_constraints(message: str, constraints: Dict, confidence: float) -> Dict:
    """Check safety constraints for escalation (ADK tool function)"""
    triggers = []
    message_lower = message.lower()

    # Check escalation keywords
    for keyword in constraints.get("escalation_keywords", []):
        if keyword.lower() in message_lower:
            triggers.append(f"escalation_keyword:{keyword}")

    # Check confidence threshold
    min_confidence = constraints.get("min_confidence", 0.7)
    if confidence < min_confidence:
        triggers.append(f"low_confidence:{confidence:.2f}")

    # Check confusion
    if constraints.get("stop_if_confused", True):
        if any(p in message_lower for p in ["i don't understand", "i'm not sure"]):
            triggers.append("confusion_detected")

    if triggers:
        return {
            "decision": "escalate",
            "reason": f"Safety violations: {', '.join(triggers)}",
            "triggers": triggers
        }
    else:
        return {
            "decision": "safe",
            "reason": "All checks passed",
            "triggers": []
        }
