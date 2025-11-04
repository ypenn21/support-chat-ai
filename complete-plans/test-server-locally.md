Here are the exact commands I used to run and test the backend locally:

  🚀 Running the Server Locally

  1. Start the Backend Server

  cd backend
  source venv/bin/activate  # On Windows: venv\Scripts\activate
  uvicorn app.main:app --reload --port 8001 --host 0.0.0.0

  Note: I used port 8001 because port 8000 was already in use on the system.

  2. Quick Health Check (Optional)

  # In a new terminal window
  curl -s http://localhost:8001/health | python -m json.tool
  curl -s http://localhost:8001/ | python -m json.tool

  🧪 Testing the Endpoints

  Method 1: Using Python Test Scripts (What I Used)

  Create and run test script for Suggestion & Feedback endpoints:
  cd backend
  source venv/bin/activate
  python test_api.py

  Create and run test script for Autonomous & Logs endpoints:
  cd backend
  source venv/bin/activate
  python test_autonomous_api.py

  Method 2: Using cURL (Alternative)

  Test Suggest Response Endpoint:
  curl -X POST http://localhost:8001/api/suggest-response \
    -H "Content-Type: application/json" \
    -d '{
      "platform": "zendesk",
      "conversation_context": [
        {
          "role": "customer",
          "content": "My order hasn'\''t arrived yet",
          "timestamp": 1704067200
        }
      ]
    }'

  Test Feedback Endpoint:
  curl -X POST http://localhost:8001/api/feedback \
    -H "Content-Type: application/json" \
    -d '{
      "request_id": "test_123",
      "rating": 5,
      "feedback_text": "Great suggestion!",
      "suggestion_used": true,
      "modified": false
    }'

  Method 3: Using Swagger UI (Easiest)

  1. Start the server (command above)
  2. Open browser to: http://localhost:8001/docs
  3. Click on any endpoint to test it interactively
  4. Click "Try it out", modify the example payload, and click "Execute"

  📝 Test Files I Created

  The test scripts I created are already in your backend/ directory:

  test_api.py - Tests suggest and feedback endpoints
  test_autonomous_api.py - Tests autonomous and logs endpoints

  You can run them directly as shown above!

  ✅ Expected Test Results

  When you run the tests, you should see:
  ==================================================
  Testing Suggest Response Endpoint
  ==================================================
  Status Code: 200
  Response: {
    "suggestions": [...],
    "metadata": {...}
  }

  ==================================================
  Testing Feedback Endpoint
  ==================================================
  Feedback Status Code: 200
  Response: {
    "feedback_id": "...",
    "status": "success"
  }

  All endpoints should return 200 OK status codes.