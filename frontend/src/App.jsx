import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import ProtectedRoute from './components/ProtectedRoute'
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import MovementDetection from "./pages/MovementDetection";
import FriendsList from './pages/FriendsList';
import ProgressHistory from './pages/ProgressHistory';
import CoachList from './pages/CoachList';
import TrainingPrograms from './pages/TrainingPrograms';
import AchievementSystem from './components/achievement/AchievementSystem';
import FindFriends from './pages/FindFriends';
import FriendRequestsPage from './pages/FriendRequests';
import UserProfileView from './pages/UserProfileView';
import ProgramCreator from "./pages/ProgramCreator"
import ChatWidget from './components/ChatWidget';
import { ChatProvider } from './context/ChatContext';
import Leaderboard from './pages/Leaderboard';
import './App.css'

function App() {
  return (
    <Router>
      <ChatProvider>
      <div className="min-h-screen bg-black font-sans">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:resetToken" element={<ResetPassword />} />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/progress-history" element={
            <ProtectedRoute>
              <ProgressHistory />
            </ProtectedRoute>
          } />
          <Route path="/training-programs" element={
            <ProtectedRoute>
              <TrainingPrograms />
            </ProtectedRoute>
          } />
          <Route path="/coaches" element={
            <ProtectedRoute>
              <CoachList />
            </ProtectedRoute>
          } />
          <Route path="/movement-detection" element={
            <ProtectedRoute>
              <MovementDetection />
            </ProtectedRoute>
          } />
          <Route path="/friends" element={
            <ProtectedRoute>
              <FriendsList />
            </ProtectedRoute>
          } />
          <Route path="/find-friends" element={
            <ProtectedRoute>
              <FindFriends />
            </ProtectedRoute>
          } />
          <Route path="/friend-requests" element={
            <ProtectedRoute>
              <FriendRequestsPage />
            </ProtectedRoute>
          } />
          <Route path="/profile/:userId" element={
            <ProtectedRoute>
              <UserProfileView />
            </ProtectedRoute>
          } />
          <Route path="/program-creator" element={
            <ProtectedRoute>
              <ProgramCreator />
            </ProtectedRoute>
          } />
          <Route path="/achievements" element={
            <ProtectedRoute>
              <AchievementSystem />
            </ProtectedRoute>
          } />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Routes>
        <ChatWidget />
      </div>
      </ChatProvider>
    </Router>
  )
}

export default App
