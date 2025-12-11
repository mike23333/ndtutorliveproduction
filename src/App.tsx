import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import TeacherDashboard from './pages/TeacherDashboard';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import LevelSelectPage from './pages/LevelSelectPage';
import JoinClassPage from './pages/JoinClassPage';
import ProfilePage from './pages/ProfilePage';
import BadgesPage from './pages/BadgesPage';
import RolePlayPage from './pages/RolePlayPage';
import ScenarioDetailPage from './pages/ScenarioDetailPage';

/**
 * Wrapper that forces ChatPage to remount when lessonId changes.
 * Without this, React reuses the component and stale state persists.
 */
function ChatPageWrapper() {
  const { lessonId } = useParams();
  // Key forces complete remount when lesson changes
  return <ChatPage key={lessonId || 'default'} />;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignUpPage />} />

              {/* Protected routes - require auth */}
              <Route path="/join-class" element={
                <ProtectedRoute>
                  <JoinClassPage />
                </ProtectedRoute>
              } />

              <Route path="/select-level" element={
                <ProtectedRoute>
                  <LevelSelectPage />
                </ProtectedRoute>
              } />

              <Route path="/" element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              } />
              <Route path="/chat" element={
                <ProtectedRoute>
                  <ChatPageWrapper />
                </ProtectedRoute>
              } />
              <Route path="/chat/:lessonId" element={
                <ProtectedRoute>
                  <ChatPageWrapper />
                </ProtectedRoute>
              } />
              {/* Teacher only route */}
              <Route path="/teacher" element={
                <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                  <TeacherDashboard />
                </ProtectedRoute>
              } />

              {/* Profile and Badges routes */}
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/badges" element={
                <ProtectedRoute>
                  <BadgesPage />
                </ProtectedRoute>
              } />
              <Route path="/roleplay" element={
                <ProtectedRoute>
                  <RolePlayPage />
                </ProtectedRoute>
              } />
              <Route path="/roleplay/:scenarioId" element={
                <ProtectedRoute>
                  <ScenarioDetailPage />
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
