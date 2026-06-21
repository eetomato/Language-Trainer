// import AddLesson from '../Admin/AddLesson';
import ManageEmployees from '../Admin/ManageEmployees';
import ViewReports from '../Admin/ViewReports';
import StaffManagement from '../Admin/StaffManagement';
import StoreManagement from '../Admin/StoreManagement';
import { supabase } from '../../utils/supabaseClient';

export default function ManagerDashboard({ stats, lessons = [], onRefreshLessons }) {
  return (
    <section className="dashboard-page manager-page">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">Manager dashboard</p>
          <h2>Store learning overview</h2>
          <p>Track progress, update lessons, and manage staff.</p>
        </div>
      </div>

      {stats.weeklyTestResults?.length > 0 && (
        <section className="dashboard-band">
          <div className="section-heading">
            <p className="eyebrow">Weekly Test</p>
            <h2>テスト結果（直近21日）</h2>
          </div>
          <div className="ranking-list">
            {stats.weeklyTestResults.map((r) => (
              <p key={r.name}>
                <span>{r.name}</span>
                {r.completed ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <strong style={{ color: r.isPassed ? 'var(--success)' : 'var(--warning)' }}>
                      {r.userAnswer}
                    </strong>
                    <small style={{ color: 'var(--muted)' }}>{r.date}</small>
                  </span>
                ) : (
                  <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>未受験</span>
                )}
              </p>
            ))}
          </div>
        </section>
      )}

      <ViewReports stats={stats} />
      <ManageEmployees employees={stats.rankings} />
      {/* AddLesson 一時隠し */}
      {/* <AddLesson lessons={lessons} onRefresh={onRefreshLessons} /> */}

      {supabase ? (
        <>
          <StaffManagement />
          <StoreManagement />
        </>
      ) : (
        <section className="dashboard-band">
          <p className="eyebrow">Admin</p>
          <p style={{ color: '#888', marginTop: 8 }}>Supabase接続後に使用できます。</p>
        </section>
      )}
    </section>
  );
}
