import { useState, useEffect } from 'react';
import { BookOpen, BarChart3 } from 'lucide-react';
import Layout from './Layout';
import Login from './Login';
import LessonFlow from './LessonPage/LessonFlow';
import EmployeeDashboard from './Dashboard/EmployeeDashboard';
import ManagerDashboard from './Dashboard/ManagerDashboard';
import TestResultPopup from './TestResultPopup';
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
  const [testResult, setTestResult] = useState(null);

  // ✅ 로그인 후 미확인 테스트 결과 확인
  useEffect(() => {
    if (!user) return;
    const results = JSON.parse(localStorage.getItem('nh_test_results') || '[]');
    const unseen = results.find((r) => !r.shown);
    if (unseen) setTestResult(unseen);
  }, [user]);

  const handleClosePopup = () => {
    // shown: true 로 업데이트
    const results = JSON.parse(localStorage.getItem('nh_test_results') || '[]');
    const updated = results.map((r) =>
      !r.shown && r.week === testResult.week ? { ...r, shown: true } : r
    );
    localStorage.setItem('nh_test_results', JSON.stringify(updated));
    setTestResult(null);
  };

  if (loading) {
    return <div className="app-loading"><div className="loading-spinner" /></div>;
  }

  if (!user) return <Login />;

  const isManager = user.role === 'manager';

  return (
    <Layout user={user} onLogout={logout}>
      {/* ✅ 테스트 결과 팝업 */}
      {testResult && (
        <TestResultPopup result={testResult} onClose={handleClosePopup} />
      )}

      <nav className="view-tabs" aria-label="Main views">
        <button className={view === 'dashboard' ? 'active' : ''}
          onClick={() => setView('dashboard')} type="button">
          <BarChart3 size={18} /> Dashboard
        </button>
        <button className={view === 'lesson' ? 'active' : ''}
          onClick={() => setView('lesson')} type="button">
          <BookOpen size={18} /> Lesson
        </button>
      </nav>

      {view === 'lesson' && (
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

      {view === 'dashboard' && (
        isManager
          ? <ManagerDashboard stats={managerStats} lessons={lessons} onRefreshLessons={refreshLessons} />
          : <EmployeeDashboard
              user={user}
              stats={employeeStats}
              onStartLesson={() => setView('lesson')}
              onReset={resetProgress}
            />
      )}
    </Layout>
  );
}
