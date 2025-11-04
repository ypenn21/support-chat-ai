import requests
import json

BASE_URL = "http://localhost:8001"

def test_suggest_endpoint():
    """Test the suggest-response endpoint"""
    payload = {
        "platform": "zendesk",
        "conversation_context": [
            {
                "role": "customer",
                "content": "My order hasn't arrived yet",
                "timestamp": 1704067200
            }
        ]
    }
    
    response = requests.post(f"{BASE_URL}/api/suggest-response", json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 200

def test_feedback_endpoint():
    """Test the feedback endpoint"""
    payload = {
        "request_id": "test_123",
        "rating": 5,
        "feedback_text": "Great suggestion!",
        "suggestion_used": True,
        "modified": False
    }
    
    response = requests.post(f"{BASE_URL}/api/feedback", json=payload)
    print(f"\nFeedback Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 200

if __name__ == "__main__":
    print("=" * 50)
    print("Testing Suggest Response Endpoint")
    print("=" * 50)
    test_suggest_endpoint()
    
    print("\n" + "=" * 50)
    print("Testing Feedback Endpoint")
    print("=" * 50)
    test_feedback_endpoint()
