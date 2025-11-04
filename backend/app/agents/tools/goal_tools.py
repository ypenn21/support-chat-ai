from typing import Dict


def track_goal_progress(goal: Dict, current_state: Dict, latest_action: str) -> Dict:
    """Track YOLO goal progress (ADK tool function)"""
    new_turn = current_state.get("current_turn", 0) + 1
    max_turns = goal.get("max_turns", 10)

    base_progress = min(new_turn / max_turns, 0.9)

    if "resolved" in latest_action.lower():
        progress = 1.0
    else:
        progress = base_progress

    return {
        "active": progress < 1.0 and new_turn < max_turns,
        "current_turn": new_turn,
        "progress": round(progress, 2)
    }
