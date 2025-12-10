#!/usr/bin/env python3
"""
Test Data Seed Script for Class Insights Redesign

Creates test students with reviewItems to test:
- InsightsTab display
- ClassActivitySection (active/inactive students)
- CommonMistakesSection (error type distribution)
- MistakeDrillDown (audio playback, filtering)
- BillingTab (token usage)

Usage:
    python scripts/seed_test_data.py
    python scripts/seed_test_data.py --cleanup-only  # Just delete test data
"""

import os
import sys
import argparse
from datetime import datetime, timedelta, timezone
from typing import List, Dict

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from google.cloud import firestore
from google.oauth2 import service_account

# Configuration
TEACHER_ID = "8kRapTzg5CfhQ73SvSqbh6kgZOl1"
TEST_STUDENT_PREFIX = "test-student"

# Test students configuration
TEST_STUDENTS = [
    {
        "id": "test-student-maria",
        "displayName": "Maria S.",
        "email": "maria.test@example.com",
        "level": "B1",
        "lastSessionDaysAgo": 1,  # Active
        "avgStars": 4.2,
    },
    {
        "id": "test-student-alex",
        "displayName": "Alex K.",
        "email": "alex.test@example.com",
        "level": "B1",
        "lastSessionDaysAgo": 2,  # Active
        "avgStars": 3.8,
    },
    {
        "id": "test-student-nina",
        "displayName": "Nina P.",
        "email": "nina.test@example.com",
        "level": "A2",
        "lastSessionDaysAgo": 5,  # Warning (inactive 3+ days)
        "avgStars": 2.5,  # Low score - needs attention
    },
    {
        "id": "test-student-ivan",
        "displayName": "Ivan M.",
        "email": "ivan.test@example.com",
        "level": "B2",
        "lastSessionDaysAgo": 10,  # Inactive (7+ days)
        "avgStars": 4.8,  # High performer but inactive
    },
    {
        "id": "test-student-olga",
        "displayName": "Olga T.",
        "email": "olga.test@example.com",
        "level": "A2",
        "lastSessionDaysAgo": 0,  # Active today
        "avgStars": 3.2,
    },
]

# Sample review items (mistakes) by error type
SAMPLE_MISTAKES = {
    "Grammar": [
        {
            "userSentence": "I go to store yesterday",
            "correction": "I went to the store yesterday",
            "explanation": "Use past tense 'went' for actions that happened in the past.",
        },
        {
            "userSentence": "She don't like coffee",
            "correction": "She doesn't like coffee",
            "explanation": "Use 'doesn't' with third person singular (he/she/it).",
        },
        {
            "userSentence": "I have been to Paris last year",
            "correction": "I went to Paris last year",
            "explanation": "Use simple past with specific time references like 'last year'.",
        },
        {
            "userSentence": "He is more taller than me",
            "correction": "He is taller than me",
            "explanation": "Don't use 'more' with comparative adjectives ending in -er.",
        },
        {
            "userSentence": "I am agree with you",
            "correction": "I agree with you",
            "explanation": "'Agree' is a verb, not an adjective. Don't use 'am' before it.",
        },
    ],
    "Pronunciation": [
        {
            "userSentence": "[th] sound as [s] in 'think'",
            "correction": "Think - /θɪŋk/ - tongue between teeth",
            "explanation": "Place tongue between teeth for 'th' sound, not behind teeth like 's'.",
        },
        {
            "userSentence": "[w] sound as [v] in 'water'",
            "correction": "Water - /ˈwɔːtər/ - round lips for 'w'",
            "explanation": "Round your lips and don't touch teeth for 'w' sound.",
        },
        {
            "userSentence": "Stress on wrong syllable: 'phoTOgraphy'",
            "correction": "phoTOgraphy → phoTOGraphy",
            "explanation": "Stress falls on the third syllable: pho-TO-gra-phy.",
        },
    ],
    "Vocabulary": [
        {
            "userSentence": "I made my homework",
            "correction": "I did my homework",
            "explanation": "Use 'do homework', not 'make homework'. 'Make' is for creating things.",
        },
        {
            "userSentence": "I want to become a possibility",
            "correction": "I want to have an opportunity",
            "explanation": "'Possibility' means something might happen. 'Opportunity' is a chance to do something.",
        },
        {
            "userSentence": "The weather is very cold, I need a hot coffee",
            "correction": "The weather is very cold, I need a warm coffee",
            "explanation": "In English, drinks are usually 'warm' not 'hot' when describing comfort.",
        },
    ],
    "Cultural": [
        {
            "userSentence": "How much money do you make?",
            "correction": "Consider: What do you do for work?",
            "explanation": "Asking about salary directly is considered rude in English-speaking cultures.",
        },
        {
            "userSentence": "You look tired, are you sick?",
            "correction": "Consider: How are you doing today?",
            "explanation": "Commenting on appearance negatively can be seen as rude. Use neutral greetings.",
        },
    ],
}


def get_firestore_client() -> firestore.Client:
    """Initialize Firestore client with service account."""
    creds_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        'firebase-service-account.json'
    )

    if os.path.exists(creds_path):
        credentials = service_account.Credentials.from_service_account_file(creds_path)
        db = firestore.Client(project='ndtutorlive', credentials=credentials)
        print(f"✓ Connected to Firestore with service account")
    else:
        db = firestore.Client(project='ndtutorlive')
        print(f"✓ Connected to Firestore with default credentials")

    return db


def cleanup_test_data(db: firestore.Client) -> int:
    """Delete all test student documents and their subcollections."""
    print("\n🧹 Cleaning up existing test data...")

    deleted_count = 0

    # Query for test students
    users_ref = db.collection('users')

    # Method 1: Query by ID prefix pattern
    # Firestore doesn't support prefix queries on document IDs directly,
    # so we'll query documents and check their IDs
    for doc in users_ref.stream():
        if doc.id.startswith(TEST_STUDENT_PREFIX):
            print(f"  Deleting user: {doc.id}")

            # Delete subcollections first
            for subcoll_name in ['reviewItems', 'sessionSummaries', 'sessions']:
                subcoll_ref = users_ref.document(doc.id).collection(subcoll_name)
                for subdoc in subcoll_ref.stream():
                    subdoc.reference.delete()
                    print(f"    - Deleted {subcoll_name}/{subdoc.id}")

            # Delete the user document
            doc.reference.delete()
            deleted_count += 1

    print(f"✓ Deleted {deleted_count} test student(s)")

    # Cleanup test missions
    missions_deleted = 0
    for doc in db.collection('missions').stream():
        if doc.id.startswith('test-mission-'):
            doc.reference.delete()
            missions_deleted += 1
    print(f"✓ Deleted {missions_deleted} test mission(s)")

    # Cleanup test sessions from root collection
    sessions_deleted = 0
    for doc in db.collection('sessions').where('isTestData', '==', True).stream():
        doc.reference.delete()
        sessions_deleted += 1
    print(f"✓ Deleted {sessions_deleted} test session(s) from root collection")

    return deleted_count


def create_test_students(db: firestore.Client) -> List[str]:
    """Create test student documents."""
    print("\n👥 Creating test students...")

    created_ids = []
    now = datetime.now(timezone.utc)

    for student in TEST_STUDENTS:
        student_id = student["id"]
        last_session = now - timedelta(days=student["lastSessionDaysAgo"])

        user_data = {
            "displayName": student["displayName"],
            "email": student["email"],
            "level": student["level"],
            "role": "student",
            "teacherId": TEACHER_ID,
            "createdAt": now - timedelta(days=30),  # Created a month ago
            "lastSessionAt": last_session,
            "averageStars": student["avgStars"],
            "totalSessions": 5 + (5 - student["lastSessionDaysAgo"]),  # More sessions if more active
            "isTestData": True,  # Flag for easy identification
        }

        db.collection('users').document(student_id).set(user_data)
        created_ids.append(student_id)
        print(f"  ✓ Created: {student['displayName']} ({student_id}) - Level {student['level']}")

    return created_ids


def create_review_items(db: firestore.Client, student_ids: List[str]) -> int:
    """Create reviewItems (mistakes) for test students."""
    print("\n📝 Creating review items (mistakes)...")

    total_created = 0
    now = datetime.now(timezone.utc)

    # Distribution of mistakes per student (varied for realistic testing)
    mistake_distribution = {
        "test-student-maria": {"Grammar": 3, "Pronunciation": 2, "Vocabulary": 1, "Cultural": 0},
        "test-student-alex": {"Grammar": 2, "Pronunciation": 1, "Vocabulary": 2, "Cultural": 1},
        "test-student-nina": {"Grammar": 4, "Pronunciation": 2, "Vocabulary": 2, "Cultural": 1},  # More mistakes (struggling)
        "test-student-ivan": {"Grammar": 1, "Pronunciation": 1, "Vocabulary": 1, "Cultural": 0},  # Fewer (high performer)
        "test-student-olga": {"Grammar": 2, "Pronunciation": 3, "Vocabulary": 1, "Cultural": 1},
    }

    for student_id in student_ids:
        distribution = mistake_distribution.get(student_id, {"Grammar": 2, "Pronunciation": 1, "Vocabulary": 1, "Cultural": 0})
        student_mistakes_count = 0

        for error_type, count in distribution.items():
            samples = SAMPLE_MISTAKES.get(error_type, [])

            for i in range(min(count, len(samples))):
                sample = samples[i]

                # Create reviewItem document
                review_item = {
                    "errorType": error_type,
                    "userSentence": sample["userSentence"],
                    "correction": sample["correction"],
                    "explanation": sample["explanation"],
                    "severity": 5 + (i % 5),  # Severity 5-9
                    "mastered": False,
                    "reviewCount": 0,
                    "createdAt": now - timedelta(days=i, hours=i * 2),  # Spread over recent days
                    "audioUrl": None,  # Could add test audio URLs here
                    "isTestData": True,
                }

                # Add to user's reviewItems subcollection
                db.collection('users').document(student_id).collection('reviewItems').add(review_item)
                student_mistakes_count += 1
                total_created += 1

        print(f"  ✓ {student_id}: {student_mistakes_count} review items")

    return total_created


def create_session_summaries(db: firestore.Client, student_ids: List[str]) -> int:
    """Create session summaries for billing/analytics data."""
    print("\n📊 Creating session summaries...")

    total_created = 0
    now = datetime.now(timezone.utc)

    for student_id in student_ids:
        student = next((s for s in TEST_STUDENTS if s["id"] == student_id), None)
        if not student:
            continue

        # Create 3-5 session summaries per student
        num_sessions = 3 + (5 - student["lastSessionDaysAgo"]) // 2

        for i in range(num_sessions):
            session_data = {
                "stars": max(1, min(5, round(student["avgStars"] + (i % 3 - 1) * 0.5))),
                "duration": 300 + (i * 60),  # 5-10 minutes
                "createdAt": now - timedelta(days=i * 2),
                "inputTokens": 5000 + (i * 1000),
                "outputTokens": 3000 + (i * 500),
                "isTestData": True,
            }

            db.collection('users').document(student_id).collection('sessionSummaries').add(session_data)
            total_created += 1

    print(f"  ✓ Created {total_created} session summaries")
    return total_created


def create_missions(db: firestore.Client) -> List[str]:
    """Create test missions in root missions collection."""
    print("\n🎯 Creating test missions...")

    mission_ids = []
    now = datetime.now(timezone.utc)

    test_missions = [
        {"id": "test-mission-a2", "title": "A2 Daily Practice", "targetLevel": "A2"},
        {"id": "test-mission-b1", "title": "B1 Conversation Skills", "targetLevel": "B1"},
        {"id": "test-mission-b2", "title": "B2 Advanced Topics", "targetLevel": "B2"},
    ]

    for mission in test_missions:
        mission_data = {
            "title": mission["title"],
            "description": f"Test mission for {mission['targetLevel']} level students",
            "targetLevel": mission["targetLevel"],
            "teacherId": TEACHER_ID,
            "createdAt": now - timedelta(days=30),
            "isTestData": True,
        }

        db.collection('missions').document(mission["id"]).set(mission_data)
        mission_ids.append(mission["id"])
        print(f"  ✓ Created mission: {mission['title']} ({mission['id']})")

    return mission_ids


def create_root_sessions(db: firestore.Client, student_ids: List[str], mission_ids: List[str]) -> int:
    """Create sessions in ROOT sessions collection (for analytics/Class Pulse)."""
    print("\n📊 Creating root sessions for analytics...")

    total_created = 0
    now = datetime.now(timezone.utc)

    # Map students to missions by level
    level_to_mission = {
        "A2": "test-mission-a2",
        "B1": "test-mission-b1",
        "B2": "test-mission-b2",
    }

    for student_id in student_ids:
        student = next((s for s in TEST_STUDENTS if s["id"] == student_id), None)
        if not student:
            continue

        mission_id = level_to_mission.get(student["level"], "test-mission-b1")

        # Create 2-4 sessions per student in ROOT collection
        num_sessions = 2 + (5 - student["lastSessionDaysAgo"]) // 2

        for i in range(num_sessions):
            session_data = {
                "userId": student_id,
                "missionId": mission_id,
                "createdAt": now - timedelta(days=i * 2, hours=i),
                "completedAt": now - timedelta(days=i * 2, hours=i) + timedelta(minutes=15),
                "stars": max(1, min(5, round(student["avgStars"] + (i % 3 - 1) * 0.5))),
                "inputTokens": 8000 + (i * 2000),
                "outputTokens": 5000 + (i * 1000),
                "isTestData": True,
            }

            db.collection('sessions').add(session_data)
            total_created += 1

    print(f"  ✓ Created {total_created} root sessions")
    return total_created


def create_sessions_for_billing(db: firestore.Client, student_ids: List[str]) -> int:
    """Create sessions subcollection data for billing tab."""
    print("\n💰 Creating user sessions for billing data...")

    total_created = 0
    now = datetime.now(timezone.utc)

    for student_id in student_ids:
        student = next((s for s in TEST_STUDENTS if s["id"] == student_id), None)
        if not student:
            continue

        # Create 2-4 sessions per student
        num_sessions = 2 + (5 - student["lastSessionDaysAgo"]) // 3

        for i in range(num_sessions):
            session_data = {
                "startTime": now - timedelta(days=i * 2, hours=i),
                "endTime": now - timedelta(days=i * 2, hours=i) + timedelta(minutes=10),
                "inputTokens": 8000 + (i * 2000),
                "outputTokens": 5000 + (i * 1000),
                "missionId": f"test-mission-{i}",
                "isTestData": True,
            }

            db.collection('users').document(student_id).collection('sessions').add(session_data)
            total_created += 1

    print(f"  ✓ Created {total_created} user sessions for billing")
    return total_created


def verify_data(db: firestore.Client) -> None:
    """Verify created test data."""
    print("\n🔍 Verifying test data...")

    # Count students
    students = list(db.collection('users').where('teacherId', '==', TEACHER_ID).where('isTestData', '==', True).stream())
    print(f"  Students with teacherId={TEACHER_ID}: {len(students)}")

    # Count review items
    total_items = 0
    for student in students:
        items = list(db.collection('users').document(student.id).collection('reviewItems').stream())
        total_items += len(items)
    print(f"  Total review items: {total_items}")

    # Summary by error type
    error_counts = {"Grammar": 0, "Pronunciation": 0, "Vocabulary": 0, "Cultural": 0}
    for student in students:
        for item in db.collection('users').document(student.id).collection('reviewItems').stream():
            error_type = item.to_dict().get('errorType', 'Unknown')
            if error_type in error_counts:
                error_counts[error_type] += 1

    print(f"  By error type: {error_counts}")


def main():
    parser = argparse.ArgumentParser(description='Seed test data for Class Insights testing')
    parser.add_argument('--cleanup-only', action='store_true', help='Only delete test data, do not create new data')
    args = parser.parse_args()

    print("=" * 60)
    print("Class Insights Test Data Seed Script")
    print("=" * 60)
    print(f"Teacher ID: {TEACHER_ID}")
    print(f"Test student prefix: {TEST_STUDENT_PREFIX}")

    # Initialize Firestore
    db = get_firestore_client()

    # Cleanup existing test data
    cleanup_test_data(db)

    if args.cleanup_only:
        print("\n✓ Cleanup complete (--cleanup-only flag set)")
        return

    # Create new test data
    student_ids = create_test_students(db)
    create_review_items(db, student_ids)
    create_session_summaries(db, student_ids)
    mission_ids = create_missions(db)
    create_root_sessions(db, student_ids, mission_ids)
    create_sessions_for_billing(db, student_ids)

    # Verify
    verify_data(db)

    print("\n" + "=" * 60)
    print("✅ Test data seeding complete!")
    print("=" * 60)
    print("\nYou can now test the Insights tab with this teacher account.")
    print(f"Teacher ID: {TEACHER_ID}")
    print(f"Test students: {', '.join(s['displayName'] for s in TEST_STUDENTS)}")
    print("\nTo cleanup later, run:")
    print("  python scripts/seed_test_data.py --cleanup-only")


if __name__ == "__main__":
    main()
