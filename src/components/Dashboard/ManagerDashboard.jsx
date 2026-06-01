import AddLesson from '../Admin/AddLesson';
import ManageEmployees from '../Admin/ManageEmployees';
import ViewReports from '../Admin/ViewReports';
import StaffManagement from '../Admin/StaffManagement';
import StoreManagement from '../Admin/StoreManagement';
import { supabase } from '../../utils/supabaseClient';

export default function ManagerDashboard({ stats, lesson, onSaveLesson }) {
  return (
    <section className="dashboard-page manager-page">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">Manager dashboard</p>
          <h2>Store learning overview</h2>
          <p>Track progress, update the video, and spot weak vocabulary.</p>
        </div>
      </div>

      {/* Analytics */}
      <ViewReports stats={stats} />
      <ManageEmployees employees={stats.rankings} />

      {/* Lesson settings */}
      <AddLesson lesson={lesson} onSaveLesson={onSaveLesson} />

      {/* Staff & store admin — only shown when Supabase is connected */}
      {supabase ? (
        <>
          <StaffManagement />
          <StoreManagement />
        </>
      ) : (
        <section className="dashboard-band">
          <p className="eyebrow">Admin</p>
          <p style={{ color: '#888', marginTop: 8 }}>
            スタッフ・店舗管理はSupabase接続後に使用できます。
          </p>
        </section>
      )}
    </section>
  );
}
