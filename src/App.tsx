import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
                  <ChatPage />
                </ProtectedRoute>
              } />
              <Route path="/chat/:lessonId" element={
                <ProtectedRoute>
                  <ChatPage />
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
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
