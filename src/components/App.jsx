import { useState } from 'react';
import { BookOpen, BarChart3, ClipboardList } from 'lucide-react';
import Layout from './Layout';
import Login from './Login';
import LessonPage from './LessonPage/LessonPage';
import EmployeeDashboard from './Dashboard/EmployeeDashboard';
import ManagerDashboard from './Dashboard/ManagerDashboard';
import { useAuth } from '../hooks/useAuth';
import { useLesson } from '../hooks/useLesson';
import { useDashboard } from '../hooks/useDashboard';
import '../App.css';

export default function App() {
  const { user, logout, loading } = useAuth();
  const { lesson, saveLesson, submitAnswer, resetProgress } = useLesson(user);
  const { employeeStats, managerStats } = useDashboard(user, lesson);
  const [view, setView] = useState('dashboard');

  // Wait for Supabase session check
  if (loading) {
    return (
      <div className="app-loading">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const isManager = user.role === 'manager';

  // Guard: non-manager cannot access manager view
  const safeView = view === 'manager' && !isManager ? 'dashboard' : view;

  return (
    <Layout user={user} onLogout={logout}>
      <nav className="view-tabs" aria-label="Main views">
        <button
          className={safeView === 'dashboard' ? 'active' : ''}
          onClick={() => setView('dashboard')}
          type="button"
        >
          <BarChart3 size={18} />
          Dashboard
        </button>
        <button
          className={safeView === 'lesson' ? 'active' : ''}
          onClick={() => setView('lesson')}
          type="button"
        >
          <BookOpen size={18} />
          Lesson
        </button>
        {isManager && (
          <button
            className={safeView === 'manager' ? 'active' : ''}
            onClick={() => setView('manager')}
            type="button"
          >
            <ClipboardList size={18} />
            Manager
          </button>
        )}
      </nav>

      {safeView === 'dashboard' && (
        isManager ? (
          <ManagerDashboard stats={managerStats} lesson={lesson} onSaveLesson={saveLesson} />
        ) : (
          <EmployeeDashboard
            user={user}
            stats={employeeStats}
            onStartLesson={() => setView('lesson')}
            onReset={resetProgress}
          />
        )
      )}

      {safeView === 'lesson' && (
        <LessonPage
          user={user}
          lesson={lesson}
          onSubmitAnswer={submitAnswer}
          stats={employeeStats}
        />
      )}

      {safeView === 'manager' && isManager && (
        <ManagerDashboard stats={managerStats} lesson={lesson} onSaveLesson={saveLesson} />
      )}
    </Layout>
  );
}
