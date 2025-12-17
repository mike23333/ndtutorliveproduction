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
    secretmanager.googleapis.com \
    --quiet

# Setup Secret Manager secrets (only creates if they don't exist)
echo "🔐 Setting up Secret Manager..."

create_secret_if_not_exists() {
    SECRET_NAME=$1
    PROMPT_MSG=$2

    if ! gcloud secrets describe ${SECRET_NAME} --project=${PROJECT_ID} > /dev/null 2>&1; then
        echo "   Creating secret: ${SECRET_NAME}"
        read -sp "${PROMPT_MSG}: " SECRET_VALUE
        echo ""
        echo -n "${SECRET_VALUE}" | gcloud secrets create ${SECRET_NAME} \
            --replication-policy="automatic" \
            --data-file=- \
            --project=${PROJECT_ID}
    else
        echo "   ✓ Secret ${SECRET_NAME} already exists"
    fi
}

create_secret_if_not_exists "gemini-api-key" "Enter your GEMINI_API_KEY"

# Grant Cloud Run service account access to secrets
echo "🔑 Configuring IAM for secrets..."
PROJECT_NUMBER=$(gcloud projects describe ${PROJECT_ID} --format="value(projectNumber)")
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

gcloud secrets add-iam-policy-binding gemini-api-key \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor" \
    --project=${PROJECT_ID} --quiet 2>/dev/null || true

# Build and push container
echo "🔨 Building container image..."
gcloud builds submit --tag ${IMAGE_NAME} .

# Deploy to Cloud Run
echo "☁️  Deploying to Cloud Run..."

# Configuration - set these or pass as environment variables
ALLOWED_ORIGINS="${ALLOWED_ORIGINS:-https://ndtutorlive.web.app,https://ndtutorlive.firebaseapp.com,http://localhost:5173}"
SCHEDULER_SECRET="${SCHEDULER_SECRET:-$(openssl rand -base64 32)}"

echo "   ALLOWED_ORIGINS: ${ALLOWED_ORIGINS}"
echo "   SCHEDULER_SECRET: ${SCHEDULER_SECRET:0:8}..."

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
    --set-env-vars "^##^GCP_PROJECT_ID=${PROJECT_ID}##GCP_LOCATION=${REGION}##GEMINI_MODEL=gemini-2.5-flash-native-audio-preview-12-2025##GEMINI_VOICE=Aoede##ALLOWED_ORIGINS=${ALLOWED_ORIGINS}##SCHEDULER_SECRET=${SCHEDULER_SECRET}" \
    --set-secrets "GEMINI_API_KEY=gemini-api-key:latest"

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format="value(status.url)")

# Grant IAM roles to service account
echo "🔒 Configuring IAM roles..."
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/aiplatform.user" \
    --quiet 2>/dev/null || true

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/datastore.user" \
    --quiet 2>/dev/null || true

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Service URL: ${SERVICE_URL}"
echo "WebSocket URL: ${SERVICE_URL/https/wss}/ws"
echo ""
echo "📝 Update your frontend .env with:"
echo "   VITE_GEMINI_WS_URL=${SERVICE_URL/https/wss}/ws"
echo "   VITE_API_URL=${SERVICE_URL}"
echo ""
echo "📅 For Cloud Scheduler (weekly reviews), use this secret:"
echo "   SCHEDULER_SECRET=${SCHEDULER_SECRET}"
echo ""
echo "🔒 IAM roles configured for service account:"
echo "   ✓ Vertex AI User (roles/aiplatform.user)"
echo "   ✓ Firestore User (roles/datastore.user)"
echo "   ✓ Secret Manager Accessor (for GEMINI_API_KEY)"
