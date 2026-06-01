import AddLesson from '../Admin/AddLesson';
import ManageEmployees from '../Admin/ManageEmployees';
import ViewReports from '../Admin/ViewReports';

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

      <ViewReports stats={stats} />
      <ManageEmployees employees={stats.rankings} />
      <AddLesson lesson={lesson} onSaveLesson={onSaveLesson} />
    </section>
  );
}
