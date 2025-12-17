# ND Tutor App - Platform Architecture Documentation

## Overview

**ndnewtutorapp** is an AI-powered English language tutoring platform designed for real-time conversational practice using voice interaction with Google's Gemini Live API. The platform serves both **students learning English** (CEFR levels A1-C2) and **teachers managing their language classes**.

**Core Mission**: Enable immersive, gamified English language learning through AI-powered roleplay conversations with immediate feedback, progress tracking, and personalized practice.

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Project Structure](#2-project-structure)
3. [Architecture Overview](#3-architecture-overview)
4. [User Roles & Permissions](#4-user-roles--permissions)
5. [Core Features](#5-core-features)
6. [AI Integration](#6-ai-integration)
7. [Database Schema](#7-database-schema)
8. [API Endpoints](#8-api-endpoints)
9. [Frontend Components](#9-frontend-components)
10. [State Management](#10-state-management)
11. [Gamification System](#11-gamification-system)
12. [Security & Authentication](#12-security--authentication)
13. [Configuration](#13-configuration)

---

## 1. Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.2.0 | UI framework |
| TypeScript | 5.3.3 | Type safety |
| Vite | 5.0.8 | Build tool & dev server |
| Tailwind CSS | 3.4.0 | Utility-first styling |
| React Router | 6.21.1 | Client-side routing |
| Firebase SDK | 10.7.1 | Auth, Firestore, Storage |
| Gemini AI SDK | 1.31.0 | AI chat integration |
| Sonner | 2.0.7 | Toast notifications |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| FastAPI | 0.109.0+ | Python async API |
| Uvicorn | - | ASGI web server |
| Google Genai SDK | 0.8.0+ | Gemini API access |
| Firestore Client | 2.11.0+ | Database client |
| Pydantic | 2.5.0+ | Data validation |

### Infrastructure
| Service | Purpose |
|---------|---------|
| Firebase Firestore | NoSQL document database |
| Firebase Auth | User authentication |
| Firebase Storage | File storage (images, audio) |
| Firebase Hosting | Frontend hosting |
| Cloud Run | Python server hosting |
| Gemini Live API | Real-time voice AI |

---

## 2. Project Structure

```
ndnewtutorapp/
├── src/                           # React TypeScript source
│   ├── pages/                     # 17 page components
│   │   ├── HomePage.tsx           # Student learning hub
│   │   ├── ChatPage.tsx           # Real-time AI conversations
│   │   ├── TeacherDashboard.tsx   # Teacher management
│   │   ├── RolePlayPage.tsx       # Scenario gallery
│   │   ├── ProgressPage.tsx       # Learning analytics
│   │   ├── ProfilePage.tsx        # Student profile
│   │   ├── BadgesPage.tsx         # Achievement showcase
│   │   └── ...                    # Auth, settings pages
│   │
│   ├── components/                # Modular UI components
│   │   ├── chat/                  # Chat interface (6 files)
│   │   ├── dashboard/             # Teacher dashboard (17 files)
│   │   ├── home/                  # Home page sections (11 files)
│   │   ├── roleplay/              # Roleplay components (14 files)
│   │   ├── progress/              # Progress views (6 files)
│   │   ├── badges/                # Badge display (3 files)
│   │   └── ...                    # Layout, forms, etc.
│   │
│   ├── hooks/                     # 21 custom React hooks
│   │   ├── useGeminiChat.ts       # Main AI chat logic (41KB)
│   │   ├── useTeacherLessons.ts   # Lesson CRUD
│   │   ├── useClassPulse.ts       # AI class insights
│   │   ├── useBadges.ts           # Badge logic
│   │   └── ...
│   │
│   ├── services/                  # Business logic
│   │   ├── firebase/              # 15 Firebase service modules
│   │   │   ├── auth.ts            # Authentication
│   │   │   ├── sessions.ts        # Session management
│   │   │   ├── missions.ts        # Lesson operations
│   │   │   ├── badges.ts          # Badge awards
│   │   │   └── ...
│   │   ├── geminiDirectClient.ts  # Gemini WebSocket client
│   │   └── tokenService.ts        # Token management
│   │
│   ├── contexts/                  # React Context providers
│   │   ├── AuthContext.tsx        # User auth state
│   │   └── ThemeContext.tsx       # Dark/light theme
│   │
│   ├── types/                     # TypeScript definitions
│   │   ├── firestore.ts           # Database schema types
│   │   ├── gemini.ts              # AI API types
│   │   └── badges.ts              # Badge system types
│   │
│   ├── config/
│   │   └── firebase.ts            # Firebase initialization
│   │
│   └── theme/
│       ├── colors.ts              # Design system colors
│       └── icons.tsx              # SVG icon components
│
├── python-server/                 # FastAPI backend
│   ├── main.py                    # Server entry point & routes
│   ├── app/
│   │   ├── token_service.py       # Gemini token provisioning
│   │   ├── review_service.py      # Weekly review generation
│   │   └── analytics_service.py   # Class analytics
│   └── requirements.txt
│
├── docs/                          # Documentation
├── tests/                         # Test files
├── public/                        # Static assets
└── dist/                          # Build output
```

---

## 3. Architecture Overview

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                              │
├─────────────────────────────────────────────────────────────────┤
│  React App (Vite)                                                │
│  ├── Pages (HomePage, ChatPage, TeacherDashboard, etc.)         │
│  ├── Custom Hooks (useGeminiChat, useAuth, etc.)                │
│  └── Contexts (AuthContext, ThemeContext)                        │
└────────────────────┬───────────────────┬────────────────────────┘
                     │                   │
                     ▼                   ▼
┌────────────────────────────┐  ┌────────────────────────────────┐
│     Firebase Services       │  │     Python FastAPI Server      │
├────────────────────────────┤  ├────────────────────────────────┤
│  • Auth (email/password)   │  │  • Token provisioning          │
│  • Firestore (database)    │  │  • Weekly review generation    │
│  • Storage (files/audio)   │  │  • Analytics aggregation       │
└────────────────────────────┘  │  • Class Pulse AI insights     │
                                └───────────────┬────────────────┘
                                                │
                                                ▼
                                ┌────────────────────────────────┐
                                │     Google Gemini Live API     │
                                ├────────────────────────────────┤
                                │  • Real-time voice streaming   │
                                │  • Function calling            │
                                │  • Session resumption          │
                                └────────────────────────────────┘
```

### Key Architectural Patterns

1. **Ephemeral Tokens** - Client connects directly to Gemini with short-lived tokens
2. **Function Calling** - AI autonomously tracks errors, task completion, badges
3. **Session Resumption** - 2-hour window for pause/resume within conversations
4. **Tenant Isolation** - `teacherId` enforcement across collections
5. **Denormalized Data** - User aggregates for fast reads
6. **Immutable Activity Logs** - Audit trail for teacher dashboard

---

## 4. User Roles & Permissions

### Role Definitions

| Role | Access | Capabilities |
|------|--------|--------------|
| **Student** | Chat, Progress, Badges, RolePlay | Practice with AI, view progress, earn badges |
| **Teacher** | Dashboard, Lessons, Students, Analytics | Create lessons, manage students, view insights |
| **Admin** | Full system | System-wide management |

### Student Types

```typescript
// Group Students - Join via class code
{
  teacherId: "teacher-uid",
  joinedClassAt: Timestamp,
  isPrivateStudent: false
}

// Private Students - One-on-one tutoring
{
  teacherId: "teacher-uid",
  isPrivateStudent: true,
  privateStudentCode: "ABC123"
}
```

### Route Protection

```typescript
// Public routes
/login, /signup

// Protected routes (auth required)
/, /chat, /progress, /profile, /badges, /roleplay

// Teacher-only routes
/teacher  // requires role='teacher' or role='admin'
```

---

## 5. Core Features

### Student Features

| Feature | Description | Location |
|---------|-------------|----------|
| **Live Chat** | Real-time voice conversations with AI tutors | `ChatPage.tsx` |
| **Roleplay Collections** | CEFR-leveled conversation scenarios | `RolePlayPage.tsx` |
| **Custom Lessons** | Student-created practice topics | `CreateOwnModal` |
| **Weekly Reviews** | Spaced-repetition practice on struggles | Review lessons |
| **Progress Tracking** | Practice time, sessions, stars | `ProgressPage.tsx` |
| **Pronunciation Coach** | Quick pronunciation practice | `PronunciationModal` |
| **Badges** | 27 achievement badges across 5 categories | `BadgesPage.tsx` |
| **Streaks** | Consecutive daily practice tracking | User document |

### Teacher Features

| Feature | Description | Location |
|---------|-------------|----------|
| **Dashboard Home** | Quick stats, activity feed, alerts | `DashboardHome.tsx` |
| **Lesson Management** | CRUD for missions/scenarios | `LessonsTab.tsx` |
| **Collections** | Organize lessons into themed groups | `CollectionDetailView.tsx` |
| **Student Roster** | Manage class enrollment | `StudentsTab.tsx` |
| **Class Insights** | AI-powered class analytics | `InsightsTab.tsx` |
| **Billing** | Token usage and API costs | `BillingTab.tsx` |
| **Templates** | Reusable system prompts | `PromptTemplates` |

---

## 6. AI Integration

### Gemini Live API Configuration

```typescript
// Model: December 2025 version with native audio
const MODEL = "gemini-2.5-flash-native-audio-preview-12-2025";

// Audio configuration
{
  voice: 'Aoede',           // AI voice persona
  sampleRate: 24000,        // Output audio
  inputSampleRate: 16000,   // Input audio
  vadEnabled: true,         // Voice activity detection
  transcription: true       // Speech-to-text
}
```

### Built-in AI Personas

| Persona | Icon | Tone | Scenario |
|---------|------|------|----------|
| Friendly Barista | ☕ | friendly | Café ordering |
| Hotel Receptionist | 🏨 | friendly | Check-in conversations |
| Fast-Talking Shopkeeper | 🛍️ | fast | Market shopping |
| Patient Tutor | 👨‍🏫 | friendly | Grammar/vocab practice |
| Strict Grammar Teacher | 📚 | strict | Accuracy-focused |
| Confused Tourist | 🗺️ | confused | Help-seeking |

### Function Calling Declarations

The AI can trigger these functions during conversation:

```typescript
// 1. Track student errors silently
mark_for_review(error_type, severity, user_sentence, correction, explanation)

// 2. Record student preferences
update_user_profile(category, value, sentiment, confidence)

// 3. Display session summary
show_session_summary(did_well[], work_on[], stars, summary_text)

// 4. Mark review item mastered
mark_item_mastered(review_item_id, confidence)

// 5. Play previous error audio
play_student_audio(review_item_id)

// 6. Complete lesson task
mark_task_complete(task_id)
```

### CEFR Level Configurations

```typescript
const LEVEL_CONFIGS = {
  A1: { speechSpeed: 0.7, sentenceComplexity: 2, waitTime: 2000 },
  A2: { speechSpeed: 0.8, sentenceComplexity: 3, waitTime: 1500 },
  B1: { speechSpeed: 0.9, sentenceComplexity: 5, waitTime: 1200 },
  B2: { speechSpeed: 1.0, sentenceComplexity: 7, waitTime: 1000 },
  C1: { speechSpeed: 1.0, sentenceComplexity: 9, waitTime: 800 },
  C2: { speechSpeed: 1.0, sentenceComplexity: 10, waitTime: 600 }
};
```

---

## 7. Database Schema

### Core Collections

#### users/{userId}
```typescript
{
  uid: string;
  email: string;
  displayName: string;
  role: 'student' | 'teacher' | 'admin';
  level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

  // Student fields
  teacherId?: string;
  isPrivateStudent?: boolean;
  status?: 'active' | 'suspended';

  // Teacher fields
  classCode?: string;

  // Progress tracking
  totalStars?: number;
  totalSessions?: number;
  totalPracticeTime?: number;
  currentStreak?: number;
  longestStreak?: number;
  badgeCount?: number;

  // Continue Learning
  currentLesson?: { missionId, title, imageUrl, startedAt };

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### missions/{missionId}
```typescript
{
  id: string;
  teacherId: string;
  title: string;
  description: string;
  scenario: string;
  tone: 'friendly' | 'formal' | 'encouraging' | 'challenging';
  vocabList: { word, definition?, example? }[];
  imageUrl?: string;
  targetLevel?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  systemPrompt?: string;
  durationMinutes?: number;
  functionCallingEnabled?: boolean;
  tasks?: { id, text }[];
  collectionId?: string;
  showOnHomepage: boolean;
  isActive: boolean;
  createdAt: Timestamp;
}
```

#### collections/{collectionId}
```typescript
{
  id: string;
  teacherId: string;
  title: string;
  description?: string;
  category: string;  // 'Travel & Dining', 'Work & Career', etc.
  imageUrl: string;
  visibility: 'visible' | 'hidden';
  order: number;
  createdAt: Timestamp;
}
```

#### users/{userId}/reviewItems/{itemId}
```typescript
{
  id: string;
  errorType: 'Grammar' | 'Pronunciation' | 'Vocabulary' | 'Cultural';
  severity: number;  // 1-10
  userSentence: string;
  correction: string;
  explanation?: string;
  reviewCount: number;
  mastered: boolean;
  audioUrl?: string;
  lastReviewedAt?: Timestamp;
}
```

#### users/{userId}/sessionSummaries/{summaryId}
```typescript
{
  sessionId: string;
  missionId: string;
  did_well: string[];
  work_on: string[];
  stars: 1 | 2 | 3 | 4 | 5;
  summary_text: string;
  durationSeconds: number;
  createdAt: Timestamp;
}
```

#### activities/{activityId}
```typescript
{
  id: string;
  teacherId: string;
  studentId: string;
  studentName: string;
  action: 'started' | 'completed' | 'abandoned';
  lessonId: string;
  lessonTitle: string;
  stars?: number;
  timestamp: Timestamp;
}
```

---

## 8. API Endpoints

### Python FastAPI Server (port 8080)

#### Token Management
```
POST /api/token
  Request: { userId, systemPrompt?, expireMinutes, lockConfig }
  Response: { token, expiresAt, model }
  Purpose: Create ephemeral tokens for Gemini Live API
```

#### Review Generation
```
POST /api/review/generate
  Request: { userId }
  Response: { success, reviewId, struggleCount }
  Purpose: Generate weekly review for single user

POST /api/review/generate-batch
  Request: { triggerSecret }
  Response: { usersProcessed, reviewsCreated }
  Purpose: Batch generate reviews (Cloud Scheduler)
```

#### Analytics
```
GET /api/analytics/teacher/{teacherId}
  Query: period (week|month|all-time), level (A1-C2|all)
  Response: Aggregated class data by level, trends, costs

GET /api/mistakes/teacher/{teacherId}
  Query: period (week|month|all-time)
  Response: Mistake array, error type summary
```

#### Class Pulse (AI Insights)
```
GET /api/pulse/teacher/{teacherId}
  Response: Existing AI-generated insights

POST /api/pulse/teacher/{teacherId}
  Query: force (optional)
  Response: Generated class insights using Gemini 2.5 Pro
```

#### Health
```
GET /health  - Server health check
GET /        - API info and endpoint reference
```

---

## 9. Frontend Components

### Page Components (17 total)

| Page | Route | Purpose |
|------|-------|---------|
| `HomePage` | `/` | Student learning hub |
| `ChatPage` | `/chat`, `/chat/:lessonId` | AI conversation interface |
| `TeacherDashboard` | `/teacher` | Teacher management |
| `RolePlayPage` | `/roleplay` | Scenario gallery |
| `ScenarioDetailPage` | `/roleplay/:scenarioId` | Scenario details |
| `ProgressPage` | `/progress` | Learning analytics |
| `ProfilePage` | `/profile` | Student profile |
| `BadgesPage` | `/badges` | Achievement showcase |
| `LoginPage` | `/login` | Authentication |
| `SignUpPage` | `/signup` | Registration |
| `JoinClassPage` | `/join-class` | Class enrollment |
| `LevelSelectPage` | `/select-level` | CEFR selection |
| `AccountSettingsPage` | `/settings/account` | Account management |
| Review pages | `/progress/*` | Pronunciation, Grammar, Vocabulary, Cultural reviews |

### Key Component Hierarchies

#### ChatPage
```
ChatPage
├── ScenarioHeader (role, connection, timer)
├── TasksPanel (lesson objectives)
├── ModeIndicator (recording/listening/speaking)
├── Chat messages container
│   └── ChatBubble (user + AI messages)
├── ChatControlBar (record button)
└── Modals (StarAnimation, BadgeEarned, FirstSession)
```

#### TeacherDashboard
```
TeacherDashboard
├── Header (title + new lesson button)
├── Tab navigation (Home/Lessons/Students/Insights/Settings)
└── Tab Content
    ├── DashboardHome (stats + activity feed)
    ├── LessonsTab (CRUD interface)
    ├── StudentsTab (roster + performance)
    ├── InsightsTab (ClassPulse AI)
    └── Settings (Billing + Templates + Collections)
```

---

## 10. State Management

### Global State (React Context)

#### AuthContext
```typescript
interface AuthContextValue {
  user: User | null;           // Firebase Auth user
  userDocument: UserDocument;  // Firestore user data
  loading: boolean;
  error: Error | null;
}
```

#### ThemeContext
```typescript
interface ThemeContextValue {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
}
```

### Custom Hooks (21 total)

| Hook | Purpose |
|------|---------|
| `useAuth()` | Access AuthContext |
| `useGeminiChat()` | Main AI chat logic |
| `useTeacherLessons()` | Lesson CRUD operations |
| `useCustomLessons()` | Student-created lessons |
| `useHomepageData()` | Lesson assignment logic |
| `useCollections()` | Collection management |
| `useBadges()` | Badge checking & progress |
| `useStreak()` | Streak calculation |
| `useStreakCalendar()` | Weekly practice visualization |
| `usePracticeHistory()` | Historical session data |
| `useTeacherAnalytics()` | Usage analytics |
| `useClassPulse()` | AI-generated insights |
| `usePromptTemplates()` | Template management |
| `useMistakesByType()` | Error categorization |
| `useRecentActivity()` | Real-time activity feed |
| `useLessonForm()` | Lesson form state |
| `useCollectionLessons()` | Lessons by collection |
| `useAudioRecorder()` | Audio recording |
| `useMissionCompletion()` | Mission tracking |

---

## 11. Gamification System

### Badge Categories (27 total)

#### Consistency (8 badges)
| Badge | Criteria |
|-------|----------|
| First Steps | Complete 1st session |
| Getting Started | Complete 5 sessions |
| Dedicated Learner | Complete 25 sessions |
| Century Club | Complete 100 sessions |
| Streak Starter | 3-day streak |
| Week Warrior | 7-day streak |
| Fortnight Force | 14-day streak |
| Month Master | 30-day streak |

#### Excellence (5 badges)
| Badge | Criteria |
|-------|----------|
| Rising Star | First 5-star session |
| Star Collector | Earn 50 total stars |
| Perfectionist | 3 consecutive 5-star sessions |
| Constellation | Earn 100 stars |
| Supernova | Earn 250 stars |

#### Time (4 badges)
| Badge | Criteria |
|-------|----------|
| First Hour | 60 minutes practice |
| Five Hours | 300 minutes practice |
| Ten Hours | 600 minutes practice |
| Marathon Learner | 1000 minutes practice |

#### Explorer (5 badges)
| Badge | Criteria |
|-------|----------|
| Explorer | 5 unique scenarios |
| Adventurer | 15 unique scenarios |
| World Traveler | 30 unique scenarios |
| Creator | First custom lesson |
| Lesson Architect | 5 custom lessons |

#### Level (5 badges)
| Badge | Criteria |
|-------|----------|
| Breakthrough | Reach A2 |
| Intermediate | Reach B1 |
| Upper Intermediate | Reach B2 |
| Advanced | Reach C1 |
| Mastery | Reach C2 |

### Streak System

```typescript
// Streak calculation logic
if (lastPractice === today) {
  // Same day - maintain streak
} else if (lastPractice === yesterday) {
  // Increment streak
  currentStreak++;
} else {
  // Gap > 1 day - reset
  currentStreak = 1;
}
```

---

## 12. Security & Authentication

### Firebase Auth
- Email/password authentication
- Auth state persistence
- Reauthentication for sensitive operations

### Firestore Security Rules

```javascript
// Users can only access their own data
match /users/{userId} {
  allow read, write: if request.auth.uid == userId;
}

// Teachers can read their students
match /users/{userId} {
  allow read: if isTeacherOf(userId);
}

// Missions visible to teacher's students
match /missions/{missionId} {
  allow read: if resource.data.teacherId == getUserTeacherId();
}

// Activities are immutable
match /activities/{activityId} {
  allow create: if request.auth != null;
  allow update, delete: if false;
}
```

### Role-Based Access Control
- Route-level protection via `ProtectedRoute` component
- Component-level permission checks
- API endpoint authorization

---

## 13. Configuration

### Frontend Environment Variables
```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_API_URL=http://localhost:8080
```

### Backend Environment Variables
```env
GCP_PROJECT_ID=ndtutorlive
PORT=8080
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash-native-audio-preview-12-2025
SCHEDULER_SECRET=
```

### Build Scripts
```json
{
  "dev": "vite",
  "build": "tsc && vite build",
  "lint": "eslint . --ext ts,tsx",
  "preview": "vite preview"
}
```

### Vite Configuration
```typescript
export default defineConfig({
  plugins: [react()],
  server: { port: 3000 },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
```

---

## Quick Reference

### File Counts
- **React Components**: 95 files
- **Custom Hooks**: 21 files
- **Firebase Services**: 15 modules
- **TypeScript Types**: 7 definition files
- **Pages**: 17 routes

### Key Metrics
- **Total Source Files**: 180+ TypeScript files
- **Largest Components**: ChatPage (860 lines), TeacherDashboard (906 lines)
- **AI Model**: Gemini 2.5 Flash (December 2025)
- **Badge System**: 27 badges across 5 categories
- **CEFR Levels**: A1, A2, B1, B2, C1, C2

### Development Commands
```bash
# Frontend
npm run dev        # Start dev server (port 3000)
npm run build      # Production build
npm run lint       # ESLint check

# Backend
cd python-server
uvicorn main:app --reload --port 8080
```

---

*Documentation generated: December 2025*
*Platform: ND Tutor App - AI English Tutoring*
