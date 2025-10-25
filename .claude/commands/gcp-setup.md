# GCP Setup

Set up Google Cloud Platform infrastructure for the Support Chat AI Assistant (Cloud Run + Python FastAPI).

**Prerequisites**:
- GCP account with billing enabled
- gcloud CLI installed and authenticated
- Docker installed locally

**Tasks**:

1. **Create GCP Project**:
   ```bash
   gcloud projects create support-chat-ai-[unique-id]
   gcloud config set project support-chat-ai-[unique-id]
   gcloud config set compute/region us-central1

   # Link billing account (required)
   gcloud billing projects link support-chat-ai-[unique-id] \
     --billing-account=YOUR_BILLING_ACCOUNT_ID
   ```

2. **Enable Required APIs**:
   ```bash
   gcloud services enable \
     aiplatform.googleapis.com \
     run.googleapis.com \
     cloudbuild.googleapis.com \
     secretmanager.googleapis.com \
     firestore.googleapis.com \
     artifactregistry.googleapis.com
   ```

3. **Set up Artifact Registry** (for Docker images):
   ```bash
   gcloud artifacts repositories create support-chat-ai \
     --repository-format=docker \
     --location=us-central1 \
     --description="Docker repository for Support Chat AI"

   # Configure Docker to use gcloud as credential helper
   gcloud auth configure-docker us-central1-docker.pkg.dev
   ```

4. **Set up Service Account**:
   ```bash
   # Create service account
   gcloud iam service-accounts create support-chat-ai-sa \
     --display-name="Support Chat AI Service Account"

   # Grant necessary permissions
   gcloud projects add-iam-policy-binding support-chat-ai-[unique-id] \
     --member="serviceAccount:support-chat-ai-sa@support-chat-ai-[unique-id].iam.gserviceaccount.com" \
     --role="roles/aiplatform.user"

   gcloud projects add-iam-policy-binding support-chat-ai-[unique-id] \
     --member="serviceAccount:support-chat-ai-sa@support-chat-ai-[unique-id].iam.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor"

   gcloud projects add-iam-policy-binding support-chat-ai-[unique-id] \
     --member="serviceAccount:support-chat-ai-sa@support-chat-ai-[unique-id].iam.gserviceaccount.com" \
     --role="roles/datastore.user"
   ```

5. **Configure Vertex AI**:
   ```bash
   # Vertex AI is already enabled, test access
   gcloud ai models list --region=us-central1

   # Note: Gemini models are accessed via API, no additional setup needed
   ```

6. **Create Secrets in Secret Manager**:
   ```bash
   # Create API key secret (for extension authentication)
   echo -n "your-api-key-here" | gcloud secrets create api-key \
     --data-file=- \
     --replication-policy="automatic"

   # Grant service account access to secrets
   gcloud secrets add-iam-policy-binding api-key \
     --member="serviceAccount:support-chat-ai-sa@support-chat-ai-[unique-id].iam.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor"
   ```

7. **Set up Firestore** (for analytics):
   ```bash
   # Create Firestore database in Native mode
   gcloud firestore databases create --region=us-central1

   # Note: Set up security rules via Firebase Console or gcloud
   ```

8. **Build and Deploy to Cloud Run**:
   ```bash
   # Build the Docker image
   cd backend
   docker build -t us-central1-docker.pkg.dev/support-chat-ai-[unique-id]/support-chat-ai/backend:latest .

   # Push to Artifact Registry
   docker push us-central1-docker.pkg.dev/support-chat-ai-[unique-id]/support-chat-ai/backend:latest

   # Deploy to Cloud Run
   gcloud run deploy support-chat-ai \
     --image=us-central1-docker.pkg.dev/support-chat-ai-[unique-id]/support-chat-ai/backend:latest \
     --platform=managed \
     --region=us-central1 \
     --service-account=support-chat-ai-sa@support-chat-ai-[unique-id].iam.gserviceaccount.com \
     --set-env-vars="GCP_PROJECT_ID=support-chat-ai-[unique-id],VERTEX_AI_LOCATION=us-central1,GEMINI_MODEL=gemini-1.5-pro" \
     --allow-unauthenticated \
     --max-instances=10 \
     --memory=512Mi \
     --cpu=1

   # Get the service URL
   gcloud run services describe support-chat-ai \
     --region=us-central1 \
     --format="value(status.url)"
   ```

9. **Test the deployment**:
   ```bash
   # Get the Cloud Run URL
   SERVICE_URL=$(gcloud run services describe support-chat-ai \
     --region=us-central1 \
     --format="value(status.url)")

   # Test the health endpoint
   curl $SERVICE_URL/health

   # Test the API endpoint
   curl -X POST $SERVICE_URL/api/suggest-response \
     -H "Content-Type: application/json" \
     -d '{
       "platform": "zendesk",
       "conversation_context": [
         {"role": "customer", "content": "I need help with my account", "timestamp": 1234567890}
       ]
     }'
   ```

10. **Document the setup**:
    - Project ID: support-chat-ai-[unique-id]
    - Region: us-central1
    - Cloud Run URL: [from step 9]
    - Service Account: support-chat-ai-sa@support-chat-ai-[unique-id].iam.gserviceaccount.com

**Next Steps**:
- Set up CI/CD with Cloud Build
- Configure monitoring and alerts
- Set up Cloud Armor for DDoS protection (optional)
- Configure custom domain (optional)

Verify each step succeeds before proceeding to the next one.
