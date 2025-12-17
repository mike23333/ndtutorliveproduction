#!/usr/bin/env python3
"""
Test Script for Weekly Review Flow

This script tests the entire weekly review generation flow:
1. Creates/updates a test user document
2. Adds struggle words to the user's struggles subcollection
3. Generates a weekly review lesson
4. Verifies the generated prompt includes level-appropriate content

Run with: python test_review_flow.py
"""

import os
import sys
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add app directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from google.cloud import firestore
from app.review_service import ReviewService, get_review_service

# Test configuration
TEST_USER_ID = "8kRapTzg5CfhQ73SvSqbh6kgZOl1"  # Real user ID
TEST_USER_LEVEL = None  # Set to None to use existing user's level from Firestore

# Sample struggle words for testing
TEST_STRUGGLES = [
    {
        "word": "reservation",
        "struggleType": "vocabulary",
        "context": "Making a restaurant reservation",
        "severity": "significant",
    },
    {
        "word": "appetizer",
        "struggleType": "vocabulary",
        "context": "Ordering food at a restaurant",
        "severity": "moderate",
    },
    {
        "word": "bill",
        "struggleType": "vocabulary",
        "context": "Paying at a restaurant",
        "severity": "moderate",
    },
    {
        "word": "recommend",
        "struggleType": "pronunciation",
        "context": "Asking waiter for suggestions",
        "severity": "minor",
    },
    {
        "word": "medium rare",
        "struggleType": "vocabulary",
        "context": "Ordering steak",
        "severity": "significant",
    },
]


def setup_firestore():
    """Initialize Firestore client."""
    print("=" * 60)
    print("WEEKLY REVIEW FLOW TEST")
    print("=" * 60)

    try:
        # Use service account credentials from file
        from google.oauth2 import service_account

        creds_path = os.path.join(os.path.dirname(__file__), 'firebase-service-account.json')
        if os.path.exists(creds_path):
            credentials = service_account.Credentials.from_service_account_file(creds_path)
            db = firestore.Client(project='ndtutorlive', credentials=credentials)
            print("✅ Firestore client initialized with service account (project: ndtutorlive)")
        else:
            # Fallback to default credentials
            db = firestore.Client(project='ndtutorlive')
            print("✅ Firestore client initialized with default credentials (project: ndtutorlive)")
        return db
    except Exception as e:
        print(f"❌ Failed to initialize Firestore: {e}")
        print("   Make sure firebase-service-account.json exists or gcloud is configured")
        return None


def create_test_user(db: firestore.Client):
    """Check existing user or create test user document."""
    print("\n" + "-" * 40)
    print("Step 1: Checking user document")
    print("-" * 40)

    user_ref = db.document(f"users/{TEST_USER_ID}")
    user_doc = user_ref.get()

    if user_doc.exists:
        user_data = user_doc.to_dict()
        print(f"✅ Found existing user: {TEST_USER_ID}")
        print(f"   Display name: {user_data.get('displayName', 'N/A')}")
        print(f"   Level: {user_data.get('level', 'Not set')}")
        print(f"   Total sessions: {user_data.get('totalSessions', 0)}")

        # Update lastSessionAt to ensure user is "active"
        user_ref.update({"lastSessionAt": datetime.now(timezone.utc)})
        return True
    else:
        # Create new user if doesn't exist
        user_data = {
            "displayName": "Test Student",
            "email": "test@example.com",
            "level": TEST_USER_LEVEL or "B1",
            "lastSessionAt": datetime.now(timezone.utc),
            "createdAt": datetime.now(timezone.utc),
            "totalSessions": 5,
            "totalStars": 15,
        }
        user_ref.set(user_data)
        print(f"✅ Created new user: {TEST_USER_ID}")
        print(f"   Level: {user_data['level']}")
        return True


def add_test_struggles(db: firestore.Client):
    """Add struggle words to user's struggles subcollection."""
    print("\n" + "-" * 40)
    print("Step 2: Adding struggle words")
    print("-" * 40)

    struggles_ref = db.collection(f"users/{TEST_USER_ID}/struggles")

    # Clear existing struggles first
    existing = list(struggles_ref.stream())
    for doc in existing:
        doc.reference.delete()
    print(f"   Cleared {len(existing)} existing struggles")

    # Add test struggles
    for i, struggle in enumerate(TEST_STRUGGLES):
        doc_id = f"struggle-{i+1}"
        struggle_data = {
            "word": struggle["word"],
            "struggleType": struggle["struggleType"],
            "context": struggle["context"],
            "severity": struggle["severity"],
            "mastered": False,
            "reviewCount": 0,
            "lastReviewedAt": None,
            "includedInReviews": [],
            "createdAt": datetime.now(timezone.utc) - timedelta(days=3),  # Created 3 days ago
            "sessionId": f"test-session-{i}",
        }
        struggles_ref.document(doc_id).set(struggle_data)
        print(f"   ✅ Added: \"{struggle['word']}\" ({struggle['severity']})")

    print(f"\n✅ Added {len(TEST_STRUGGLES)} struggle words")
    return True


def clear_existing_reviews(db: firestore.Client):
    """Clear any existing reviews for this week."""
    print("\n" + "-" * 40)
    print("Step 3: Clearing existing reviews")
    print("-" * 40)

    reviews_ref = db.collection(f"users/{TEST_USER_ID}/reviewLessons")
    existing = list(reviews_ref.stream())

    for doc in existing:
        doc.reference.delete()
        print(f"   Deleted: {doc.id}")

    if not existing:
        print("   No existing reviews to clear")

    print(f"✅ Cleared {len(existing)} existing reviews")
    return True


def generate_review():
    """Generate a weekly review lesson."""
    print("\n" + "-" * 40)
    print("Step 4: Generating weekly review")
    print("-" * 40)

    try:
        review_service = get_review_service()

        # Check eligible struggles
        struggles = review_service.get_eligible_struggles(TEST_USER_ID)
        print(f"   Found {len(struggles)} eligible struggles:")
        for s in struggles:
            print(f"      - \"{s.word}\" ({s.severity}, reviewed {s.review_count}x)")

        if len(struggles) < review_service.MIN_STRUGGLES:
            print(f"\n❌ Not enough struggles (need {review_service.MIN_STRUGGLES}, have {len(struggles)})")
            return None

        # Get user level
        level = review_service.get_user_level(TEST_USER_ID)
        print(f"\n   User level: {level}")

        # Generate the review
        print("\n   Generating review prompt with Gemini 2.5 Flash...")
        review = review_service.create_review_lesson(TEST_USER_ID)

        if review:
            print(f"\n✅ Review created successfully!")
            print(f"   Review ID: {review.id}")
            print(f"   Struggle words: {', '.join(review.struggle_words)}")
            print(f"   User level: {review.user_level}")
            print(f"   Estimated duration: {review.estimated_minutes} minutes")
            return review
        else:
            print("\n❌ Review creation returned None")
            print("   This usually means a review already exists for this week")
            return None

    except Exception as e:
        print(f"\n❌ Error generating review: {e}")
        import traceback
        traceback.print_exc()
        return None


def verify_review(db: firestore.Client, review):
    """Verify the generated review in Firestore."""
    print("\n" + "-" * 40)
    print("Step 5: Verifying review in Firestore")
    print("-" * 40)

    review_ref = db.document(f"users/{TEST_USER_ID}/reviewLessons/{review.id}")
    review_doc = review_ref.get()

    if not review_doc.exists:
        print("❌ Review document not found in Firestore")
        return False

    data = review_doc.to_dict()
    print(f"✅ Review document found")
    print(f"   Status: {data.get('status')}")
    print(f"   Week start: {data.get('weekStart')}")
    print(f"   Target struggles: {len(data.get('targetStruggles', []))} words")

    # Verify struggle documents were updated
    print("\n   Verifying struggle updates:")
    struggles_ref = db.collection(f"users/{TEST_USER_ID}/struggles")
    for doc in struggles_ref.stream():
        sdata = doc.to_dict()
        if review.id in sdata.get("includedInReviews", []):
            print(f"      ✅ \"{sdata['word']}\" - reviewCount: {sdata['reviewCount']}")

    return True


def display_generated_prompt(review):
    """Display the generated system prompt."""
    print("\n" + "-" * 40)
    print("Step 6: Generated System Prompt")
    print("-" * 40)
    print("\nThis prompt will be sent to Gemini Live API for the review conversation:\n")
    print("=" * 60)
    print(review.generated_prompt)
    print("=" * 60)

    # Check for level-appropriate content
    prompt_lower = review.generated_prompt.lower()
    level = review.user_level

    print(f"\n📊 Prompt Analysis for {level} level:")

    # Check if level is mentioned
    if level.lower() in prompt_lower:
        print(f"   ✅ Level '{level}' referenced in prompt")
    else:
        print(f"   ⚠️  Level '{level}' not explicitly mentioned")

    # Check for struggle words
    found_words = []
    for word in review.struggle_words:
        if word.lower() in prompt_lower:
            found_words.append(word)

    print(f"   ✅ {len(found_words)}/{len(review.struggle_words)} struggle words found in prompt")
    if found_words:
        print(f"      Words found: {', '.join(found_words)}")


def test_meta_prompt_template(db: firestore.Client):
    """Check if meta-prompt template exists in Firestore."""
    print("\n" + "-" * 40)
    print("Bonus: Checking meta-prompt template")
    print("-" * 40)

    template_ref = db.document("systemTemplates/weeklyReviewMetaPrompt")
    template_doc = template_ref.get()

    if template_doc.exists:
        data = template_doc.to_dict()
        print("✅ Meta-prompt template found in Firestore")
        print(f"   Name: {data.get('name')}")
        print(f"   Updated by: {data.get('updatedBy', 'N/A')}")
        print(f"   Template length: {len(data.get('template', ''))} chars")
    else:
        print("ℹ️  Meta-prompt template not in Firestore (using default)")
        print("   Teachers can create one via the dashboard")

    return True


def update_weekly_review_template(db: firestore.Client):
    """Update the weekly review template in Firestore with stronger function calling instructions."""
    print("\n" + "-" * 40)
    print("Updating Weekly Review Template")
    print("-" * 40)

    from app.review_service import ReviewService

    # Get the new template from the code
    new_template = ReviewService.DEFAULT_REVIEW_TEMPLATE

    template_ref = db.document("systemTemplates/weeklyReviewTemplate")
    template_doc = template_ref.get()

    if template_doc.exists:
        # Update existing template
        template_ref.update({
            "template": new_template,
            "updatedAt": datetime.now(timezone.utc),
            "updatedBy": "test_script"
        })
        print("✅ Updated existing template with new function calling instructions")
    else:
        # Create new template
        template_ref.set({
            "id": "weeklyReviewTemplate",
            "name": "Weekly Review Generation Prompt",
            "description": "Template for weekly review sessions with mandatory function calling",
            "template": new_template,
            "placeholders": ["{{level}}", "{{struggles}}", "{{studentName}}", "{{itemReference}}"],
            "updatedAt": datetime.now(timezone.utc),
            "updatedBy": "test_script"
        })
        print("✅ Created new template with function calling instructions")

    print(f"   Template length: {len(new_template)} chars")
    print("   Key change: Added CRITICAL section about mandatory function calling")
    return True


def cleanup_test_data(db: firestore.Client):
    """Optional: Clean up test data (safe for real users)."""
    print("\n" + "-" * 40)
    print("Cleanup Options")
    print("-" * 40)
    print("1. Keep everything (recommended for real users)")
    print("2. Delete only the generated review")
    print("3. Delete review AND test struggles")

    try:
        response = input("\nChoice (1/2/3) [1]: ").strip()
    except EOFError:
        # Non-interactive mode - keep everything
        print("\n   (Non-interactive mode) Keeping all data")
        response = "1"

    if response == '2':
        # Delete only reviews
        reviews_ref = db.collection(f"users/{TEST_USER_ID}/reviewLessons")
        count = 0
        for doc in reviews_ref.stream():
            doc.reference.delete()
            count += 1
        print(f"✅ Deleted {count} review(s)")

    elif response == '3':
        # Delete reviews
        reviews_ref = db.collection(f"users/{TEST_USER_ID}/reviewLessons")
        review_count = 0
        for doc in reviews_ref.stream():
            doc.reference.delete()
            review_count += 1

        # Delete test struggles (only ones we added)
        struggles_ref = db.collection(f"users/{TEST_USER_ID}/struggles")
        struggle_count = 0
        for doc in struggles_ref.stream():
            data = doc.to_dict()
            # Only delete struggles that match our test data
            if data.get('word') in [s['word'] for s in TEST_STRUGGLES]:
                doc.reference.delete()
                struggle_count += 1

        print(f"✅ Deleted {review_count} review(s) and {struggle_count} test struggle(s)")

    else:
        print("   Keeping all data for frontend testing")


def regenerate_review_only(db: firestore.Client):
    """Quick regeneration: update template, clear reviews, regenerate."""
    print("\n" + "=" * 60)
    print("QUICK REVIEW REGENERATION")
    print("=" * 60)

    # Step 1: Update the template in Firestore
    update_weekly_review_template(db)

    # Step 2: Check user exists
    user_ref = db.document(f"users/{TEST_USER_ID}")
    user_doc = user_ref.get()
    if user_doc.exists:
        user_data = user_doc.to_dict()
        print(f"\n✅ User found: {user_data.get('displayName', TEST_USER_ID)}")
        print(f"   Level: {user_data.get('level', 'B1')}")
    else:
        print(f"\n❌ User {TEST_USER_ID} not found!")
        return None

    # Step 3: Check existing reviewItems (not struggles)
    review_items_ref = db.collection(f"users/{TEST_USER_ID}/reviewItems")
    review_items = list(review_items_ref.where('mastered', '==', False).stream())
    print(f"\n📋 Found {len(review_items)} unmastered review items:")
    for item in review_items[:5]:  # Show first 5
        data = item.to_dict()
        audio_status = "🔊 HAS AUDIO" if data.get('audioUrl') else "no audio"
        print(f"   - {item.id}: \"{data.get('correction', 'N/A')[:40]}\" ({audio_status})")
    if len(review_items) > 5:
        print(f"   ... and {len(review_items) - 5} more")

    # Step 4: Clear existing reviews
    clear_existing_reviews(db)

    # Step 5: Generate new review using reviewItems
    print("\n" + "-" * 40)
    print("Generating new review")
    print("-" * 40)

    review_service = get_review_service()
    review = review_service.create_review_lesson(TEST_USER_ID)

    if review:
        print(f"\n✅ Review created!")
        print(f"   Review ID: {review.id}")
        print(f"   Items: {len(review.struggle_words)}")
        return review
    else:
        print("\n❌ Review creation failed - check reviewItems")
        return None


def main():
    """Run the full test flow."""
    # Initialize Firestore
    db = setup_firestore()
    if not db:
        print("\n❌ Cannot proceed without Firestore connection")
        sys.exit(1)

    # Check command line args for quick mode
    if len(sys.argv) > 1 and sys.argv[1] == '--quick':
        # Quick mode: just regenerate review with updated template
        review = regenerate_review_only(db)
        if review:
            display_generated_prompt(review)
            print("\n" + "=" * 60)
            print("REGENERATION COMPLETE!")
            print("=" * 60)
            print("\nNow test in the app - function calls should trigger properly.")
        sys.exit(0 if review else 1)

    # Full test mode (original behavior)
    # Step 1: Create test user
    if not create_test_user(db):
        sys.exit(1)

    # Step 2: Add struggles
    if not add_test_struggles(db):
        sys.exit(1)

    # Step 3: Clear existing reviews
    if not clear_existing_reviews(db):
        sys.exit(1)

    # Step 4: Generate review
    review = generate_review()
    if not review:
        print("\n" + "=" * 60)
        print("TEST INCOMPLETE - Review generation failed")
        print("=" * 60)
        sys.exit(1)

    # Step 5: Verify in Firestore
    verify_review(db, review)

    # Step 6: Display prompt
    display_generated_prompt(review)

    # Bonus: Check template
    test_meta_prompt_template(db)

    # Summary
    print("\n" + "=" * 60)
    print("TEST COMPLETED SUCCESSFULLY!")
    print("=" * 60)
    print(f"""
Next steps to verify frontend:
1. Start the dev server: npm run dev
2. Log in as the test user or use Firebase Auth emulator
3. The WeeklyReviewCard should appear on the HomePage
4. Click "Practice Now" to start the review conversation
5. The generated prompt will be sent to Gemini Live API

To test with different levels, modify TEST_USER_LEVEL at the top of this script.
Current test level: {TEST_USER_LEVEL}
""")

    # Optional cleanup
    cleanup_test_data(db)


if __name__ == "__main__":
    main()
