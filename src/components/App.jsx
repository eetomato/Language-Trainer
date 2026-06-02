import { useState } from 'react';
import { BookOpen, BarChart3, ClipboardList } from 'lucide-react';
import Layout from './Layout';
import Login from './Login';
import LessonList from './LessonPage/LessonList';
import LessonPage from './LessonPage/LessonPage';
import EmployeeDashboard from './Dashboard/EmployeeDashboard';
import ManagerDashboard from './Dashboard/ManagerDashboard';
import { useAuth } from '../hooks/useAuth';
import { useLesson } from '../hooks/useLesson';
import { useLessons } from '../hooks/useLessons';
import { useDashboard } from '../hooks/useDashboard';
import '../App.css';

export default function App() {
  const { user, logout, loading } = useAuth();
  const { submitAnswer, resetProgress } = useLesson(user);
  const { lessons, loading: lessonsLoading } = useLessons();
  const { employeeStats, managerStats } = useDashboard(user);
  const [view, setView] = useState('dashboard');
  const [selectedLesson, setSelectedLesson] = useState(null);

  if (loading) {
    return (
      <div className="app-loading">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) return <Login />;

  const isManager = user.role === 'manager';
  const safeView = view === 'manager' && !isManager ? 'dashboard' : view;

  const handleSelectLesson = (lesson) => {
    setSelectedLesson(lesson);
  };

  const handleBackToList = () => {
    setSelectedLesson(null);
  };

  // Switch to lesson view and reset selection
  const handleLessonTabClick = () => {
    setView('lesson');
    setSelectedLesson(null);
  };

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
          onClick={handleLessonTabClick}
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
          <ManagerDashboard stats={managerStats} lesson={lessons[0]} onSaveLesson={() => {}} />
        ) : (
          <EmployeeDashboard
            user={user}
            stats={employeeStats}
            onStartLesson={() => { setView('lesson'); setSelectedLesson(null); }}
            onReset={resetProgress}
          />
        )
      )}

      {safeView === 'lesson' && !selectedLesson && (
        <LessonList
          lessons={lessons}
          loading={lessonsLoading}
          onSelect={handleSelectLesson}
        />
      )}

      {safeView === 'lesson' && selectedLesson && (
        <LessonPage
          user={user}
          lesson={selectedLesson}
          onSubmitAnswer={submitAnswer}
          stats={employeeStats}
          onBack={handleBackToList}
        />
      )}

      {safeView === 'manager' && isManager && (
        <ManagerDashboard stats={managerStats} lesson={lessons[0]} onSaveLesson={() => {}} />
      )}
    </Layout>
  );
}
