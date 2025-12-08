#!/bin/bash
# Weekly Review Scheduler Setup Script
# Run this after deploying your Python server to Cloud Run
#
# Usage: ./scripts/setup-scheduler.sh <SERVER_URL> <SCHEDULER_SECRET>
# Example: ./scripts/setup-scheduler.sh https://my-server-abc123-uc.a.run.app my-secret-token

set -e

# Configuration
PROJECT_ID="ndtutorlive"
JOB_NAME="weekly-review-generator"
LOCATION="us-central1"
TIMEZONE="Europe/Kyiv"
# Schedule: Every Sunday at 6:00 PM Kyiv time
SCHEDULE="0 18 * * 0"

# Parse arguments
SERVER_URL="${1}"
SCHEDULER_SECRET="${2}"

if [ -z "$SERVER_URL" ] || [ -z "$SCHEDULER_SECRET" ]; then
    echo "Usage: $0 <SERVER_URL> <SCHEDULER_SECRET>"
    echo ""
    echo "Example:"
    echo "  $0 https://your-server-abc123-uc.a.run.app your-secure-secret"
    echo ""
    echo "Arguments:"
    echo "  SERVER_URL       - Your deployed Python server URL (Cloud Run or custom domain)"
    echo "  SCHEDULER_SECRET - The same secret set in your server's SCHEDULER_SECRET env var"
    exit 1
fi

# Ensure we're using the right project
echo "Setting project to $PROJECT_ID..."
gcloud config set project "$PROJECT_ID"

# Check if job already exists
if gcloud scheduler jobs describe "$JOB_NAME" --location="$LOCATION" &>/dev/null; then
    echo "Job '$JOB_NAME' already exists. Deleting and recreating..."
    gcloud scheduler jobs delete "$JOB_NAME" --location="$LOCATION" --quiet
fi

# Create the scheduler job
echo "Creating Cloud Scheduler job..."
gcloud scheduler jobs create http "$JOB_NAME" \
    --location="$LOCATION" \
    --schedule="$SCHEDULE" \
    --time-zone="$TIMEZONE" \
    --uri="${SERVER_URL}/api/review/generate-batch" \
    --http-method=POST \
    --headers="Content-Type=application/json" \
    --message-body="{\"triggerSecret\":\"${SCHEDULER_SECRET}\"}" \
    --attempt-deadline="600s" \
    --description="Generates weekly review lessons for all active users every Sunday at 6PM Kyiv time"

echo ""
echo "✅ Cloud Scheduler job created successfully!"
echo ""
echo "Job details:"
echo "  Name:     $JOB_NAME"
echo "  Schedule: $SCHEDULE ($TIMEZONE)"
echo "  Endpoint: ${SERVER_URL}/api/review/generate-batch"
echo ""
echo "To test the job manually, run:"
echo "  gcloud scheduler jobs run $JOB_NAME --location=$LOCATION"
echo ""
echo "To view job status:"
echo "  gcloud scheduler jobs describe $JOB_NAME --location=$LOCATION"
