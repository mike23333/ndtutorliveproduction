#!/usr/bin/env python3
"""
Populate test data for Teacher Analytics testing.

This script creates realistic test data for a specific teacher to test:
- Analytics dashboard
- Class Pulse insights
- Student progress tracking

Usage:
    python scripts/populate_test_data.py [teacher_id]

    If no teacher_id provided, uses the default test teacher.
"""

import os
import sys
import random
from datetime import datetime, timedelta, timezone
from collections import defaultdict
from google.cloud import firestore
from google.oauth2 import service_account

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configuration
DEFAULT_TEACHER_ID = "8kRapTzg5CfhQ73SvSqbh6kgZOl1"  # Your teacher ID
CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

# Sample data
STUDENT_NAMES = [
    "Emma Wilson", "Liam Chen", "Sofia Rodriguez", "Noah Kim", "Olivia Patel",
    "Lucas Martinez", "Ava Thompson", "Mason Lee", "Isabella Garcia", "Ethan Brown",
    "Mia Johnson", "Aiden Davis", "Charlotte Miller", "Jackson Moore", "Amelia Taylor"
]

STRUGGLE_WORDS = {
    'A1': ['hello', 'goodbye', 'please', 'thank you', 'water', 'food', 'help', 'yes', 'no', 'sorry'],
    'A2': ['appointment', 'schedule', 'directions', 'weather', 'shopping', 'restaurant', 'hotel', 'travel'],
    'B1': ['opportunity', 'experience', 'recommend', 'apologize', 'convenient', 'disappointed', 'arrangement'],
    'B2': ['nevertheless', 'comprehensive', 'accommodate', 'circumstances', 'significantly', 'subsequently'],
    'C1': ['nuance', 'ubiquitous', 'pragmatic', 'unprecedented', 'meticulous', 'eloquent', 'ambiguous'],
    'C2': ['quintessential', 'ephemeral', 'sycophant', 'obfuscate', 'perspicacious', 'ineffable']
}

MISSION_TITLES = [
    ("Ordering Food", "B1", "Practice ordering food at a restaurant"),
    ("Hotel Check-in", "A2", "Learn to check into a hotel"),
    ("Job Interview", "B2", "Practice common job interview questions"),
    ("Doctor Visit", "B1", "Describe symptoms and understand medical advice"),
    ("Shopping", "A2", "Practice buying clothes and asking about sizes"),
]


def get_firestore_client():
    """Initialize Firestore client."""
    creds_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        'firebase-service-account.json'
    )
    if os.path.exists(creds_path):
        credentials = service_account.Credentials.from_service_account_file(creds_path)
        return firestore.Client(project='ndtutorlive', credentials=credentials)
    else:
        return firestore.Client(project='ndtutorlive')


def create_test_missions(db, teacher_id: str) -> list:
    """Create test missions for the teacher."""
    missions = []

    for title, level, scenario in MISSION_TITLES:
        mission_ref = db.collection('missions').document()
        mission_data = {
            'id': mission_ref.id,
            'teacherId': teacher_id,
            'teacherName': 'Test Teacher',
            'title': title,
            'scenario': scenario,
            'systemPrompt': f"You are a helpful English tutor helping a {level} level student practice {title.lower()}.",
            'targetLevel': level,
            'tone': 'friendly',
            'vocabList': [],
            'isActive': True,
            'durationMinutes': 15,
            'functionCallingEnabled': True,
            'createdAt': datetime.now(timezone.utc) - timedelta(days=random.randint(7, 30)),
            'updatedAt': datetime.now(timezone.utc),
        }
        mission_ref.set(mission_data)
        missions.append(mission_data)
        print(f"  Created mission: {title} ({level})")

    return missions


def create_test_students(db, teacher_id: str, count: int = 10) -> list:
    """Create test student users."""
    students = []

    for i in range(count):
        name = STUDENT_NAMES[i % len(STUDENT_NAMES)]
        level = random.choice(['A2', 'B1', 'B1', 'B2'])  # Weighted towards B1

        # Random last activity (some active, some inactive)
        days_ago = random.choices(
            [1, 2, 3, 5, 8, 14, 21],
            weights=[30, 25, 20, 10, 8, 5, 2]
        )[0]
        last_session = datetime.now(timezone.utc) - timedelta(days=days_ago)

        user_ref = db.collection('users').document(f'test-student-{teacher_id[:8]}-{i:03d}')
        user_data = {
            'displayName': name,
            'email': f'student{i}@test.com',
            'level': level,
            'teacherId': teacher_id,
            'lastSessionAt': last_session,
            'totalSessions': random.randint(3, 20),
            'createdAt': datetime.now(timezone.utc) - timedelta(days=random.randint(14, 60)),
        }
        user_ref.set(user_data)
        students.append({'id': user_ref.id, **user_data})
        print(f"  Created student: {name} ({level}) - last active {days_ago} days ago")

    return students


def create_test_sessions(db, missions: list, students: list):
    """Create test session data."""
    session_count = 0
    now = datetime.now(timezone.utc)

    for student in students:
        # Each student has 3-8 sessions in the past week
        num_sessions = random.randint(3, 8)

        for _ in range(num_sessions):
            mission = random.choice(missions)

            # Session time in the past 7 days
            days_ago = random.randint(0, 6)
            hours_ago = random.randint(0, 23)
            session_time = now - timedelta(days=days_ago, hours=hours_ago)

            # Performance based on level match
            student_level_idx = CEFR_LEVELS.index(student['level']) if student['level'] in CEFR_LEVELS else 2
            mission_level_idx = CEFR_LEVELS.index(mission['targetLevel']) if mission['targetLevel'] in CEFR_LEVELS else 2
            level_diff = abs(student_level_idx - mission_level_idx)

            # Stars: better if level matches, worse if mismatched
            if level_diff == 0:
                stars = random.choices([3, 4, 5], weights=[20, 40, 40])[0]
            elif level_diff == 1:
                stars = random.choices([2, 3, 4, 5], weights=[10, 30, 40, 20])[0]
            else:
                stars = random.choices([1, 2, 3, 4], weights=[20, 40, 30, 10])[0]

            duration = random.randint(300, 900)  # 5-15 minutes in seconds

            # Create session
            session_ref = db.collection('sessions').document()
            session_data = {
                'id': session_ref.id,
                'userId': student['id'],
                'missionId': mission['id'],
                'stars': stars,
                'duration': duration,
                'status': 'completed',
                'createdAt': session_time,
                'completedAt': session_time + timedelta(seconds=duration),
            }
            session_ref.set(session_data)

            # Create session summary
            summary_ref = db.collection('users').document(student['id']).collection('sessionSummaries').document()
            summary_data = {
                'sessionId': session_ref.id,
                'missionId': mission['id'],
                'missionTitle': mission['title'],
                'stars': stars,
                'duration': duration,
                'createdAt': session_time,
            }
            summary_ref.set(summary_data)

            session_count += 1

    print(f"  Created {session_count} sessions")
    return session_count


def create_test_struggles(db, students: list, missions: list):
    """Create test struggle data linked to specific missions."""
    struggle_count = 0
    now = datetime.now(timezone.utc)

    # Create a mapping of level to missions
    level_missions = defaultdict(list)
    for mission in missions:
        level_missions[mission['targetLevel']].append(mission)

    for student in students:
        level = student['level']
        words = STRUGGLE_WORDS.get(level, STRUGGLE_WORDS['B1'])

        # Get missions for this student's level (or adjacent levels)
        student_missions = level_missions.get(level, [])
        if not student_missions:
            # Fallback to any mission
            student_missions = missions

        # Each student struggles with 2-5 words
        num_struggles = random.randint(2, 5)
        struggled_words = random.sample(words, min(num_struggles, len(words)))

        for word in struggled_words:
            # Multiple occurrences of the same struggle
            occurrences = random.randint(1, 3)

            for _ in range(occurrences):
                days_ago = random.randint(0, 6)
                struggle_time = now - timedelta(days=days_ago, hours=random.randint(0, 23))

                severity = random.choices(
                    ['minor', 'moderate', 'significant'],
                    weights=[30, 50, 20]
                )[0]

                # Link to a specific mission
                mission = random.choice(student_missions)

                struggle_ref = db.collection('users').document(student['id']).collection('struggles').document()
                struggle_data = {
                    'word': word,
                    'struggleType': 'vocabulary',
                    'severity': severity,
                    'context': f"Student struggled with '{word}' during {mission['title']}",
                    'missionId': mission['id'],
                    'missionTitle': mission['title'],
                    'mastered': random.random() > 0.7,  # 30% mastered
                    'createdAt': struggle_time,
                }
                struggle_ref.set(struggle_data)
                struggle_count += 1

    print(f"  Created {struggle_count} struggle records (linked to missions)")
    return struggle_count


def cleanup_test_data(db, teacher_id: str):
    """Remove existing test data for this teacher."""
    print(f"Cleaning up existing test data for teacher {teacher_id}...")

    # Delete test students and their subcollections
    users = db.collection('users').where('teacherId', '==', teacher_id).stream()
    for user in users:
        if user.id.startswith('test-student-'):
            # Delete subcollections
            for subcoll in ['sessionSummaries', 'struggles']:
                for doc in db.collection('users').document(user.id).collection(subcoll).stream():
                    doc.reference.delete()
            user.reference.delete()
            print(f"  Deleted user: {user.id}")

    # Delete test missions
    missions = db.collection('missions').where('teacherId', '==', teacher_id).stream()
    mission_ids = []
    for mission in missions:
        data = mission.to_dict()
        # Only delete missions created by this script (have specific titles)
        if data.get('title') in [t[0] for t in MISSION_TITLES]:
            mission_ids.append(mission.id)
            mission.reference.delete()
            print(f"  Deleted mission: {data.get('title')}")

    # Delete sessions for these missions
    for mission_id in mission_ids:
        sessions = db.collection('sessions').where('missionId', '==', mission_id).stream()
        for session in sessions:
            session.reference.delete()

    print("Cleanup complete!")


def main():
    """Main function to populate test data."""
    teacher_id = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_TEACHER_ID

    print(f"\n{'='*60}")
    print(f"Populating test data for teacher: {teacher_id}")
    print(f"{'='*60}\n")

    db = get_firestore_client()

    # Ask about cleanup
    if '--clean' in sys.argv:
        cleanup_test_data(db, teacher_id)
        print()

    # Create test data
    print("Creating test missions...")
    missions = create_test_missions(db, teacher_id)

    print("\nCreating test students...")
    students = create_test_students(db, teacher_id, count=10)

    print("\nCreating test sessions...")
    create_test_sessions(db, missions, students)

    print("\nCreating test struggles...")
    create_test_struggles(db, students, missions)

    print(f"\n{'='*60}")
    print("Test data population complete!")
    print(f"{'='*60}")
    print(f"\nYou can now view analytics at:")
    print(f"  http://localhost:3000 (Teacher Dashboard > Analytics tab)")
    print(f"\nTo clean up test data later, run:")
    print(f"  python scripts/populate_test_data.py {teacher_id} --clean")
    print()


if __name__ == '__main__':
    main()
