# Teacher Analytics Endpoint Implementation Plan

## Objective
Add a teacher analytics endpoint to the existing Python FastAPI server (`python-server/main.py`) to support the Analytics Tab in TeacherDashboard.

## Current State
- **Design Doc**: `docs/teacher-analytics-design.md` specifies Class Pulse + Analytics Tab features
- **Python Server**: FastAPI with existing endpoints (`/api/token`, `/api/review/generate`, `/api/review/generate-batch`)
- **Frontend**: TeacherDashboard has placeholder "Analytics Coming Soon" tab ready for data

## Implementation Approach

### Single Endpoint Addition to `python-server/main.py`

**Endpoint**: `GET /api/analytics/teacher/{teacherId}`

**Query Parameters**:
- `period`: "week" | "month" | "all-time" (default: "week")
- `level`: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "all" (default: "all")

### Response Structure
```json
{
  "period": "week",
  "generatedAt": "ISO timestamp",
  "byLevel": {
    "B1": {
      "studentCount": 12,
      "sessionCount": 28,
      "avgStars": 3.6,
      "totalPracticeMinutes": 420,
      "wordsMastered": 85,
      "trends": {
        "sessions": "+12%",
        "avgStars": "+0.2"
      },
      "lessons": [
        {
          "missionId": "...",
          "title": "Restaurant Vocabulary",
          "completions": 8,
          "avgStars": 3.4,
          "warning": true
        }
      ],
      "students": [
        {
          "userId": "...",
          "displayName": "Student Name",
          "lastActive": "ISO timestamp",
          "activityStatus": "active|warning|inactive",
          "sessionCount": 5,
          "avgStars": 4.2,
          "advancementCandidate": false,
          "levelMismatch": false
        }
      ],
      "topStruggles": [
        {
          "text": "borrow vs lend",
          "type": "vocabulary",
          "count": 15,
          "severity": "high"
        }
      ]
    }
  },
  "totals": {
    "studentCount": 25,
    "sessionCount": 58,
    "avgStars": 3.5
  },
  "crossLevelInsights": {
    "advancementCandidates": [],
    "levelMismatches": [],
    "universalStruggles": []
  }
}
```

## Implementation Steps

### Step 1: Create AnalyticsService class
**File**: `python-server/app/analytics_service.py`

- `__init__`: Initialize Firestore client
- `get_teacher_analytics(teacher_id, period, level)`: Main entry point
- `_get_time_range(period)`: Calculate start/end timestamps
- `_query_missions(teacher_id, level)`: Get teacher's missions filtered by level
- `_query_sessions(mission_ids, start_time)`: Get sessions for missions in time period
- `_query_students(teacher_id)`: Get students linked to teacher
- `_query_struggles(user_ids, start_time)`: Get struggles for students
- `_aggregate_by_level(data)`: Group all metrics by CEFR level
- `_calculate_trends(current, previous)`: Week-over-week comparisons
- `_detect_level_mismatches(sessions, users)`: Find students struggling below level
- `_detect_advancement_candidates(sessions, users)`: Find students ready to advance

### Step 2: Add endpoint to main.py

```python
from app.analytics_service import AnalyticsService, get_analytics_service

@app.get("/api/analytics/teacher/{teacherId}")
async def get_teacher_analytics(
    teacherId: str,
    period: str = "week",
    level: str = "all"
):
    try:
        analytics_service = get_analytics_service()
        result = analytics_service.get_teacher_analytics(teacherId, period, level)
        return result
    except Exception as e:
        print(f"[Analytics] Error: {e}", flush=True)
        raise HTTPException(status_code=500, detail=str(e))
```

### Step 3: Add Pydantic models for type safety

```python
class LessonStats(BaseModel):
    missionId: str
    title: str
    completions: int
    avgStars: float
    warning: bool

class StudentActivity(BaseModel):
    userId: str
    displayName: str
    lastActive: Optional[str]
    activityStatus: str  # "active" | "warning" | "inactive"
    sessionCount: int
    avgStars: float
    advancementCandidate: bool
    levelMismatch: bool

class StruggleItem(BaseModel):
    text: str
    type: str  # "vocabulary" | "grammar" | "pronunciation"
    count: int
    severity: str  # "low" | "medium" | "high"

class LevelAnalytics(BaseModel):
    studentCount: int
    sessionCount: int
    avgStars: float
    totalPracticeMinutes: int
    wordsMastered: int
    trends: Dict[str, str]
    lessons: List[LessonStats]
    students: List[StudentActivity]
    topStruggles: List[StruggleItem]

class AnalyticsResponse(BaseModel):
    period: str
    generatedAt: str
    byLevel: Dict[str, LevelAnalytics]
    totals: Dict[str, Any]
    crossLevelInsights: Dict[str, List]
```

## Data Sources (Firestore Collections)

| Collection | Key Fields | Usage |
|------------|-----------|-------|
| `missions` | `teacherId`, `targetLevel`, `title` | Get teacher's lessons by level |
| `sessions` | `missionId`, `userId`, `createdAt` | Session activity counts |
| `users/{id}/sessionSummaries` | `stars`, `createdAt`, `duration` | Performance metrics |
| `users/{id}/struggles` | `text`, `type`, `severity`, `createdAt` | Struggle tracking |
| `users` | `level`, `displayName`, `lastSessionAt` | Student info + level |

## Files to Modify/Create

1. **Create**: `python-server/app/analytics_service.py` - Analytics service class
2. **Modify**: `python-server/main.py` - Add endpoint + import
3. **Optional**: `python-server/requirements.txt` - No new dependencies needed

## Key Design Decisions

1. **Real-time queries**: No pre-computation, query Firestore on each request
2. **Level-aware grouping**: All metrics grouped by CEFR level
3. **Activity status logic**:
   - 🟢 active: session within 3 days
   - 🟡 warning: session within 7 days
   - 🔴 inactive: no session in 7+ days
4. **Trend calculation**: Compare current period to previous period of same length
5. **Level mismatch detection**: Student's assigned level vs lesson level they struggled with
6. **Advancement candidate**: 5+ sessions with avg stars ≥ 4.5 at current level

## AnalyticsService Implementation Skeleton

```python
# python-server/app/analytics_service.py

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from google.cloud import firestore

class AnalyticsService:
    def __init__(self):
        self._db = firestore.Client()

    def get_teacher_analytics(
        self,
        teacher_id: str,
        period: str = "week",
        level: str = "all"
    ) -> Dict[str, Any]:
        """Main entry point for teacher analytics."""
        start_time, end_time = self._get_time_range(period)
        prev_start, prev_end = self._get_previous_period(period, start_time)

        # Query data
        missions = self._query_missions(teacher_id, level)
        mission_ids = [m.id for m in missions]

        if not mission_ids:
            return self._empty_response(period)

        sessions = self._query_sessions(mission_ids, start_time, end_time)
        prev_sessions = self._query_sessions(mission_ids, prev_start, prev_end)

        user_ids = list(set(s.get('userId') for s in sessions if s.get('userId')))
        users = self._query_users(user_ids)
        struggles = self._query_struggles(user_ids, start_time, end_time)

        # Aggregate by level
        by_level = self._aggregate_by_level(
            missions, sessions, prev_sessions, users, struggles
        )

        # Calculate totals and cross-level insights
        totals = self._calculate_totals(by_level)
        cross_level = self._detect_cross_level_insights(sessions, users, struggles)

        return {
            "period": period,
            "generatedAt": datetime.utcnow().isoformat() + "Z",
            "byLevel": by_level,
            "totals": totals,
            "crossLevelInsights": cross_level
        }

    def _get_time_range(self, period: str) -> tuple:
        """Calculate start and end timestamps for the period."""
        now = datetime.utcnow()
        if period == "week":
            start = now - timedelta(days=7)
        elif period == "month":
            start = now - timedelta(days=30)
        else:  # all-time
            start = datetime(2020, 1, 1)
        return start, now

    def _get_previous_period(self, period: str, current_start: datetime) -> tuple:
        """Get the previous period for trend comparison."""
        if period == "week":
            delta = timedelta(days=7)
        elif period == "month":
            delta = timedelta(days=30)
        else:
            return None, None
        return current_start - delta, current_start

    def _query_missions(self, teacher_id: str, level: str) -> List:
        """Query missions for teacher, optionally filtered by level."""
        query = self._db.collection('missions').where('teacherId', '==', teacher_id)
        if level != "all":
            query = query.where('targetLevel', '==', level)
        return list(query.stream())

    def _query_sessions(
        self,
        mission_ids: List[str],
        start_time: datetime,
        end_time: datetime
    ) -> List[Dict]:
        """Query sessions for given missions within time range."""
        if not mission_ids:
            return []

        sessions = []
        # Firestore 'in' queries limited to 10 items
        for i in range(0, len(mission_ids), 10):
            batch_ids = mission_ids[i:i+10]
            query = (
                self._db.collection('sessions')
                .where('missionId', 'in', batch_ids)
                .where('createdAt', '>=', start_time)
                .where('createdAt', '<=', end_time)
            )
            sessions.extend([doc.to_dict() | {'id': doc.id} for doc in query.stream()])
        return sessions

    def _query_users(self, user_ids: List[str]) -> Dict[str, Dict]:
        """Query user documents."""
        users = {}
        for user_id in user_ids:
            doc = self._db.collection('users').document(user_id).get()
            if doc.exists:
                users[user_id] = doc.to_dict()
        return users

    def _query_struggles(
        self,
        user_ids: List[str],
        start_time: datetime,
        end_time: datetime
    ) -> List[Dict]:
        """Query struggles for users within time range."""
        struggles = []
        for user_id in user_ids:
            query = (
                self._db.collection('users').document(user_id)
                .collection('struggles')
                .where('createdAt', '>=', start_time)
                .where('createdAt', '<=', end_time)
            )
            struggles.extend([
                doc.to_dict() | {'userId': user_id}
                for doc in query.stream()
            ])
        return struggles

    def _aggregate_by_level(
        self,
        missions: List,
        sessions: List[Dict],
        prev_sessions: List[Dict],
        users: Dict[str, Dict],
        struggles: List[Dict]
    ) -> Dict[str, Dict]:
        """Aggregate all metrics grouped by CEFR level."""
        # Implementation groups sessions/struggles by mission targetLevel
        # Calculates per-level stats, trends, lessons, students, struggles
        pass  # Full implementation in actual file

    def _calculate_totals(self, by_level: Dict) -> Dict:
        """Sum totals across all levels."""
        pass

    def _detect_cross_level_insights(
        self,
        sessions: List[Dict],
        users: Dict,
        struggles: List[Dict]
    ) -> Dict:
        """Detect advancement candidates, level mismatches, universal struggles."""
        pass

    def _empty_response(self, period: str) -> Dict:
        """Return empty response when no data."""
        return {
            "period": period,
            "generatedAt": datetime.utcnow().isoformat() + "Z",
            "byLevel": {},
            "totals": {"studentCount": 0, "sessionCount": 0, "avgStars": 0},
            "crossLevelInsights": {
                "advancementCandidates": [],
                "levelMismatches": [],
                "universalStruggles": []
            }
        }


# Singleton pattern
_analytics_service: Optional[AnalyticsService] = None

def get_analytics_service() -> AnalyticsService:
    global _analytics_service
    if _analytics_service is None:
        _analytics_service = AnalyticsService()
    return _analytics_service
```

## Testing Strategy

1. Create test file `python-server/tests/test_analytics.py`
2. Mock Firestore responses
3. Test each helper method independently
4. Test full endpoint with sample data
5. Verify level filtering works correctly
6. Verify trend calculations are accurate
