#!/bin/bash
# Cloud Run Deployment Script for Gemini Live API Server
# Usage: ./deploy.sh [project-id] [region]

set -e

# Configuration
PROJECT_ID="${1:-ndtutorlive}"
REGION="${2:-us-central1}"
SERVICE_NAME="gemini-live-api"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "🚀 Deploying Gemini Live API Server to Cloud Run"
echo "   Project: ${PROJECT_ID}"
echo "   Region: ${REGION}"
echo "   Service: ${SERVICE_NAME}"
echo ""

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n1 > /dev/null 2>&1; then
    echo "❌ Not authenticated with gcloud. Run: gcloud auth login"
    exit 1
fi

# Set project
gcloud config set project ${PROJECT_ID}

# Enable required APIs
echo "📦 Enabling required APIs..."
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    aiplatform.googleapis.com \
    firestore.googleapis.com \
    --quiet

# Build and push container
echo "🔨 Building container image..."
gcloud builds submit --tag ${IMAGE_NAME} .

# Deploy to Cloud Run
echo "☁️  Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
    --image ${IMAGE_NAME} \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --port 8080 \
    --timeout 3600 \
    --cpu 1 \
    --memory 512Mi \
    --min-instances 1 \
    --max-instances 10 \
    --session-affinity \
    --set-env-vars "GCP_PROJECT_ID=${PROJECT_ID},GCP_LOCATION=${REGION},GEMINI_MODEL=gemini-2.5-flash-native-audio-preview-12-2025,GEMINI_VOICE=Aoede"

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format="value(status.url)")

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Service URL: ${SERVICE_URL}"
echo "WebSocket URL: ${SERVICE_URL/https/wss}/ws"
echo ""
echo "📝 Update your frontend .env with:"
echo "   VITE_GEMINI_WS_URL=${SERVICE_URL/https/wss}/ws"
echo ""
echo "🔒 IAM: The Cloud Run service account needs these roles:"
echo "   - Vertex AI User (roles/aiplatform.user)"
echo "   - Firestore User (roles/datastore.user)"
