import { useState } from 'react';
import { BookOpen, BarChart3, ClipboardList } from 'lucide-react';
import Layout from './Layout';
import Login from './Login';
import LessonFlow from './LessonPage/LessonFlow';
import EmployeeDashboard from './Dashboard/EmployeeDashboard';
import ManagerDashboard from './Dashboard/ManagerDashboard';
import { useAuth } from '../hooks/useAuth';
import { useLesson } from '../hooks/useLesson';
import { useLessons } from '../hooks/useLessons';
import { useDashboard } from '../hooks/useDashboard';
import '../App.css';

export default function App() {
  const { user, logout, loading } = useAuth();
  const { submitAnswer, saveSession, resetProgress } = useLesson(user);
  const { lessons, latestLesson, loading: lessonsLoading, refresh: refreshLessons } = useLessons();
  const { employeeStats, managerStats } = useDashboard(user);
  const [view, setView] = useState('dashboard');

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!user) return <Login />;

  const isManager = user.role === 'manager';
  const safeView = view === 'manager' && !isManager ? 'lesson' : view;

  return (
    <Layout user={user} onLogout={logout}>
      <nav className="view-tabs" aria-label="Main views">
        <button
          className={safeView === 'dashboard' ? 'active' : ''}
          onClick={() => setView('dashboard')}
          type="button"
        >
          <BarChart3 size={18} /> Dashboard
        </button>
        <button
          className={safeView === 'lesson' ? 'active' : ''}
          onClick={() => setView('lesson')}
          type="button"
        >
          <BookOpen size={18} /> Lesson
        </button>
        {isManager && (
          <button
            className={safeView === 'manager' ? 'active' : ''}
            onClick={() => setView('manager')}
            type="button"
          >
            <ClipboardList size={18} /> Manager
          </button>
        )}
      </nav>

      {safeView === 'lesson' && (
        <LessonFlow
          user={user}
          lessons={lessons}
          latestLesson={latestLesson}
          lessonsLoading={lessonsLoading}
          submitAnswer={submitAnswer}
          saveSession={saveSession}
          employeeStats={employeeStats}
        />
      )}

      {safeView === 'dashboard' && (
        isManager
          ? <ManagerDashboard stats={managerStats} lessons={lessons} onRefreshLessons={refreshLessons} />
          : <EmployeeDashboard
              user={user}
              stats={employeeStats}
              onStartLesson={() => setView('lesson')}
              onReset={resetProgress}
            />
      )}

      {safeView === 'manager' && isManager && (
        <ManagerDashboard stats={managerStats} lessons={lessons} onRefreshLessons={refreshLessons} />
      )}
    </Layout>
  );
}
