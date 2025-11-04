import requests
import json

BASE_URL = "http://localhost:8001"

def test_autonomous_endpoint():
    """Test the autonomous-response endpoint"""
    payload = {
        "goal": {
            "description": "Resolve shipping delay issue",
            "max_turns": 10
        },
        "goal_state": {
            "active": True,
            "current_turn": 0,
            "progress": 0.0
        },
        "safety_constraints": {
            "min_confidence": 0.7,
            "escalation_keywords": ["angry", "frustrated", "lawsuit"],
            "stop_if_confused": True
        },
        "conversation_context": [
            {
                "role": "customer",
                "content": "Where is my package? It's been 2 weeks!",
                "timestamp": 1704067200
            }
        ]
    }
    
    response = requests.post(f"{BASE_URL}/api/autonomous-response", json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 200

def test_conversation_logs():
    """Test conversation logs endpoints"""
    # Save a log
    log_payload = {
        "session_id": "test_session_123",
        "mode": "autonomous",
        "goal_description": "Resolve shipping issue",
        "conversation_context": [
            {"role": "customer", "content": "Where is my package?", "timestamp": 1704067200}
        ],
        "actions_taken": [
            {"action": "respond", "turn": 1, "response": "I'll check on that for you"}
        ],
        "outcome": "completed"
    }
    
    save_response = requests.post(f"{BASE_URL}/api/conversation-logs", json=log_payload)
    print(f"\nSave Log Status: {save_response.status_code}")
    print(f"Response: {json.dumps(save_response.json(), indent=2)}")
    
    # Retrieve logs
    get_response = requests.get(f"{BASE_URL}/api/conversation-logs?mode=autonomous&page=1&page_size=10")
    print(f"\nGet Logs Status: {get_response.status_code}")
    print(f"Response: {json.dumps(get_response.json(), indent=2)}")
    
    return save_response.status_code == 200 and get_response.status_code == 200

if __name__ == "__main__":
    print("=" * 50)
    print("Testing Autonomous Response Endpoint")
    print("=" * 50)
    test_autonomous_endpoint()
    
    print("\n" + "=" * 50)
    print("Testing Conversation Logs Endpoints")
    print("=" * 50)
    test_conversation_logs()
