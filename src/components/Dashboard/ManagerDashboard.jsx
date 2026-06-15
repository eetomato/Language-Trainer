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

      <ViewReports stats={stats} />
      <ManageEmployees employees={stats.rankings} />
      {/* AddLesson 일시 숨김 */}
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
