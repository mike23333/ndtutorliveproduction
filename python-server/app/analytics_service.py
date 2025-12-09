"""
Teacher Analytics Service

Provides analytics data for teachers including:
- Session counts and performance by CEFR level
- Student activity tracking
- Struggle patterns and trends
- Level mismatch and advancement detection
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Any
from collections import defaultdict

from google import genai
from google.cloud import firestore
from google.oauth2 import service_account

from app.config import config


class AnalyticsService:
    """Service for generating teacher analytics."""

    ACTIVE_THRESHOLD = 3
    WARNING_THRESHOLD = 7
    ADVANCEMENT_MIN_SESSIONS = 5
    ADVANCEMENT_MIN_AVG_STARS = 4.5
    MISMATCH_STRUGGLE_THRESHOLD = 3
    CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

    # Smart triggering thresholds
    MIN_NEW_SESSIONS_FOR_REGEN = 3
    MIN_NEW_STRUGGLES_FOR_REGEN = 5

    CLASS_PULSE_PROMPT = """You are an AI assistant helping English language teachers understand their class performance.

Analyze the following class data and generate 2-3 actionable insights. Each insight should:
1. Be specific and actionable (not vague like "students are struggling")
2. Reference specific levels, lessons, or students when relevant
3. Suggest what the teacher might do next
4. Be encouraging but honest

IMPORTANT GUIDELINES:
- Max 3 insights, prioritize the most important
- Use insight types: "warning" (needs attention), "info" (neutral observation), "success" (positive news)
- If a lesson has low stars (<3.0), that's a warning
- If students are inactive 7+ days, mention them
- If students are ready to advance (high scores), celebrate that
- If a word is causing trouble across multiple levels, flag it

CLASS DATA:
{class_data}

Respond with ONLY valid JSON in this exact format (no markdown, no explanation):
{{
  "insights": [
    {{
      "type": "warning|info|success",
      "level": "B1|B2|null",
      "title": "Short title (max 5 words)",
      "message": "Detailed message with specific advice (1-2 sentences)"
    }}
  ]
}}"""

    def __init__(self):
        """Initialize with Firestore and Gemini clients."""
        creds_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            'firebase-service-account.json'
        )
        if os.path.exists(creds_path):
            credentials = service_account.Credentials.from_service_account_file(creds_path)
            self._db = firestore.Client(project='ndtutorlive', credentials=credentials)
            print(f"[Analytics] Firestore initialized with service account", flush=True)
        else:
            self._db = firestore.Client(project='ndtutorlive')
            print(f"[Analytics] Firestore initialized with default credentials", flush=True)

        # Initialize Gemini client for Class Pulse insights
        if config.GEMINI_API_KEY:
            self._gemini = genai.Client(api_key=config.GEMINI_API_KEY)
            print(f"[Analytics] Gemini client initialized", flush=True)
        else:
            self._gemini = None
            print(f"[Analytics] WARNING: No GEMINI_API_KEY - Class Pulse will use fallback insights", flush=True)

    def get_teacher_analytics(
        self,
        teacher_id: str,
        period: str = "week",
        level: str = "all"
    ) -> Dict[str, Any]:
        """Main entry point for teacher analytics."""
        print(f"[Analytics] Getting analytics for teacher {teacher_id}, period={period}, level={level}", flush=True)

        start_time, end_time = self._get_time_range(period)
        prev_start, prev_end = self._get_previous_period(period, start_time)

        missions = self._query_missions(teacher_id, level)
        mission_map = {m.id: m.to_dict() for m in missions}
        mission_ids = list(mission_map.keys())

        if not mission_ids:
            return self._empty_response(period)

        sessions = self._query_sessions(mission_ids, start_time, end_time)
        prev_sessions = self._query_sessions(mission_ids, prev_start, prev_end) if prev_start else []

        user_ids = list(set(s.get('userId') for s in sessions if s.get('userId')))
        users = self._query_users(user_ids)
        session_summaries = self._query_session_summaries(user_ids, start_time, end_time)
        prev_summaries = self._query_session_summaries(user_ids, prev_start, prev_end) if prev_start else {}
        struggles = self._query_struggles(user_ids, start_time, end_time)

        by_level = self._aggregate_by_level(
            mission_map, sessions, prev_sessions,
            users, session_summaries, prev_summaries, struggles
        )
        totals = self._calculate_totals(by_level)
        cross_level = self._detect_cross_level_insights(sessions, users, struggles, mission_map)

        return {
            "period": period,
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "byLevel": by_level,
            "totals": totals,
            "crossLevelInsights": cross_level
        }

    def _get_time_range(self, period: str) -> tuple:
        now = datetime.now(timezone.utc)
        if period == "week":
            start = now - timedelta(days=7)
        elif period == "month":
            start = now - timedelta(days=30)
        else:
            start = datetime(2020, 1, 1, tzinfo=timezone.utc)
        return start, now

    def _get_previous_period(self, period: str, current_start: datetime) -> tuple:
        if period == "all-time":
            return None, None
        delta = timedelta(days=7) if period == "week" else timedelta(days=30)
        return current_start - delta, current_start

    def _query_missions(self, teacher_id: str, level: str) -> List:
        query = self._db.collection('missions').where('teacherId', '==', teacher_id)
        if level != "all":
            query = query.where('targetLevel', '==', level)
        return list(query.stream())

    def _query_sessions(self, mission_ids: List[str], start_time: datetime, end_time: datetime) -> List[Dict]:
        if not mission_ids:
            return []
        sessions = []
        for i in range(0, len(mission_ids), 30):
            batch_ids = mission_ids[i:i+30]
            query = (
                self._db.collection('sessions')
                .where('missionId', 'in', batch_ids)
                .where('createdAt', '>=', start_time)
                .where('createdAt', '<=', end_time)
            )
            for doc in query.stream():
                data = doc.to_dict()
                data['id'] = doc.id
                sessions.append(data)
        return sessions

    def _query_users(self, user_ids: List[str]) -> Dict[str, Dict]:
        users = {}
        for user_id in user_ids:
            doc = self._db.collection('users').document(user_id).get()
            if doc.exists:
                users[user_id] = doc.to_dict()
        return users

    def _query_session_summaries(self, user_ids: List[str], start_time: datetime, end_time: datetime) -> Dict[str, List[Dict]]:
        summaries = defaultdict(list)
        for user_id in user_ids:
            query = (
                self._db.collection('users').document(user_id)
                .collection('sessionSummaries')
                .where('createdAt', '>=', start_time)
                .where('createdAt', '<=', end_time)
            )
            for doc in query.stream():
                summaries[user_id].append(doc.to_dict())
        return dict(summaries)

    def _query_struggles(self, user_ids: List[str], start_time: datetime, end_time: datetime) -> List[Dict]:
        struggles = []
        for user_id in user_ids:
            query = (
                self._db.collection('users').document(user_id)
                .collection('struggles')
                .where('createdAt', '>=', start_time)
                .where('createdAt', '<=', end_time)
            )
            for doc in query.stream():
                data = doc.to_dict()
                data['userId'] = user_id
                data['id'] = doc.id
                struggles.append(data)
        return struggles

    def _aggregate_by_level(
        self, mission_map, sessions, prev_sessions, users, session_summaries, prev_summaries, struggles
    ) -> Dict[str, Dict]:
        level_data = {level: {
            'sessions': [], 'prev_sessions': [], 'user_ids': set(),
            'struggles': [], 'summaries': [], 'prev_summaries': []
        } for level in self.CEFR_LEVELS}

        for session in sessions:
            mission = mission_map.get(session.get('missionId'), {})
            target_level = mission.get('targetLevel', 'B1')
            if target_level in level_data:
                level_data[target_level]['sessions'].append(session)
                if session.get('userId'):
                    level_data[target_level]['user_ids'].add(session['userId'])

        for session in prev_sessions:
            mission = mission_map.get(session.get('missionId'), {})
            target_level = mission.get('targetLevel', 'B1')
            if target_level in level_data:
                level_data[target_level]['prev_sessions'].append(session)

        for struggle in struggles:
            user_level = users.get(struggle.get('userId'), {}).get('level', 'B1')
            if user_level in level_data:
                level_data[user_level]['struggles'].append(struggle)

        for user_id, user_summaries in session_summaries.items():
            user_level = users.get(user_id, {}).get('level', 'B1')
            if user_level in level_data:
                level_data[user_level]['summaries'].extend(user_summaries)

        for user_id, user_summaries in prev_summaries.items():
            user_level = users.get(user_id, {}).get('level', 'B1')
            if user_level in level_data:
                level_data[user_level]['prev_summaries'].extend(user_summaries)

        by_level = {}
        for level, data in level_data.items():
            if not data['sessions'] and not data['user_ids']:
                continue

            session_count = len(data['sessions'])
            prev_session_count = len(data['prev_sessions'])
            student_count = len(data['user_ids'])

            stars = [s.get('stars', 0) for s in data['summaries'] if s.get('stars')]
            avg_stars = sum(stars) / len(stars) if stars else 0
            prev_stars = [s.get('stars', 0) for s in data['prev_summaries'] if s.get('stars')]
            prev_avg_stars = sum(prev_stars) / len(prev_stars) if prev_stars else 0

            minutes = sum(s.get('duration', 0) / 60 for s in data['summaries'])

            by_level[level] = {
                "studentCount": student_count,
                "sessionCount": session_count,
                "avgStars": round(avg_stars, 2),
                "totalPracticeMinutes": round(minutes),
                "wordsMastered": self._count_mastered_words(list(data['user_ids'])),
                "trends": self._calculate_trends(session_count, prev_session_count, avg_stars, prev_avg_stars),
                "lessons": self._aggregate_lessons(data['sessions'], mission_map, data['struggles']),
                "students": self._aggregate_students(list(data['user_ids']), users, session_summaries),
                "topStruggles": self._aggregate_struggles(data['struggles'])
            }
        return by_level

    def _calculate_trends(self, curr_sessions, prev_sessions, curr_stars, prev_stars) -> Dict[str, str]:
        if prev_sessions > 0:
            change = ((curr_sessions - prev_sessions) / prev_sessions) * 100
            sessions_trend = f"{'+' if change >= 0 else ''}{change:.0f}%"
        else:
            sessions_trend = "+100%" if curr_sessions > 0 else "0%"

        if prev_stars > 0:
            star_change = curr_stars - prev_stars
            stars_trend = f"{'+' if star_change >= 0 else ''}{star_change:.1f}"
        else:
            stars_trend = f"+{curr_stars:.1f}" if curr_stars > 0 else "0"

        return {"sessions": sessions_trend, "avgStars": stars_trend}

    def _aggregate_lessons(self, sessions, mission_map, struggles=None) -> List[Dict]:
        stats = defaultdict(lambda: {'completions': 0, 'stars': [], 'struggles': [], 'user_ids': set()})
        for session in sessions:
            mid = session.get('missionId')
            if mid:
                stats[mid]['completions'] += 1
                if session.get('stars'):
                    stats[mid]['stars'].append(session['stars'])
                if session.get('userId'):
                    stats[mid]['user_ids'].add(session['userId'])

        # Link struggles to lessons based on which lessons the student did
        if struggles:
            for struggle in struggles:
                user_id = struggle.get('userId')
                mission_id = struggle.get('missionId')  # Direct link if available
                if mission_id and mission_id in stats:
                    stats[mission_id]['struggles'].append(struggle)
                elif user_id:
                    # Fallback: attribute to lessons this user participated in
                    for mid, data in stats.items():
                        if user_id in data['user_ids']:
                            stats[mid]['struggles'].append(struggle)
                            break  # Only attribute to one lesson

        lessons = []
        for mid, s in stats.items():
            mission = mission_map.get(mid, {})
            avg = sum(s['stars']) / len(s['stars']) if s['stars'] else 0

            # Aggregate struggle words for this lesson
            struggle_counts = defaultdict(int)
            for struggle in s['struggles']:
                word = struggle.get('word', '')
                if word:
                    struggle_counts[word] += 1

            top_struggles = sorted(
                [{'word': w, 'count': c} for w, c in struggle_counts.items()],
                key=lambda x: x['count'],
                reverse=True
            )[:5]

            lessons.append({
                "missionId": mid,
                "title": mission.get('title', 'Unknown'),
                "completions": s['completions'],
                "avgStars": round(avg, 1),
                "warning": avg < 3.0 and s['completions'] >= 3,
                "struggleCount": len(s['struggles']),
                "topStruggles": top_struggles
            })
        lessons.sort(key=lambda x: x['completions'], reverse=True)
        return lessons[:10]

    def _aggregate_students(self, user_ids, users, session_summaries) -> List[Dict]:
        students = []
        now = datetime.now(timezone.utc)
        for uid in user_ids:
            user = users.get(uid, {})
            summaries = session_summaries.get(uid, [])
            last = user.get('lastSessionAt')
            days = 999
            if last:
                if hasattr(last, 'timestamp'):
                    last_dt = datetime.fromtimestamp(last.timestamp(), tz=timezone.utc)
                else:
                    last_dt = last.replace(tzinfo=timezone.utc) if last.tzinfo is None else last
                days = (now - last_dt).days

            status = "active" if days <= self.ACTIVE_THRESHOLD else "warning" if days <= self.WARNING_THRESHOLD else "inactive"
            stars = [s.get('stars', 0) for s in summaries if s.get('stars')]
            avg = sum(stars) / len(stars) if stars else 0
            adv = len(summaries) >= self.ADVANCEMENT_MIN_SESSIONS and avg >= self.ADVANCEMENT_MIN_AVG_STARS

            students.append({
                "userId": uid,
                "displayName": user.get('displayName', 'Student'),
                "lastActive": last.isoformat() if last and hasattr(last, 'isoformat') else None,
                "activityStatus": status,
                "sessionCount": len(summaries),
                "avgStars": round(avg, 1),
                "advancementCandidate": adv,
                "levelMismatch": False
            })
        students.sort(key=lambda x: x.get('lastActive') or '', reverse=True)
        return students

    def _aggregate_struggles(self, struggles) -> List[Dict]:
        counts = defaultdict(lambda: {'count': 0, 'type': 'vocabulary', 'severities': []})
        for s in struggles:
            word = s.get('word', '')
            if word:
                counts[word]['count'] += 1
                counts[word]['type'] = s.get('struggleType', 'vocabulary')
                counts[word]['severities'].append(s.get('severity', 'moderate'))

        severity_map = {'significant': 3, 'moderate': 2, 'minor': 1}
        result = []
        for word, data in counts.items():
            avg = sum(severity_map.get(sv, 2) for sv in data['severities']) / len(data['severities'])
            sev = "high" if avg >= 2.5 else "medium" if avg >= 1.5 else "low"
            result.append({"text": word, "type": data['type'], "count": data['count'], "severity": sev})
        result.sort(key=lambda x: x['count'], reverse=True)
        return result[:15]

    def _count_mastered_words(self, user_ids) -> int:
        count = 0
        for uid in user_ids:
            query = self._db.collection('users').document(uid).collection('struggles').where('mastered', '==', True)
            count += len(list(query.stream()))
        return count

    def _calculate_totals(self, by_level) -> Dict:
        totals = {"studentCount": 0, "sessionCount": 0, "avgStars": 0, "totalPracticeMinutes": 0, "wordsMastered": 0}
        star_sum, level_count = 0, 0
        for data in by_level.values():
            totals["studentCount"] += data.get("studentCount", 0)
            totals["sessionCount"] += data.get("sessionCount", 0)
            totals["totalPracticeMinutes"] += data.get("totalPracticeMinutes", 0)
            totals["wordsMastered"] += data.get("wordsMastered", 0)
            if data.get("avgStars", 0) > 0:
                star_sum += data["avgStars"]
                level_count += 1
        totals["avgStars"] = round(star_sum / level_count, 2) if level_count > 0 else 0
        return totals

    def _detect_cross_level_insights(self, sessions, users, struggles, mission_map) -> Dict:
        insights = {"advancementCandidates": [], "levelMismatches": [], "universalStruggles": []}

        user_struggles = defaultdict(list)
        for s in struggles:
            user_struggles[s.get('userId')].append(s)

        for uid, ustruggles in user_struggles.items():
            if len(ustruggles) >= self.MISMATCH_STRUGGLE_THRESHOLD:
                sig_count = sum(1 for s in ustruggles if s.get('severity') == 'significant')
                if sig_count >= 2:
                    insights["levelMismatches"].append({
                        "userId": uid,
                        "displayName": users.get(uid, {}).get('displayName', 'Student'),
                        "currentLevel": users.get(uid, {}).get('level', 'B1'),
                        "evidence": f"{sig_count} significant struggles"
                    })

        struggle_levels = defaultdict(set)
        for s in struggles:
            word = s.get('word', '')
            user_level = users.get(s.get('userId'), {}).get('level', 'B1')
            if word:
                struggle_levels[word].add(user_level)

        for word, levels in struggle_levels.items():
            if len(levels) >= 2:
                insights["universalStruggles"].append({
                    "text": word,
                    "affectedLevels": sorted(list(levels)),
                    "totalCount": sum(1 for s in struggles if s.get('word') == word)
                })
        insights["universalStruggles"].sort(key=lambda x: len(x["affectedLevels"]), reverse=True)
        insights["universalStruggles"] = insights["universalStruggles"][:10]
        return insights

    def _empty_response(self, period: str) -> Dict:
        return {
            "period": period,
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "byLevel": {},
            "totals": {"studentCount": 0, "sessionCount": 0, "avgStars": 0, "totalPracticeMinutes": 0, "wordsMastered": 0},
            "crossLevelInsights": {"advancementCandidates": [], "levelMismatches": [], "universalStruggles": []}
        }

    # ==================== CLASS PULSE (AI-GENERATED INSIGHTS) ====================

    def generate_class_pulse(
        self,
        teacher_id: str,
        force: bool = False
    ) -> Dict[str, Any]:
        """
        Generate AI-powered Class Pulse insights for a teacher.

        Uses Gemini 2.5 Pro to analyze class data and generate 2-3 actionable insights.
        Implements smart triggering to avoid wasteful API calls when no new data.

        Args:
            teacher_id: Teacher's user ID
            force: Force regeneration even if no new data

        Returns:
            Dict with insights array, timestamps, and metadata
        """
        print(f"[ClassPulse] Generating insights for teacher {teacher_id}, force={force}", flush=True)

        today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
        insights_ref = self._db.document(f'teachers/{teacher_id}/dailyInsights/{today}')

        # Check if we should regenerate (smart triggering)
        if not force:
            should_regen, reason = self._should_regenerate_insights(teacher_id, insights_ref)
            if not should_regen:
                print(f"[ClassPulse] Skipping regeneration: {reason}", flush=True)
                # Just update the stillValidAt timestamp
                existing = insights_ref.get()
                if existing.exists:
                    insights_ref.update({'stillValidAt': datetime.now(timezone.utc)})
                    data = existing.to_dict()
                    data['skippedReason'] = reason
                    return data
                # No existing insights and no new data - return empty
                return self._empty_pulse_response(reason)

        # Get analytics data for the prompt
        analytics = self.get_teacher_analytics(teacher_id, period="week", level="all")

        if analytics['totals']['sessionCount'] == 0:
            print(f"[ClassPulse] No session data for teacher {teacher_id}", flush=True)
            return self._empty_pulse_response("No class activity in the past week")

        # Format data for Gemini
        class_data = self._format_class_data_for_gemini(teacher_id, analytics)

        # Generate insights with Gemini 2.5 Pro
        insights = self._call_gemini_for_insights(class_data)

        # Save to Firestore
        now = datetime.now(timezone.utc)
        pulse_data = {
            'insights': insights,
            'generatedAt': now,
            'stillValidAt': now,
            'dataSnapshot': {
                'totalSessions': analytics['totals']['sessionCount'],
                'totalStruggles': sum(
                    len(level.get('topStruggles', []))
                    for level in analytics['byLevel'].values()
                ),
                'lastGeneratedAt': now
            }
        }
        insights_ref.set(pulse_data)

        print(f"[ClassPulse] Generated {len(insights)} insights for teacher {teacher_id}", flush=True)

        return {
            'insights': insights,
            'generatedAt': now.isoformat(),
            'stillValidAt': now.isoformat(),
            'isNew': True
        }

    def get_class_pulse(self, teacher_id: str) -> Dict[str, Any]:
        """
        Get existing Class Pulse insights without regenerating.

        Returns the most recent insights if available, or empty response.
        """
        today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
        insights_ref = self._db.document(f'teachers/{teacher_id}/dailyInsights/{today}')
        doc = insights_ref.get()

        if doc.exists:
            data = doc.to_dict()
            return {
                'insights': data.get('insights', []),
                'generatedAt': data.get('generatedAt').isoformat() if data.get('generatedAt') else None,
                'stillValidAt': data.get('stillValidAt').isoformat() if data.get('stillValidAt') else None,
                'isNew': False
            }

        return self._empty_pulse_response("No insights generated yet today")

    def _should_regenerate_insights(
        self,
        teacher_id: str,
        insights_ref
    ) -> tuple:
        """
        Determine if we should call Gemini to regenerate insights.

        Returns (should_regenerate: bool, reason: str)
        """
        existing = insights_ref.get()

        if not existing.exists:
            return True, "No existing insights for today"

        data = existing.to_dict()
        snapshot = data.get('dataSnapshot', {})
        last_sessions = snapshot.get('totalSessions', 0)
        last_struggles = snapshot.get('totalStruggles', 0)

        # Get current stats
        analytics = self.get_teacher_analytics(teacher_id, period="week", level="all")
        current_sessions = analytics['totals']['sessionCount']
        current_struggles = sum(
            len(level.get('topStruggles', []))
            for level in analytics['byLevel'].values()
        )

        new_sessions = current_sessions - last_sessions
        new_struggles = current_struggles - last_struggles

        if new_sessions >= self.MIN_NEW_SESSIONS_FOR_REGEN:
            return True, f"{new_sessions} new sessions since last generation"

        if new_struggles >= self.MIN_NEW_STRUGGLES_FOR_REGEN:
            return True, f"{new_struggles} new struggles since last generation"

        return False, f"Only {new_sessions} new sessions and {new_struggles} new struggles (thresholds: {self.MIN_NEW_SESSIONS_FOR_REGEN}/{self.MIN_NEW_STRUGGLES_FOR_REGEN})"

    def _format_class_data_for_gemini(
        self,
        teacher_id: str,
        analytics: Dict
    ) -> str:
        """Format analytics data into a readable prompt for Gemini."""
        lines = [f"Teacher ID: {teacher_id}", "Period: Last 7 days", ""]

        for level, data in sorted(analytics['byLevel'].items()):
            student_count = data.get('studentCount', 0)
            lines.append(f"=== {level} LEVEL ({student_count} students) ===")

            # Struggles
            struggles = data.get('topStruggles', [])
            if struggles:
                lines.append("STRUGGLES:")
                for s in struggles[:5]:
                    lines.append(f"- \"{s['text']}\" - {s['count']} occurrences, {s['type']}")
            else:
                lines.append("STRUGGLES: None recorded")

            # Sessions/Lessons
            lessons = data.get('lessons', [])
            if lessons:
                lines.append("SESSIONS:")
                for lesson in lessons[:5]:
                    warning = " ⚠️" if lesson.get('warning') else ""
                    lines.append(
                        f"- \"{lesson['title']}\" ({level}): {lesson['avgStars']} avg stars, "
                        f"{lesson['completions']} completions{warning}"
                    )

            # Inactive students
            students = data.get('students', [])
            inactive = [s['displayName'] for s in students if s.get('activityStatus') == 'inactive']
            if inactive:
                lines.append(f"INACTIVE (7+ days): {', '.join(inactive[:5])}")

            # Advancement candidates
            advancing = [s['displayName'] for s in students if s.get('advancementCandidate')]
            if advancing:
                lines.append(f"READY TO ADVANCE: {', '.join(advancing[:5])}")

            lines.append("")

        # Cross-level concerns
        cross = analytics.get('crossLevelInsights', {})
        if any([cross.get('levelMismatches'), cross.get('universalStruggles'), cross.get('advancementCandidates')]):
            lines.append("=== CROSS-LEVEL CONCERNS ===")

            mismatches = cross.get('levelMismatches', [])
            for m in mismatches[:3]:
                lines.append(f"- {m['displayName']} ({m['currentLevel']}) has {m['evidence']}")

            universal = cross.get('universalStruggles', [])
            for u in universal[:3]:
                lines.append(f"- \"{u['text']}\" difficult across {', '.join(u['affectedLevels'])}")

        return "\n".join(lines)

    def _call_gemini_for_insights(self, class_data: str) -> List[Dict]:
        """Call Gemini 2.5 Pro to generate insights from class data."""
        import json

        # Check if Gemini client is available
        if self._gemini is None:
            print("[ClassPulse] Gemini client not available, using fallback", flush=True)
            return self._fallback_insights()

        prompt = self.CLASS_PULSE_PROMPT.format(class_data=class_data)

        try:
            print(f"[ClassPulse] Calling Gemini 2.5 Pro...", flush=True)
            response = self._gemini.models.generate_content(
                model='gemini-2.5-pro',
                contents=prompt
            )
            print(f"[ClassPulse] Gemini response received", flush=True)

            # Parse JSON response
            response_text = response.text.strip()
            # Remove markdown code blocks if present
            if response_text.startswith('```'):
                response_text = response_text.split('```')[1]
                if response_text.startswith('json'):
                    response_text = response_text[4:]
                response_text = response_text.strip()

            result = json.loads(response_text)
            insights = result.get('insights', [])

            # Validate and clean insights
            valid_insights = []
            for insight in insights[:3]:  # Max 3
                if all(k in insight for k in ['type', 'title', 'message']):
                    valid_insights.append({
                        'type': insight['type'] if insight['type'] in ['warning', 'info', 'success'] else 'info',
                        'level': insight.get('level'),
                        'title': insight['title'][:50],  # Limit title length
                        'message': insight['message'][:200]  # Limit message length
                    })

            return valid_insights if valid_insights else self._fallback_insights()

        except Exception as e:
            print(f"[ClassPulse] Error calling Gemini: {e}", flush=True)
            return self._fallback_insights()

    def _fallback_insights(self) -> List[Dict]:
        """Return fallback insights if Gemini call fails."""
        return [{
            'type': 'info',
            'level': None,
            'title': 'Insights Unavailable',
            'message': 'Unable to generate AI insights at this time. Check the Analytics tab for detailed data.'
        }]

    def _empty_pulse_response(self, reason: str) -> Dict:
        """Return empty pulse response with reason."""
        return {
            'insights': [],
            'generatedAt': None,
            'stillValidAt': None,
            'isNew': False,
            'skippedReason': reason
        }


_analytics_service: Optional[AnalyticsService] = None


def get_analytics_service() -> AnalyticsService:
    global _analytics_service
    if _analytics_service is None:
        _analytics_service = AnalyticsService()
    return _analytics_service
