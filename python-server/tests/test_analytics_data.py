"""
Test Data Generator for Teacher Analytics & Class Pulse

Creates realistic test data in Firestore (project: ndtutorlive) including:
- 1 teacher
- 10 students across B1/B2 levels
- 3 lessons (missions)
- Sessions with varying performance
- Struggles with different types/severities
- Session summaries with stars

Run: python tests/test_analytics_data.py
"""

import os
import sys
from datetime import datetime, timedelta, timezone
from random import randint, choice, uniform

# Add parent to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from google.cloud import firestore
from google.oauth2 import service_account


def get_firestore_client():
    """Initialize Firestore client."""
    creds_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        'firebase-service-account.json'
    )
    if os.path.exists(creds_path):
        credentials = service_account.Credentials.from_service_account_file(creds_path)
        db = firestore.Client(project='ndtutorlive', credentials=credentials)
        print("✅ Firestore connected with service account")
    else:
        db = firestore.Client(project='ndtutorlive')
        print("✅ Firestore connected with default credentials")
    return db


def create_test_data():
    """Create all test data for analytics testing."""
    db = get_firestore_client()
    now = datetime.now(timezone.utc)

    # Test IDs
    TEACHER_ID = "test-teacher-analytics-001"

    STUDENTS = [
        {"id": "test-student-b1-001", "name": "Maria Kovalenko", "level": "B1"},
        {"id": "test-student-b1-002", "name": "Petro Shevchenko", "level": "B1"},
        {"id": "test-student-b1-003", "name": "Oksana Bondar", "level": "B1"},
        {"id": "test-student-b1-004", "name": "Viktor Melnyk", "level": "B1"},
        {"id": "test-student-b1-005", "name": "Natalia Kravchenko", "level": "B1"},
        {"id": "test-student-b2-001", "name": "Anna Lysenko", "level": "B2"},
        {"id": "test-student-b2-002", "name": "Dmytro Tkachenko", "level": "B2"},
        {"id": "test-student-b2-003", "name": "Olena Marchenko", "level": "B2"},
        {"id": "test-student-b2-004", "name": "Andriy Polishchuk", "level": "B2"},
        {"id": "test-student-b2-005", "name": "Yulia Savchenko", "level": "B2"},
    ]

    MISSIONS = [
        {"id": "test-mission-b1-coffee", "title": "Coffee Shop Conversation", "level": "B1"},
        {"id": "test-mission-b1-restaurant", "title": "Restaurant Ordering", "level": "B1"},
        {"id": "test-mission-b2-business", "title": "Business Meeting", "level": "B2"},
    ]

    STRUGGLE_WORDS = {
        "B1": [
            ("reservation", "vocabulary", "They confuse with 'booking'"),
            ("would you like", "grammar", "Formality issues"),
            ("medium-rare", "vocabulary", "Food terminology"),
            ("borrow", "vocabulary", "Confuse with 'lend'"),
            ("lend", "vocabulary", "Confuse with 'borrow'"),
        ],
        "B2": [
            ("negotiate", "vocabulary", "Business context"),
            ("compromise", "vocabulary", "Abstract concept"),
            ("stakeholder", "vocabulary", "Business jargon"),
            ("whereas", "grammar", "Contrast connectors"),
        ]
    }

    print("\n" + "="*60)
    print("CREATING TEST DATA FOR ANALYTICS")
    print("="*60)

    # 1. Create Teacher
    print(f"\n📝 Creating teacher: {TEACHER_ID}")
    db.collection('users').document(TEACHER_ID).set({
        'displayName': 'Test Teacher',
        'email': 'test-teacher@example.com',
        'role': 'teacher',
        'createdAt': now,
    })

    # 2. Create Missions (Lessons)
    print(f"\n📚 Creating {len(MISSIONS)} missions...")
    for mission in MISSIONS:
        db.collection('missions').document(mission['id']).set({
            'title': mission['title'],
            'teacherId': TEACHER_ID,
            'targetLevel': mission['level'],
            'status': 'published',
            'createdAt': now - timedelta(days=30),
        })
        print(f"   ✓ {mission['title']} ({mission['level']})")

    # 3. Create Students
    print(f"\n👥 Creating {len(STUDENTS)} students...")
    for student in STUDENTS:
        # Vary last session time - some active, some inactive
        if "001" in student['id'] or "002" in student['id']:
            last_session = now - timedelta(hours=randint(1, 24))  # Active today
        elif "003" in student['id']:
            last_session = now - timedelta(days=randint(3, 5))  # Warning
        elif "004" in student['id']:
            last_session = now - timedelta(days=randint(10, 14))  # Inactive
        else:
            last_session = now - timedelta(days=randint(1, 3))  # Active

        db.collection('users').document(student['id']).set({
            'displayName': student['name'],
            'email': f"{student['id']}@example.com",
            'level': student['level'],
            'role': 'student',
            'teacherId': TEACHER_ID,
            'lastSessionAt': last_session,
            'totalSessions': randint(5, 20),
            'totalStars': randint(15, 80),
            'createdAt': now - timedelta(days=60),
        })
        print(f"   ✓ {student['name']} ({student['level']}) - last active: {last_session.strftime('%Y-%m-%d')}")

    # 4. Create Sessions and Session Summaries
    print(f"\n🎯 Creating sessions...")
    session_count = 0

    for student in STUDENTS:
        student_level = student['level']
        # Get missions for this student's level
        student_missions = [m for m in MISSIONS if m['level'] == student_level]

        # Create 3-6 sessions per student in last 7 days
        num_sessions = randint(3, 6)

        # Make some students high performers (advancement candidates)
        is_high_performer = student['id'] in ['test-student-b2-001', 'test-student-b2-003']

        for i in range(num_sessions):
            mission = choice(student_missions)
            session_time = now - timedelta(days=randint(0, 6), hours=randint(0, 23))

            # Vary stars - high performers get 4-5, others get 2-5
            if is_high_performer:
                stars = choice([4, 4, 5, 5, 5])
            elif mission['id'] == 'test-mission-b1-restaurant':
                # Restaurant lesson struggles (for warning insight)
                stars = choice([2, 2, 3, 3, 3])
            else:
                stars = choice([3, 3, 4, 4, 5])

            session_id = f"test-session-{student['id'][-3:]}-{i}"
            duration = randint(180, 420)  # 3-7 minutes in seconds

            # Create session document
            db.collection('sessions').document(session_id).set({
                'userId': student['id'],
                'missionId': mission['id'],
                'teacherId': TEACHER_ID,
                'stars': stars,
                'duration': duration,
                'status': 'completed',
                'createdAt': session_time,
            })

            # Create session summary in user subcollection
            db.collection('users').document(student['id']).collection('sessionSummaries').document(session_id).set({
                'missionId': mission['id'],
                'missionTitle': mission['title'],
                'stars': stars,
                'duration': duration,
                'createdAt': session_time,
            })

            session_count += 1

    print(f"   ✓ Created {session_count} sessions")

    # 5. Create Struggles
    print(f"\n😓 Creating struggles...")
    struggle_count = 0

    for student in STUDENTS:
        student_level = student['level']
        words = STRUGGLE_WORDS.get(student_level, [])

        # Each student struggles with 2-4 words
        num_struggles = randint(2, 4)
        selected_words = words[:num_struggles] if len(words) >= num_struggles else words

        for word, struggle_type, context in selected_words:
            # Some words appear multiple times (multiple occurrences)
            occurrences = randint(1, 3)
            for occ in range(occurrences):
                struggle_time = now - timedelta(days=randint(0, 6), hours=randint(0, 23))
                severity = choice(['minor', 'moderate', 'moderate', 'significant'])

                struggle_id = f"struggle-{student['id'][-3:]}-{word[:4]}-{occ}"

                db.collection('users').document(student['id']).collection('struggles').document(struggle_id).set({
                    'word': word,
                    'struggleType': struggle_type,
                    'context': context,
                    'severity': severity,
                    'mastered': False,
                    'reviewCount': 0,
                    'lastReviewedAt': None,
                    'createdAt': struggle_time,
                })
                struggle_count += 1

    print(f"   ✓ Created {struggle_count} struggles")

    # 6. Summary
    print("\n" + "="*60)
    print("TEST DATA CREATED SUCCESSFULLY")
    print("="*60)
    print(f"""
Test IDs for API calls:
  Teacher ID: {TEACHER_ID}

Test the endpoints:
  GET  http://localhost:8080/api/analytics/teacher/{TEACHER_ID}
  GET  http://localhost:8080/api/analytics/teacher/{TEACHER_ID}?level=B1
  GET  http://localhost:8080/api/pulse/teacher/{TEACHER_ID}
  POST http://localhost:8080/api/pulse/teacher/{TEACHER_ID}?force=true
""")

    return TEACHER_ID


def cleanup_test_data():
    """Remove all test data."""
    db = get_firestore_client()

    print("\n🗑️  Cleaning up test data...")

    # Delete test users and their subcollections
    users_query = db.collection('users').where('email', '>=', 'test-').where('email', '<=', 'test-\uf8ff')
    for doc in users_query.stream():
        # Delete subcollections
        for subcoll in ['sessionSummaries', 'struggles', 'reviewLessons']:
            for subdoc in db.collection('users').document(doc.id).collection(subcoll).stream():
                subdoc.reference.delete()
        doc.reference.delete()
        print(f"   ✓ Deleted user: {doc.id}")

    # Delete test missions
    missions_query = db.collection('missions').where('teacherId', '==', 'test-teacher-analytics-001')
    for doc in missions_query.stream():
        doc.reference.delete()
        print(f"   ✓ Deleted mission: {doc.id}")

    # Delete test sessions
    sessions_query = db.collection('sessions').where('teacherId', '==', 'test-teacher-analytics-001')
    for doc in sessions_query.stream():
        doc.reference.delete()
        print(f"   ✓ Deleted session: {doc.id}")

    # Delete daily insights
    insights_ref = db.collection('teachers').document('test-teacher-analytics-001').collection('dailyInsights')
    for doc in insights_ref.stream():
        doc.reference.delete()
        print(f"   ✓ Deleted insight: {doc.id}")

    print("✅ Cleanup complete")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Test data management for analytics')
    parser.add_argument('--cleanup', action='store_true', help='Remove test data instead of creating')
    args = parser.parse_args()

    if args.cleanup:
        cleanup_test_data()
    else:
        create_test_data()
